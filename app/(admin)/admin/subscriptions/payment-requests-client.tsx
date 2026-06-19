"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, Loader2, Eye, ChevronDown,
  FileImage, Search, Filter, ChevronLeft, ChevronRight,
  Store, Calendar, CreditCard, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { approvePaymentRequest, rejectPaymentRequest } from "@/actions/payment-requests";
import { extendTrial } from "@/actions/admin";

// ============================================================
// STATUS BADGE
// ============================================================
const STATUS = {
  pending:  { label: "قيد المراجعة", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  approved: { label: "مُوافَق عليه", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  rejected: { label: "مرفوض",        cls: "text-red-700 bg-red-50 border-red-200" },
  trialing: { label: "تجريبي",       cls: "text-blue-700 bg-blue-50 border-blue-200" },
  active:   { label: "نشط",          cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  expired:  { label: "منتهي",        cls: "text-zinc-600 bg-zinc-50 border-zinc-200" },
  suspended:{ label: "موقوف",        cls: "text-red-700 bg-red-50 border-red-200" },
} as const;

function Badge({ status }: { status: string }) {
  const cfg = STATUS[status as keyof typeof STATUS] ?? { label: status, cls: "text-muted-foreground bg-muted border-border" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", cfg.cls)}>
      {status === "pending" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {cfg.label}
    </span>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

// ============================================================
// PAYMENT REQUEST ROW
// ============================================================
function RequestRow({ req }: { req: any }) {
  const [open, setOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const store = req.stores;

  function handleApprove() {
    startTransition(async () => {
      const r = await approvePaymentRequest(req.id, req.store_id);
      if (r.success) toast.success(`تم تفعيل اشتراك ${store?.name}`);
      else toast.error(r.error ?? "حدث خطأ");
    });
  }

  function handleReject() {
    if (!rejectNote.trim()) { toast.error("أدخل سبب الرفض"); return; }
    startTransition(async () => {
      const r = await rejectPaymentRequest(req.id, req.store_id, rejectNote.trim());
      if (r.success) { toast.success("تم رفض الطلب"); setShowRejectForm(false); setRejectNote(""); }
      else toast.error(r.error ?? "حدث خطأ");
    });
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      {/* Summary row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-right hover:bg-slate-50/80 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="font-semibold text-sm text-foreground truncate">{store?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {req.plan} • {req.transaction_number ? `رقم العملية: ${req.transaction_number}` : "بدون رقم عملية"}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {fmtDate(req.created_at)}
        </div>
        <Badge status={req.status} />
        {req.receiptSignedUrl && (
          <span className="text-xs text-blue-600 flex items-center gap-1 shrink-0">
            <FileImage className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border p-5 space-y-4 bg-slate-50/50">
          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">المتجر</p>
              <p className="font-medium">{store?.name}</p>
              {store?.email && <p className="text-xs text-muted-foreground">{store.email}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">الباقة المطلوبة</p>
              <p className="font-medium capitalize">{req.plan}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الطلب</p>
              <p className="font-medium">{fmtDate(req.created_at)}</p>
            </div>
            {req.transaction_number && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">رقم العملية</p>
                <p className="font-mono font-medium text-sm">{req.transaction_number}</p>
              </div>
            )}
            {req.amount && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">المبلغ</p>
                <p className="font-medium">{req.amount} {req.currency}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {req.notes && (
            <div className="p-3 rounded-lg bg-white border border-border text-sm">
              <p className="text-xs font-semibold text-muted-foreground mb-1">ملاحظات التاجر:</p>
              <p className="text-foreground">{req.notes}</p>
            </div>
          )}

          {/* Admin note (rejection reason) */}
          {req.admin_note && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <p className="text-xs font-semibold mb-1">سبب الرفض:</p>
              <p>{req.admin_note}</p>
            </div>
          )}

          {/* Receipt */}
          {req.receiptSignedUrl && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">إثبات الدفع:</p>
              <div className="flex items-center gap-3">
                <a
                  href={req.receiptSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  فتح الإيصال
                </a>
                {/* If image — show inline preview */}
                {req.receipt_url?.match(/\.(jpg|jpeg|png|webp)$/i) && (
                  <a href={req.receiptSignedUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={req.receiptSignedUrl}
                      alt="إيصال"
                      className="h-16 w-16 object-cover rounded-lg border border-border"
                    />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {req.status === "pending" && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                قبول وتفعيل
              </button>
              {!showRejectForm && (
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  رفض
                </button>
              )}
            </div>
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <label className="text-sm font-semibold text-red-800">سبب الرفض (يُرسل للتاجر بالبريد):</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="مثال: الإيصال غير واضح — أعد الإرسال بجودة أعلى"
                rows={3}
                className="w-full text-sm border border-red-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isPending || !rejectNote.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => { setShowRejectForm(false); setRejectNote(""); }}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
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
// SUBSCRIPTION ROW (existing subscriptions tab)
// ============================================================
function SubscriptionRow({ sub }: { sub: any }) {
  const [isPending, startTransition] = useTransition();

  function handleExtend(days: number) {
    startTransition(async () => {
      try {
        await extendTrial(sub.id, sub.store_id, days);
        toast.success(`تم تمديد التجربة ${days} أيام`);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 p-4 border border-border rounded-xl bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Crown className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{sub.stores?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{sub.packages?.name ?? "بدون باقة"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge status={sub.status} />
        {(sub.status === "trialing" || sub.status === "expired") && (
          <div className="flex gap-1">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => handleExtend(d)}
                disabled={isPending}
                className="px-2 py-1 rounded-md border border-border text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : `+${d}d`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN CLIENT
// ============================================================
interface Props {
  requests: any[];
  subscriptions: any[];
  totalCount: number;
  currentPage: number;
  statusFilter: string;
  search: string;
  tab: string;
}

export function PaymentRequestsClient({ requests, subscriptions, totalCount, currentPage, statusFilter, search, tab }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ page: String(currentPage), status: statusFilter, q: search, tab, ...params });
    router.push(`${pathname}?${sp.toString()}`);
  }

  const pendingReqs = requests.filter((r) => r.status === "pending");
  const otherReqs = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: "requests", label: "طلبات الدفع" },
          { key: "subscriptions", label: "الاشتراكات" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => navigate({ tab: t.key, page: "1" })}
            className={cn(
              "px-5 py-3 text-sm font-medium border-b-2 transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (requests tab) */}
      {tab === "requests" && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              defaultValue={search}
              onChange={(e) => navigate({ q: e.target.value, page: "1" })}
              placeholder="بحث برقم العملية..."
              className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => navigate({ status: s, page: "1" })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                {{ all: "الكل", pending: "قيد المراجعة", approved: "مُوافَق", rejected: "مرفوض" }[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {tab === "requests" ? (
        <div className="space-y-4">
          {pendingReqs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                بانتظار المراجعة ({pendingReqs.length})
              </h3>
              {pendingReqs.map((r) => <RequestRow key={r.id} req={r} />)}
            </div>
          )}
          {otherReqs.length > 0 && (
            <div className="space-y-3">
              {pendingReqs.length > 0 && <h3 className="text-sm font-semibold text-muted-foreground">طلبات سابقة</h3>}
              {otherReqs.map((r) => <RequestRow key={r.id} req={r} />)}
            </div>
          )}
          {requests.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">لا توجد طلبات دفع</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {totalCount} طلب — صفحة {currentPage} من {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => navigate({ page: String(currentPage - 1) })}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate({ page: String(currentPage + 1) })}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Crown className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">لا توجد اشتراكات</p>
            </div>
          ) : (
            subscriptions.map((sub: any) => <SubscriptionRow key={sub.id} sub={sub} />)
          )}
        </div>
      )}
    </div>
  );
}
