import { sendEmail } from "./sender";
import {
  trialEndingSoon,
  subscriptionExpired,
  paymentApproved,
  paymentRejected,
  subscriptionReactivated,
} from "./templates";
import { createAdminClient } from "@/lib/supabase/admin";

async function logEmailAudit(action: string, storeId: string, to: string, success: boolean) {
  try {
    const supabase = createAdminClient();
    await supabase.from("audit_logs").insert({
      action,
      resource_type: "store",
      resource_id: storeId,
      details: { email_to: to, success },
    });
  } catch {
    // Audit log failure is non-fatal
  }
}

export async function notifyTrialEndingSoon(to: string, storeName: string, plan: string, trialEndsAt: string, storeId: string) {
  const result = await sendEmail({
    to,
    subject: `تنبيه: فترة التجربة المجانية لمتجر ${storeName} على وشك الانتهاء`,
    html: trialEndingSoon(storeName, plan, trialEndsAt),
  });
  await logEmailAudit("email_trial_ending_soon", storeId, to, result.success);
  return result;
}

export async function notifySubscriptionExpired(to: string, storeName: string, plan: string, storeId: string) {
  const result = await sendEmail({
    to,
    subject: `تنبيه عاجل: انتهى اشتراك متجرك ${storeName}`,
    html: subscriptionExpired(storeName, plan),
  });
  await logEmailAudit("email_subscription_expired", storeId, to, result.success);
  return result;
}

export async function notifyPaymentApproved(to: string, storeName: string, plan: string, endsAt: string, storeId: string) {
  const result = await sendEmail({
    to,
    subject: `✅ تم تفعيل اشتراكك في سبأ ستور`,
    html: paymentApproved(storeName, plan, endsAt),
  });
  await logEmailAudit("email_payment_approved", storeId, to, result.success);
  return result;
}

export async function notifyPaymentRejected(to: string, storeName: string, reason: string, storeId: string) {
  const result = await sendEmail({
    to,
    subject: `إشعار: تم رفض طلب الدفع لمتجر ${storeName}`,
    html: paymentRejected(storeName, reason),
  });
  await logEmailAudit("email_payment_rejected", storeId, to, result.success);
  return result;
}

export async function notifySubscriptionReactivated(to: string, storeName: string, plan: string, storeId: string) {
  const result = await sendEmail({
    to,
    subject: `🎉 تمت إعادة تفعيل متجرك في سبأ ستور`,
    html: subscriptionReactivated(storeName, plan),
  });
  await logEmailAudit("email_subscription_reactivated", storeId, to, result.success);
  return result;
}
