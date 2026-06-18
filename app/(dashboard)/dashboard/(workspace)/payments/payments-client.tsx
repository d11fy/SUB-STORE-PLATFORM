// ============================================================
// Saba Store — Payments Client Component
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Wallet,
  Building2,
  Coins,
  ChevronLeft,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodActive,
} from "@/actions/payments";
import { paymentMethodSchema, type PaymentMethodInput } from "@/lib/validations/payment";
import { cn } from "@/lib/utils";

interface PaymentsClientProps {
  initialMethods: any[];
  initialError: string | null;
}

export function PaymentsClient({ initialMethods, initialError }: PaymentsClientProps) {
  const router = useRouter();
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<any | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState,
  } = useForm<PaymentMethodInput>({
    resolver: zodResolver(paymentMethodSchema) as any,
    defaultValues: {
      name: "",
      type: "bank_transfer",
      account_holder_name: "",
      bank_name: "",
      account_number: "",
      iban: "",
      instructions: "",
      notes: "",
      is_active: true,
    },
  });

  const { errors, isSubmitting } = formState as any;

  const selectedType = watch("type");

  // Local payment templates / suggestions
  const paymentSuggestions = [
    { name: "CliQ (تحويل بنكي فوري - الأردن)", type: "bank_transfer", bank_name: "CliQ", instructions: "يرجى التحويل إلى الاسم المستعار أو رقم الهاتف المحدد، ثم إرفاق صورة التحويل." },
    { name: "Jawwal Pay (محفظة فلسطين)", type: "local_wallet", bank_name: "Jawwal Pay", instructions: "يرجى التحويل إلى رقم المحفظة (رقم الجوال)، ثم إرفاق صورة إشعار التحويل." },
    { name: "PalPay (محفظة فلسطين)", type: "local_wallet", bank_name: "PalPay", instructions: "يرجى التحويل عبر التطبيق إلى رقم المحفظة، ثم إرفاق إشعار الدفع." },
    { name: "Zain Cash (محفظة الأردن)", type: "local_wallet", bank_name: "Zain Cash", instructions: "يرجى التحويل عبر زين كاش لرقم الهاتف المحدد، ثم إرفاق إشعار الدفع." },
    { name: "الدفع عند الاستلام", type: "cash_on_delivery", instructions: "يتم تسليم قيمة الطلب نقداً عند استلام الشحنة من المندوب." },
  ];

  const applyTemplate = (tpl: any) => {
    setValue("name", tpl.name);
    setValue("type", tpl.type as any);
    setValue("bank_name", tpl.bank_name ?? "");
    setValue("instructions", tpl.instructions ?? "");
    setValue("account_holder_name", "");
    setValue("account_number", "");
    setValue("iban", "");
  };

  const handleOpenAdd = () => {
    reset({
      name: "",
      type: "bank_transfer",
      account_holder_name: "",
      bank_name: "",
      account_number: "",
      iban: "",
      instructions: "",
      notes: "",
      is_active: true,
    });
    setEditingMethod(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (method: any) => {
    reset({
      name: method.name,
      type: method.type,
      account_holder_name: method.account_holder_name ?? "",
      bank_name: method.bank_name ?? "",
      account_number: method.account_number ?? "",
      iban: method.iban ?? "",
      instructions: method.instructions ?? "",
      notes: method.notes ?? "",
      is_active: method.is_active,
    });
    setEditingMethod(method);
    setModalOpen(true);
  };

  const onSubmit = async (data: PaymentMethodInput) => {
    try {
      let res;
      if (editingMethod) {
        res = await updatePaymentMethod(editingMethod.id, data);
      } else {
        res = await createPaymentMethod(data);
      }

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(editingMethod ? "تم تعديل طريقة الدفع" : "تم إضافة طريقة الدفع بنجاح");
      setModalOpen(false);
      router.refresh();
    } catch {
      toast.error("حدث خطأ غير متوقع");
    }
  };

  const handleToggleActive = async (method: any) => {
    try {
      const res = await togglePaymentMethodActive(method.id, !method.is_active);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(method.is_active ? "تم تعطيل طريقة الدفع" : "تم تفعيل طريقة الدفع");
        router.refresh();
      }
    } catch {
      toast.error("فشل تعديل حالة طريقة الدفع");
    }
  };

  const handleDeleteClick = (method: any) => {
    setDeletingMethod(method);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingMethod) return;
    try {
      const res = await deletePaymentMethod(deletingMethod.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم إزالة طريقة الدفع");
        router.refresh();
      }
    } catch {
      toast.error("فشل حذف طريقة الدفع");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingMethod(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            ملاحظة: هذا النظام يدعم الدفع اليدوي لـ MVP (يقوم العميل بالتحويل وإرفاق إشعار الدفع)، ولا يتطلب ربط بوابات دفع إلكترونية معقدة.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-brand text-sm px-4 py-2 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          إضافة طريقة دفع
        </button>
      </div>

      {initialError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {initialError}
        </div>
      )}

      {/* Methods List */}
      {initialMethods.length === 0 ? (
        <div className="glass-card py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <CreditCard className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-cairo font-semibold text-foreground">
              لم تقم بتهيئة طرق دفع بعد
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              يجب إضافة طريقة دفع واحدة على الأقل (مثل الدفع عند الاستلام أو التحويل البنكي) ليتمكن العملاء من إتمام الطلبات.
            </p>
          </div>
          <button onClick={handleOpenAdd} className="btn-secondary text-xs px-4 py-2 cursor-pointer">
            إضافة أول طريقة دفع
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialMethods.map((method) => {
            const isWallet = method.type === "local_wallet";
            const isCOD = method.type === "cash_on_delivery";

            return (
              <div
                key={method.id}
                className={cn(
                  "glass-card p-5 space-y-4 border transition-all duration-300",
                  method.is_active ? "border-primary/20" : "opacity-60 border-border"
                )}
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {isWallet ? (
                        <Wallet className="h-5 w-5" />
                      ) : isCOD ? (
                        <Coins className="h-5 w-5" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-cairo font-bold text-foreground text-sm">{method.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {method.type === "bank_transfer"
                          ? "حساب بنكي / CliQ"
                          : method.type === "local_wallet"
                          ? "محفظة رقمية"
                          : method.type === "cash_on_delivery"
                          ? "الدفع عند الاستلام"
                          : "طريقة دفع مخصصة"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Active status */}
                  <button
                    onClick={() => handleToggleActive(method)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={method.is_active ? "تعطيل" : "تفعيل"}
                  >
                    {method.is_active ? (
                      <ToggleRight className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Details view */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {method.account_holder_name && (
                    <p>
                      <span className="font-semibold text-foreground">المستفيد:</span>{" "}
                      {method.account_holder_name}
                    </p>
                  )}
                  {method.bank_name && (
                    <p>
                      <span className="font-semibold text-foreground">
                        {isWallet ? "المحفظة:" : "البنك:"}
                      </span>{" "}
                      {method.bank_name}
                    </p>
                  )}
                  {method.account_number && (
                    <p className="font-mono">
                      <span className="font-semibold font-cairo text-foreground">رقم الحساب / المحفظة:</span>{" "}
                      {method.account_number}
                    </p>
                  )}
                  {method.iban && (
                    <p className="font-mono">
                      <span className="font-semibold font-cairo text-foreground">IBAN:</span> {method.iban}
                    </p>
                  )}
                  {method.instructions && (
                    <p className="border-t border-border/50 pt-2 text-[11px] leading-relaxed">
                      <span className="font-semibold text-foreground block mb-0.5">التعليمات للعميل:</span>
                      {method.instructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => handleOpenEdit(method)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteClick(method)}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT DIALOG ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-cairo font-bold text-foreground mb-4">
              {editingMethod ? "تعديل طريقة الدفع" : "إضافة طريقة دفع جديدة"}
            </h3>

            {/* Suggestions Templates (Only when creating new) */}
            {!editingMethod && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground block mb-2">
                  هل تريد استخدام نموذج جاهز محلي؟
                </label>
                <div className="flex flex-wrap gap-2">
                  {paymentSuggestions.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-border bg-sidebar/50 hover:bg-sidebar transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {tpl.name}
                      <ChevronLeft className="h-3 w-3 rtl-flip" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">نوع طريقة الدفع</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                  {...register("type")}
                >
                  <option value="bank_transfer">حساب بنكي / CliQ / تحويل مالي</option>
                  <option value="local_wallet">محفظة إلكترونية (مثل Zain Cash / Jawwal Pay)</option>
                  <option value="cash_on_delivery">الدفع عند الاستلام (COD)</option>
                  <option value="custom">طريقة دفع مخصصة</option>
                </select>
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  الاسم الظاهر للعميل <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: تحويل إلى محفظة Zain Cash"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none",
                    errors.name ? "border-destructive" : "border-border"
                  )}
                  {...register("name")}
                />
                {errors.name && <p className="text-destructive text-xs mt-0.5">{errors.name.message}</p>}
              </div>

              {/* Conditional Fields: Bank & Wallet */}
              {(selectedType === "bank_transfer" || selectedType === "local_wallet") && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {selectedType === "local_wallet" ? "مزود المحفظة" : "اسم البنك"}
                      </label>
                      <input
                        type="text"
                        placeholder={selectedType === "local_wallet" ? "مثال: Zain Cash" : "مثال: بنك فلسطين"}
                        className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                        {...register("bank_name")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">اسم صاحب الحساب / المحفظة</label>
                      <input
                        type="text"
                        placeholder="مثال: أحمد محمد علي"
                        className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                        {...register("account_holder_name")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {selectedType === "local_wallet" ? "رقم المحفظة (رقم الجوال)" : "رقم الحساب"}
                      </label>
                      <input
                        type="text"
                        placeholder={selectedType === "local_wallet" ? "مثال: 079XXXXXXX" : "مثال: 12345678"}
                        className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none font-mono"
                        {...register("account_number")}
                      />
                    </div>

                    {selectedType === "bank_transfer" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">رقم الـ IBAN (اختياري)</label>
                        <input
                          type="text"
                          placeholder="PSXXXXXXXXXXXXXXXXXXXXXXXX"
                          className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none font-mono"
                          {...register("iban")}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">تعليمات الدفع للعميل</label>
                <textarea
                  rows={3}
                  placeholder="مثال: بعد التحويل يرجى تصوير الشاشة ورفع إشعار التحويل لتأكيد الطلب."
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none resize-none"
                  {...register("instructions")}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">ملاحظات إضافية (تظهر لك فقط)</label>
                <input
                  type="text"
                  placeholder="ملاحظات لتنظيم الدفع..."
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                  {...register("notes")}
                />
              </div>

              {/* Status */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-primary focus:ring-primary bg-input border-border"
                  {...register("is_active")}
                />
                <span className="text-xs font-semibold text-foreground">تفعيل طريقة الدفع مباشرة في المتجر</span>
              </label>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-sm px-4 py-2 cursor-pointer"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-brand text-sm px-5 py-2 flex items-center gap-1.5 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  حفظ طريقة الدفع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {deleteConfirmOpen && deletingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <h3 className="text-lg font-cairo font-bold text-foreground mb-2">
              تأكيد حذف طريقة الدفع
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              هل أنت متأكد من حذف طريقة الدفع{" "}
              <span className="text-foreground font-semibold">"{deletingMethod.name}"</span>؟
              <br />
              لن يتمكن العملاء من اختيار طريقة الدفع هذه بعد الآن.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="btn-secondary text-sm px-4 py-2 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer font-cairo"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
