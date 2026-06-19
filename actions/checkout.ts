"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { logger } from "@/lib/monitoring/logger";
import type { Order, OrderItem } from "@/lib/types/database";

// Interface for checkout cart items passed from Zustand
export interface CheckoutCartItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  quantity: number;
}

/**
 * Validates the order items and calculates the final totals (subtotal, shipping, total) on the server.
 */
export async function validateAndCalculateOrder(
  storeSlug: string,
  items: CheckoutCartItem[],
  city: string,
  shippingMethodId: string
): Promise<{
  subtotal: number;
  shippingCost: number;
  total: number;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, status")
    .eq("slug", storeSlug)
    .single();

  if (storeError || !store) {
    return { subtotal: 0, shippingCost: 0, total: 0, error: "المتجر غير موجود" };
  }

  if (store.status !== "active" && store.status !== "trial") {
    return { subtotal: 0, shippingCost: 0, total: 0, error: "المتجر غير نشط حالياً" };
  }

  // Calculate subtotal from products in database to prevent client tampering
  let subtotal = 0;
  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("price, compare_price, is_active")
      .eq("id", item.product_id)
      .single();

    if (!product || !product.is_active) {
      return { subtotal: 0, shippingCost: 0, total: 0, error: `المنتج ${item.name} غير متوفر حالياً` };
    }

    const price = product.price; // use database price
    subtotal += price * item.quantity;
  }

  // Fetch shipping method
  const { data: method, error: methodError } = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("id", shippingMethodId)
    .eq("store_id", store.id)
    .single();

  if (methodError || !method || !method.is_active) {
    return { subtotal, shippingCost: 0, total: subtotal, error: "طريقة الشحن المحددة غير صالحة" };
  }

  let shippingCost = method.base_price;

  // If free shipping threshold is met
  if (method.free_shipping_threshold !== null && subtotal >= method.free_shipping_threshold) {
    shippingCost = 0;
  } else if (method.type === "city_based") {
    // Look up city-specific shipping fee
    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("price")
      .eq("shipping_method_id", method.id)
      .eq("city_name", city)
      .eq("is_active", true)
      .maybeSingle();

    if (zone) {
      shippingCost = zone.price;
    }
  } else if (method.type === "free") {
    shippingCost = 0;
  }

  const total = subtotal + shippingCost;

  return {
    subtotal,
    shippingCost,
    total,
    error: null,
  };
}

/**
 * Creates the order record, handles customer lookup/insertion, and decrements product inventory.
 */
export async function createCustomerOrder(
  storeSlug: string,
  checkoutInput: CheckoutInput,
  items: CheckoutCartItem[]
): Promise<{
  success: boolean;
  orderId: string | null;
  orderNumber: string | null;
  error: string | null;
}> {
  const validated = checkoutSchema.safeParse(checkoutInput);
  if (!validated.success) {
    return { success: false, orderId: null, orderNumber: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = createAdminClient();

  // 1. Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, status")
    .eq("slug", storeSlug)
    .single();

  if (storeError || !store) {
    return { success: false, orderId: null, orderNumber: null, error: "المتجر غير موجود" };
  }

  if (store.status !== "active" && store.status !== "trial") {
    return { success: false, orderId: null, orderNumber: null, error: "المتجر غير نشط حالياً" };
  }

  // 2. Calculate subtotal & check inventory
  let subtotal = 0;
  const validatedItems: { id: string; name: string; price: number; quantity: number; stock: number }[] = [];

  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, track_inventory, is_active")
      .eq("id", item.product_id)
      .single();

    if (!product || !product.is_active) {
      return { success: false, orderId: null, orderNumber: null, error: `المنتج ${item.name} غير متوفر حالياً` };
    }

    if (product.track_inventory && product.stock_quantity < item.quantity) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        error: `عذراً، الكمية المطلوبة من المنتج (${product.name}) غير متوفرة حالياً. المتبقي في المخزون: ${product.stock_quantity}`,
      };
    }

    subtotal += product.price * item.quantity;
    validatedItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      stock: product.stock_quantity,
    });
  }

  // 3. Fetch shipping details (optional when store doesn't require shipping)
  let shippingMethod: any = null;
  let shippingCost = 0;

  if (validated.data.shipping_method_id) {
    const { data: fetchedMethod } = await supabase
      .from("shipping_methods")
      .select("*")
      .eq("id", validated.data.shipping_method_id)
      .eq("store_id", store.id)
      .single();

    if (!fetchedMethod || !fetchedMethod.is_active) {
      return { success: false, orderId: null, orderNumber: null, error: "طريقة الشحن غير صالحة" };
    }

    shippingMethod = fetchedMethod;
    shippingCost = shippingMethod.base_price;

    if (shippingMethod.free_shipping_threshold !== null && subtotal >= shippingMethod.free_shipping_threshold) {
      shippingCost = 0;
    } else if (shippingMethod.type === "city_based") {
      const { data: zone } = await supabase
        .from("shipping_zones")
        .select("price")
        .eq("shipping_method_id", shippingMethod.id)
        .eq("city_name", validated.data.city)
        .eq("is_active", true)
        .maybeSingle();

      if (zone) {
        shippingCost = zone.price;
      }
    } else if (shippingMethod.type === "free") {
      shippingCost = 0;
    }
  }

  // 4. Fetch payment details
  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("id", validated.data.payment_method_id)
    .eq("store_id", store.id)
    .single();

  if (!paymentMethod || !paymentMethod.is_active) {
    return { success: false, orderId: null, orderNumber: null, error: "طريقة الدفع غير صالحة" };
  }

  const totalAmount = subtotal + shippingCost;

  // 5. Manage Customer Record
  let customerId = null;
  const cleanPhone = validated.data.phone.replace(/[\s\-\(\)]/g, "");

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, orders_count, total_spent")
    .eq("store_id", store.id)
    .eq("phone", cleanPhone)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
    await supabase
      .from("customers")
      .update({
        orders_count: existingCustomer.orders_count + 1,
        total_spent: existingCustomer.total_spent + totalAmount,
        full_name: validated.data.full_name, // update name/details if changed
        email: validated.data.email || null,
        city: validated.data.city,
        address: validated.data.address,
      })
      .eq("id", customerId);
  } else {
    const { data: newCustomer, error: customerInsertError } = await supabase
      .from("customers")
      .insert({
        store_id: store.id,
        full_name: validated.data.full_name,
        email: validated.data.email || null,
        phone: cleanPhone,
        city: validated.data.city,
        address: validated.data.address,
        orders_count: 1,
        total_spent: totalAmount,
      })
      .select("id")
      .single();

    if (customerInsertError || !newCustomer) {
      console.error("Customer creation error:", customerInsertError);
      return { success: false, orderId: null, orderNumber: null, error: "حدث خطأ أثناء معالجة بيانات المشتري" };
    }
    customerId = newCustomer.id;
  }

  // 6. Create Order
  // Define default order status based on payment method type
  const orderStatus =
    paymentMethod.type === "bank_transfer" || paymentMethod.type === "local_wallet"
      ? "بانتظار_تأكيد_الدفع"
      : "جديد";

  const { data: order, error: orderInsertError } = await supabase
    .from("orders")
    .insert({
      store_id: store.id,
      customer_id: customerId,
      status: orderStatus,
      full_name: validated.data.full_name,
      phone: cleanPhone,
      email: validated.data.email || null,
      city: validated.data.city,
      address: validated.data.address,
      notes: validated.data.notes || null,
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: 0,
      total_amount: totalAmount,
      payment_method_id: paymentMethod.id,
      shipping_method_id: shippingMethod?.id ?? null,
      payment_status: paymentMethod.type === "cash_on_delivery" ? "pending" : "unpaid",
    })
    .select("id, order_number")
    .single();

  if (orderInsertError || !order) {
    logger.actionError("createCustomerOrder", orderInsertError ?? new Error("no order returned"), { storeId: store.id });
    return { success: false, orderId: null, orderNumber: null, error: "فشل إنشاء الطلب، يرجى المحاولة مرة أخرى" };
  }

  // 7. Insert Order Items & Decrement Inventory
  for (const item of validatedItems) {
    const { error: itemInsertError } = await supabase.from("order_items").insert({
      store_id: store.id,
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      attributes: {},
    });

    if (itemInsertError) {
      console.error("Failed to insert order item:", itemInsertError);
    }

    // Decrement inventory
    await supabase
      .from("products")
      .update({ stock_quantity: Math.max(0, item.stock - item.quantity) })
      .eq("id", item.id);
  }

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.order_number,
    error: null,
  };
}

/**
 * Uploads a payment proof file to private storage and logs the transaction record.
 */
export async function submitPaymentProof(
  orderId: string,
  payerName: string,
  transactionReference: string | null,
  fileBase64: string,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; error: string | null }> {
  if (!orderId || !payerName || !fileBase64) {
    return { success: false, error: "جميع الحقول المطلوبة يجب تعبئتها" };
  }

  const supabase = createAdminClient();

  // 1. Fetch order to verify store ownership and get details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("store_id, id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "الطلب غير موجود" };
  }

  // 2. Decode the base64 file content
  const base64Data = fileBase64.split(";base64,").pop();
  if (!base64Data) {
    return { success: false, error: "محتوى الملف غير صالح" };
  }

  const fileBuffer = Buffer.from(base64Data, "base64");

  // Validate file size (max 5MB)
  if (fileBuffer.length > 5 * 1024 * 1024) {
    return { success: false, error: "حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)" };
  }

  // Validate file type
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedMimeTypes.includes(fileType)) {
    return { success: false, error: "صيغة الملف غير مدعومة (يسمح بصور JPG, PNG, WEBP وملفات PDF فقط)" };
  }

  const fileExt = fileName.split(".").pop() || "png";
  const filePath = `${order.store_id}/${order.id}_proof_${Date.now()}.${fileExt}`;

  // 3. Upload file to Supabase private storage bucket 'payment-proofs'
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(filePath, fileBuffer, {
      contentType: fileType,
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { success: false, error: "حدث خطأ أثناء رفع ملف إثبات الدفع" };
  }

  // 4. Create record in payment_proofs table
  const { error: insertError } = await supabase.from("payment_proofs").insert({
    store_id: order.store_id,
    order_id: order.id,
    uploaded_file_url: filePath,
    transaction_reference: transactionReference || null,
    payer_name: payerName,
    review_status: "pending",
  });

  if (insertError) {
    console.error("Payment proof DB record insert error:", insertError);
    return { success: false, error: "فشل حفظ تفاصيل إثبات الدفع، يرجى المحاولة مرة أخرى" };
  }

  return {
    success: true,
    error: null,
  };
}

