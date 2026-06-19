import { createAdminClient } from "@/lib/supabase/admin";
import { Activity, AlertTriangle, CheckCircle2, Clock, ShoppingBag, Store, TrendingUp, Users } from "lucide-react";

export const dynamic = "force-dynamic";

async function getMonitoringData() {
  const supabase = createAdminClient();
  const since24h = new Date(Date.now() - 86_400_000).toISOString();
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [
    { count: storesTotal },
    { count: storesActive },
    { count: storesSuspended },
    { count: storesTrial },
    { count: orders24h },
    { count: ordersTotal },
    { count: usersTotal },
    { data: recentLogs },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "trial"),
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", since24h),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("admin_logs")
      .select("id, action, description, created_at, store_id")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("orders")
      .select("id, status, total_amount, created_at, store_id")
      .gte("created_at", since7d)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Derive order health
  const failedOrders = recentOrders?.filter((o) =>
    ["ملغي", "فشل_الدفع"].includes(o.status)
  ) ?? [];

  const pendingPaymentOrders = recentOrders?.filter((o) =>
    o.status === "بانتظار_تأكيد_الدفع"
  ) ?? [];

  const completedOrders = recentOrders?.filter((o) =>
    ["مكتمل", "تم_تأكيد_الدفع", "تم_الشحن"].includes(o.status)
  ) ?? [];

  const totalRevenue7d = completedOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);

  return {
    stores: {
      total: storesTotal ?? 0,
      active: storesActive ?? 0,
      suspended: storesSuspended ?? 0,
      trial: storesTrial ?? 0,
    },
    orders: {
      total: ordersTotal ?? 0,
      last24h: orders24h ?? 0,
      failed7d: failedOrders.length,
      pendingPayment: pendingPaymentOrders.length,
      completedRevenue7d: totalRevenue7d,
    },
    users: { total: usersTotal ?? 0 },
    recentLogs: recentLogs ?? [],
  };
}

export default async function MonitoringPage() {
  const data = await getMonitoringData();

  const storeHealthPct =
    data.stores.total > 0
      ? Math.round((data.stores.active / data.stores.total) * 100)
      : 100;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-cairo" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">مراقبة المنصة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            صحة النظام · آخر تحديث: {new Date().toLocaleString("ar-SA")}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
          data.stores.suspended > 0
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            data.stores.suspended > 0 ? "bg-amber-500" : "bg-emerald-500"
          }`} />
          {data.stores.suspended > 0 ? "تنبيهات نشطة" : "النظام يعمل بشكل طبيعي"}
        </div>
      </div>

      {/* System Health Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "المتاجر النشطة",
            value: `${data.stores.active} / ${data.stores.total}`,
            sub: `${storeHealthPct}% معدل الصحة`,
            icon: Store,
            color: storeHealthPct >= 80 ? "text-emerald-600" : "text-amber-600",
            bg: storeHealthPct >= 80 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200",
          },
          {
            label: "طلبات آخر 24 ساعة",
            value: data.orders.last24h,
            sub: `${data.orders.total} إجمالي`,
            icon: ShoppingBag,
            color: "text-primary",
            bg: "bg-primary/5 border-primary/20",
          },
          {
            label: "متاجر موقفة",
            value: data.stores.suspended,
            sub: `${data.stores.trial} في تجربة`,
            icon: AlertTriangle,
            color: data.stores.suspended > 0 ? "text-amber-600" : "text-muted-foreground",
            bg: data.stores.suspended > 0 ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border",
          },
          {
            label: "طلبات بانتظار الدفع",
            value: data.orders.pendingPayment,
            sub: `${data.orders.failed7d} ملغية (7 أيام)`,
            icon: Clock,
            color: data.orders.pendingPayment > 10 ? "text-amber-600" : "text-muted-foreground",
            bg: data.orders.pendingPayment > 10 ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border",
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-4 ${item.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Users row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">إيراد آخر 7 أيام</p>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-foreground">
            ₪{data.orders.completedRevenue7d.toLocaleString("ar-SA")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">من الطلبات المكتملة</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">إجمالي التجار</p>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{data.users.total}</p>
          <p className="text-xs text-muted-foreground mt-1">مسجلون في المنصة</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">طلبات ملغية (7 أيام)</p>
            <AlertTriangle className={`h-4 w-4 ${data.orders.failed7d > 5 ? "text-red-500" : "text-muted-foreground"}`} />
          </div>
          <p className={`text-2xl font-black ${data.orders.failed7d > 5 ? "text-red-600" : "text-foreground"}`}>
            {data.orders.failed7d}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.orders.failed7d === 0 ? "لا توجد طلبات ملغية" : "يستحق المراجعة"}
          </p>
        </div>
      </div>

      {/* Admin Action Log */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">سجل الإجراءات الإدارية الأخيرة</h2>
          <span className="mr-auto text-xs text-muted-foreground">{data.recentLogs.length} إجراء</span>
        </div>

        {data.recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد إجراءات إدارية مسجلة بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.recentLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{log.action}</p>
                  {log.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{log.description}</p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("ar-SA", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
