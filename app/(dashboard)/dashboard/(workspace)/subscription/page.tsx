import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Crown,
  Zap,
  Package,
  ArrowLeft,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDate, getTrialDaysRemaining } from "@/lib/utils";
import type { Metadata } from "next";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PricingCard } from "@/components/ui/pricing-card";

export const metadata: Metadata = {
  title: "الاشتراك والباقة",
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch store with subscription and package
  const { data: storeData } = await supabase
    .from("stores")
    .select(`*, subscriptions (*), packages (*)`)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!storeData) redirect("/dashboard/onboarding");

  const store = storeData as any;
  const subscription = Array.isArray(store.subscriptions)
    ? store.subscriptions[0]
    : store.subscriptions;
  const currentPkg = Array.isArray(store.packages)
    ? store.packages[0]
    : store.packages;

  // Fetch all packages for upgrade comparison
  const adminDb = createAdminClient();
  const { data: allPackages } = await adminDb
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const packages = allPackages || [];

  const trialDaysRemaining = getTrialDaysRemaining(
    subscription?.trial_ends_at ?? null
  );
  const isTrialing = subscription?.status === "trialing";
  const isActive = subscription?.status === "active";

  const statusLabels: Record<string, string> = {
    trialing: "فترة تجريبية",
    active: "نشط",
    past_due: "متأخر الدفع",
    canceled: "ملغي",
    unpaid: "غير مدفوع",
  };

  const statusColors: Record<string, string> = {
    trialing: "text-amber-700 bg-amber-50 border border-amber-200",
    active: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    past_due: "text-red-700 bg-red-50 border border-red-200",
    canceled: "text-muted-foreground bg-muted border border-border",
    unpaid: "text-red-700 bg-red-50 border border-red-200",
  };

  const pkgIcons: Record<string, React.ElementType> = {
    starter: Zap,
    growth: Package,
    pro: Crown,
  };

  return (
    <div className="page-shell max-w-4xl">
      <PremiumPageHeader
        icon={Crown}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        title="الاشتراك والباقة"
        description="إدارة باقتك الحالية ومتابعة حالة الاشتراك"
      />

      {/* Current Subscription Status */}
      <div className="surface-card p-6 space-y-4">
        <h2 className="font-cairo font-semibold text-foreground text-sm border-b border-border pb-3">
          حالة اشتراكك الحالي
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Package name */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">الباقة الحالية</p>
            <p className="font-cairo font-bold text-foreground text-lg">
              {currentPkg?.name ?? "غير محدد"}
            </p>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">الحالة</p>
            <span
              className={cn(
                "inline-block text-xs font-semibold px-3 py-1 rounded-full",
                statusColors[subscription?.status ?? "trialing"]
              )}
            >
              {statusLabels[subscription?.status ?? "trialing"] ?? "غير معروف"}
            </span>
          </div>

          {/* Trial / Period */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {isTrialing ? "انتهاء الفترة التجريبية" : "انتهاء الدورة الحالية"}
            </p>
            <p className="font-medium text-foreground text-sm">
              {subscription?.trial_ends_at
                ? formatDate(subscription.trial_ends_at)
                : subscription?.current_period_end
                ? formatDate(subscription.current_period_end)
                : "—"}
            </p>
          </div>
        </div>

        {/* Trial countdown */}
        {isTrialing && (
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border mt-2",
              trialDaysRemaining <= 1
                ? "border-red-500/30 bg-red-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            )}
          >
            {trialDaysRemaining <= 1 ? (
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  trialDaysRemaining <= 1 ? "text-red-600" : "text-amber-600"
                )}
              >
                {trialDaysRemaining === 0
                  ? "الفترة التجريبية انتهت اليوم!"
                  : `متبقٍ ${trialDaysRemaining} ${trialDaysRemaining === 1 ? "يوم" : "أيام"} من تجربتك المجانية`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                بعد انتهاء الفترة التجريبية، تحتاج لتفعيل الاشتراك للاستمرار في استخدام متجرك.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Available Packages */}
      <div className="space-y-4">
        <h2 className="font-cairo font-semibold text-foreground text-sm text-right">
          الباقات المتاحة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {packages.map((pkg: any) => {
            const isCurrent = pkg.id === store.package_id;
            const accentMap: Record<string, "primary" | "emerald" | "amber"> = {
              starter: "primary",
              growth:  "emerald",
              pro:     "amber",
            };
            const accent = accentMap[pkg.slug] ?? "primary";

            const features = [
              pkg.max_products === null
                ? "منتجات غير محدودة"
                : `حتى ${pkg.max_products} منتج`,
              `${pkg.max_ai_credits} رصيد ذكاء اصطناعي شهرياً`,
              pkg.has_custom_domain ? "نطاق مخصص" : null,
              pkg.has_email_notif ? "إشعارات بريدية" : null,
              pkg.has_reports ? "تقارير متقدمة" : null,
              pkg.has_priority_support ? "دعم ذو أولوية" : null,
            ].filter(Boolean) as string[];

            return (
              <PricingCard
                key={pkg.id}
                name={pkg.name}
                price={pkg.price_monthly}
                currency="₪"
                description={pkg.description}
                features={features}
                isFeatured={isCurrent}
                featuredLabel="باقتك الحالية"
                accentColor={accent}
                ctaLabel={isCurrent ? "✓ باقتك النشطة" : "قريباً — تواصل مع الدعم للترقية"}
              />
            );
          })}
        </div>
      </div>

      {/* Contact Support Note */}
      <div className="surface-card p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="font-cairo font-semibold text-foreground text-sm">
            هل تريد الترقية أو تغيير باقتك؟
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            نظام الدفع والترقية قيد التطوير. للترقية الآن، تواصل مع فريق الدعم عبر
            واتساب أو البريد الإلكتروني وسيقومون بتفعيل الترقية خلال 24 ساعة.
          </p>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
