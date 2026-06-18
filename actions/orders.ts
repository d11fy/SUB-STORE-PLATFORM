// ============================================================
// Saba Store — Orders Server Actions (Merchant Dashboard)
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import type { Order, OrderItem, PaymentProof, OrderStatus } from "@/lib/types/database";

// Return type interface
export interface MerchantOrder extends Order {
  shipping_methods: {
    name: string;
  } | null;
  payment_proofs: {
    id: string;
    review_status: string;
    payer_name: string | null;
    transaction_reference: string | null;
    uploaded_at: string;
  }[] | null;
}

export interface OrderDetails extends Order {
  payment_methods?: any | null;
  shipping_methods: any;
  payment_proofs: (PaymentProof & { signedUrl?: string })[] | null;
  order_items: OrderItem[] | null;
}

/**
 * Fetches all orders for the authenticated merchant's store
 */
export async function getMerchantOrders(options?: {
  status?: string;
  search?: string;
}): Promise<{ data: MerchantOrder[] | null; error: string | null }> {
  // getMerchantStoreId calls redirect() — must be outside try-catch so redirect propagates
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    let query = supabase
      .from("orders")
      .select(`
        *,
        payment_proofs (id, review_status, payer_name, transaction_reference, uploaded_at)
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    // Filter by status if provided and not 'all'
    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status as OrderStatus);
    }

    // Simple search by order_number or customer full_name
    if (options?.search) {
      query = query.or(`order_number.ilike.%${options.search}%,full_name.ilike.%${options.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Attach shipping_methods as null (no FK in DB — names resolved on detail page)
    const result = (data as any[]).map((o) => ({ ...o, shipping_methods: null }));
    return { data: result, error: null };
  } catch (err: any) {
    console.error("Error fetching merchant orders:", err);
    return { data: null, error: "فشل جلب الطلبات" };
  }
}

/**
 * Fetches details of a single order by ID, verifying ownership
 */
export async function getMerchantOrderDetails(
  orderId: string
): Promise<{ data: OrderDetails | null; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        payment_proofs (*),
        order_items (*)
      `)
      .eq("id", orderId)
      .eq("store_id", storeId)
      .single();

    if (orderError || !order) {
      return { data: null, error: "الطلب غير موجود أو غير مصرح لك بالوصول إليه" };
    }

    // Fetch shipping method separately (no FK constraint in DB)
    let shippingMethodData: any = null;
    if ((order as any).shipping_method_id) {
      const { data: sm } = await supabase
        .from("shipping_methods")
        .select("*")
        .eq("id", (order as any).shipping_method_id)
        .maybeSingle();
      shippingMethodData = sm;
    }

    // Generate signed URL for payment proofs if they exist
    const proofs = (order as any).payment_proofs as any[];
    if (proofs && proofs.length > 0) {
      for (const proof of proofs) {
        if (proof.uploaded_file_url) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from("payment-proofs")
            .createSignedUrl(proof.uploaded_file_url, 3600); // 1 hour expiration

          if (!signedError && signedData) {
            proof.signedUrl = signedData.signedUrl;
          }
        }
      }
    }

    return { data: { ...order, shipping_methods: shippingMethodData } as any, error: null };
  } catch (err: any) {
    console.error("Error fetching order details:", err);
    return { data: null, error: "فشل جلب تفاصيل الطلب" };
  }
}

/**
 * Updates an order status (verifying store ownership)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    // Verify order ownership
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, store_id, stores (slug)")
      .eq("id", orderId)
      .eq("store_id", storeId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: "الطلب غير موجود أو غير مصرح لك بالتعديل عليه" };
    }

    // Update status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // Get store slug for path revalidation
    const storeSlug = (order.stores as any)?.slug;

    // Revalidate paths
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    if (storeSlug) {
      revalidatePath(`/store/${storeSlug}/orders/${orderId}`);
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return { success: false, error: "فشل تحديث حالة الطلب" };
  }
}

/**
 * Reviews (approves or rejects) a payment proof, updating the proof and the order status
 */
export async function reviewPaymentProof(
  proofId: string,
  action: "approve" | "reject",
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    // Get the authenticated user ID for record tracking
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "جلسة المستخدم منتهية" };
    }

    // Fetch the payment proof and check store ownership
    const { data: proof, error: proofError } = await supabase
      .from("payment_proofs")
      .select("*, orders (id, store_id, stores (slug))")
      .eq("id", proofId)
      .eq("store_id", storeId)
      .single();

    if (proofError || !proof) {
      return { success: false, error: "إثبات الدفع غير موجود أو غير مصرح لك بمراجعته" };
    }

    const orderId = proof.order_id;
    const storeSlug = (proof.orders as any)?.stores?.slug;

    if (action === "approve") {
      // 1. Update proof record
      const { error: proofUpdateError } = await supabase
        .from("payment_proofs")
        .update({
          review_status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", proofId);

      if (proofUpdateError) throw proofUpdateError;

      // 2. Update order record
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "تم_تأكيد_الدفع",
          payment_status: "paid",
        })
        .eq("id", orderId);

      if (orderUpdateError) throw orderUpdateError;

    } else {
      // rejection
      if (!reason || reason.trim() === "") {
        return { success: false, error: "يرجى تحديد سبب رفض الدفع" };
      }

      // 1. Update proof record
      const { error: proofUpdateError } = await supabase
        .from("payment_proofs")
        .update({
          review_status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason.trim(),
        })
        .eq("id", proofId);

      if (proofUpdateError) throw proofUpdateError;

      // 2. Update order record
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "فشل_الدفع",
          payment_status: "failed",
        })
        .eq("id", orderId);

      if (orderUpdateError) throw orderUpdateError;
    }

    // Revalidate paths
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    if (storeSlug) {
      revalidatePath(`/store/${storeSlug}/orders/${orderId}`);
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error reviewing payment proof:", err);
    return { success: false, error: "فشل معالجة مراجعة إثبات الدفع" };
  }
}
