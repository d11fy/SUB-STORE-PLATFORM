"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Calendar, CheckCircle, Users, Star, Award, TrendingUp, ArrowLeft } from "lucide-react";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps } from "./theme-types";

const SERVICE_ICONS = ["🎯", "💼", "🧠", "📈", "🎤", "✍️", "🌐", "🔑"];

const STEPS = [
  { num: "01", title: "احجز موعدك", desc: "اختر الخدمة المناسبة وأكّد حجزك بخطوات بسيطة." },
  { num: "02", title: "جلسة تعارف", desc: "نحدد أهدافك ونضع خطة مخصصة لك." },
  { num: "03", title: "التنفيذ والمتابعة", desc: "نعمل معاً وفق جدول منظم بنتائج قابلة للقياس." },
  { num: "04", title: "النتائج والتقييم", desc: "نراجع الإنجازات ونضع الخطوة التالية." },
];

const NUMBERS = [
  { value: "200+", label: "جلسة مكتملة" },
  { value: "98%", label: "رضا العملاء" },
  { value: "15+", label: "خدمة متخصصة" },
  { value: "5 ⭐", label: "متوسط التقييم" },
];

const TESTIMONIALS = [
  { quote: "كانت الجلسة الاستشارية نقطة تحول حقيقية في مسيرتي المهنية. التحليلات والنصائح عملية وقابلة للتطبيق فوراً.", name: "أحمد م.", role: "رائد أعمال" },
  { quote: "أسلوب رائع ومتابعة دقيقة طوال البرنامج التدريبي. ساعدني على تجاوز عقبات كانت تبدو مستحيلة.", name: "سارة خ.", role: "مصممة جرافيك" },
  { quote: "خمس نجوم لا تكفي. الدقة في المواعيد والاحترافية العالية جعلت التجربة استثماراً حقيقياً في نفسي.", name: "خالد ع.", role: "مهندس برمجيات" },
];

const TRUST_STATS = [
  { value: "150+", label: "عميل", icon: Users },
  { value: "4.9", label: "تقييم", icon: Star },
  { value: "5", label: "سنوات خبرة", icon: Award },
];

export default function PersonalServicesTheme({ store, categories, products, settings }: StorefrontThemeProps) {
  const slug = store.slug;

  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 6);
  const allServices = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 6);

  const heroTitle = settings.hero_title || "خبرتي في خدمتك — حقّق أهدافك بخطوات واضحة";
  const heroSubtitle =
    settings.hero_subtitle ||
    "مدرب ومستشار معتمد مع أكثر من خمس سنوات من مساعدة الأفراد والمؤسسات على الوصول إلى أفضل نسخة منهم.";
  const heroImage = settings.hero_image_url || store.cover_url || null;

  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["personal_services"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-background to-background border-b border-rose-100 py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-right order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold font-cairo">
              <span>✦</span>
              مدرب ومستشار معتمد
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground leading-tight font-cairo">{heroTitle}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl font-cairo">{heroSubtitle}</p>
            <div className="flex gap-3 justify-start flex-wrap pt-2">
              <a href="#services" className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-md font-cairo">
                <Calendar className="h-4 w-4" />
                احجز جلسة
              </a>
              <a href="#about" className="inline-flex items-center gap-2 px-6 py-3 bg-background border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-50 transition-all font-cairo">
                اعرف أكثر
              </a>
            </div>
            <div className="flex gap-6 pt-4 border-t border-rose-100 flex-wrap">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-rose-400" />
                  <div className="text-right">
                    <p className="text-base font-black text-foreground font-cairo leading-none">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground font-cairo">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-200 to-amber-100 p-1.5 scale-[1.04] opacity-60" />
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-background shadow-xl">
                {heroImage ? (
                  <img src={heroImage} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                    <span className="text-8xl font-black text-rose-200 font-cairo">{store.name.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    ),

    trust_badges: () => (
      <section className="bg-muted/30 border-y border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {NUMBERS.map((n) => (
              <div key={n.label} className="space-y-1">
                <p className="text-3xl font-black text-rose-600 font-cairo">{n.value}</p>
                <p className="text-xs text-muted-foreground font-cairo">{n.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    categories: () =>
      categories.length > 0 ? (
        <section className="py-10 space-y-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-right">
              <h2 className="text-xl font-black text-foreground font-cairo">مجالات عملي</h2>
              <p className="text-xs text-muted-foreground font-cairo mt-1">التخصصات التي أقدم فيها خدماتي</p>
            </div>
          </div>
          <div className="overflow-hidden marquee-pause">
            <div className="flex gap-3 w-max animate-marquee">
              {[...categories.slice(0, 8), ...categories.slice(0, 8)].map((category, idx) => {
                const base = categories.slice(0, 8).length;
                return (
                  <Link
                    key={`cat-${idx}`}
                    href={`/store/${slug}/category/${category.slug}`}
                    className="group flex-shrink-0 flex items-center gap-2.5 px-5 py-3 bg-card border border-border hover:border-rose-300 rounded-2xl text-xs font-bold text-muted-foreground hover:text-rose-600 transition-all duration-200 hover:shadow-md font-cairo whitespace-nowrap"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-200 leading-none">
                      {SERVICE_ICONS[(idx % base) % SERVICE_ICONS.length]}
                    </span>
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null,

    services_list: () =>
      allServices.length > 0 ? (
        <section id="services" className="py-16 bg-muted/20 border-y border-border">
          <div className="space-y-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-baseline justify-between border-b border-border pb-4">
              <Link href={`/store/${slug}/products`} className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors font-cairo flex items-center gap-1">
                شاهد كل الخدمات
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
              <div className="text-right">
                <h2 className="text-2xl font-black text-foreground font-cairo">الخدمات المتاحة للحجز</h2>
                <p className="text-xs text-muted-foreground font-cairo mt-0.5">اختر الخدمة المناسبة لأهدافك</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide snap-x snap-mandatory px-4 sm:px-6 lg:px-8">
              {allServices.map((product, idx) => {
                const hasDiscount = product.compare_price !== null && product.compare_price > product.price;
                return (
                  <div
                    key={product.id}
                    className="group flex-shrink-0 w-[260px] snap-start bg-card border border-border hover:border-rose-200 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                      {SERVICE_ICONS[idx % SERVICE_ICONS.length]}
                    </div>
                    <div className="text-right space-y-1.5 flex-1">
                      <h3 className="text-sm font-bold text-foreground font-cairo line-clamp-2 leading-snug">{product.name}</h3>
                      {product.short_description && (
                        <p className="text-xs text-muted-foreground font-cairo line-clamp-3 leading-relaxed">{product.short_description}</p>
                      )}
                    </div>
                    {(product as any).subscription_duration_value && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold font-cairo w-fit">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        مدة: {(product as any).subscription_duration_value} جلسات
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                      <Link
                        href={`/store/${slug}/product/${product.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all font-cairo"
                      >
                        احجز الآن
                      </Link>
                      <div className="text-right space-y-0.5">
                        <p className="text-base font-black text-rose-600 font-cairo">
                          {product.price.toLocaleString("ar-SA")} {store.currency}
                        </p>
                        {hasDiscount && (
                          <p className="text-[10px] text-muted-foreground line-through font-cairo">
                            {product.compare_price!.toLocaleString("ar-SA")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex-shrink-0 w-4 sm:w-6" aria-hidden="true" />
            </div>
          </div>
        </section>
      ) : null,

    testimonials: () => (
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-foreground font-cairo">آراء وتجارب المستفيدين</h2>
          <p className="text-xs text-muted-foreground font-cairo">قصص نجاح حقيقية من عملائنا</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} quote={t.quote} name={t.name} role={t.role} rating={5} accentColor="rose" />
          ))}
        </div>
      </section>
    ),

    about_text: () => (
      <section id="about" className="py-16 bg-muted/20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-foreground font-cairo">كيف نعمل معاً</h2>
            <p className="text-xs text-muted-foreground font-cairo">مسار واضح من أول خطوة حتى الوصول للهدف</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div key={step.num} className="relative text-right space-y-3">
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-0 w-full h-px bg-rose-100 -translate-x-1/2" />
                )}
                <div className="relative">
                  <span className="text-6xl font-black text-rose-100 font-cairo leading-none select-none">{step.num}</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-foreground font-cairo">{step.title}</h3>
                  <p className="text-xs text-muted-foreground font-cairo leading-relaxed">{step.desc}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-rose-300" />
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    promo_banner: () => (
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-10 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto">
            <TrendingUp className="h-7 w-7 text-rose-600" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground font-cairo leading-tight">هل أنت مستعد لخطوتك القادمة؟</h2>
            <p className="text-muted-foreground text-sm font-cairo leading-relaxed">
              لا تؤجّل نجاحك. احجز جلستك الأولى اليوم وابدأ رحلة التحوّل الحقيقي.
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="#services" className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all shadow-md font-cairo">
              <Calendar className="h-4 w-4" />
              احجز جلستك الآن
            </a>
            <Link href={`/store/${slug}/products`} className="inline-flex items-center gap-2 px-8 py-3.5 bg-background border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-50 transition-all font-cairo">
              تصفح كل الخدمات
            </Link>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="bg-background text-foreground" dir="rtl">
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
