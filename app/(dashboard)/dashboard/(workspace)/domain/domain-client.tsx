"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Globe, Plus, Trash2, RefreshCw, Star, StarOff,
  CheckCircle2, Clock, Copy, ChevronDown, ChevronUp, X,
} from "lucide-react";
import {
  addDomainAction,
  verifyDomainAction,
  removeDomainAction,
  setPrimaryDomainAction,
} from "@/actions/domain";
import type { StoreDomain } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface Props {
  domains: StoreDomain[];
  fetchError: string | null;
}

const PLATFORM_CNAME = "cname.sabastore.com";

function DnsInstructions({ domain }: { domain: string }) {
  const [open, setOpen] = useState(false);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
      >
        <span className="font-medium">إعدادات DNS المطلوبة</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            أضف أحد السجلات التالية في لوحة DNS الخاصة بمزود النطاق (Namecheap، GoDaddy، Cloudflare...):
          </p>

          {/* CNAME Option */}
          <div className="rounded-xl bg-background border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">خيار 1 — سجل CNAME (موصى به)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">النوع</p>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono font-bold text-foreground">
                  CNAME
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">الاسم</p>
                <div
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono text-foreground cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => copyText("www")}
                >
                  <span>www</span>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">القيمة</p>
                <div
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono text-foreground cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => copyText(PLATFORM_CNAME)}
                >
                  <span className="truncate">{PLATFORM_CNAME}</span>
                  <Copy className="h-3 w-3 text-muted-foreground shrink-0 mr-1" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">أو</p>

          {/* A Record Option */}
          <div className="rounded-xl bg-background border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">خيار 2 — سجل A (للنطاق الجذر @)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">النوع</p>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono font-bold text-foreground">
                  A
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">الاسم</p>
                <div
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono text-foreground cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => copyText("@")}
                >
                  <span>@</span>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">القيمة</p>
                <div
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono text-foreground cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => copyText("76.76.21.21")}
                >
                  <span>76.76.21.21</span>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            قد يستغرق انتشار DNS من دقائق إلى 48 ساعة. بعد الإعداد، اضغط <strong>تحقق</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

interface DomainRowProps {
  domain: StoreDomain;
  onVerify: (id: string) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  busy: boolean;
}

function DomainRow({ domain, onVerify, onRemove, onSetPrimary, busy }: DomainRowProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
      {/* Domain + Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            domain.is_verified ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"
          )}>
            <Globe className={cn("h-4 w-4", domain.is_verified ? "text-emerald-600" : "text-amber-600")} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate font-cairo" dir="ltr">
              {domain.domain}
            </p>
            {domain.is_primary && (
              <span className="text-xs text-primary font-medium">رئيسي</span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0",
          domain.is_verified
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        )}>
          {domain.is_verified ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {domain.is_verified ? "مفعّل" : "في الانتظار"}
        </div>
      </div>

      {/* DNS instructions for unverified domains */}
      {!domain.is_verified && <DnsInstructions domain={domain.domain} />}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {!domain.is_verified && (
          <button
            onClick={() => onVerify(domain.id)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 h-8 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {busy ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            تحقق من DNS
          </button>
        )}

        {domain.is_verified && !domain.is_primary && (
          <button
            onClick={() => onSetPrimary(domain.id)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 h-8 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            تعيين رئيسياً
          </button>
        )}

        {domain.is_primary && domain.is_verified && (
          <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-primary bg-primary/10 border border-primary/20">
            <Star className="h-3.5 w-3.5" />
            النطاق الرئيسي
          </div>
        )}

        <button
          onClick={() => onRemove(domain.id)}
          disabled={busy}
          className="mr-auto flex items-center gap-1.5 px-3 h-8 border border-destructive/20 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
          aria-label="حذف النطاق"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف
        </button>
      </div>
    </div>
  );
}

export function DomainClient({ domains: initialDomains, fetchError }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domains, setDomains] = useState(initialDomains);
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInput.trim()) return;
    setAdding(true);
    startTransition(async () => {
      const res = await addDomainAction(addInput);
      if (res.data) {
        toast.success("تم إضافة النطاق");
        setDomains((prev) => [...prev, res.data!]);
        setAddInput("");
      } else {
        toast.error(res.error ?? "فشلت الإضافة");
      }
      setAdding(false);
      router.refresh();
    });
  };

  const handleVerify = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await verifyDomainAction(id);
      if (res.success) {
        if (res.is_verified) {
          toast.success("تم التحقق بنجاح! النطاق مفعّل الآن.");
        } else {
          toast.error("لم يتم التحقق بعد — تأكد من إعدادات DNS وحاول مجدداً");
        }
        router.refresh();
        const updated = await (await import("@/actions/domain")).getDomainsAction();
        if (updated.data) setDomains(updated.data);
      } else {
        toast.error(res.error ?? "فشل التحقق");
      }
      setBusyId(null);
    });
  };

  const handleRemove = (id: string) => {
    const d = domains.find((x) => x.id === id);
    if (!window.confirm(`حذف النطاق "${d?.domain}"؟ لا يمكن التراجع.`)) return;
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
        setDomains((prev) =>
          prev.map((d) => ({ ...d, is_primary: d.id === id }))
        );
      } else {
        toast.error(res.error ?? "فشلت العملية");
      }
      setBusyId(null);
      router.refresh();
    });
  };

  return (
    <div className="min-h-full" dir="rtl">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 py-5 border-b border-border">
        <h1 className="text-xl font-bold font-cairo text-foreground">النطاق المخصص</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          اربط نطاقك الخاص بمتجرك لتجربة احترافية أمام عملائك
        </p>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-2xl space-y-6">
        {/* ── Add Domain Form ── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 font-cairo">إضافة نطاق جديد</h2>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="mystore.com"
              dir="ltr"
              disabled={isPending}
              className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors font-mono disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !addInput.trim()}
              className="flex items-center gap-2 px-4 h-10 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
            >
              {adding ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              إضافة
            </button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            أدخل النطاق بدون <span className="font-mono">https://</span> — مثال:{" "}
            <span className="font-mono text-foreground">store.example.com</span>
          </p>
        </div>

        {/* ── Error ── */}
        {fetchError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {fetchError}
          </div>
        )}

        {/* ── Domain List ── */}
        {domains.length === 0 && !fetchError && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Globe className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground font-cairo mb-1">لا يوجد نطاقات مضافة</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              أضف نطاقك الخاص أعلاه وستظهر تعليمات ربطه هنا
            </p>
          </div>
        )}

        {domains.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">
              النطاقات المضافة ({domains.length})
            </p>
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

        {/* ── Help Card ── */}
        <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground font-cairo">كيف يعمل ربط النطاق؟</p>
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
