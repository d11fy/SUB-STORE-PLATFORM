// ============================================================
// Saba Store — Dashboard Overview Page (Live Statistics)
// ============================================================
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Package,
  ArrowUpRight,
  Clock,
  Store,
  CreditCard,
  Truck,
  AlertTriangle,
  Tag,
  Crown,
  Sparkles,
  ShoppingBag,
  Users,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, getTrialDaysRemaining } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DashboardMetricCard } from "@/components/ui/dashboard-metric-card";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch store with relations
  const { data: storeData } = await supabase
    .from("stores")
    .select(`*, packages (*), subscriptions (*), ai_credits (*)`)
    .eq("owner_id", user.id)
    .maybeSingle();

  const store = storeData as any;

  if (!store) redirect("/dashboard/onboarding");

  // Fetch counts
  const [
    productsResult,
    categoriesResult,
    paymentsResult,
    shippingResult,
    ordersResult,
    customersResult,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", store.id),
    supabase.from("payment_methods").select("id", { count: "exact", head: true }).eq("store_id", store.id).eq("is_active", true),
    supabase.from("shipping_methods").select("id", { count: "exact", head: true }).eq("store_id", store.id).eq("is_active", true),
    supabase.from("orders").select("total_amount, status").eq("store_id", store.id),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", store.id),
  ]);

  const productsCount = productsResult.count ?? 0;
  const categoriesCount = categoriesResult.count ?? 0;
  const activePaymentsCount = paymentsResult.count ?? 0;
  const activeShippingCount = shippingResult.count ?? 0;
  const customersCount = customersResult.count ?? 0;
  const orders = ordersResult.data ?? [];
  const ordersCount = orders.length;

  // Calculate revenue
  const totalRevenue = orders.reduce((sum, order) => {
    if (order.status !== "ملغي" && order.status !== "فشل_الدفع") {
      return sum + (order.total_amount ?? 0);
    }
    return sum;
  }, 0);

  // Onboarding Setup Alerts
  const alerts = [];
  if (productsCount === 0) {
    alerts.push({
      id: "no-products",
      title: "لم تقم بإضافة منتجات بعد",
      message: "ابدأ بإضافة منتجاتك وحدد أسعارها وصورها حتى تظهر للزوار في واجهة متجرك.",
      href: "/dashboard/products",
      actionText: "إضافة منتج",
    });
  }
  if (activePaymentsCount === 0) {
    alerts.push({
      id: "no-payments",
      title: "لم تقم بتفعيل طرق الدفع بعد",
      message: "يرجى إضافة طريقة دفع واحدة على الأقل (مثل تحويل بنكي أو محفظة جوال باي) لاستقبال المدفوعات.",
      href: "/dashboard/payments",
      actionText: "إعداد الدفع",
    });
  }
  if (activeShippingCount === 0) {
    alerts.push({
      id: "no-shipping",
      title: "لم تقم بتفعيل خيارات الشحن بعد",
      message: "حدد خيارات التوصيل وأسعار الشحن للمدن لتمكين العملاء من إتمام الطلبات وحساب التكاليف.",
      href: "/dashboard/shipping",
      actionText: "إعداد الشحن",
    });
  }

  // Subscription details
  const subscription = Array.isArray(store.subscriptions)
    ? store.subscriptions[0]
    : store.subscriptions;
  const trialDaysRemaining = getTrialDaysRemaining(subscription?.trial_ends_at ?? null);
  const isTrialing = subscription?.status === "trialing";

  // Package
  const pkg = Array.isArray(store.packages) ? store.packages[0] : store.packages;

  const stats = [
    {
      label: "المنتجات",
      value: productsCount.toString(),
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/dashboard/products",
    },
    {
      label: "التصنيفات",
      value: categoriesCount.toString(),
      icon: Tag,
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: "/dashboard/categories",
    },
    {
      label: "طرق الدفع النشطة",
      value: activePaymentsCount.toString(),
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/dashboard/payments",
    },
    {
      label: "طرق الشحن النشطة",
      value: activeShippingCount.toString(),
      icon: Truck,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/shipping",
    },
  ];

  const aiCreditsRaw = Array.isArray(store.ai_credits) ? store.ai_credits[0] : store.ai_credits;
  const creditsTotal = aiCreditsRaw?.credits_total ?? 0;
  const creditsUsed = aiCreditsRaw?.credits_used ?? 0;
  const creditsRemaining = creditsTotal - creditsUsed;
  const creditsPercent = creditsTotal > 0 ? Math.round((creditsRemaining / creditsTotal) * 100) : 0;
  const isCreditsLow = creditsPercent < 20;

  return (
    <div className="page-shell animate-fade-in text-right">

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="dashboard-heading font-cairo">لوحة تحكم التاجر</h1>
          <p className="text-xs text-muted-foreground font-cairo">
            مرحباً بك في متجر{" "}
            <span className="text-foreground font-semibold">{store.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn(
            "text-xs px-3 py-1.5 rounded-full font-medium font-cairo border",
            store.settings?.maintenance_mode
              ? "text-amber-700 bg-amber-50 border-amber-200"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
          )}>
            {store.settings?.maintenance_mode ? "تحت الصيانة" : "● نشط"}
          </span>
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors surface-card px-3 py-2 rounded-xl font-cairo"
          >
            <Store className="h-3.5 w-3.5" />
            عرض المتجر
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ── TRIAL BANNER ────────────────────────────────────────── */}
      {isTrialing && (
        <div className="relative overflow-hidden rounded-2xl p-5 bg-primary/5 border border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-cairo font-bold text-foreground text-sm">
                  الفترة التجريبية المجانية
                </p>
                <p className="text-muted-foreground text-xs mt-0.5 font-cairo">
                  متبقٍ لك{" "}
                  <span className="text-primary font-bold font-numbers">{trialDaysRemaining}</span>{" "}
                  {trialDaysRemaining === 1 ? "يوم" : "أيام"} — فعّل اشتراكك للاستمرار بعد انتهائها.
                </p>
              </div>
            </div>
            <Link href="/dashboard/subscription" className="btn-brand text-xs px-5 py-2.5 shrink-0 self-start sm:self-center">
              ترقية الاشتراك
            </Link>
          </div>
        </div>
      )}

      {/* ── SETUP ALERTS ────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <p className="caption-text font-bold uppercase tracking-wider font-cairo">خطوات متبقية لإطلاق متجرك</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="surface-card p-4 flex flex-col justify-between gap-3 border-amber-200 bg-amber-50/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-bold font-cairo">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{alert.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-cairo">{alert.message}</p>
                </div>
                <Link
                  href={alert.href}
                  className="text-xs py-2 text-center w-full block rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors font-bold font-cairo"
                >
                  {alert.actionText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── METRIC CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <DashboardMetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            href={stat.href}
            iconColor={stat.color}
            iconBg={stat.bg}
          />
        ))}
      </div>

      {/* ── BOTTOM ROW ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sales Summary */}
        <div className="lg:col-span-2 surface-card p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Link href="/dashboard/orders" className="text-xs text-primary hover:underline font-cairo">
              عرض الطلبات
            </Link>
            <h2 className="text-sm font-bold text-foreground font-cairo">ملخص المبيعات</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right">
            <div className="space-y-1 p-3 bg-muted/50 rounded-xl border border-border">
              <p className="metric-value text-primary font-numbers">{ordersCount}</p>
              <p className="caption-text font-cairo">الطلبات الكلية</p>
            </div>
            <div className="space-y-1 p-3 bg-muted/50 rounded-xl border border-border">
              <p className="metric-value text-emerald-600 font-numbers">{formatCurrency(totalRevenue, store.currency)}</p>
              <p className="caption-text font-cairo">صافي الإيرادات</p>
            </div>
            <div className="space-y-1 p-3 bg-muted/50 rounded-xl border border-border">
              <p className="metric-value text-foreground font-numbers">{customersCount}</p>
              <p className="caption-text font-cairo">العملاء</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center font-cairo border-t border-border pt-3">
            تظهر الإحصائيات بعد استقبال طلبات حقيقية من متجرك.
          </p>
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Package Card */}
          {pkg && (
            <div className="surface-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <Link href="/dashboard/subscription" className="text-xs text-primary hover:underline font-cairo">ترقية</Link>
                <h3 className="text-xs font-bold text-foreground font-cairo flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  باقتك الحالية
                </h3>
              </div>
              <div className="text-right">
                <p className="font-cairo font-bold text-primary text-sm">{pkg.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-cairo">
                  {pkg.max_products === null ? "منتجات غير محدودة" : `حتى ${pkg.max_products} منتج`}
                  {" · "}
                  <span className="font-numbers">{pkg.max_ai_credits}</span> رصيد ذكاء اصطناعي
                </p>
              </div>
            </div>
          )}

          {/* AI Credits */}
          <div className="surface-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <Link href="/dashboard/ai" className="text-xs text-primary hover:underline font-cairo">استخدم الأدوات</Link>
              <h3 className="text-xs font-bold text-foreground font-cairo flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                رصيد الذكاء الاصطناعي
              </h3>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-baseline gap-1 justify-end">
                <span className={cn("metric-value font-numbers", isCreditsLow ? "text-amber-600" : "text-foreground")}>
                  {creditsRemaining}
                </span>
                <span className="text-xs text-muted-foreground font-cairo">/ {creditsTotal} رصيد</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", isCreditsLow ? "bg-amber-500" : "bg-primary")}
                  style={{ width: `${creditsPercent}%` }}
                />
              </div>
              {isCreditsLow && (
                <p className="text-[10px] text-amber-600 text-right font-cairo">الرصيد منخفض — يرجى ترقية باقتك</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="surface-card p-4 space-y-1.5">
            <h3 className="text-xs font-bold text-foreground font-cairo border-b border-border pb-2 mb-1">إجراءات سريعة</h3>
            {[
              { href: "/dashboard/products", label: "إضافة منتج جديد", icon: Package },
              { href: "/dashboard/orders", label: "مراجعة الطلبات", icon: ShoppingBag },
              { href: "/dashboard/settings", label: "إعدادات المتجر", icon: Store },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sidebar-accent transition-colors text-xs text-muted-foreground hover:text-foreground group font-cairo"
              >
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-2">
                  <span>{label}</span>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
