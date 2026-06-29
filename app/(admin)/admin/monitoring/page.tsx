import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  CreditCard,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { getMonitoringSnapshot } from "@/actions/monitoring";
import { MonitoringRefresh } from "@/components/admin/monitoring-refresh";

export const dynamic = "force-dynamic";

// ── Helpers ────────────────────────────────────────────────────────────────────

const ILS = (n: number) =>
  `₪${n.toLocaleString("ar-SA", { maximumFractionDigits: 0 })}`;

const PCT = (used: number, total: number) =>
  total > 0 ? Math.round((used / total) * 100) : 0;

function StatusPill({ suspended, pending, errorRate }: {
  suspended: number;
  pending: number;
  errorRate: number;
}) {
  const isError   = suspended > 3 || errorRate > 10;
  const isWarning = suspended > 0 || pending > 5 || errorRate > 5;

  const { bg, dot, text, label } = isError
    ? { bg: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-700", label: "تنبيهات حرجة" }
    : isWarning
    ? { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-700", label: "تحقق مطلوب" }
    : { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "النظام سليم" };

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dot}`} />
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone?: "healthy" | "warn" | "critical" | "info" | "neutral";
}) {
  const tones = {
    healthy:  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-600" },
    warn:     { bg: "bg-amber-50 border-amber-200",     text: "text-amber-600"  },
    critical: { bg: "bg-red-50 border-red-200",         text: "text-red-600"    },
    info:     { bg: "bg-primary/5 border-primary/20",   text: "text-primary"    },
    neutral:  { bg: "bg-muted/30 border-border",        text: "text-muted-foreground" },
  };
  const { bg, text } = tones[tone];

  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground leading-snug">{label}</p>
        <Icon className={`h-4 w-4 ${text}`} />
      </div>
      <p className={`text-2xl font-black ${text}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-1.5 rounded-full bg-muted overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

const AI_LABELS: Record<string, string> = {
  product_name:         "اسم منتج",
  product_description:  "وصف منتج",
  homepage_content:     "محتوى رئيسية",
  about_us:             "من نحن",
  store_slogan:         "شعار متجر",
  social_ad_copy:       "إعلان تواصل",
  instagram_post:       "منشور إنستغرام",
  short_ad:             "إعلان قصير",
  promo_message:        "رسالة ترويجية",
  return_policy:        "سياسة الإرجاع",
  privacy_policy:       "سياسة الخصوصية",
  terms_of_service:     "شروط الخدمة",
  category_description: "وصف فئة",
  product_seo_title:    "SEO عنوان",
  product_seo_description: "SEO وصف",
  homepage_title:       "عنوان رئيسية",
  homepage_description: "وصف رئيسية",
  theme_config:         "إعداد ثيم",
};

const STORE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:    { label: "نشط",    cls: "bg-emerald-100 text-emerald-700" },
  trial:     { label: "تجربة",  cls: "bg-amber-100 text-amber-700"    },
  suspended: { label: "موقوف",  cls: "bg-red-100 text-red-700"        },
  expired:   { label: "منتهي",  cls: "bg-red-100 text-red-700"        },
  pending:   { label: "معلق",   cls: "bg-slate-100 text-slate-600"    },
};

const ERR_CATEGORY_LABELS = {
  ai_error:         { label: "خطأ AI",      cls: "bg-violet-100 text-violet-700" },
  payment_rejected: { label: "دفعة مرفوضة", cls: "bg-orange-100 text-orange-700" },
  admin_action:     { label: "إجراء إداري", cls: "bg-slate-100 text-slate-600"   },
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)   return "الآن";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} د`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} س`;
  return new Date(iso).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function MonitoringPage() {
  const d = await getMonitoringSnapshot();
  const h = d.systemHealth;
  const ai = d.aiUsage;
  const rev = d.revenue;

  const storeHealthPct = PCT(h.storesActive, h.storesTotal);
  const creditUsagePct = PCT(ai.creditsUsed, ai.creditsIssued);

  const healthTone = (n: number, warnAt: number, critAt: number) =>
    n >= critAt ? "critical" : n >= warnAt ? "warn" : "neutral";

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5 font-cairo" dir="rtl">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">مراقبة المنصة</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            لوحة المراقبة الداخلية · تحديث كل دقيقة
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusPill
            suspended={h.storesSuspended}
            pending={h.pendingPaymentRequests}
            errorRate={ai.errorRate}
          />
          <MonitoringRefresh fetchedAt={d.fetchedAt} />
        </div>
      </div>

      {/* ── Section 1: System Health ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          صحة النظام
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="متاجر نشطة"
            value={`${h.storesActive}/${h.storesTotal}`}
            sub={`${storeHealthPct}% معدل النشاط`}
            icon={Store}
            tone={storeHealthPct >= 80 ? "healthy" : storeHealthPct >= 50 ? "warn" : "critical"}
          />
          <StatCard
            label="اشتراكات فعّالة"
            value={h.subscriptionsActive}
            sub={h.subscriptionsPending > 0 ? `${h.subscriptionsPending} بانتظار موافقة` : "لا يوجد معلق"}
            icon={CreditCard}
            tone={h.subscriptionsPending > 0 ? "warn" : "info"}
          />
          <StatCard
            label="طلبات آخر 24 س"
            value={h.orders24h}
            sub={`${h.ordersTotal.toLocaleString("ar-SA")} إجمالي`}
            icon={ShoppingBag}
            tone="info"
          />
          <StatCard
            label="متاجر موقوفة"
            value={h.storesSuspended}
            sub={`${h.storesTrial} في طور تجربة`}
            icon={AlertTriangle}
            tone={healthTone(h.storesSuspended, 1, 4)}
          />
          <StatCard
            label="تجارب تنتهي خلال 7 أيام"
            value={h.trialsExpiringIn7d}
            sub="يحتاجون تجديد"
            icon={Zap}
            tone={healthTone(h.trialsExpiringIn7d, 3, 10)}
          />
          <StatCard
            label="طلبات دفع معلقة"
            value={h.pendingPaymentRequests}
            sub={`${h.usersTotal.toLocaleString("ar-SA")} مستخدم`}
            icon={Users}
            tone={healthTone(h.pendingPaymentRequests, 3, 10)}
          />
        </div>
      </section>

      {/* ── Section 2: Revenue Overview ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          نظرة إيرادية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* MRR card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">MRR — الإيراد الشهري المتكرر</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-700">{ILS(rev.mrr)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ARR: <span className="font-semibold text-foreground">{ILS(rev.arr)}</span>
              {" · "}
              {rev.activeSubscriptions} مشترك فعّال
            </p>
            {/* Package breakdown */}
            {rev.byPackage.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-emerald-200 pt-3">
                {rev.byPackage
                  .sort((a, b) => b.mrr - a.mrr)
                  .map((pkg) => (
                  <div key={pkg.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{pkg.name}</span>
                    <span className="font-medium text-foreground">
                      {pkg.count} × {ILS(pkg.mrr / (pkg.count || 1))} = {ILS(pkg.mrr)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GMV 7 days */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">حجم مبيعات آخر 7 أيام</span>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{ILS(rev.gmv7d)}</p>
            <p className="text-xs text-muted-foreground mt-1">GMV من الطلبات المكتملة والمؤكدة</p>
            <div className="mt-3">
              <MiniBar value={rev.gmv7d} max={rev.gmv30d} />
              <p className="text-xs text-muted-foreground mt-1">
                {PCT(rev.gmv7d, rev.gmv30d)}% من إيراد الـ 30 يوماً
              </p>
            </div>
          </div>

          {/* GMV 30 days */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">حجم مبيعات آخر 30 يوم</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-black text-foreground">{ILS(rev.gmv30d)}</p>
            <p className="text-xs text-muted-foreground mt-1">GMV الإجمالي للفترة</p>
            {d.storeActivity.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                من {d.storeActivity.length} متجر ناشط
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 3: Store Activity ─────────────────────────────────────────── */}
      <section>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">أكثر المتاجر نشاطاً (آخر 30 يوم)</h2>
            <span className="mr-auto text-xs text-muted-foreground">
              {d.storeActivity.length} متجر
            </span>
          </div>

          {d.storeActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد طلبات خلال الـ 30 يوماً الماضية</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-right">
                    <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">المتجر</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">الحالة</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-center">الطلبات</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">الإيراد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.storeActivity.map((s, i) => {
                    const maxRev = d.storeActivity[0].revenue;
                    const status = STORE_STATUS_LABELS[s.storeStatus] ?? { label: s.storeStatus, cls: "bg-slate-100 text-slate-600" };
                    return (
                      <tr key={s.storeId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-5 text-center">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium text-foreground text-sm">{s.storeName}</p>
                              <p className="text-xs text-muted-foreground">{s.storeSlug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-foreground">{s.orderCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <MiniBar value={s.revenue} max={maxRev} className="w-16" />
                            <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                              {ILS(s.revenue)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: AI Usage ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          استخدام الذكاء الاصطناعي
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* AI stats row */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="رصيد مُصدَر"
                value={ai.creditsIssued.toLocaleString("ar-SA")}
                sub={`${ai.creditsUsed.toLocaleString("ar-SA")} مستخدَم`}
                icon={Bot}
                tone="info"
              />
              <StatCard
                label="توليدات آخر 24 س"
                value={ai.generations24h}
                sub={`${ai.errors24h} خطأ · ${ai.errorRate}% معدل الخطأ`}
                icon={Activity}
                tone={
                  ai.errorRate >= 10 ? "critical" :
                  ai.errorRate >= 5  ? "warn"     : "neutral"
                }
              />
            </div>

            {/* Credit usage bar */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">استخدام الرصيد الكلي</span>
                <span className="text-xs font-bold text-foreground">{creditUsagePct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    creditUsagePct >= 90 ? "bg-red-500" :
                    creditUsagePct >= 70 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${creditUsagePct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>{ai.creditsUsed.toLocaleString("ar-SA")} مستخدَم</span>
                <span>{ai.creditsIssued.toLocaleString("ar-SA")} إجمالي</span>
              </div>
            </div>
          </div>

          {/* AI type breakdown */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-foreground">توزيع أنواع التوليد (7 أيام)</p>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            {ai.byType.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>
            ) : (
              <div className="space-y-2.5">
                {ai.byType.map(({ type, count }) => {
                  const maxCount = ai.byType[0].count;
                  const pct = PCT(count, maxCount);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right">
                        {AI_LABELS[type] ?? type}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-8 text-left shrink-0">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 5: Error & Activity Log ──────────────────────────────────── */}
      <section>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">سجل الأخطاء والإجراءات (آخر 48 ساعة)</h2>
            <span className="mr-auto text-xs text-muted-foreground">{d.errorLog.length} حدث</span>
          </div>

          {d.errorLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-foreground">لا أخطاء في الـ 48 ساعة الماضية</p>
              <p className="text-xs text-muted-foreground mt-1">المنصة تعمل بشكل طبيعي</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {d.errorLog.map((entry) => {
                const cat = ERR_CATEGORY_LABELS[entry.category];
                const isError = entry.category === "ai_error";
                return (
                  <div key={`${entry.category}-${entry.id}`} className="px-5 py-3 flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isError ? "bg-red-100" : "bg-muted"
                    }`}>
                      {isError
                        ? <XCircle className="h-3.5 w-3.5 text-red-600" />
                        : <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${cat.cls}`}>
                          {cat.label}
                        </span>
                        <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                      </div>
                      {entry.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.detail}</p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                      {relTime(entry.timestamp)}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
