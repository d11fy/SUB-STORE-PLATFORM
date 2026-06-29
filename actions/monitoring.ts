"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "./auth";

// ── Auth guard ─────────────────────────────────────────────────────────────────
async function requireAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") {
    throw new Error("غير مصرح");
  }
}

// ── Public types ───────────────────────────────────────────────────────────────

export type StoreActivityRow = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeStatus: string;
  orderCount: number;
  revenue: number;
};

export type ErrorLogEntry = {
  id: string;
  category: "ai_error" | "payment_rejected" | "admin_action";
  title: string;
  detail: string | null;
  timestamp: string;
  storeId: string | null;
};

export type MonitoringSnapshot = {
  fetchedAt: string;
  systemHealth: {
    storesTotal: number;
    storesActive: number;
    storesSuspended: number;
    storesTrial: number;
    subscriptionsActive: number;
    subscriptionsPending: number;
    trialsExpiringIn7d: number;
    pendingPaymentRequests: number;
    orders24h: number;
    ordersTotal: number;
    usersTotal: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    gmv7d: number;
    gmv30d: number;
    activeSubscriptions: number;
    byPackage: { name: string; count: number; mrr: number }[];
  };
  aiUsage: {
    creditsIssued: number;
    creditsUsed: number;
    generations24h: number;
    errors24h: number;
    errorRate: number;
    byType: { type: string; count: number }[];
  };
  storeActivity: StoreActivityRow[];
  errorLog: ErrorLogEntry[];
};

// ── Main snapshot function ─────────────────────────────────────────────────────
//
// All queries run in a single Promise.all batch.  Design constraints:
//   • COUNT-only queries use head:true — no row data transferred
//   • All data queries are time-bounded or limited to prevent large scans
//   • No N+1 queries — a single follow-up query fetches store names in bulk
//   • Total round-trips: 2 (one large parallel batch + one small store-name lookup)

export async function getMonitoringSnapshot(): Promise<MonitoringSnapshot> {
  await requireAdmin();

  const db = createAdminClient();
  const now = new Date();
  const since24h = new Date(now.getTime() - 86_400_000).toISOString();
  const since48h = new Date(now.getTime() - 2 * 86_400_000).toISOString();
  const since7d  = new Date(now.getTime() - 7  * 86_400_000).toISOString();
  const since30d = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const in7d     = new Date(now.getTime() + 7  * 86_400_000).toISOString();

  // ── Round-trip 1: parallel batch ──────────────────────────────────────────
  const [
    // System health — COUNT-only queries (no row data, no network overhead)
    { count: storesTotal },
    { count: storesActive },
    { count: storesSuspended },
    { count: storesTrial },
    { count: subsActive },
    { count: subsPending },
    { count: trialsExpiring },
    { count: pendingPayReqs },
    { count: orders24h },
    { count: ordersTotal },
    { count: usersTotal },
    // Revenue — active subscriptions with package prices
    { data: activeSubs },
    // GMV — orders last 30d; only store_id + amount + timestamp; bounded at 2000 rows
    { data: orders30d },
    // AI credits — platform-wide totals
    { data: aiCredits },
    // AI generation counts (last 24h, head-only)
    { count: aiGen24h },
    { count: aiErr24h },
    // AI type breakdown — last 7d, bounded at 500 rows
    { data: aiTypeRows },
    // Error log sources — each bounded, newest first
    { data: aiErrorLog },
    { data: rejectedPayments },
    { data: adminErrorLog },
  ] = await Promise.all([
    // ── Store health counts ──────────────────────────────────────────────────
    db.from("stores").select("*", { count: "exact", head: true }),
    db.from("stores").select("*", { count: "exact", head: true }).eq("status", "active"),
    db.from("stores").select("*", { count: "exact", head: true }).eq("status", "suspended"),
    db.from("stores").select("*", { count: "exact", head: true }).eq("status", "trial"),
    // ── Subscription counts ─────────────────────────────────────────────────
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "trialing")
      .lte("trial_ends_at", in7d)
      .gte("trial_ends_at", now.toISOString()),
    db.from("payment_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    // ── Order counts ────────────────────────────────────────────────────────
    db.from("orders").select("*", { count: "exact", head: true }).gte("created_at", since24h),
    db.from("orders").select("*", { count: "exact", head: true }),
    db.from("users").select("*", { count: "exact", head: true }),
    // ── Revenue data ────────────────────────────────────────────────────────
    db.from("subscriptions")
      .select("packages(name, price_monthly)")
      .eq("status", "active"),
    db.from("orders")
      .select("store_id, total_amount, created_at")
      .in("status", ["تم_تأكيد_الدفع", "مكتمل", "تم_الشحن"])
      .gte("created_at", since30d)
      .limit(2000),
    // ── AI credits ──────────────────────────────────────────────────────────
    db.from("ai_credits").select("credits_total, credits_used"),
    db.from("ai_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h),
    db.from("ai_generations")
      .select("*", { count: "exact", head: true })
      .eq("status", "error")
      .gte("created_at", since24h),
    db.from("ai_generations")
      .select("type")
      .gte("created_at", since7d)
      .limit(500),
    // ── Error log sources ────────────────────────────────────────────────────
    db.from("ai_generations")
      .select("id, type, error_message, created_at, store_id")
      .eq("status", "error")
      .gte("created_at", since48h)
      .order("created_at", { ascending: false })
      .limit(20),
    db.from("payment_requests")
      .select("id, plan, admin_note, created_at, store_id, stores(name)")
      .eq("status", "rejected")
      .gte("created_at", since48h)
      .order("created_at", { ascending: false })
      .limit(15),
    db.from("admin_logs")
      .select("id, action, description, created_at, store_id")
      .in("action", ["reject_payment_request", "suspend_user_stores"])
      .gte("created_at", since48h)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // ── MRR calculation ────────────────────────────────────────────────────────
  const mrr = (activeSubs ?? []).reduce((sum: number, sub: any) => {
    return sum + ((sub.packages as any)?.price_monthly ?? 0);
  }, 0);

  const pkgMap: Record<string, { name: string; count: number; mrr: number }> = {};
  for (const sub of activeSubs ?? []) {
    const pkg = (sub as any).packages;
    if (!pkg?.name) continue;
    if (!pkgMap[pkg.name]) pkgMap[pkg.name] = { name: pkg.name, count: 0, mrr: 0 };
    pkgMap[pkg.name].count++;
    pkgMap[pkg.name].mrr += pkg.price_monthly ?? 0;
  }

  // ── GMV aggregation + store activity ──────────────────────────────────────
  // Aggregate in JS from the bounded 2000-row query — no GROUP BY round-trip.
  const since7dMs = now.getTime() - 7 * 86_400_000;
  let gmv30d = 0;
  let gmv7d = 0;
  const storeRevMap: Record<string, { revenue: number; count: number }> = {};

  for (const o of orders30d ?? []) {
    const amount = o.total_amount ?? 0;
    gmv30d += amount;
    if (new Date(o.created_at).getTime() >= since7dMs) gmv7d += amount;
    const sid = o.store_id;
    if (!storeRevMap[sid]) storeRevMap[sid] = { revenue: 0, count: 0 };
    storeRevMap[sid].revenue += amount;
    storeRevMap[sid].count++;
  }

  const topStoreIds = Object.entries(storeRevMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([id]) => id);

  // ── Round-trip 2: store names for top active stores ────────────────────────
  let storeActivity: StoreActivityRow[] = [];
  if (topStoreIds.length > 0) {
    const { data: storeRows } = await db
      .from("stores")
      .select("id, name, slug, status")
      .in("id", topStoreIds);

    storeActivity = topStoreIds.map((id) => {
      const s = storeRows?.find((r) => r.id === id);
      return {
        storeId: id,
        storeName: s?.name ?? "—",
        storeSlug: s?.slug ?? "",
        storeStatus: s?.status ?? "unknown",
        orderCount: storeRevMap[id].count,
        revenue: storeRevMap[id].revenue,
      };
    });
  }

  // ── AI usage ──────────────────────────────────────────────────────────────
  const creditsIssued = (aiCredits ?? []).reduce((s: number, c: any) => s + (c.credits_total ?? 0), 0);
  const creditsUsed   = (aiCredits ?? []).reduce((s: number, c: any) => s + (c.credits_used  ?? 0), 0);
  const gen24h   = aiGen24h ?? 0;
  const err24h   = aiErr24h ?? 0;
  const errorRate = gen24h > 0 ? Math.round((err24h / gen24h) * 100) : 0;

  const typeMap: Record<string, number> = {};
  for (const g of aiTypeRows ?? []) {
    if (g.type) typeMap[g.type] = (typeMap[g.type] ?? 0) + 1;
  }
  const byType = Object.entries(typeMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([type, count]) => ({ type, count }));

  // ── Unified error log ──────────────────────────────────────────────────────
  const errorLog: ErrorLogEntry[] = [
    ...(aiErrorLog ?? []).map((g): ErrorLogEntry => ({
      id: g.id,
      category: "ai_error",
      title: `خطأ AI: ${g.type ?? "توليد"}`,
      detail: g.error_message ?? null,
      timestamp: g.created_at,
      storeId: g.store_id ?? null,
    })),
    ...(rejectedPayments ?? []).map((p: any): ErrorLogEntry => ({
      id: p.id,
      category: "payment_rejected",
      title: `دفعية مرفوضة: ${(p.stores as any)?.name ?? p.store_id?.slice(0, 8) ?? "—"}`,
      detail: p.admin_note ?? `خطة ${p.plan ?? "starter"}`,
      timestamp: p.created_at,
      storeId: p.store_id ?? null,
    })),
    ...(adminErrorLog ?? []).map((l): ErrorLogEntry => ({
      id: l.id,
      category: "admin_action",
      title: l.action.replace(/_/g, " "),
      detail: l.description ?? null,
      timestamp: l.created_at,
      storeId: l.store_id ?? null,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);

  return {
    fetchedAt: now.toISOString(),
    systemHealth: {
      storesTotal:            storesTotal    ?? 0,
      storesActive:           storesActive   ?? 0,
      storesSuspended:        storesSuspended ?? 0,
      storesTrial:            storesTrial    ?? 0,
      subscriptionsActive:    subsActive     ?? 0,
      subscriptionsPending:   subsPending    ?? 0,
      trialsExpiringIn7d:     trialsExpiring ?? 0,
      pendingPaymentRequests: pendingPayReqs ?? 0,
      orders24h:              orders24h      ?? 0,
      ordersTotal:            ordersTotal    ?? 0,
      usersTotal:             usersTotal     ?? 0,
    },
    revenue: {
      mrr,
      arr: mrr * 12,
      gmv7d,
      gmv30d,
      activeSubscriptions: activeSubs?.length ?? 0,
      byPackage: Object.values(pkgMap),
    },
    aiUsage: {
      creditsIssued,
      creditsUsed,
      generations24h: gen24h,
      errors24h:      err24h,
      errorRate,
      byType,
    },
    storeActivity,
    errorLog,
  };
}
