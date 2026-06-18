"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search, Users, X, Phone, Mail, MapPin,
  ShoppingBag, TrendingUp, Pencil, Trash2, Check,
} from "lucide-react";
import {
  getCustomerDetailsAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "@/actions/customers";
import type { Customer, Order } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type RecentOrder = Pick<Order, "id" | "order_number" | "status" | "total_amount" | "created_at">;

type CustomerWithOrders = Customer & { recent_orders: RecentOrder[] };

interface Props {
  customers: Customer[];
  totalCount: number;
  currentPage: number;
  search: string;
  fetchError: string | null;
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  "جديد": "bg-blue-50 text-blue-700 border-blue-100",
  "بانتظار_تأكيد_الدفع": "bg-amber-50 text-amber-700 border-amber-100",
  "تم_تأكيد_الدفع": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "فشل_الدفع": "bg-red-50 text-red-700 border-red-100",
  "قيد_التجهيز": "bg-violet-50 text-violet-700 border-violet-100",
  "تم_الشحن": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "مكتمل": "bg-green-50 text-green-700 border-green-100",
  "ملغي": "bg-gray-100 text-gray-500 border-gray-200",
};

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("ar", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function fmtCurrency(n: number) {
  return `₪${n.toLocaleString("ar")}`;
}

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function CustomersClient({ customers, totalCount, currentPage, search, fetchError }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchVal, setSearchVal] = useState(search);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<CustomerWithOrders | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", city: "", notes: "" });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const navigate = useCallback(
    (q: string, p: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (p > 1) params.set("page", String(p));
      const qs = params.toString();
      router.push(`/dashboard/customers${qs ? `?${qs}` : ""}`);
    },
    [router]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchVal, 1);
  };

  const openCustomer = async (c: Customer) => {
    setSelectedId(c.id);
    setDetails(null);
    setIsEditing(false);
    setDetailsLoading(true);
    const res = await getCustomerDetailsAction(c.id);
    setDetailsLoading(false);
    if (res.data) {
      setDetails(res.data as CustomerWithOrders);
    } else {
      toast.error(res.error ?? "فشل جلب البيانات");
    }
  };

  const closeDrawer = () => {
    setSelectedId(null);
    setDetails(null);
    setIsEditing(false);
  };

  const startEdit = () => {
    if (!details) return;
    setEditForm({
      full_name: details.full_name ?? "",
      email: details.email ?? "",
      phone: details.phone ?? "",
      city: details.city ?? "",
      notes: details.notes ?? "",
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!details) return;
    startTransition(async () => {
      const res = await updateCustomerAction(details.id, editForm);
      if (res.success) {
        toast.success("تم تحديث بيانات العميل");
        setIsEditing(false);
        router.refresh();
        const refreshed = await getCustomerDetailsAction(details.id);
        if (refreshed.data) setDetails(refreshed.data as CustomerWithOrders);
      } else {
        toast.error(res.error ?? "فشل التحديث");
      }
    });
  };

  const handleDelete = () => {
    if (!details) return;
    if (!window.confirm(`حذف العميل "${details.full_name}"؟ لا يمكن التراجع عن هذا.`)) return;
    startTransition(async () => {
      const res = await deleteCustomerAction(details.id);
      if (res.success) {
        toast.success("تم حذف العميل");
        closeDrawer();
        router.refresh();
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
    });
  };

  return (
    <div className="min-h-full" dir="rtl">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 py-5 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-cairo text-foreground">العملاء</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount > 0
                ? `${totalCount.toLocaleString("ar")} عميل مسجّل`
                : "لا يوجد عملاء بعد"}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="ابحث بالاسم، البريد، الجوال..."
                className="w-full pr-9 pl-3 h-9 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 h-9 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
            >
              بحث
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearchVal(""); navigate("", 1); }}
                className="px-3 h-9 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                مسح
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ── Error ── */}
      {fetchError && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-cairo">
          {fetchError}
        </div>
      )}

      {/* ── Empty State ── */}
      {!fetchError && customers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-5">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1.5 font-cairo">
            {search ? "لا توجد نتائج" : "لا يوجد عملاء بعد"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {search
              ? "جرّب كلمات بحث مختلفة أو امسح الفلتر"
              : "سيظهر عملاؤك هنا تلقائياً عند استلام أول طلب"}
          </p>
        </div>
      )}

      {/* ── Table — desktop ── */}
      {customers.length > 0 && (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground">العميل</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">جوال</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">المدينة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">الطلبات</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">الإجمالي</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCustomer(c)}
                    className={cn(
                      "hover:bg-muted/30 cursor-pointer transition-colors",
                      selectedId === c.id && "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold font-cairo shrink-0">
                          {initials(c.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate font-cairo">{c.full_name}</p>
                          {c.email && (
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-sm" dir="ltr">
                      {c.phone ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-sm">
                      {c.city ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-foreground">{c.orders_count}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground font-cairo">
                      {fmtCurrency(c.total_spent)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Cards — mobile ── */}
          <div className="sm:hidden divide-y divide-border">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => openCustomer(c)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/30",
                  selectedId === c.id && "bg-primary/5"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold font-cairo shrink-0">
                  {initials(c.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate font-cairo text-sm">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.orders_count} طلب · {fmtCurrency(c.total_spent)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{fmtDate(c.created_at)}</p>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-border flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground font-cairo">
                صفحة {currentPage} من {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => navigate(search, currentPage - 1)}
                  className="px-3 h-8 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  السابق
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => navigate(search, currentPage + 1)}
                  className="px-3 h-8 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Customer Detail Drawer ── */}
      {selectedId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-background border-l border-border flex flex-col shadow-2xl"
            dir="rtl"
          >
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-background">
              <p className="font-bold text-foreground font-cairo text-base">
                {detailsLoading ? "جارٍ التحميل..." : (details?.full_name ?? "عميل")}
              </p>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Loading */}
            {detailsLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {/* Content */}
            {!detailsLoading && details && (
              <div className="flex-1 overflow-y-auto">
                {/* Avatar + Stats */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-base font-bold font-cairo shrink-0">
                      {initials(details.full_name)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      {isEditing ? (
                        <input
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="w-full text-base font-bold text-foreground font-cairo bg-transparent border-b-2 border-primary focus:outline-none pb-0.5"
                        />
                      ) : (
                        <p className="text-base font-bold text-foreground font-cairo leading-tight">{details.full_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">عميل منذ {fmtDate(details.created_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/40 border border-border p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span className="text-xs">الطلبات</span>
                      </div>
                      <p className="text-2xl font-black text-foreground font-cairo">{details.orders_count}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 border border-border p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-xs">الإجمالي</span>
                      </div>
                      <p className="text-2xl font-black text-foreground font-cairo">{fmtCurrency(details.total_spent)}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="p-5 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">معلومات التواصل</p>

                  {isEditing ? (
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-xs text-muted-foreground block mb-1">البريد الإلكتروني</span>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="name@example.com"
                          dir="ltr"
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-muted-foreground block mb-1">رقم الجوال</span>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="+970 59 000 0000"
                          dir="ltr"
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-muted-foreground block mb-1">المدينة</span>
                        <input
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          placeholder="رام الله، نابلس..."
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-muted-foreground block mb-1">ملاحظات</span>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={3}
                          placeholder="أي ملاحظات عن العميل..."
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors resize-none"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {details.email && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-foreground truncate">{details.email}</span>
                        </div>
                      )}
                      {details.phone && (
                        <div className="flex items-center gap-2.5 text-sm" dir="ltr">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{details.phone}</span>
                        </div>
                      )}
                      {details.city && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{details.city}</span>
                        </div>
                      )}
                      {!details.email && !details.phone && !details.city && (
                        <p className="text-sm text-muted-foreground">لا توجد معلومات تواصل مسجّلة</p>
                      )}
                      {details.notes && (
                        <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">ملاحظة</p>
                          <p className="text-sm text-foreground leading-relaxed">{details.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                {details.recent_orders.length > 0 && (
                  <div className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">
                      آخر الطلبات ({details.recent_orders.length})
                    </p>
                    <div className="space-y-2">
                      {details.recent_orders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground font-cairo" dir="ltr">
                              {o.order_number}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(o.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full border font-cairo",
                                ORDER_STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                              )}
                            >
                              {o.status}
                            </span>
                            <span className="text-sm font-bold text-foreground font-cairo whitespace-nowrap">
                              {fmtCurrency(o.total_amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {details.recent_orders.length === 0 && (
                  <div className="p-5 text-center">
                    <p className="text-sm text-muted-foreground font-cairo">لا توجد طلبات مسجّلة لهذا العميل</p>
                  </div>
                )}
              </div>
            )}

            {/* Drawer Footer */}
            {!detailsLoading && details && (
              <div className="p-4 border-t border-border shrink-0 flex items-center gap-2 bg-background">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={isPending}
                      className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      حفظ
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isPending}
                      className="px-4 h-9 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEdit}
                      className="flex-1 h-9 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل البيانات
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="h-9 px-3 border border-destructive/30 rounded-xl text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors flex items-center justify-center"
                      aria-label="حذف العميل"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
