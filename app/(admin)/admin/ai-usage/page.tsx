import { getAiUsageOverview } from "@/actions/admin";
import { Sparkles, Cpu, Store, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "استخدام الذكاء الاصطناعي | الإدارة",
};

const TYPE_LABELS: Record<string, string> = {
  product_name: "اسم المنتج",
  product_description: "وصف المنتج",
  homepage_content: "محتوى الصفحة الرئيسية",
  homepage_title: "عنوان الصفحة",
  homepage_description: "وصف الصفحة",
  about_us: "من نحن",
  return_policy: "سياسة الإرجاع",
  privacy_policy: "سياسة الخصوصية",
  terms_of_service: "شروط الاستخدام",
  social_ad_copy: "إعلان سوشيال",
  store_slogan: "شعار المتجر",
  category_description: "وصف التصنيف",
  product_seo_title: "SEO عنوان",
  product_seo_description: "SEO وصف",
  instagram_post: "منشور انستقرام",
  short_ad: "إعلان قصير",
  promo_message: "رسالة ترويجية",
  theme_config: "تكوين الثيم",
};

export default async function AdminAiUsagePage() {
  const data = await getAiUsageOverview();
  const usagePct = data.totalCreditsIssued > 0
    ? Math.round((data.totalCreditsUsed / data.totalCreditsIssued) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-cairo font-bold text-foreground">مراقبة الذكاء الاصطناعي</h1>
        <p className="text-sm text-muted-foreground mt-1">استخدام أرصدة AI عبر المنصة</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-2">إجمالي الأرصدة المستخدمة</p>
          <p className="text-2xl font-bold text-foreground font-numbers">{data.totalCreditsUsed.toLocaleString()}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">من أصل {data.totalCreditsIssued.toLocaleString()}</span>
              <span className="font-bold text-foreground">{usagePct}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-2">إجمالي الأرصدة المتوفرة</p>
          <p className="text-2xl font-bold text-foreground font-numbers">
            {(data.totalCreditsIssued - data.totalCreditsUsed).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">رصيد متبقٍّ في المنصة</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-2">إجمالي التوليدات</p>
          <p className="text-2xl font-bold text-foreground font-numbers">{data.totalGenerations.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">طلب توليد مكتمل</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-store usage table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-cairo font-bold text-foreground">الاستخدام حسب المتجر</h3>
          </div>
          {data.perStore.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">لا توجد بيانات</p>
          ) : (
            <div className="divide-y divide-border">
              {data.perStore.slice(0, 12).map((store, idx) => {
                const pct = store.creditsTotal > 0
                  ? Math.round((store.creditsUsed / store.creditsTotal) * 100)
                  : 0;
                const isHighUsage = pct > 80;
                return (
                  <div key={idx} className="px-6 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-cairo font-medium text-foreground truncate">
                        {store.storeName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-muted rounded-full max-w-24">
                          <div
                            className={`h-full rounded-full ${isHighUsage ? "bg-rose-500" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {store.creditsUsed}/{store.creditsTotal}
                        </span>
                      </div>
                    </div>
                    {isHighUsage && (
                      <span className="text-xs text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full shrink-0">
                        {pct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {data.perStore.length > 12 && (
            <div className="px-6 py-3 border-t border-border">
              <Link href="/admin/ai-credits" className="text-xs text-primary hover:underline flex items-center gap-1">
                عرض الكل في إدارة الأرصدة
                <ChevronLeft className="h-3 w-3 rtl-flip" />
              </Link>
            </div>
          )}
        </div>

        {/* By generation type */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-cairo font-bold text-foreground">الاستخدام حسب نوع التوليد</h3>
          </div>
          {data.byType.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">لا توجد توليدات بعد</p>
          ) : (
            <div className="divide-y divide-border">
              {data.byType.map(({ type, count }) => {
                const maxCount = data.byType[0]?.count ?? 1;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={type} className="px-6 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">
                        {TYPE_LABELS[type] ?? type}
                      </p>
                      <div className="mt-1 h-1 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-numbers font-bold text-foreground shrink-0 w-12 text-left">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
