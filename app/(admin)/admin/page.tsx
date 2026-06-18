import { getEnhancedDashboardStats } from "@/actions/admin";
import {
  Store,
  Users,
  ShoppingBag,
  Crown,
  TrendingUp,
  Sparkles,
  Activity,
  BarChart3,
  ShieldAlert,
  ScrollText,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "إدارة المنصة | سبأ ستور",
};

const ACTION_LABELS: Record<string, string> = {
  update_store_status: "تغيير حالة متجر",
  suspend_user_stores: "تعليق متاجر مستخدم",
  reactivate_user_stores: "إعادة تفعيل متاجر",
  add_ai_credits: "إضافة أرصدة AI",
  extend_trial: "تمديد تجربة",
  platform_settings_update: "إعدادات المنصة",
  update_package: "تحديث الباقة",
};

export default async function AdminDashboardPage() {
  const stats = await getEnhancedDashboardStats();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">نظرة عامة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">أداء منصة سبأ ستور</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-600">المنصة تعمل بشكل طبيعي</span>
        </div>
      </div>

      {/* Primary metrics — revenue up top, asymmetric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MRR — featured card */}
        <div className="md:col-span-1 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">الإيراد الشهري المتكرر</p>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground font-numbers">
            {stats.mrr.toLocaleString("ar-EG")}
            <span className="text-base font-normal text-muted-foreground mr-1">₪</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            ARR: <span className="font-bold text-foreground font-numbers">{stats.arr.toLocaleString("ar-EG")} ₪</span>
          </p>
          <Link href="/admin/revenue" className="mt-4 text-xs text-primary hover:underline block">
            تحليل الإيرادات التفصيلي ←
          </Link>
        </div>

        {/* Secondary metrics grid */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "إجمالي المتاجر", value: stats.storesCount, sub: `${stats.activeStoresCount} نشط`, icon: Store, href: "/admin/stores" },
            { label: "التجار المسجلون", value: stats.merchantsCount, icon: Users, href: "/admin/users" },
            { label: "الاشتراكات النشطة", value: stats.subscriptionsCount, icon: Crown, href: "/admin/subscriptions" },
            { label: "إجمالي الطلبات", value: stats.ordersCount, icon: ShoppingBag, href: "/admin/stores" },
            { label: "إجمالي المبيعات", value: `${stats.totalSales.toLocaleString("ar-EG")} ₪`, icon: BarChart3, href: "/admin/revenue" },
            { label: "نشاط اليوم", value: stats.recentLogs.filter((l) => new Date(l.created_at) > new Date(Date.now() - 86400000)).length + " إجراء", icon: Activity, href: "/admin/logs" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
                <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xl font-bold text-foreground font-numbers">{item.value}</p>
              {item.sub && (
                <p className="text-xs text-emerald-600 mt-0.5">{item.sub}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick access + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity log */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-cairo font-bold text-foreground">آخر الإجراءات الإدارية</h3>
            </div>
            <Link href="/admin/logs" className="text-xs text-primary hover:underline">
              عرض الكل
            </Link>
          </div>
          {stats.recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">لا توجد إجراءات مسجلة بعد</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentLogs.map((log, idx) => (
                <div key={idx} className="px-6 py-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-cairo font-medium text-foreground">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    {log.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{log.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground px-1">وصول سريع</h3>
          {[
            { label: "إدارة المتاجر", desc: "عرض وتعديل المتاجر", href: "/admin/stores", icon: Store },
            { label: "المستخدمون", desc: "إدارة التجار والمستخدمين", href: "/admin/users", icon: Users },
            { label: "الإيرادات", desc: "MRR/ARR وتحليلات الاشتراكات", href: "/admin/revenue", icon: BarChart3 },
            { label: "استخدام AI", desc: "أرصدة الذكاء الاصطناعي", href: "/admin/ai-usage", icon: Sparkles },
            { label: "مركز الأمان", desc: "الإجراءات والمراقبة", href: "/admin/security", icon: ShieldAlert },
            { label: "إعدادات المنصة", desc: "التحكم في سلوك النظام", href: "/admin/settings", icon: Activity },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-primary/20 hover:bg-muted/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-xs font-cairo font-bold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
