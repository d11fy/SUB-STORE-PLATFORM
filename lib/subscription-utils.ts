import type { Subscription } from "@/lib/types/database";

export type SubscriptionStateStatus =
  | "active"
  | "trialing"
  | "pending"
  | "rejected"
  | "expired"
  | "suspended"
  | "locked"
  | "no_sub";

/**
 * Returns true if the subscription prevents the store from operating.
 * Performs a client-side period-end check for active subscriptions so
 * the UI reflects expiry immediately, even before the cron job runs.
 */
export function isSubscriptionLocked(sub: Subscription | null | undefined): boolean {
  if (!sub) return true;

  if (sub.status === "active") {
    if (sub.current_period_end) {
      return new Date(sub.current_period_end) < new Date();
    }
    return false;
  }

  if (sub.status === "trialing" && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) < new Date();
  }

  // pending, rejected, expired, canceled, past_due — all locked
  return true;
}

/**
 * Derives a rich UI state from a subscription record.
 *
 * @param sub - subscription row (null → no_sub)
 * @param storeSubscriptionStatus - stores.subscription_status for suspended check
 */
export function getSubscriptionState(
  sub: Subscription | null | undefined,
  storeSubscriptionStatus?: string
): {
  status: SubscriptionStateStatus;
  daysRemaining: number;
  trialExpired: boolean;
  adminNote: string | null;
} {
  if (!sub) {
    return { status: "no_sub", daysRemaining: 0, trialExpired: false, adminNote: null };
  }

  // Admin-suspended overrides all other states
  if (storeSubscriptionStatus === "suspended") {
    return { status: "suspended", daysRemaining: 0, trialExpired: false, adminNote: null };
  }

  if (sub.status === "active") {
    if (sub.current_period_end) {
      const end = new Date(sub.current_period_end);
      const now = new Date();
      if (end < now) {
        // DB hasn't been updated by cron yet — treat as expired client-side
        return { status: "expired", daysRemaining: 0, trialExpired: false, adminNote: null };
      }
      const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
      return { status: "active", daysRemaining: days, trialExpired: false, adminNote: null };
    }
    return { status: "active", daysRemaining: 0, trialExpired: false, adminNote: null };
  }

  if (sub.status === "trialing") {
    const end = sub.trial_ends_at ? new Date(sub.trial_ends_at) : new Date();
    const diffMs = end.getTime() - Date.now();
    const days = Math.max(0, Math.ceil(diffMs / 86_400_000));
    const expired = diffMs <= 0;
    return {
      status: expired ? "locked" : "trialing",
      daysRemaining: days,
      trialExpired: expired,
      adminNote: null,
    };
  }

  if (sub.status === "pending") {
    return { status: "pending", daysRemaining: 0, trialExpired: true, adminNote: null };
  }

  if (sub.status === "rejected") {
    return { status: "rejected", daysRemaining: 0, trialExpired: true, adminNote: sub.admin_note };
  }

  if (sub.status === "expired") {
    return { status: "expired", daysRemaining: 0, trialExpired: false, adminNote: sub.admin_note };
  }

  // past_due, canceled, unpaid
  return { status: "locked", daysRemaining: 0, trialExpired: true, adminNote: null };
}
