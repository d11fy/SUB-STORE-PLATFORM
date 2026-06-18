import { getAdminLogsPage, getLogActionTypes } from "@/actions/admin";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سجلات المنصة | الإدارة",
};

const ACTION_LABELS: Record<string, string> = {
  update_store_status: "تغيير حالة المتجر",
  suspend_user_stores: "تعليق متاجر مستخدم",
  reactivate_user_stores: "إعادة تفعيل متاجر",
  add_ai_credits: "إضافة أرصدة AI",
  extend_trial: "تمديد التجربة",
  platform_settings_update: "إعدادات المنصة",
  update_package: "تحديث الباقة",
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const { page: pageParam, action } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [{ logs, total, totalPages }, actionTypes] = await Promise.all([
    getAdminLogsPage(page, action),
    getLogActionTypes(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">سجلات المنصة</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total.toLocaleString("ar-EG")} سجل نشاط إداري
          </p>
        </div>

        {/* Action filter */}
        {actionTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">فلترة حسب:</span>
            <select
              className="h-9 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              defaultValue={action ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const url = v ? `?action=${v}` : "?";
                window.location.href = url;
              }}
            >
              <option value="">كل الإجراءات</option>
              {actionTypes.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a] ?? a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ScrollText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-cairo font-bold text-foreground mb-2">لا توجد سجلات</h3>
          <p className="text-muted-foreground text-sm">لم تُنفَّذ أي إجراءات إدارية بعد.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-cairo">
                <tr>
                  <th className="px-6 py-4 font-semibold">الإجراء</th>
                  <th className="px-6 py-4 font-semibold">الوصف</th>
                  <th className="px-6 py-4 font-semibold">المدير</th>
                  <th className="px-6 py-4 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-xs text-muted-foreground max-w-xs truncate">
                        {log.description ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-xs text-foreground font-medium">
                        {(log.users as any)?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(log.users as any)?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                صفحة {page} من {totalPages}
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`?page=${page - 1}${action ? `&action=${action}` : ""}`}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-muted border border-border hover:bg-muted/80 transition-colors text-foreground"
                  >
                    <ChevronRight className="h-3 w-3" />
                    السابق
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`?page=${page + 1}${action ? `&action=${action}` : ""}`}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-muted border border-border hover:bg-muted/80 transition-colors text-foreground"
                  >
                    التالي
                    <ChevronLeft className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
