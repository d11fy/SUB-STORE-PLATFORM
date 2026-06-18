// ============================================================
// Saba Store — Orders Dashboard Client Component
// ============================================================
"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye, ShoppingBag, CreditCard, Clock, Check, X, FileText, AlertCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface OrdersClientProps {
  initialOrders: any[];
  store: any;
  initialError: string | null;
}

export function OrdersClient({
  initialOrders,
  store,
  initialError,
}: OrdersClientProps) {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  // Status mapping to display label and classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "جديد":
        return {
          label: "جديد",
          class: "text-blue-700 bg-blue-50 border-blue-200",
        };
      case "بانتظار_تأكيد_الدفع":
        return {
          label: "بانتظار تأكيد الدفع",
          class: "text-amber-700 bg-amber-50 border-amber-200 animate-pulse",
        };
      case "تم_تأكيد_الدفع":
        return {
          label: "تم تأكيد الدفع",
          class: "text-emerald-700 bg-emerald-50 border-emerald-200",
        };
      case "فشل_الدفع":
        return {
          label: "فشل الدفع",
          class: "text-red-700 bg-red-50 border-red-200",
        };
      case "قيد_التجهيز":
        return {
          label: "قيد التجهيز",
          class: "text-violet-700 bg-violet-50 border-violet-200",
        };
      case "تم_الشحن":
        return {
          label: "تم الشحن",
          class: "text-sky-700 bg-sky-50 border-sky-200",
        };
      case "مكتمل":
        return {
          label: "مكتمل",
          class: "text-teal-700 bg-teal-50 border-teal-200",
        };
      case "ملغي":
        return {
          label: "ملغي",
          class: "text-muted-foreground bg-muted/40 border-muted/50",
        };
      default:
        return {
          label: status,
          class: "text-muted-foreground bg-muted/40 border-muted/50",
        };
    }
  };

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case "bank_transfer":
        return "تحويل بنكي";
      case "local_wallet":
        return "محفظة إلكترونية";
      case "cash_on_delivery":
        return "دفع عند الاستلام";
      default:
        return "أخرى";
    }
  };

  const getProofBadge = (proofs: any[], methodType: string) => {
    if (methodType === "cash_on_delivery") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-muted/30 text-muted-foreground border border-border">
          لا يتطلب إثبات
        </span>
      );
    }

    if (!proofs || proofs.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
          لم يتم الرفع بعد
        </span>
      );
    }

    // Find the latest proof
    const latestProof = proofs[0];
    if (latestProof.review_status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 font-semibold animate-pulse">
          <Clock className="h-3 w-3 shrink-0" />
          معلق للمراجعة
        </span>
      );
    }
    if (latestProof.review_status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
          <Check className="h-3 w-3 shrink-0" />
          معتمد
        </span>
      );
    }
    if (latestProof.review_status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
          <X className="h-3 w-3 shrink-0" />
          مرفوض
        </span>
      );
    }

    return null;
  };

  // Filter orders
  const filteredOrders = initialOrders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.full_name.toLowerCase().includes(search.toLowerCase()) ||
      order.phone.includes(search);

    let matchesStatus = true;
    if (statusTab !== "all") {
      if (statusTab === "cancelled_failed") {
        matchesStatus = order.status === "ملغي" || order.status === "فشل_الدفع";
      } else {
        matchesStatus = order.status === statusTab;
      }
    }

    return matchesSearch && matchesStatus;
  });

  // Count helper for status tabs
  const getCountForStatus = (status: string) => {
    if (status === "all") return initialOrders.length;
    if (status === "cancelled_failed") {
      return initialOrders.filter(o => o.status === "ملغي" || o.status === "فشل_الدفع").length;
    }
    return initialOrders.filter(o => o.status === status).length;
  };

  const tabs = [
    { id: "all", label: "كل الطلبات" },
    { id: "جديد", label: "جديد" },
    { id: "بانتظار_تأكيد_الدفع", label: "بانتظار تأكيد الدفع" },
    { id: "قيد_التجهيز", label: "قيد التجهيز" },
    { id: "تم_الشحن", label: "تم الشحن" },
    { id: "مكتمل", label: "مكتمل" },
    { id: "cancelled_failed", label: "ملغي / فشل الدفع" },
  ];

  return (
    <div className="space-y-4">
      {initialError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {initialError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border pb-px gap-1 no-scrollbar">
        {tabs.map((tab) => {
          const count = getCountForStatus(tab.id);
          const active = statusTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-cairo font-semibold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "font-mono font-bold text-xs px-2 py-0.5 rounded-full",
                active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass p-4 rounded-2xl">
        <div className="relative w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-all"
          />
        </div>
      </div>

      {/* Orders Table / List */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-cairo font-semibold text-foreground">
              لا توجد طلبات تطابق الفلترة
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              لم نجد أي طلبات مطابقة لمعايير البحث الحالية.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border bg-sidebar/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">رقم الطلب</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">طريقة الدفع</th>
                  <th className="px-6 py-4">إشعار الدفع</th>
                  <th className="px-6 py-4">المجموع</th>
                  <th className="px-6 py-4">حالة الطلب</th>
                  <th className="px-6 py-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  const isBankOrWallet = order.payment_methods?.type === "bank_transfer" || order.payment_methods?.type === "local_wallet";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-sidebar-accent/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-primary text-sm">
                        <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">
                          {order.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {order.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                        {new Date(order.created_at).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-cairo">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground/80" />
                          <span>{order.payment_methods?.name || "دفع عند الاستلام"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getProofBadge(order.payment_proofs, order.payment_methods?.type)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {formatCurrency(order.total_amount, store?.currency ?? "ILS")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border",
                          statusInfo.class
                        )}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>
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
