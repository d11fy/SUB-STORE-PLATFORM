"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  ChevronDown,
  FileImage,
  Calendar,
  Store,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { approveSubscription, rejectSubscription, extendTrial } from "@/actions/admin";

// ============================================================
// TYPES
// ============================================================
interface SubscriptionRow {
  id: string;
  store_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_proof_url: string | null;
  proofSignedUrl: string | null;
  admin_note: string | null;
  plan: string | null;
  created_at: string;
  stores: { name: string; slug: string } | null;
  packages: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  trialing: { label: "تجريبي", color: "text-amber-700 bg-amber-50 border-amber-200" },
  active:   { label: "نشط", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  pending:  { label: "قيد المراجعة", color: "text-blue-700 bg-blue-50 border-blue-200" },
  rejected: { label: "مرفوض", color: "text-red-700 bg-red-50 border-red-200" },
  expired:  { label: "منتهي", color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
  past_due: { label: "متأخر", color: "text-orange-700 bg-orange-50 border-orange-200" },
  canceled: { label: "ملغي", color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
};

// ============================================================
// ROW COMPONENT
// ============================================================
function SubscriptionRow({ sub }: { sub: SubscriptionRow }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isPending, startTransition] = useTransition();

  const config = STATUS_CONFIG[sub.status] ?? { label: sub.status, color: "text-muted-foreground bg-muted border-border" };
  const isTrialExpired = sub.status === "trialing" && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date();

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "—";

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveSubscription(sub.id, sub.store_id);
        toast.success(`تم تفعيل اشتراك ${sub.stores?.name}`);
      } catch (e: any) {
        toast.error(e.message ?? "حدث خطأ");
      }
    });
  }

  function handleReject() {
    if (!rejectNote.trim()) {
      toast.error("يرجى كتابة سبب الرفض");
      return;
    }
    startTransition(async () => {
      try {
        await rejectSubscription(sub.id, sub.store_id, rejectNote.trim());
        toast.success("تم رفض الطلب وإشعار التاجر");
        setShowRejectInput(false);
        setRejectNote("");
      } catch (e: any) {
        toast.error(e.message ?? "حدث خطأ");
      }
    });
  }

  function handleExtend(days: number) {
    startTransition(async () => {
      try {
        await extendTrial(sub.id, sub.store_id, days);
        toast.success(`تم تمديد التجربة ${days} أيام`);
      } catch (e: any) {
        toast.error(e.message ?? "حدث خطأ");
      }
    });
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Store className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0 text-right">
          <p className="font-semibold text-sm text-foreground truncate">
            {sub.stores?.name ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">{sub.packages?.name ?? "بدون باقة"}</p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(sub.created_at)}
        </div>

        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border", config.color)}>
          {sub.status === "pending" && <Loader2 className="h-3 w-3 animate-spin" />}
          {config.label}
        </span>

        {sub.payment_proof_url && (
          <span className="text-xs text-blue-600 flex items-center gap-1 shrink-0">
            <FileImage className="h-3.5 w-3.5" />
            إثبات
          </span>
        )}

        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {/* Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">تاريخ الإنشاء</p>
              <p className="font-medium text-foreground">{formatDate(sub.created_at)}</p>
            </div>
            {sub.trial_ends_at && (
              <div>
                <p className="text-muted-foreground mb-0.5">نهاية التجربة</p>
                <p className={cn("font-medium", isTrialExpired ? "text-red-600" : "text-foreground")}>
                  {formatDate(sub.trial_ends_at)}
                  {isTrialExpired && " (منتهية)"}
                </p>
              </div>
            )}
            {sub.current_period_end && (
              <div>
                <p className="text-muted-foreground mb-0.5">نهاية الاشتراك</p>
                <p className="font-medium text-foreground">{formatDate(sub.current_period_end)}</p>
              </div>
            )}
          </div>

          {/* Payment proof */}
          {sub.proofSignedUrl && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">إثبات الدفع:</p>
              <a
                href={sub.proofSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-primary hover:underline border border-primary/30 px-3 py-1.5 rounded-lg"
              >
                <Eye className="h-3.5 w-3.5" />
                عرض / تحميل الملف
              </a>
            </div>
          )}

          {/* Admin note */}
          {sub.admin_note && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <span className="font-semibold">ملاحظة المشرف: </span>
              {sub.admin_note}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Approve */}
            {sub.status === "pending" && (
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                تفعيل الاشتراك
              </button>
            )}

            {/* Reject */}
            {(sub.status === "pending" || sub.status === "trialing") && !showRejectInput && (
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                رفض
              </button>
            )}

            {/* Extend trial */}
            {(sub.status === "trialing" || sub.status === "expired") && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">تمديد:</span>
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleExtend(d)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    {d} يوم
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reject input */}
          {showRejectInput && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-foreground">سبب الرفض (سيظهر للتاجر):</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="مثال: الإيصال غير واضح، يرجى إعادة الإرسال بجودة أعلى"
                rows={3}
                className="w-full text-xs border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isPending || !rejectNote.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => { setShowRejectInput(false); setRejectNote(""); }}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN CLIENT
// ============================================================
export function SubscriptionsClient({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const pending = subscriptions.filter((s) => s.status === "pending");
  const others = subscriptions.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-cairo font-semibold text-blue-700 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            بانتظار المراجعة ({pending.length})
          </h2>
          {pending.map((sub) => (
            <SubscriptionRow key={sub.id} sub={sub} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          {pending.length > 0 && (
            <h2 className="text-sm font-cairo font-semibold text-muted-foreground">
              الاشتراكات الأخرى
            </h2>
          )}
          {others.map((sub) => (
            <SubscriptionRow key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
