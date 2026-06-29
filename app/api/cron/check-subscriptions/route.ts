// Cron endpoint: subscription lifecycle maintenance
//
// Runs two jobs on each call:
//   1. expire_overdue_subscriptions() — atomically expires all stores past current_period_end
//   2. send7DayExpiryWarnings()       — emails merchants whose sub expires in ~7 days
//
// Configure in vercel.json:
//   { "crons": [{ "path": "/api/cron/check-subscriptions", "schedule": "0 3 * * *" }] }
//
// Vercel injects Authorization: Bearer {CRON_SECRET} automatically.
// Set CRON_SECRET in your Vercel env. For local testing:
//   curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/cron/check-subscriptions
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySubscriptionExpiringSoon } from "@/lib/email/notifications";

export const runtime = "nodejs";

// ── Auth guard ────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return Boolean(process.env.CRON_SECRET && token === process.env.CRON_SECRET);
}

// ── Job 2: 7-day expiry warning ───────────────────────────────────────────────
// Finds active subscriptions expiring in the next 6–8 days and sends a warning
// email. Uses expiry_warning_sent_at to prevent re-sending in the same period.

async function send7DayExpiryWarnings(): Promise<{ warned: number; errors: number }> {
  const supabase = createAdminClient();
  const now = new Date();
  const in6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();
  const in8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

  // Find subscriptions expiring within the warning window that haven't been notified yet
  const { data: candidates, error } = await supabase
    .from("subscriptions")
    .select("id, store_id, plan, current_period_end, stores(name, email)")
    .eq("status", "active")
    .gte("current_period_end", in6Days)
    .lte("current_period_end", in8Days)
    .is("expiry_warning_sent_at", null);

  if (error || !candidates?.length) {
    return { warned: 0, errors: error ? 1 : 0 };
  }

  let warned = 0;
  let errors = 0;

  await Promise.all(
    candidates.map(async (sub: any) => {
      const store = Array.isArray(sub.stores) ? sub.stores[0] : sub.stores;
      if (!store?.email) return;

      const result = await notifySubscriptionExpiringSoon(
        store.email,
        store.name,
        sub.plan ?? "starter",
        sub.current_period_end,
        sub.store_id
      ).catch(() => ({ success: false }));

      if (result.success) {
        // Mark as warned — prevents duplicate emails even if cron runs twice
        await supabase
          .from("subscriptions")
          .update({ expiry_warning_sent_at: now.toISOString() })
          .eq("id", sub.id);
        warned++;
      } else {
        errors++;
      }
    })
  );

  return { warned, errors };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Job 1: expire overdue subscriptions
  const { data: expiryData, error: expiryError } = await supabase.rpc(
    "expire_overdue_subscriptions"
  );

  if (expiryError) {
    console.error("[cron] expire_overdue_subscriptions failed:", expiryError.message);
    return NextResponse.json({ error: expiryError.message }, { status: 500 });
  }

  const expiredResult = expiryData as { expired_count: number; run_at: string };

  // Job 2: 7-day warning emails
  const warningResult = await send7DayExpiryWarnings();

  const summary = {
    expired_count: expiredResult.expired_count,
    warned_count: warningResult.warned,
    warning_errors: warningResult.errors,
    run_at: expiredResult.run_at,
  };

  console.log("[cron/check-subscriptions]", summary);
  return NextResponse.json(summary);
}
