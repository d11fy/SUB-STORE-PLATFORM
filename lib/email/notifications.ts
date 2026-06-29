// ============================================================
// Email notification dispatchers
//
// Each function maps one business event to one email.
// All are fire-and-forget safe — callers should .catch(() => {}).
// ============================================================
import { sendEmail } from "./sender";
import { createAdminClient } from "@/lib/supabase/admin"; // used by getAdminEmail()
import {
  trialEndingSoon,
  subscriptionExpired,
  paymentApproved,
  paymentRejected,
  subscriptionReactivated,
  orderConfirmation,
  adminPaymentProofAlert,
  type OrderConfirmationData,
  type AdminPaymentProofData,
} from "./templates";

// ── Audit helper ──────────────────────────────────────────────────────────────
// Email delivery events are system-generated (not admin actions) so they are
// logged to stdout only — admin_logs requires a real user FK which automated
// emails don't have. Monitor delivery via your email provider's dashboard.

function logEmailAudit(action: string, storeId: string | null, to: string, success: boolean) {
  const status = success ? "✓" : "✗";
  console.log(`[email] ${status} ${action} store=${storeId ?? "system"} to=${to}`);
}

// ── Admin email resolution ────────────────────────────────────────────────────
// Priority: platform_settings.admin_email → ADMIN_NOTIFICATION_EMAIL env var

let _adminEmailCache: { email: string | null; expires: number } | null = null;

async function getAdminEmail(): Promise<string | null> {
  if (_adminEmailCache && Date.now() < _adminEmailCache.expires) {
    return _adminEmailCache.email;
  }

  let email: string | null = process.env.ADMIN_NOTIFICATION_EMAIL ?? null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "admin_email")
      .maybeSingle();
    if ((data as any)?.value) email = (data as any).value;
  } catch {
    // Fall through to env var value already set above
  }

  _adminEmailCache = { email, expires: Date.now() + 5 * 60 * 1000 };
  return email;
}

// ============================================================
// 1. Trial ending soon
//    Trigger: daily cron when trial_ends_at is within 7 days
// ============================================================
export async function notifyTrialEndingSoon(
  to: string,
  storeName: string,
  plan: string,
  trialEndsAt: string,
  storeId: string
) {
  const result = await sendEmail({
    to,
    subject: `تنبيه: فترة التجربة المجانية لمتجر ${storeName} على وشك الانتهاء`,
    html: trialEndingSoon(storeName, plan, trialEndsAt),
  });
  logEmailAudit("email_trial_ending_soon", storeId, to, result.success);
  return result;
}

// ============================================================
// 2. Subscription expired — store suspended
//    Trigger: checkAndExpireSubscription() in actions/billing.ts
// ============================================================
export async function notifySubscriptionExpired(
  to: string,
  storeName: string,
  plan: string,
  storeId: string
) {
  const result = await sendEmail({
    to,
    subject: `تنبيه عاجل: انتهى اشتراك متجرك ${storeName}`,
    html: subscriptionExpired(storeName, plan),
  });
  logEmailAudit("email_subscription_expired", storeId, to, result.success);
  return result;
}

// ============================================================
// 3. Admin approved subscription payment
//    Trigger: approvePaymentRequest() in actions/payment-requests.ts
// ============================================================
export async function notifyPaymentApproved(
  to: string,
  storeName: string,
  plan: string,
  endsAt: string,
  storeId: string
) {
  const result = await sendEmail({
    to,
    subject: `✅ تم تفعيل اشتراكك في سبأ ستور`,
    html: paymentApproved(storeName, plan, endsAt),
  });
  logEmailAudit("email_payment_approved", storeId, to, result.success);
  return result;
}

// ============================================================
// 4. Admin rejected subscription payment
//    Trigger: rejectPaymentRequest() in actions/payment-requests.ts
// ============================================================
export async function notifyPaymentRejected(
  to: string,
  storeName: string,
  reason: string,
  storeId: string
) {
  const result = await sendEmail({
    to,
    subject: `إشعار: تم رفض طلب الدفع لمتجر ${storeName}`,
    html: paymentRejected(storeName, reason),
  });
  logEmailAudit("email_payment_rejected", storeId, to, result.success);
  return result;
}

// ============================================================
// 5. Subscription reactivated after renewal approval
//    Trigger: approvePaymentRequest() (second subscription cycle)
// ============================================================
export async function notifySubscriptionReactivated(
  to: string,
  storeName: string,
  plan: string,
  storeId: string
) {
  const result = await sendEmail({
    to,
    subject: `🎉 تمت إعادة تفعيل متجرك في سبأ ستور`,
    html: subscriptionReactivated(storeName, plan),
  });
  logEmailAudit("email_subscription_reactivated", storeId, to, result.success);
  return result;
}

// ============================================================
// 6. Order confirmation → customer
//    Trigger: createCustomerOrder() in actions/checkout.ts
//    Only sent when customer provides an email at checkout.
// ============================================================
export async function notifyOrderConfirmation(
  to: string,
  storeId: string,
  data: OrderConfirmationData
) {
  const result = await sendEmail({
    to,
    subject: `تأكيد طلبك #${data.orderNumber} من متجر ${data.storeName}`,
    html: orderConfirmation(data),
    replyTo: data.storeEmail ?? undefined,
  });
  logEmailAudit("email_order_confirmation", storeId, to, result.success);
  return result;
}

// ============================================================
// 7. Payment proof uploaded → admin
//    Trigger: createPaymentRequest() in actions/payment-requests.ts
//    Sent to ADMIN_NOTIFICATION_EMAIL or platform_settings.admin_email
// ============================================================
export async function notifyAdminNewPaymentProof(
  storeId: string,
  data: AdminPaymentProofData
) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return { success: false, error: "ADMIN_NOTIFICATION_EMAIL not configured" };

  const result = await sendEmail({
    to: adminEmail,
    subject: `[سبأ ستور] طلب اشتراك جديد: ${data.storeName}`,
    html: adminPaymentProofAlert(data),
  });
  logEmailAudit("email_admin_payment_proof", storeId, adminEmail, result.success);
  return result;
}

// ============================================================
// 8. Subscription expiring soon (7 days) — for paid subscriptions
//    Trigger: daily cron /api/cron/check-subscriptions
//    Anti-spam: subscriptions.expiry_warning_sent_at guards re-sends
// ============================================================
export async function notifySubscriptionExpiringSoon(
  to: string,
  storeName: string,
  plan: string,
  expiresAt: string,
  storeId: string
) {
  const result = await sendEmail({
    to,
    subject: `تنبيه: اشتراك متجرك ${storeName} ينتهي خلال 7 أيام`,
    html: trialEndingSoon(storeName, plan, expiresAt),
  });
  logEmailAudit("email_subscription_expiring_soon", storeId, to, result.success);
  return result;
}
