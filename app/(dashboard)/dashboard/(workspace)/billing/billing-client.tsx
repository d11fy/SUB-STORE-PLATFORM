"use client";

import { useState, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  Crown, Clock, CheckCircle2, XCircle, Loader2, Upload,
  FileImage, X, AlertTriangle, CreditCard, Copy, Phone,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPaymentRequest } from "@/actions/payment-requests";
import type { Subscription, PaymentRequest } from "@/lib/types/database";

// ============================================================
// PLANS CONFIG
// ============================================================
const PLANS = [
  { key: "starter", label: "ستارتر", price: "49 ₪ / شهر", desc: "حتى 50 منتج" },
  { key: "growth",  label: "نمو",     price: "99 ₪ / شهر", desc: "حتى 500 منتج" },
  { key: "pro",     label: "برو",     price: "199 ₪ / شهر", desc: "منتجات غير محدودة" },
];

// ============================================================
// PAYMENT INSTRUCTIONS
// ============================================================
const PAYMENT_METHODS = [
  {
    label: "تحويل بنكي",
    icon: CreditCard,
    fields: [
      { label: "البنك", value: "البنك الإسلامي الفلسطيني" },
      { label: "اسم الحساب", value: "سبأ ستور" },
      { label: "رقم IBAN", value: "PS92BANK000000001234567890" },
    ],
  },
  {
    label: "واتساب / تحويل",
    icon: Phone,
    fields: [
      { label: "الرقم", value: "+970 59 000 0000" },
      { label: "ملاحظة", value: "أرسل اسم متجرك مع الإيصال" },
    ],
  },
];

// ============================================================
// STATUS CONFIG
// ============================================================
function statusConfig(sub: Subscription | null) {
  if (!sub) return { label: "غير مشترك", cls: "text-red-700 bg-red-50 border-red-200", icon: XCircle };
  const map: Record<string, any> = {
    active:   { label: "نشط", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    trialing: {
      label: (() => {
        const d = sub.trial_ends_at ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000)) : 0;
        return d > 0 ? `تجريبي — ${d} ${d === 1 ? "يوم" : "أيام"} متبقية` : "انتهت التجربة";
      })(),
      cls: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock,
    },
    pending:  { label: "قيد المراجعة", cls: "text-blue-700 bg-blue-50 border-blue-200", icon: Loader2 },
    rejected: { label: "مرفوض", cls: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  };
  return map[sub.status] ?? { label: sub.status, cls: "text-muted-foreground bg-muted border-border", icon: AlertTriangle };
}

// ============================================================
// PROPS
// ============================================================
interface Props {
  subscription: Subscription | null;
  pkg: any;
  storeName: string;
  proofSignedUrl: string | null;
  requests: PaymentRequest[];
}

// ============================================================
// COMPONENT
// ============================================================
export function BillingClient({ subscription, pkg, storeName, proofSignedUrl, requests }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [txNumber, setTxNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sc = statusConfig(subscription);
  const Icon = sc.icon;
  const canSubmit = subscription?.status !== "active";
  const isPending2 = subscription?.status === "pending";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("الحد الأقصى 5 ميجابايت"); return; }
    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect({ target: { files: [file] } } as any);
  }

  function clearFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit() {
    if (!selectedFile) { toast.error("يرجى اختيار إيصال الدفع"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        const result = await createPaymentRequest(
          reader.result as string,
          selectedFile.name,
          selectedFile.type,
          selectedPlan,
          txNumber,
          notes
        );
        if (result.success) {
          toast.success("تم إرسال طلب الاشتراك — سيتم مراجعته خلال 24 ساعة");
          clearFile(); setTxNumber(""); setNotes("");
        } else {
          toast.error(result.error ?? "حدث خطأ");
        }
      });
    };
    reader.readAsDataURL(selectedFile);
  }

  async function copy(v: string) {
    await navigator.clipboard.writeText(v);
    toast.success("تم النسخ");
  }

  return (
    <div className="page-shell max-w-3xl space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-cairo font-bold text-2xl text-foreground">الفواتير والاشتراك</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة اشتراكك وإرسال إثبات الدفع</p>
      </div>

      {/* Status card */}
      <div className="surface-card p-5 space-y-4">
        <h2 className="font-cairo font-semibold text-sm border-b border-border pb-3">حالة الاشتراك</h2>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{storeName}</p>
            <p className="text-xs text-muted-foreground">{pkg?.name ?? "بدون باقة"}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0", sc.cls)}>
            <Icon className={cn("h-3.5 w-3.5", isPending2 && "animate-spin")} />
            {sc.label}
          </span>
        </div>

        {/* Inline messages */}
        {subscription?.status === "active" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>اشتراكك نشط — استمتع بكامل ميزات المنصة</span>
          </div>
        )}
        {isPending2 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>طلبك قيد المراجعة — سيتم التفعيل خلال 24 ساعة</span>
          </div>
        )}
        {subscription?.status === "rejected" && subscription.admin_note && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">سبب الرفض:</p>
              <p>{subscription.admin_note}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment instructions */}
      {canSubmit && (
        <div className="surface-card p-5 space-y-4">
          <h2 className="font-cairo font-semibold text-sm border-b border-border pb-3">بيانات الدفع</h2>
          <p className="text-xs text-muted-foreground">حوّل المبلغ لأحد الحسابات أدناه ثم ارفع الإيصال.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAYMENT_METHODS.map((m) => {
              const Ic = m.icon;
              return (
                <div key={m.label} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ic className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="font-semibold text-sm">{m.label}</p>
                  </div>
                  {m.fields.map((f) => (
                    <div key={f.label} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{f.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">{f.value}</span>
                        <button onClick={() => copy(f.value)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload form */}
      {canSubmit && (
        <div className="surface-card p-5 space-y-5">
          <h2 className="font-cairo font-semibold text-sm border-b border-border pb-3">رفع إثبات الدفع</h2>

          {/* Plan selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">الباقة المطلوبة</label>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedPlan(p.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-colors",
                    selectedPlan === p.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted text-foreground"
                  )}
                >
                  <span className="font-semibold text-xs">{p.label}</span>
                  <span className="text-xs text-muted-foreground">{p.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">رقم العملية / المرجع</label>
            <input
              value={txNumber}
              onChange={(e) => setTxNumber(e.target.value)}
              placeholder="أدخل رقم العملية من إيصال البنك"
              className="w-full text-sm border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات تود إضافتها للمشرف"
              rows={2}
              className="w-full text-sm border border-border rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
          </div>

          {/* File drop zone */}
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:bg-muted/20"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">اضغط للرفع أو اسحب الإيصال هنا</p>
                <p className="text-xs text-muted-foreground mt-1">JPG، PNG، WEBP، PDF — الحد الأقصى 5 ميجابايت</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="border border-border rounded-xl p-4 space-y-3">
              {previewUrl && (
                <div className="w-full max-h-48 rounded-lg overflow-hidden bg-muted">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileImage className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button onClick={clearFile} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />جاري الإرسال...</> : <><Upload className="h-4 w-4" />إرسال طلب الاشتراك</>}
          </button>
        </div>
      )}

      {/* Request history */}
      {requests.length > 0 && (
        <div className="surface-card overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-5 text-sm font-semibold hover:bg-muted/30 transition-colors"
          >
            <span>سجل الطلبات ({requests.length})</span>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showHistory && (
            <div className="border-t border-border divide-y divide-border">
              {requests.map((r) => {
                const sc2 = STATUS_MAP[r.status] ?? { label: r.status, cls: "" };
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.plan}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
                    </div>
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", sc2.cls)}>
                      {sc2.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:  { label: "قيد المراجعة", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  approved: { label: "مُوافَق",       cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  rejected: { label: "مرفوض",        cls: "text-red-700 bg-red-50 border-red-200" },
};
