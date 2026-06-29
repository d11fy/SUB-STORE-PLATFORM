"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { logger } from "@/lib/monitoring/logger";
import { notifyOrderConfirmation } from "@/lib/email/notifications";
import { checkoutRateLimit } from "@/lib/rate-limit";
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
  if (!items.length || items.length > 50) {
    return { subtotal: 0, shippingCost: 0, total: 0, error: "عدد المنتجات في السلة غير صالح" };
  }

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

  // Calculate subtotal from products in database to prevent client tampering.
  // SECURITY: Every product is scoped to this store — prevents cross-store price reads (IDOR).
  // A single batch query is used so a mismatched count (items not in this store) is caught
  // before any pricing is trusted.
  const productIds = items.map((i) => i.product_id);
  const { data: storeProducts } = await supabase
    .from("products")
    .select("id, price, is_active")
    .in("id", productIds)
    .eq("store_id", store.id);

  if (!storeProducts || storeProducts.length !== items.length) {
    return { subtotal: 0, shippingCost: 0, total: 0, error: "بعض المنتجات غير متاحة في هذا المتجر" };
  }

  const priceMap = new Map(storeProducts.map((p) => [p.id, p]));

  let subtotal = 0;
  for (const item of items) {
    const product = priceMap.get(item.product_id);

    if (!product || !product.is_active) {
      return { subtotal: 0, shippingCost: 0, total: 0, error: `المنتج ${item.name} غير متوفر حالياً` };
    }

    subtotal += product.price * item.quantity;
  }

  // Digital stores / no shipping: skip shipping lookup entirely
  if (!shippingMethodId || shippingMethodId === "") {
    return { subtotal, shippingCost: 0, total: subtotal, error: null };
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

  if (!items.length || items.length > 50) {
    return { success: false, orderId: null, orderNumber: null, error: "عدد المنتجات في السلة غير صالح" };
  }

  // IP-based rate limiting: 5 orders per minute per client IP.
  const h = await headers();
  const clientIp =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = checkoutRateLimit(clientIp);
  if (!rl.allowed) {
    return { success: false, orderId: null, orderNumber: null, error: "طلبات كثيرة، يرجى المحاولة بعد قليل" };
  }

  const supabase = createAdminClient();

  // 1. Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, status, requires_shipping, name, email, currency")
    .eq("slug", storeSlug)
    .single();

  if (storeError || !store) {
    return { success: false, orderId: null, orderNumber: null, error: "المتجر غير موجود" };
  }

  if (store.status !== "active" && store.status !== "trial") {
    return { success: false, orderId: null, orderNumber: null, error: "المتجر غير نشط حالياً" };
  }

  const storeRequiresShipping = store.requires_shipping ?? true;

  // Validate delivery fields only when store requires shipping
  if (storeRequiresShipping) {
    if (!validated.data.city?.trim()) {
      return { success: false, orderId: null, orderNumber: null, error: "يرجى تحديد المدينة" };
    }
    if (!validated.data.address?.trim() || validated.data.address.trim().length < 5) {
      return { success: false, orderId: null, orderNumber: null, error: "يرجى ملء العنوان التفصيلي (5 أحرف على الأقل)" };
    }
  }

  // Normalize delivery fields — guaranteed strings for DB inserts + shipping zone queries
  const deliveryCity = validated.data.city?.trim() ?? "";
  const deliveryAddress = validated.data.address?.trim() ?? "";

  // 2. Validate cart & calculate subtotal
  //
  // SECURITY: Batch-fetch all submitted product IDs scoped to this store.
  // Any product ID that doesn't belong to store.id is silently excluded from
  // the result set, making the length check below fail — this blocks all IDOR
  // cross-store purchase attempts at the DB query level.
  const cartProductIds = items.map((i) => i.product_id);
  const { data: ownedProducts } = await supabase
    .from("products")
    .select("id, name, price, stock_quantity, track_inventory, is_active")
    .in("id", cartProductIds)
    .eq("store_id", store.id);

  // Defensive count check: if any submitted product_id was from a different
  // store or didn't exist, it won't appear in ownedProducts.
  if (!ownedProducts || ownedProducts.length !== items.length) {
    return { success: false, orderId: null, orderNumber: null, error: "بعض المنتجات غير متاحة في هذا المتجر" };
  }

  const productMap = new Map(ownedProducts.map((p) => [p.id, p]));

  let subtotal = 0;
  const validatedItems: { id: string; name: string; price: number; quantity: number; stock: number }[] = [];

  for (const item of items) {
    const product = productMap.get(item.product_id);

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
        .eq("city_name", deliveryCity)
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
        full_name: validated.data.full_name,
        email: validated.data.email || null,
        ...(storeRequiresShipping ? { city: deliveryCity, address: deliveryAddress } : {}),
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
        city: deliveryCity,
        address: deliveryAddress,
        orders_count: 1,
        total_spent: totalAmount,
      })
      .select("id")
      .single();

    if (customerInsertError || !newCustomer) {
      logger.error("createCustomerOrder", customerInsertError ?? new Error("no customer returned"), { storeId: store.id });
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
      city: deliveryCity,
      address: deliveryAddress,
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
      logger.error("createCustomerOrder_item", itemInsertError, { storeId: store.id });
    }

    // Decrement inventory — store_id filter is defense-in-depth;
    // item.id was already validated against store.id above.
    await supabase
      .from("products")
      .update({ stock_quantity: Math.max(0, item.stock - item.quantity) })
      .eq("id", item.id)
      .eq("store_id", store.id);
  }

  // Fire-and-forget order confirmation email (non-blocking)
  // Only sent when the customer provided an email at checkout.
  if (validated.data.email) {
    notifyOrderConfirmation(validated.data.email, store.id, {
      orderNumber: order.order_number ?? order.id.slice(0, 8).toUpperCase(),
      storeName: (store as any).name ?? storeSlug,
      storeEmail: (store as any).email ?? null,
      customerName: validated.data.full_name,
      items: validatedItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      subtotal,
      shippingCost,
      total: totalAmount,
      currency: (store as any).currency ?? "ILS",
      city: deliveryCity || undefined,
      address: deliveryAddress || undefined,
      notes: validated.data.notes ?? null,
    }).catch((err: unknown) => {
      logger.warn("checkout_email", "Order confirmation email failed", {
        storeId: store.id,
        metadata: { error: String(err) },
      });
    });
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
    logger.error("submitPaymentProof_upload", uploadError);
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
    logger.error("submitPaymentProof_insert", insertError);
    return { success: false, error: "فشل حفظ تفاصيل إثبات الدفع، يرجى المحاولة مرة أخرى" };
  }

  return {
    success: true,
    error: null,
  };
}

