"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Globe, Plus, Trash2, RefreshCw, Star,
  CheckCircle2, Clock, AlertCircle, XCircle, Copy,
  ChevronDown, ChevronUp, Info, Loader2,
} from "lucide-react";
import {
  addDomainAction,
  verifyDomainAction,
  removeDomainAction,
  setPrimaryDomainAction,
  getDomainsAction,
} from "@/actions/domain";
import type { StoreDomain } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface Props {
  domains: StoreDomain[];
  fetchError: string | null;
  vercelConfigured: boolean;
}

// Vercel's real DNS values
const VERCEL_A_RECORD = "76.76.21.21";
const VERCEL_CNAME = "cname.vercel-dns.com";

type DomainStatus = "pending_dns" | "verifying" | "active" | "invalid" | "failed";

function getDomainStatus(domain: StoreDomain): DomainStatus {
  const raw = (domain.dns_records as Record<string, unknown>) ?? {};
  if (raw.status) return raw.status as DomainStatus;
  return domain.is_verified ? "active" : "pending_dns";
}

function getLastChecked(domain: StoreDomain): string | null {
  const raw = (domain.dns_records as Record<string, unknown>) ?? {};
  return (raw.last_checked_at as string) ?? null;
}

function getErrorMessage(domain: StoreDomain): string | null {
  const raw = (domain.dns_records as Record<string, unknown>) ?? {};
  return (raw.error_message as string) ?? null;
}

function StatusBadge({ status }: { status: DomainStatus }) {
  const map: Record<DomainStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    active: {
      label: "مفعّل",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    pending_dns: {
      label: "بانتظار DNS",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="h-3 w-3" />,
    },
    verifying: {
      label: "جارٍ التحقق",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    invalid: {
      label: "DNS خاطئ",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    failed: {
      label: "فشل الربط",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const { label, cls, icon } = map[status] ?? map.pending_dns;
  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0", cls)}>
      {icon}
      {label}
    </div>
  );
}

function RecordField({ label, value, onCopy }: { label: string; value: string; onCopy?: (v: string) => void }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1">{label}</p>
      <div
        className={cn(
          "flex items-center justify-between bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono text-foreground",
          onCopy && "cursor-pointer hover:bg-muted transition-colors"
        )}
        onClick={() => onCopy?.(value)}
      >
        <span className="truncate text-xs">{value}</span>
        {onCopy && <Copy className="h-3 w-3 text-muted-foreground shrink-0 mr-1" />}
      </div>
    </div>
  );
}

function DnsInstructions({ domain, defaultOpen }: { domain: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("تم النسخ"));
  };

  const parts = domain.split(".");
  const isApex = parts.length === 2;
  const isWww = domain.startsWith("www.") && parts.length === 3;
  const subdomain = !isApex && !isWww && parts.length >= 3 ? parts[0] : null;

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>تعليمات إعداد DNS</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            أضف السجل التالي في لوحة DNS عند مزود النطاق (Namecheap، GoDaddy، Cloudflare...):
          </p>

          {/* For apex domains: A record */}
          {isApex && (
            <div className="rounded-xl bg-background border border-border p-3 space-y-2">
              <p className="text-xs font-semibold">سجل A — للنطاق الجذر (@)</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <RecordField label="النوع" value="A" />
                <RecordField label="الاسم" value="@" onCopy={copyText} />
                <RecordField label="القيمة" value={VERCEL_A_RECORD} onCopy={copyText} />
              </div>
            </div>
          )}

          {/* For www or subdomains: CNAME */}
          {(isWww || subdomain) && (
            <div className="rounded-xl bg-background border border-border p-3 space-y-2">
              <p className="text-xs font-semibold">سجل CNAME</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <RecordField label="النوع" value="CNAME" />
                <RecordField label="الاسم" value={isWww ? "www" : subdomain!} onCopy={copyText} />
                <RecordField label="القيمة" value={VERCEL_CNAME} onCopy={copyText} />
              </div>
            </div>
          )}

          {/* Also show CNAME for apex as alternative */}
          {isApex && (
            <>
              <p className="text-xs text-center text-muted-foreground">أو إذا مزودك يدعم CNAME Flattening</p>
              <div className="rounded-xl bg-background border border-border p-3 space-y-2">
                <p className="text-xs font-semibold">سجل CNAME (Flattening)</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <RecordField label="النوع" value="CNAME" />
                  <RecordField label="الاسم" value="@" onCopy={copyText} />
                  <RecordField label="القيمة" value={VERCEL_CNAME} onCopy={copyText} />
                </div>
              </div>
            </>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 space-y-1">
            <p className="text-xs font-semibold text-amber-800">ملاحظة مهمة</p>
            <p className="text-xs text-amber-700">
              قد يستغرق انتشار DNS من دقائق إلى 48 ساعة. بعد إعداد السجلات، اضغط <strong>تحقق من DNS</strong>.
            </p>
            <p className="text-xs text-amber-700">
              قيمة TTL الموصى بها: 300 ثانية (5 دقائق) أو أقل لتسريع الانتشار.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DomainRow({
  domain,
  onVerify,
  onRemove,
  onSetPrimary,
  busy,
}: {
  domain: StoreDomain;
  onVerify: (id: string) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  busy: boolean;
}) {
  const status = getDomainStatus(domain);
  const lastChecked = getLastChecked(domain);
  const errorMsg = getErrorMessage(domain);
  const isPendingOrFailed = status === "pending_dns" || status === "invalid" || status === "failed";

  return (
    <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
      {/* Domain + Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            status === "active" ? "bg-emerald-50 border border-emerald-200" :
            status === "verifying" ? "bg-blue-50 border border-blue-200" :
            "bg-amber-50 border border-amber-200"
          )}>
            <Globe className={cn(
              "h-4 w-4",
              status === "active" ? "text-emerald-600" :
              status === "verifying" ? "text-blue-600" :
              "text-amber-600"
            )} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate font-cairo" dir="ltr">
              {domain.domain}
            </p>
            {domain.is_primary && (
              <span className="text-xs text-primary font-medium">النطاق الرئيسي</span>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Error message */}
      {errorMsg && status !== "active" && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">{errorMsg}</p>
        </div>
      )}

      {/* Last checked */}
      {lastChecked && (
        <p className="text-xs text-muted-foreground">
          آخر فحص: {new Date(lastChecked).toLocaleString("ar-SA")}
        </p>
      )}

      {/* DNS instructions for non-active */}
      {isPendingOrFailed && (
        <DnsInstructions domain={domain.domain} defaultOpen={true} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {status !== "active" && (
          <button
            onClick={() => onVerify(domain.id)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 h-8 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            تحقق من DNS
          </button>
        )}

        {status === "active" && !domain.is_primary && (
          <button
            onClick={() => onSetPrimary(domain.id)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 h-8 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            تعيين رئيسياً
          </button>
        )}

        {domain.is_primary && status === "active" && (
          <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-primary bg-primary/10 border border-primary/20">
            <Star className="h-3.5 w-3.5" />
            النطاق الرئيسي
          </div>
        )}

        {status === "active" && (
          <button
            onClick={() => onVerify(domain.id)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 h-8 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            title="إعادة التحقق"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={() => onRemove(domain.id)}
          disabled={busy}
          className="mr-auto flex items-center gap-1.5 px-3 h-8 border border-destructive/20 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف
        </button>
      </div>
    </div>
  );
}

export function DomainClient({ domains: initialDomains, fetchError, vercelConfigured }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domains, setDomains] = useState(initialDomains);
  const [addInput, setAddInput] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInput.trim()) return;
    startTransition(async () => {
      const res = await addDomainAction(addInput);
      if (res.data) {
        toast.success(res.vercel_status ? `تم الإضافة — ${res.vercel_status}` : "تم إضافة النطاق");
        setDomains((prev) => [...prev, res.data!]);
        setAddInput("");
      } else {
        toast.error(res.error ?? "فشلت الإضافة");
      }
      router.refresh();
    });
  };

  const handleVerify = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await verifyDomainAction(id);
      if (res.success) {
        if (res.is_verified) {
          toast.success("تم التحقق بنجاح! النطاق مفعّل.");
        } else if (res.error_detail) {
          toast.error(res.error_detail);
        } else {
          toast.warning("DNS لم يُكتشف بعد — تأكد من إعداد السجلات");
        }
        const updated = await getDomainsAction();
        if (updated.data) setDomains(updated.data);
        router.refresh();
      } else {
        toast.error(res.error ?? "فشل التحقق");
      }
      setBusyId(null);
    });
  };

  const handleRemove = (id: string) => {
    const d = domains.find((x) => x.id === id);
    if (!window.confirm(`حذف النطاق "${d?.domain}"؟`)) return;
    setBusyId(id);
    startTransition(async () => {
      const res = await removeDomainAction(id);
      if (res.success) {
        toast.success("تم حذف النطاق");
        setDomains((prev) => prev.filter((x) => x.id !== id));
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
      setBusyId(null);
      router.refresh();
    });
  };

  const handleSetPrimary = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await setPrimaryDomainAction(id);
      if (res.success) {
        toast.success("تم تعيين النطاق الرئيسي");
        setDomains((prev) => prev.map((d) => ({ ...d, is_primary: d.id === id })));
      } else {
        toast.error(res.error ?? "فشلت العملية");
      }
      setBusyId(null);
      router.refresh();
    });
  };

  return (
    <div className="min-h-full" dir="rtl">
      <div className="px-4 sm:px-6 py-5 border-b border-border">
        <h1 className="text-xl font-bold font-cairo text-foreground">النطاق المخصص</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          اربط نطاقك الخاص بمتجرك لتجربة احترافية أمام عملائك
        </p>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-2xl space-y-6">
        {/* Vercel notice if not configured */}
        {!vercelConfigured && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900 font-cairo">متغيرات Vercel غير مُعدَّة</p>
              <p className="text-xs text-amber-800">
                لربط النطاقات تلقائيًا بـ Vercel، يجب ضبط{" "}
                <code className="font-mono bg-amber-100 px-1 rounded">VERCEL_TOKEN</code> و{" "}
                <code className="font-mono bg-amber-100 px-1 rounded">VERCEL_PROJECT_ID</code> في متغيرات البيئة.
                يمكنك الآن حفظ النطاق ومتابعة إعداد DNS يدويًا.
              </p>
            </div>
          </div>
        )}

        {/* Add Domain Form */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold font-cairo mb-3">إضافة نطاق جديد</h2>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="mystore.com"
              dir="ltr"
              disabled={isPending}
              className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors font-mono disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !addInput.trim()}
              className="flex items-center gap-2 px-4 h-10 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إضافة
            </button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            أدخل النطاق بدون <code className="font-mono">https://</code> — مثال:{" "}
            <code className="font-mono text-foreground">store.example.com</code>
          </p>
        </div>

        {fetchError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {fetchError}
          </div>
        )}

        {domains.length === 0 && !fetchError && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Globe className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium font-cairo mb-1">لا يوجد نطاقات مضافة</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              أضف نطاقك الخاص أعلاه وستظهر تعليمات ربطه هنا
            </p>
          </div>
        )}

        {domains.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">النطاقات ({domains.length})</p>
            {domains.map((d) => (
              <DomainRow
                key={d.id}
                domain={d}
                onVerify={handleVerify}
                onRemove={handleRemove}
                onSetPrimary={handleSetPrimary}
                busy={busyId === d.id}
              />
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
          <p className="text-sm font-semibold font-cairo">كيف يعمل ربط النطاق؟</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
            <li>أدخل النطاق الذي تملكه في الحقل أعلاه</li>
            <li>اذهب إلى لوحة DNS في مزود النطاق وأضف السجل المطلوب</li>
            <li>عد وانقر <strong className="text-foreground">تحقق من DNS</strong> لتأكيد الإعداد</li>
            <li>بعد التفعيل، عيّن النطاق رئيسياً ليصبح العنوان الافتراضي لمتجرك</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
