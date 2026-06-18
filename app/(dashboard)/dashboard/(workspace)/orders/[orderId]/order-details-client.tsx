// ============================================================
// Saba Store — Order Details Client Component
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Truck,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus, reviewPaymentProof, type OrderDetails } from "@/actions/orders";
import { cn, formatCurrency } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types/database";

interface OrderDetailsClientProps {
  order: OrderDetails;
  store: any;
}

export function OrderDetailsClient({ order, store }: OrderDetailsClientProps) {
  const router = useRouter();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reviewingProof, setReviewingProof] = useState(false);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const latestProof = order.payment_proofs && order.payment_proofs.length > 0 ? order.payment_proofs[0] : null;

  // Handle status update
  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const res = await updateOrderStatus(order.id, newStatus as OrderStatus);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("تم تحديث حالة الطلب بنجاح");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء تحديث حالة الطلب");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle payment proof approval
  const handleApproveProof = async () => {
    if (!latestProof) return;
    try {
      setReviewingProof(true);
      const res = await reviewPaymentProof(latestProof.id, "approve");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("تم اعتماد دفعة الطلب بنجاح");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء اعتماد الدفعة");
    } finally {
      setReviewingProof(false);
    }
  };

  // Handle payment proof rejection
  const handleRejectProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestProof) return;
    if (!rejectionReason.trim()) {
      toast.error("يرجى كتابة سبب الرفض");
      return;
    }

    try {
      setReviewingProof(true);
      const res = await reviewPaymentProof(latestProof.id, "reject", rejectionReason.trim());
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("تم رفض الدفعة بنجاح");
      setRejectModalOpen(false);
      setRejectionReason("");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setReviewingProof(false);
    }
  };

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
          class: "text-amber-700 bg-amber-50 border-amber-200",
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

  const statusInfo = getStatusBadge(order.status);
  const isPdf = latestProof?.uploaded_file_url?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6 text-right">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="p-2 rounded-lg bg-sidebar border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-cairo font-bold text-foreground">
                تفاصيل الطلب: {order.order_number}
              </h2>
              <span className={cn(
                "inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                statusInfo.class
              )}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(order.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Change Status Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground shrink-0">
            تحديث الحالة:
          </label>
          <div className="relative">
            <select
              value={order.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3.5 py-2 pl-8 pr-3 rounded-xl bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 text-foreground cursor-pointer font-cairo font-semibold min-w-[160px]"
            >
              <option value="جديد">جديد</option>
              <option value="بانتظار_تأكيد_الدفع">بانتظار تأكيد الدفع</option>
              <option value="تم_تأكيد_الدفع">تم تأكيد الدفع</option>
              <option value="قيد_التجهيز">قيد التجهيز</option>
              <option value="تم_الشحن">تم الشحن</option>
              <option value="مكتمل">مكتمل</option>
              <option value="فشل_الدفع">فشل الدفع</option>
              <option value="ملغي">ملغي</option>
            </select>
            {updatingStatus && (
              <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Right side: Order Items & Proof of Payment (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              منتجات الطلب
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                    <th className="pb-3">المنتج</th>
                    <th className="pb-3 text-center">السعر</th>
                    <th className="pb-3 text-center">الكمية</th>
                    <th className="pb-3 text-left">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {order.order_items?.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-3.5 font-semibold text-foreground">
                        {item.product_name}
                        {item.product_sku && (
                          <span className="block text-[11px] text-muted-foreground font-mono mt-0.5">
                            SKU: {item.product_sku}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-center font-mono text-muted-foreground">
                        {formatCurrency(item.unit_price, store.currency)}
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold text-foreground">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 text-left font-mono font-bold text-foreground">
                        {formatCurrency(item.total_price, store.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="border-t border-border pt-4 space-y-2.5 max-w-sm mr-auto">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{formatCurrency(order.subtotal, store.currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>تكلفة الشحن:</span>
                <span className="font-mono">{formatCurrency(order.shipping_cost, store.currency)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-xs text-red-600">
                  <span>الخصم:</span>
                  <span className="font-mono">-{formatCurrency(order.discount_amount, store.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2">
                <span>المجموع الكلي:</span>
                <span className="font-mono text-primary text-base">{formatCurrency(order.total_amount, store.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Proof Verification Flow */}
          {latestProof && (
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <FileText className="h-5 w-5 text-amber-500" />
                إشعار التحويل المالي المرفق
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs bg-sidebar/30 p-4 rounded-xl border border-border">
                    <span className="text-muted-foreground font-semibold">اسم الدافع:</span>
                    <span className="text-foreground font-medium">{latestProof.payer_name || "—"}</span>

                    <span className="text-muted-foreground font-semibold">رقم المرجع/العملية:</span>
                    <span className="text-foreground font-mono font-medium">{latestProof.transaction_reference || "—"}</span>

                    <span className="text-muted-foreground font-semibold">تاريخ الرفع:</span>
                    <span className="text-foreground font-mono font-medium">
                      {new Date(latestProof.uploaded_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <span className="text-muted-foreground font-semibold">حالة المراجعة:</span>
                    <span>
                      {latestProof.review_status === "pending" && (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          بانتظار المراجعة
                        </span>
                      )}
                      {latestProof.review_status === "approved" && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          مقبول / معتمد
                        </span>
                      )}
                      {latestProof.review_status === "rejected" && (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          مرفوض
                        </span>
                      )}
                    </span>
                  </div>

                  {latestProof.rejection_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      <p className="font-semibold mb-1">سبب الرفض:</p>
                      <p>{latestProof.rejection_reason}</p>
                    </div>
                  )}

                  {/* Approve/Reject Buttons */}
                  {latestProof.review_status === "pending" && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleApproveProof}
                        disabled={reviewingProof}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-cairo font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {reviewingProof ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        تأكيد واعتماد الدفع
                      </button>
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        disabled={reviewingProof}
                        className="bg-destructive hover:bg-destructive/90 text-white font-cairo font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        رفض
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview Secure Signed URL */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-muted-foreground">صورة أو مستند الإثبات:</div>
                  {latestProof.signedUrl ? (
                    isPdf ? (
                      <div className="border border-border rounded-xl p-6 bg-sidebar/20 flex flex-col items-center justify-center text-center gap-3 aspect-video">
                        <FileText className="h-10 w-10 text-red-500" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">وصل دفع PDF</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">الملف محمي بآمان.</p>
                        </div>
                        <a
                          href={latestProof.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          فتح الملف في نافذة جديدة
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="relative group border border-border rounded-xl overflow-hidden bg-sidebar/20 aspect-video flex items-center justify-center">
                        <img
                          src={latestProof.signedUrl}
                          alt="وصل إثبات الدفع"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <a
                            href={latestProof.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-white/20 transition-all shadow-lg"
                          >
                            عرض الصورة كاملة
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="border border-dashed border-border rounded-xl py-8 text-center text-xs text-muted-foreground">
                      فشل توليد رابط آمن للمستند.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Left side: Customer details & Shipping address (1 col) */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <User className="h-5 w-5 text-primary" />
              بيانات المشتري
            </h3>

            <div className="space-y-3.5">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground">الاسم الكامل:</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{order.full_name}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground">رقم الهاتف:</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-mono font-bold text-foreground">{order.phone}</span>
                  <a
                    href={`tel:${order.phone}`}
                    className="p-1 rounded-md hover:bg-sidebar text-muted-foreground hover:text-primary transition-colors"
                    title="اتصال مباشر"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${order.phone.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md hover:bg-sidebar text-muted-foreground hover:text-emerald-500 transition-colors"
                    title="تواصل عبر الواتساب"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {order.email && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">البريد الإلكتروني:</p>
                  <p className="text-sm font-mono text-foreground mt-0.5 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>{order.email}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <MapPin className="h-5 w-5 text-primary" />
              عنوان التوصيل
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-sidebar/30 p-2.5 rounded-lg border border-border text-xs text-foreground">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>طريقة الشحن: {order.shipping_methods?.name || "شحن مباشر"}</span>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground">المدينة / المنطقة:</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{order.city}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground">العنوان بالتفصيل:</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{order.address}</p>
              </div>

              {order.notes && (
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-[10px] font-semibold text-amber-600">ملاحظات المشتري على الطلب:</p>
                  <p className="text-xs text-foreground/90 mt-1 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg leading-relaxed">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Info Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <CreditCard className="h-5 w-5 text-primary" />
              طريقة وحالة الدفع
            </h3>

            <div className="space-y-3.5">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground">طريقة الدفع المختارة:</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{order.payment_methods?.name || "دفع عند الاستلام"}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground">حالة الدفع الكلية:</p>
                <p className="text-sm mt-0.5">
                  {order.payment_status === "paid" ? (
                    <span className="text-emerald-600 font-bold">مدفوع</span>
                  ) : order.payment_status === "failed" ? (
                    <span className="text-red-600 font-bold">فشلت عملية الدفع</span>
                  ) : (
                    <span className="text-amber-600 font-bold">غير مدفوع</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── REJECTION REASON MODAL ── */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <h3 className="text-lg font-cairo font-bold text-foreground mb-2">
              رفض إثبات الدفع للطلب
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              يرجى إدخال سبب رفض إيصال التحويل، لكي يظهر للعميل عند تفقد حالة طلبه.
            </p>

            <form onSubmit={handleRejectProofSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">سبب الرفض <span className="text-destructive">*</span></label>
                <textarea
                  rows={3}
                  placeholder="مثال: الصورة المرفقة غير واضحة، أو المبلغ المحول غير مطابق لقيمة الفاتورة..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectionReason("");
                  }}
                  className="btn-secondary text-sm px-4 py-2 cursor-pointer"
                  disabled={reviewingProof}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-destructive hover:bg-destructive/90 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer font-cairo flex items-center gap-1.5"
                  disabled={reviewingProof}
                >
                  {reviewingProof && <Loader2 className="h-4 w-4 animate-spin" />}
                  تأكيد رفض الإشعار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
