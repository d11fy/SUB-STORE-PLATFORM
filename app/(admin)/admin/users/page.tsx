import { getAdminAllUsers } from "@/actions/admin";
import { Users, Store } from "lucide-react";
import type { Metadata } from "next";
import { UserActions } from "./user-actions";

export const metadata: Metadata = {
  title: "إدارة المستخدمين | الإدارة",
};

const ROLE_LABELS: Record<string, string> = {
  merchant: "تاجر",
  platform_admin: "مدير المنصة",
  admin: "مدير",
  customer: "عميل",
};

const ROLE_STYLES: Record<string, string> = {
  merchant: "bg-blue-500/10 text-blue-600",
  platform_admin: "bg-purple-500/10 text-purple-600",
  admin: "bg-amber-500/10 text-amber-600",
  customer: "bg-slate-500/10 text-slate-500",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const users = await getAdminAllUsers(role);

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">المستخدمون</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} مستخدم مسجل
          </p>
        </div>

        {/* Role filter tabs */}
        <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1">
          {[
            { label: "الكل", value: "" },
            { label: "تجار", value: "merchant" },
            { label: "مدراء", value: "platform_admin" },
            { label: "عملاء", value: "customer" },
          ].map((tab) => (
            <a
              key={tab.value}
              href={tab.value ? `?role=${tab.value}` : "?"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (role ?? "") === tab.value
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {roleCounts[tab.value] ? (
                <span className="mr-1.5 text-muted-foreground">({roleCounts[tab.value]})</span>
              ) : null}
            </a>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-cairo font-bold text-foreground mb-2">لا يوجد مستخدمون</h3>
          <p className="text-muted-foreground text-sm">لا توجد نتائج بهذا الفلتر.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-cairo">
                <tr>
                  <th className="px-6 py-4 font-semibold">المستخدم</th>
                  <th className="px-6 py-4 font-semibold">الدور</th>
                  <th className="px-6 py-4 font-semibold">المتاجر</th>
                  <th className="px-6 py-4 font-semibold">تاريخ التسجيل</th>
                  <th className="px-6 py-4 font-semibold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const stores = (user.stores ?? []) as Array<{ id: string; status: string }>;
                  const activeCount = stores.filter((s) => s.status === "active").length;
                  const suspendedCount = stores.filter((s) => s.status === "suspended").length;

                  return (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-cairo font-bold text-primary text-sm">
                            {(user.full_name || user.email || "؟")[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground font-cairo">
                              {user.full_name || "بدون اسم"}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            ROLE_STYLES[user.role] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {stores.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-foreground font-medium">
                              {stores.length} متجر
                            </span>
                            {activeCount > 0 && (
                              <span className="text-xs text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                {activeCount} نشط
                              </span>
                            )}
                            {suspendedCount > 0 && (
                              <span className="text-xs text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                                {suspendedCount} موقوف
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("ar-EG")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        {user.role === "merchant" && (
                          <UserActions userId={user.id} stores={stores} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
