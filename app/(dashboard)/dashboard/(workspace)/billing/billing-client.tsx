"use client";

import { useState, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  Crown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
  FileImage,
  X,
  AlertTriangle,
  CreditCard,
  Copy,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitPaymentProof } from "@/actions/billing";
import type { Subscription } from "@/lib/types/database";

// ============================================================
// PAYMENT INSTRUCTIONS (Admin-configurable in future)
// ============================================================
const PAYMENT_INSTRUCTIONS = [
  {
    method: "تحويل بنكي",
    icon: CreditCard,
    details: [
      { label: "اسم البنك", value: "البنك الإسلامي الفلسطيني" },
      { label: "اسم الحساب", value: "سبأ ستور" },
      { label: "رقم الحساب", value: "1234-5678-9012" },
      { label: "IBAN", value: "PS92 BANK 0000 0000 1234 5678 9012" },
    ],
  },
  {
    method: "واتساب / تحويل",
    icon: Phone,
    details: [
      { label: "الرقم", value: "+970 59 000 0000" },
      { label: "ملاحظة", value: "أرسل اسم متجرك مع إثبات الدفع" },
    ],
  },
];

// ============================================================
// TYPES
// ============================================================
interface BillingClientProps {
  subscription: Subscription | null;
  pkg: any;
  storeName: string;
  proofSignedUrl: string | null;
}

// ============================================================
// STATUS CONFIG
// ============================================================
function getStatusConfig(sub: Subscription | null) {
  if (!sub) return { label: "غير مشترك", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle };

  if (sub.status === "active") return { label: "نشط", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 };
  if (sub.status === "trialing") {
    const days = sub.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
      : 0;
    return { label: days > 0 ? `تجريبي (${days} ${days === 1 ? "يوم" : "أيام"})` : "انتهت التجربة", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock };
  }
  if (sub.status === "pending") return { label: "قيد المراجعة", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Loader2 };
  if (sub.status === "rejected") return { label: "مرفوض", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle };

  return { label: sub.status, color: "text-muted-foreground bg-muted border-border", icon: AlertTriangle };
}

// ============================================================
// COMPONENT
// ============================================================
export function BillingClient({ subscription, pkg, storeName, proofSignedUrl }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = getStatusConfig(subscription);
  const StatusIcon = status.icon;
  const canSubmit = subscription?.status !== "active" && subscription?.status !== "pending";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  }

  function clearFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit() {
    if (!selectedFile) {
      toast.error("يرجى اختيار ملف إثبات الدفع");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      startTransition(async () => {
        const result = await submitPaymentProof(base64, selectedFile.name, selectedFile.type);
        if (result.success) {
          toast.success("تم إرسال إثبات الدفع بنجاح — سيتم مراجعته خلال 24 ساعة");
          clearFile();
        } else {
          toast.error(result.error ?? "حدث خطأ أثناء الإرسال");
        }
      });
    };
    reader.readAsDataURL(selectedFile);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  }

  return (
    <div className="page-shell max-w-3xl space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-cairo font-bold text-2xl text-foreground">الفواتير والاشتراك</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة اشتراكك وإرسال إثبات الدفع</p>
      </div>

      {/* Current Status */}
      <div className="surface-card p-5 space-y-4">
        <h2 className="font-cairo font-semibold text-sm text-foreground border-b border-border pb-3">
          حالة الاشتراك
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">{storeName}</p>
            <p className="text-xs text-muted-foreground">{pkg?.name ?? "بدون باقة"}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border", status.color)}>
            <StatusIcon className={cn("h-3.5 w-3.5", subscription?.status === "pending" && "animate-spin")} />
            {status.label}
          </span>
        </div>

        {/* Rejection note */}
        {subscription?.status === "rejected" && subscription.admin_note && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">سبب الرفض:</p>
              <p>{subscription.admin_note}</p>
            </div>
          </div>
        )}

        {/* Active */}
        {subscription?.status === "active" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>اشتراكك نشط — استمتع بكامل ميزات المنصة</span>
          </div>
        )}

        {/* Pending */}
        {subscription?.status === "pending" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>تم إرسال إثبات الدفع — سيتم مراجعته خلال 24 ساعة</span>
          </div>
        )}

        {/* Previous proof */}
        {proofSignedUrl && subscription?.status === "pending" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">إثبات الدفع المرسل:</p>
            <a
              href={proofSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
            >
              <FileImage className="h-4 w-4" />
              عرض الملف المرفق
            </a>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      {canSubmit && (
        <div className="surface-card p-5 space-y-4">
          <h2 className="font-cairo font-semibold text-sm text-foreground border-b border-border pb-3">
            بيانات الدفع
          </h2>
          <p className="text-xs text-muted-foreground">
            حوّل المبلغ المطلوب إلى أحد الحسابات أدناه ثم ارفع إثبات الدفع في القسم التالي.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAYMENT_INSTRUCTIONS.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.method} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{method.method}</p>
                  </div>
                  <div className="space-y-2">
                    {method.details.map((d) => (
                      <div key={d.label} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{d.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-foreground">{d.value}</span>
                          <button
                            onClick={() => copyText(d.value)}
                            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Proof Upload */}
      {canSubmit && (
        <div className="surface-card p-5 space-y-4">
          <h2 className="font-cairo font-semibold text-sm text-foreground border-b border-border pb-3">
            رفع إثبات الدفع
          </h2>
          <p className="text-xs text-muted-foreground">
            ارفع صورة أو ملف PDF يثبت إتمام عملية الدفع.
          </p>

          {/* Drop zone */}
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:bg-muted/30"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">اضغط للرفع أو اسحب الملف هنا</p>
                <p className="text-xs text-muted-foreground mt-1">JPG، PNG، WEBP، PDF — الحد الأقصى 5 ميجابايت</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-border rounded-xl p-4 space-y-3">
              {/* Preview */}
              {previewUrl && (
                <div className="relative w-full max-h-48 rounded-lg overflow-hidden bg-muted">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileImage className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={clearFile}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isPending}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                إرسال إثبات الدفع
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
