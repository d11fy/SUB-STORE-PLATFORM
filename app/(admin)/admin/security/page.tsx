import { getSecurityOverview } from "@/actions/admin";
import { ShieldAlert, Users, Store, Activity } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "مركز الأمان | الإدارة",
};

const ACTION_LABELS: Record<string, string> = {
  update_store_status: "تغيير حالة المتجر",
  suspend_user_stores: "تعليق متاجر مستخدم",
  reactivate_user_stores: "إعادة تفعيل متاجر",
  add_ai_credits: "إضافة أرصدة AI",
  extend_trial: "تمديد التجربة",
  platform_settings_update: "تحديث إعدادات المنصة",
  update_package: "تحديث الباقة",
};

const ACTION_RISK: Record<string, "high" | "medium" | "low"> = {
  suspend_user_stores: "high",
  update_store_status: "high",
  platform_settings_update: "high",
  reactivate_user_stores: "medium",
  add_ai_credits: "medium",
  extend_trial: "low",
  update_package: "low",
};

const RISK_STYLES = {
  high: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const RISK_LABELS = {
  high: "عالي",
  medium: "متوسط",
  low: "منخفض",
};

const ROLE_LABELS: Record<string, string> = {
  merchant: "تجار",
  platform_admin: "مدراء المنصة",
  admin: "مدراء",
  customer: "عملاء",
};

export default async function AdminSecurityPage() {
  const data = await getSecurityOverview();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-cairo font-bold text-foreground">مركز الأمان</h1>
        <p className="text-sm text-muted-foreground mt-1">مراقبة الإجراءات الإدارية وحالة المنصة</p>
      </div>

      {/* Platform health summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "إجمالي المستخدمين",
            value: data.totalUsers,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "متاجر موقوفة",
            value: data.suspendedStores,
            icon: Store,
            color: data.suspendedStores > 0 ? "text-rose-500" : "text-emerald-500",
            bg: data.suspendedStores > 0 ? "bg-rose-500/10" : "bg-emerald-500/10",
          },
          {
            label: "إجراءات الـ24 ساعة",
            value: data.recentActions.filter(
              (a) => new Date(a.created_at) > new Date(Date.now() - 86400000)
            ).length,
            icon: Activity,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "إجراءات عالية الخطورة",
            value: data.recentActions.filter(
              (a) => ACTION_RISK[a.action] === "high"
            ).length,
            icon: ShieldAlert,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
          },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <p className="text-xs text-muted-foreground leading-snug">{card.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.bg}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent admin actions */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-cairo font-bold text-foreground">الإجراءات الإدارية الأخيرة</h3>
            <Link href="/admin/logs" className="text-xs text-primary hover:underline">
              عرض جميع السجلات
            </Link>
          </div>
          {data.recentActions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">لا توجد إجراءات مسجلة</p>
          ) : (
            <div className="divide-y divide-border">
              {data.recentActions.map((action, idx) => {
                const risk = ACTION_RISK[action.action] ?? "low";
                return (
                  <div key={idx} className="px-6 py-3 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${RISK_STYLES[risk]}`}>
                          {RISK_LABELS[risk]}
                        </span>
                        <span className="text-xs font-cairo font-bold text-foreground">
                          {ACTION_LABELS[action.action] ?? action.action}
                        </span>
                      </div>
                      {action.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(action.created_at).toLocaleDateString("ar-EG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User role distribution */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-cairo font-bold text-foreground">توزيع أدوار المستخدمين</h3>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(data.roleCounts).map(([role, count]) => (
              <div key={role} className="px-6 py-4 flex items-center justify-between">
                <span className="text-sm text-foreground font-cairo">{ROLE_LABELS[role] ?? role}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-muted rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (count / data.totalUsers) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground w-8 text-left">{count}</span>
                </div>
              </div>
            ))}
            {Object.keys(data.roleCounts).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
