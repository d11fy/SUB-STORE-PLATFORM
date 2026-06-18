"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  Zap,
  Shield,
  Headphones,
  Globe,
  BarChart2,
  Lock,
  Check,
  Minus,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps } from "./theme-types";

const BENEFITS = [
  { icon: Zap, iconBg: "bg-violet-50", iconColor: "text-violet-600", title: "تفعيل فوري بعد الدفع", desc: "يُفعَّل اشتراكك تلقائياً في ثوانٍ بمجرد إتمام عملية الدفع. لا انتظار ولا مراسلات يدوية." },
  { icon: Shield, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", title: "ضمان كامل طوال الفترة", desc: "نضمن استمرار خدمتك دون انقطاع. في حال أي عطل نعوّضك فوراً أو نُجدد اشتراكك مجاناً." },
  { icon: Headphones, iconBg: "bg-sky-50", iconColor: "text-sky-600", title: "دعم بشري مباشر", desc: "فريق دعم متخصص عبر الواتساب والبريد — يجيب في دقائق لا ساعات." },
  { icon: Globe, iconBg: "bg-amber-50", iconColor: "text-amber-600", title: "يعمل من أي مكان", desc: "اشتراكاتنا تعمل من فلسطين والأردن وسائر الدول العربية بدون قيود جغرافية." },
  { icon: BarChart2, iconBg: "bg-rose-50", iconColor: "text-rose-600", title: "تقارير وإحصاءات لحظية", desc: "تابع استهلاكك ونشاطك عبر لوحة تحكم واضحة ومحدثة في الوقت الفعلي." },
  { icon: Lock, iconBg: "bg-violet-50", iconColor: "text-violet-600", title: "بيانات مشفرة وآمنة", desc: "تشفير من طرف لطرف يحمي حسابك وبياناتك. نحن لا نشارك معلوماتك مع أي طرف ثالث." },
];

const COMPARISON_FEATURES = [
  { label: "التفعيل الفوري" },
  { label: "ضمان الاستمرارية" },
  { label: "دعم فني عبر الواتساب" },
  { label: "دعم VIP أولوية قصوى" },
  { label: "إحصاءات وتقارير" },
  { label: "مستخدمين متعددين" },
  { label: "API وتكاملات" },
];

const PLAN_FEATURES: boolean[][] = [
  [true, false, false],
  [true, true, true],
  [true, true, true],
  [false, false, true],
  [false, true, true],
  [false, false, true],
  [false, false, true],
];

const TESTIMONIALS = [
  { quote: "خدمة احترافية من أول يوم. الاشتراك اشتغل فوراً والدعم رد خلال دقيقتين. ما توقعت هالمستوى.", name: "أحمد السيد", role: "مدير مشاريع — عمّان" },
  { quote: "جربت خدمات كثيرة وهذه الأفضل بفارق كبير. السعر منافس والجودة ما تُقارن.", name: "فاطمة النمر", role: "مصممة جرافيك — رام الله" },
  { quote: "الضمان الحقيقي هو اللي خلاني أختار هذه الخدمة. اشتريت وارتحت — بس كده.", name: "محمد الخالد", role: "رائد أعمال — الخليل" },
];

export default function SubscriptionsTheme({ store, products, settings }: StorefrontThemeProps) {
  const currency = store.currency;
  const slug = store.slug;

  const plans = products.slice(0, 3);
  const featuredIndex = plans.findIndex((p) => p.is_featured);
  const highlightIndex = featuredIndex >= 0 ? featuredIndex : Math.min(1, plans.length - 1);

  const planNames =
    plans.length >= 3
      ? plans.map((p) => p.name)
      : ["أساسي", "متقدم", "احترافي"];

  const heroTitle = settings.hero_title || "كل أدواتك في اشتراك واحد";
  const heroSubtitle =
    settings.hero_subtitle ||
    "اشتراكات رقمية مضمونة للأفراد والشركات — تُفعَّل فوراً وتدعمك طوال الطريق.";

  function formatDuration(value: number | null, unit: string | null): string {
    if (!value || !unit) return "/ شهر";
    const unitMap: Record<string, string> = {
      day: "يوم", days: "يوم",
      week: "أسبوع", weeks: "أسبوع",
      month: "شهر", months: "شهر",
      year: "سنة", years: "سنة",
    };
    const label = unitMap[unit.toLowerCase()] ?? unit;
    return value === 1 ? `/ ${label}` : `/ ${value} ${label}`;
  }

  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["subscriptions"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-violet-950/30 to-slate-900 py-24 px-4 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-semibold font-cairo">
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            500+ مشترك نشط يثقون بنا اليوم
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight font-cairo">{heroTitle}</h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-cairo">{heroSubtitle}</p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a href="#pricing" className="inline-flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-violet-900/40 font-cairo">
              ابدأ الآن
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </a>
            <a href="#benefits" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-bold rounded-xl transition-all font-cairo">
              شاهد المميزات
            </a>
          </div>
          <div className="pt-4 flex flex-wrap justify-center gap-5 text-slate-400 text-xs font-cairo">
            {["بدون إلزام", "إلغاء في أي وقت", "دعم مباشر"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    ),

    trust_badges: () => (
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground font-cairo">لماذا تختار اشتراكاتنا؟</h2>
          <p className="text-muted-foreground text-sm font-cairo">مزايا مُصمَّمة لتمنحك راحة البال وأقصى إنتاجية</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-card border border-border shadow-sm rounded-2xl p-6 space-y-4 text-right hover:border-violet-200 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${b.iconBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${b.iconColor}`} />
                </div>
                <h3 className="text-sm font-bold text-foreground font-cairo">{b.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-cairo">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    ),

    pricing_cards: () => (
      <div className="space-y-0">
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground font-cairo">الباقات والأسعار</h2>
            <p className="text-muted-foreground text-sm font-cairo">اختر الباقة المناسبة — يمكنك الترقية أو الإلغاء في أي وقت</p>
          </div>
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {plans.map((product, idx) => {
                const isHighlight = idx === highlightIndex;
                const duration = formatDuration(
                  (product as any).subscription_duration_value ?? null,
                  (product as any).subscription_duration_unit ?? null
                );
                const features = [
                  "تفعيل فوري بعد الدفع",
                  "ضمان الاستمرارية الكاملة",
                  "دعم فني عبر الواتساب",
                  ...(isHighlight ? ["أولوية دعم VIP", "إحصاءات مفصلة"] : []),
                ];
                return (
                  <div
                    key={product.id}
                    className={`relative bg-card rounded-3xl p-8 flex flex-col gap-6 transition-all ${
                      isHighlight
                        ? "border-2 border-violet-400 shadow-xl shadow-violet-100 scale-105"
                        : "border border-border hover:border-violet-200 shadow-sm"
                    }`}
                  >
                    {isHighlight && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-full shadow font-cairo">الأكثر شيوعاً</span>
                      </div>
                    )}
                    <div className="text-right space-y-1">
                      <h3 className="text-lg font-black text-foreground font-cairo">{product.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1 justify-end" dir="ltr">
                        <span className="text-3xl font-black text-foreground">{product.price.toLocaleString("ar-SA")}</span>
                        <span className="text-sm font-bold text-muted-foreground">{currency}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-cairo">{duration}</span>
                      {product.compare_price != null && product.compare_price > product.price && (
                        <p className="text-xs text-muted-foreground line-through mt-0.5 font-cairo">
                          {product.compare_price.toLocaleString("ar-SA")} {currency}
                        </p>
                      )}
                    </div>
                    {(product.short_description || product.description) && (
                      <p className="text-xs text-muted-foreground text-right leading-relaxed font-cairo line-clamp-2">
                        {product.short_description ?? product.description}
                      </p>
                    )}
                    <ul className="space-y-2.5 border-t border-border pt-5 flex-1">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 justify-end text-xs text-foreground font-cairo">
                          <span>{f}</span>
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/store/${slug}/product/${product.slug}`}
                      className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all font-cairo ${
                        isHighlight
                          ? "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-200"
                          : "bg-muted border border-border hover:bg-muted/70 text-foreground"
                      }`}
                    >
                      اشترك الآن
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {(
                [
                  { name: "أساسي", price: "49", highlight: false },
                  { name: "متقدم", price: "99", highlight: true },
                  { name: "احترافي", price: "199", highlight: false },
                ] as const
              ).map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-card rounded-3xl p-8 flex flex-col gap-6 transition-all ${
                    plan.highlight ? "border-2 border-violet-400 shadow-xl scale-105" : "border border-border shadow-sm"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-full font-cairo">الأكثر شيوعاً</span>
                    </div>
                  )}
                  <h3 className="text-lg font-black text-foreground text-right font-cairo">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 justify-end" dir="ltr">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                    <span className="text-sm font-bold text-muted-foreground">{currency}</span>
                  </div>
                  <ul className="space-y-2.5 border-t border-border pt-5">
                    {["تفعيل فوري", "ضمان كامل", "دعم مباشر"].map((f) => (
                      <li key={f} className="flex items-center gap-2 justify-end text-xs font-cairo">
                        <span>{f}</span>
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/store/${slug}/products`}
                    className={`w-full py-3 rounded-xl text-sm font-bold text-center font-cairo ${
                      plan.highlight ? "bg-violet-600 text-white hover:bg-violet-500" : "bg-muted border border-border text-foreground hover:bg-muted/70"
                    }`}
                  >
                    اشترك الآن
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground font-cairo">مقارنة الباقات</h2>
            <p className="text-muted-foreground text-xs font-cairo">شفافية كاملة — تعرف بالضبط ما تحصل عليه في كل باقة</p>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full min-w-[420px] text-xs" dir="rtl">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="p-4 text-right font-bold text-foreground font-cairo">الميزة</th>
                  {planNames.map((name) => (
                    <th key={name} className="p-4 text-center font-bold text-foreground font-cairo">{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_FEATURES.map((feature, fi) => (
                  <tr key={feature.label} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4 text-foreground font-medium font-cairo">{feature.label}</td>
                    {(PLAN_FEATURES[fi] ?? [false, false, false]).map((has, ci) => (
                      <td key={ci} className="p-4 text-center">
                        {has ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),

    testimonials: () => (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground font-cairo">ماذا يقول عملاؤنا</h2>
          <p className="text-muted-foreground text-xs font-cairo">آراء حقيقية من مشتركين فعليين</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} quote={t.quote} name={t.name} role={t.role} rating={5} accentColor="violet" />
          ))}
        </div>
      </section>
    ),

    promo_banner: () => (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-violet-50 border border-violet-100 rounded-3xl py-14 px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground font-cairo">ابدأ اشتراكك اليوم</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto font-cairo">
            انضم إلى أكثر من 500 مشترك نشط. لا بطاقة ائتمان مطلوبة للبداية.
          </p>
          <Link
            href={`/store/${slug}/products`}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-violet-200 font-cairo"
          >
            استعرض الباقات
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <p className="text-[10px] text-muted-foreground font-cairo">
            ✓ بدون إلزام &nbsp;&nbsp; ✓ إلغاء في أي وقت &nbsp;&nbsp; ✓ دعم مباشر
          </p>
        </div>
      </section>
    ),
  };

  return (
    <div className="pb-24 bg-background text-foreground" dir="rtl">
      {orderedSections.map((section) => {
        const render = sectionRenderers[section.type];
        if (!render) return null;
        const node = render();
        if (node === null || node === undefined) return null;
        return <Fragment key={section.id}>{node}</Fragment>;
      })}
    </div>
  );
}
