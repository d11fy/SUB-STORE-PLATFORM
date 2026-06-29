"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantStoreId } from "./store-utils";
import { getSubscriptionState } from "@/lib/subscription-utils";
import { createPaymentRequest } from "./payment-requests";
import { notifySubscriptionExpired } from "@/lib/email/notifications";
import { logger } from "@/lib/monitoring/logger";
import type { Subscription, PaymentRequest } from "@/lib/types/database";

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: lazy single-store expiry check
// If a subscription is active but past its period end, expire it in the DB
// immediately rather than waiting for the next cron run.
// ─────────────────────────────────────────────────────────────────────────────
async function checkAndExpireSubscription(storeId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, status, current_period_end, plan")
    .eq("store_id", storeId)
    .maybeSingle();

  if (!sub || sub.status !== "active" || !sub.current_period_end) return;
  if (new Date(sub.current_period_end) > now) return;

  // Expire both tables concurrently; the store update is conditional on
  // subscription_status = 'active' to avoid overwriting a concurrent change.
  await Promise.all([
    admin
      .from("subscriptions")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("id", sub.id),
    admin
      .from("stores")
      .update({ subscription_status: "expired", updated_at: now.toISOString() })
      .eq("id", storeId)
      .eq("subscription_status", "active"),
  ]);

  // Non-blocking email notification
  const { data: store } = await admin
    .from("stores")
    .select("name, email")
    .eq("id", storeId)
    .single();

  if (store?.email) {
    notifySubscriptionExpired(
      store.email,
      store.name,
      (sub as any).plan ?? "starter",
      storeId
    ).catch((err: unknown) => {
      logger.warn("billing_expiry_email", "Subscription expired notification failed", {
        storeId,
        metadata: { error: String(err) },
      });
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing state shape returned to the dashboard billing page
// ─────────────────────────────────────────────────────────────────────────────
export interface BillingState {
  subscription: Subscription | null;
  store: {
    subscription_status: string;
    subscription_ends_at: string | null;
    trial_ends_at: string | null;
  } | null;
  lastPaymentRequest: PaymentRequest | null;
  state: ReturnType<typeof getSubscriptionState>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive billing state for the dashboard.
// Triggers lazy expiry before reading so the returned state is always current.
// ─────────────────────────────────────────────────────────────────────────────
export async function getMyBillingState(): Promise<{
  data: BillingState | null;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();

    // Run expiry check first — updates DB if the period has passed
    await checkAndExpireSubscription(storeId);

    const admin = createAdminClient();

    const [subResult, storeResult, reqResult] = await Promise.all([
      admin
        .from("subscriptions")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle(),
      admin
        .from("stores")
        .select("subscription_status, subscription_ends_at, trial_ends_at")
        .eq("id", storeId)
        .single(),
      admin
        .from("payment_requests")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const sub = subResult.data as Subscription | null;
    const store = storeResult.data ?? null;
    const state = getSubscriptionState(sub, store?.subscription_status);

    return {
      data: {
        subscription: sub,
        store,
        lastPaymentRequest: reqResult.data as PaymentRequest | null,
        state,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "فشل جلب بيانات الفوترة" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw subscription record — kept for backward compatibility
// ─────────────────────────────────────────────────────────────────────────────
export async function getMySubscription(): Promise<{
  data: Subscription | null;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("subscriptions")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) throw error;
    return { data: data as Subscription | null, error: null };
  } catch {
    return { data: null, error: "فشل جلب بيانات الاشتراك" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Submit payment proof — delegates to createPaymentRequest so the admin
// approval queue receives the request. The old direct-subscription approach
// bypassed the payment_requests table and broke the approval flow.
// ─────────────────────────────────────────────────────────────────────────────
export async function submitPaymentProof(
  fileBase64: string,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; error: string | null }> {
  return createPaymentRequest(fileBase64, fileName, fileType, "starter", "", "");
}
