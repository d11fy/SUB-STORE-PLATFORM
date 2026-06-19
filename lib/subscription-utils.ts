import type { Subscription } from "@/lib/types/database";

export function isSubscriptionLocked(sub: Subscription | null | undefined): boolean {
  if (!sub) return true;
  if (sub.status === "active") return false;

  if (sub.status === "trialing" && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) < new Date();
  }

  return true;
}

export type SubscriptionStateStatus =
  | "active"
  | "trialing"
  | "pending"
  | "rejected"
  | "locked"
  | "no_sub";

export function getSubscriptionState(sub: Subscription | null | undefined): {
  status: SubscriptionStateStatus;
  daysRemaining: number;
  trialExpired: boolean;
  adminNote: string | null;
} {
  if (!sub) return { status: "no_sub", daysRemaining: 0, trialExpired: false, adminNote: null };

  if (sub.status === "active") {
    return { status: "active", daysRemaining: 0, trialExpired: false, adminNote: null };
  }

  if (sub.status === "trialing") {
    const end = sub.trial_ends_at ? new Date(sub.trial_ends_at) : new Date();
    const diffMs = end.getTime() - Date.now();
    const days = Math.max(0, Math.ceil(diffMs / 86_400_000));
    const expired = days === 0;
    return { status: expired ? "locked" : "trialing", daysRemaining: days, trialExpired: expired, adminNote: null };
  }

  if (sub.status === "pending") {
    return { status: "pending", daysRemaining: 0, trialExpired: true, adminNote: null };
  }

  if (sub.status === "rejected") {
    return { status: "rejected", daysRemaining: 0, trialExpired: true, adminNote: sub.admin_note };
  }

  return { status: "locked", daysRemaining: 0, trialExpired: true, adminNote: null };
}
