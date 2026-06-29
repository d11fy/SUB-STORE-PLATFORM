"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantStoreId } from "./store-utils";
import { getCurrentUser } from "./auth";
import { logger } from "@/lib/monitoring/logger";
import {
  notifyPaymentApproved,
  notifyPaymentRejected,
  notifyAdminNewPaymentProof,
} from "@/lib/email/notifications";
import type { PaymentRequest } from "@/lib/types/database";

const VALID_STATUS_FILTERS = new Set(["all", "pending", "approved", "rejected"]);

const PAGE_SIZE = 20;

// ============================================================
// MERCHANT: Create payment request
// ============================================================
export async function createPaymentRequest(
  fileBase64: string,
  fileName: string,
  fileType: string,
  plan: string,
  transactionNumber: string,
  notes: string
): Promise<{ success: boolean; error: string | null }> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(fileType)) {
    return { success: false, error: "صيغة الملف غير مدعومة (JPG، PNG، WEBP، PDF)" };
  }
  if (!fileBase64) return { success: false, error: "الملف مطلوب" };

  const storeId = await getMerchantStoreId();

  const base64Data = fileBase64.split(";base64,").pop();
  if (!base64Data) return { success: false, error: "محتوى الملف غير صالح" };

  const fileBuffer = Buffer.from(base64Data, "base64");
  if (fileBuffer.length > 5 * 1024 * 1024) {
    return { success: false, error: "حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)" };
  }

  const ext = fileName.split(".").pop() ?? "png";
  const filePath = `${storeId}/payment-requests/${Date.now()}.${ext}`;
  const adminSupabase = createAdminClient();

  const { error: uploadError } = await adminSupabase.storage
    .from("payment-proofs")
    .upload(filePath, fileBuffer, { contentType: fileType, upsert: true });

  if (uploadError) {
    return { success: false, error: "فشل رفع الإيصال، يرجى المحاولة مرة أخرى" };
  }

  // Cancel any existing pending requests for this store
  await adminSupabase
    .from("payment_requests")
    .update({ status: "rejected", admin_note: "تم استبداله بطلب جديد" })
    .eq("store_id", storeId)
    .eq("status", "pending");

  const { error: insertError } = await adminSupabase.from("payment_requests").insert({
    store_id: storeId,
    plan: plan || "starter",
    transaction_number: transactionNumber || null,
    notes: notes || null,
    receipt_url: filePath,
    status: "pending",
  });

  if (insertError) {
    return { success: false, error: "فشل إرسال الطلب، يرجى المحاولة مرة أخرى" };
  }

  // Update subscription status to pending
  await adminSupabase
    .from("subscriptions")
    .update({ status: "pending", payment_proof_url: filePath, admin_note: null })
    .eq("store_id", storeId);

  // Notify admin of the new payment proof (non-blocking)
  const { data: storeInfo } = await adminSupabase
    .from("stores")
    .select("name, slug, email")
    .eq("id", storeId)
    .single();

  if (storeInfo) {
    notifyAdminNewPaymentProof(storeId, {
      storeName: storeInfo.name,
      storeSlug: storeInfo.slug,
      storeEmail: storeInfo.email,
      plan: plan || "starter",
      transactionNumber: transactionNumber || null,
      notes: notes || null,
      adminPanelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscriptions`,
    }).catch((err: unknown) => {
      logger.warn("payment_request_email", "Admin payment proof notification failed", {
        storeId,
        metadata: { error: String(err) },
      });
    });
  }

  revalidatePath("/dashboard/billing");
  revalidatePath("/admin/subscriptions");
  return { success: true, error: null };
}

// ============================================================
// MERCHANT: Get my payment requests
// ============================================================
export async function getMyPaymentRequests(): Promise<{
  data: PaymentRequest[];
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return { data: (data ?? []) as PaymentRequest[], error: null };
  } catch {
    return { data: [], error: "فشل جلب الطلبات" };
  }
}

// ============================================================
// ADMIN: Get all payment requests (paginated)
// ============================================================
export async function getAdminPaymentRequests(
  page = 1,
  statusFilter = "all",
  search = ""
): Promise<{
  data: (PaymentRequest & { stores: { name: string; slug: string; email: string | null } | null })[];
  count: number;
  error: string | null;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") {
    return { data: [], count: 0, error: "غير مصرح" };
  }

  // Runtime validation: reject unknown filter values before they reach the DB.
  const safeStatus = VALID_STATUS_FILTERS.has(statusFilter) ? statusFilter : "all";
  // Bound search length to prevent extremely long ilike patterns.
  const safeSearch = search.trim().slice(0, 100);

  const supabase = createAdminClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("payment_requests")
    .select("*, stores(name, slug, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (safeStatus !== "all") {
    query = query.eq("status", safeStatus as "pending" | "approved" | "rejected");
  }
  if (safeSearch) {
    query = query.ilike("transaction_number", `%${safeSearch}%`);
  }

  const { data, count, error } = await query;
  if (error) return { data: [], count: 0, error: "فشل جلب الطلبات" };
  return { data: (data ?? []) as any, count: count ?? 0, error: null };
}

// ============================================================
// ADMIN: Approve payment request
// ============================================================
export async function approvePaymentRequest(
  requestId: string,
  storeId: string,
  durationDays = 30
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") return { success: false, error: "غير مصرح" };

  const adminSupabase = createAdminClient();
  const now = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + durationDays);

  // Get request details for email
  const { data: req } = await adminSupabase
    .from("payment_requests")
    .select("plan, stores(name, email)")
    .eq("id", requestId)
    .single();

  // 1. Mark request approved
  const { error: reqError } = await adminSupabase
    .from("payment_requests")
    .update({ status: "approved", reviewed_by: user.id, reviewed_at: now.toISOString() })
    .eq("id", requestId);
  if (reqError) return { success: false, error: "فشل تحديث الطلب" };

  // 2. Update subscription — reset expiry_warning_sent_at so the new
  //    billing cycle gets a fresh 7-day warning from the cron job.
  await adminSupabase
    .from("subscriptions")
    .update({
      status: "active",
      admin_note: null,
      plan: req?.plan ?? null,
      current_period_start: now.toISOString(),
      current_period_end: endsAt.toISOString(),
      expiry_warning_sent_at: null,
    })
    .eq("store_id", storeId);

  // 3. Update store.subscription_status
  await adminSupabase
    .from("stores")
    .update({
      status: "active",
      subscription_status: "active",
      subscription_ends_at: endsAt.toISOString(),
    })
    .eq("id", storeId);

  // 4. Audit log
  await adminSupabase.from("admin_logs").insert({
    admin_id: user.id,
    store_id: storeId,
    action: "approve_payment_request",
    description: `الموافقة على طلب دفع الاشتراك للباقة ${req?.plan ?? "starter"}`,
    metadata: { requestId, durationDays, plan: req?.plan },
  });

  // 5. Send email (non-blocking — errors are caught inside)
  const storeData = req?.stores as any;
  if (storeData?.email) {
    notifyPaymentApproved(
      storeData.email,
      storeData.name,
      req?.plan ?? "starter",
      endsAt.toISOString(),
      storeId
    ).catch((err: unknown) => {
      logger.warn("payment_approved_email", "Approval notification email failed", {
        storeId,
        metadata: { error: String(err) },
      });
    });
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath("/dashboard/billing");
  return { success: true, error: null };
}

// ============================================================
// ADMIN: Reject payment request
// ============================================================
export async function rejectPaymentRequest(
  requestId: string,
  storeId: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") return { success: false, error: "غير مصرح" };

  if (!reason.trim()) return { success: false, error: "سبب الرفض مطلوب" };

  const adminSupabase = createAdminClient();

  const { data: req } = await adminSupabase
    .from("payment_requests")
    .select("plan, stores(name, email)")
    .eq("id", requestId)
    .single();

  const { error } = await adminSupabase
    .from("payment_requests")
    .update({
      status: "rejected",
      admin_note: reason.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { success: false, error: "فشل رفض الطلب" };

  // Update subscription status
  await adminSupabase
    .from("subscriptions")
    .update({ status: "rejected", admin_note: reason.trim() })
    .eq("store_id", storeId);

  // Audit log
  await adminSupabase.from("admin_logs").insert({
    admin_id: user.id,
    store_id: storeId,
    action: "reject_payment_request",
    description: `رفض طلب دفع الاشتراك: ${reason}`,
    metadata: { requestId, reason },
  });

  // Email notification
  const storeData = req?.stores as any;
  if (storeData?.email) {
    notifyPaymentRejected(storeData.email, storeData.name, reason.trim(), storeId).catch((err: unknown) => {
      logger.warn("payment_rejected_email", "Rejection notification email failed", {
        storeId,
        metadata: { error: String(err) },
      });
    });
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath("/dashboard/billing");
  return { success: true, error: null };
}

// ============================================================
// ADMIN: Run global subscription expiry job
// ============================================================
// Calls expire_overdue_subscriptions() atomically — all stores whose
// current_period_end < now() are expired in one Postgres CTE transaction.
// Can also be triggered automatically via /api/cron/check-subscriptions.
export async function runSubscriptionExpiryJob(): Promise<{
  success: boolean;
  expiredCount: number;
  error: string | null;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") {
    return { success: false, expiredCount: 0, error: "غير مصرح" };
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase.rpc("expire_overdue_subscriptions");

  if (error) {
    return { success: false, expiredCount: 0, error: error.message };
  }

  const result = data as unknown as { expired_count: number; run_at: string };

  await adminSupabase.from("admin_logs").insert({
    admin_id: user.id,
    action: "run_subscription_expiry_job",
    description: `تشغيل مهمة انتهاء الاشتراكات — تم إيقاف ${result.expired_count} متجر`,
    metadata: result,
  });

  revalidatePath("/admin/subscriptions");
  return { success: true, expiredCount: result.expired_count, error: null };
}
