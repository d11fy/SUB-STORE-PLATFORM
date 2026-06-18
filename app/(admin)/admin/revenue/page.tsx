import { getRevenueOverview, getMonthlyRevenueTrend } from "@/actions/admin";
import { TrendingUp, CreditCard, Crown, BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تحليلات الإيرادات | الإدارة",
};

const MONTH_NAMES: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

function formatMoney(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k ₪`;
  return `${n.toFixed(0)} ₪`;
}

export default async function AdminRevenuePage() {
  const [overview, trend] = await Promise.all([
    getRevenueOverview(),
    getMonthlyRevenueTrend(),
  ]);

  const maxRevenue = Math.max(...trend.map((t) => t.revenue), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-cairo font-bold text-foreground">تحليلات الإيرادات</h1>
        <p className="text-sm text-muted-foreground mt-1">إيرادات المنصة والاشتراكات</p>
      </div>

      {/* Primary metrics — 2-column asymmetric layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MRR — wide card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">الإيراد الشهري (MRR)</p>
              <p className="text-3xl font-bold text-foreground mt-1 font-numbers">
                {overview.mrr.toLocaleString("ar-EG")} ₪
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ARR: </span>
              <span className="font-bold text-foreground font-numbers">{overview.arr.toLocaleString("ar-EG")} ₪</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="text-muted-foreground">اشتراكات نشطة: </span>
              <span className="font-bold text-foreground">{overview.activeSubscriptions}</span>
            </div>
          </div>
        </div>

        {/* This month + total */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">إيراد الشهر الحالي</p>
            <p className="text-2xl font-bold text-foreground font-numbers">{overview.monthRevenue.toLocaleString("ar-EG")} ₪</p>
            <div className="mt-2 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">من الطلبات المؤكدة</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-foreground font-numbers">{overview.totalRevenue.toLocaleString("ar-EG")} ₪</p>
            <div className="mt-2 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">منذ انطلاق المنصة</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend bar chart */}
        {trend.length > 0 && (
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-cairo font-bold text-foreground">الإيرادات الشهرية (آخر 6 أشهر)</h3>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {trend.map(({ month, revenue }) => {
                const [year, m] = month.split("-");
                const label = `${MONTH_NAMES[m] ?? m} ${year}`;
                const pct = (revenue / maxRevenue) * 100;
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{label}</span>
                    <div className="flex-1 bg-muted/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-numbers font-bold text-foreground w-20 text-left">
                      {formatMoney(revenue)}
                    </span>
                  </div>
                );
              })}
              {trend.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات إيرادات بعد</p>
              )}
            </div>
          </div>
        )}

        {/* Revenue by package */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-cairo font-bold text-foreground">الإيراد حسب الباقة</h3>
          </div>
          {overview.revenueByPackage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد اشتراكات نشطة</p>
          ) : (
            <div className="space-y-4">
              {overview.revenueByPackage.map(({ name, count, mrr: pkgMrr }) => (
                <div key={name} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-cairo font-bold text-foreground">{name}</span>
                    <span className="text-xs text-muted-foreground">{count} اشتراك</span>
                  </div>
                  <p className="text-lg font-bold text-foreground font-numbers">
                    {pkgMrr.toLocaleString("ar-EG")} ₪
                    <span className="text-xs font-normal text-muted-foreground mr-1">/شهر</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
