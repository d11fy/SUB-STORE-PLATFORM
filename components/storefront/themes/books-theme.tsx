"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  Download,
  BookOpen,
  FileText,
  Video,
  Layers,
  ArrowLeft,
  Search,
} from "lucide-react";
import { ProductCard } from "@/app/store/[slug]/components/product-card";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps, ProductWithImages } from "./theme-types";

const GENRE_ICONS = [BookOpen, FileText, Video, Layers, Download, BookOpen];

const TESTIMONIALS = [
  {
    quote: "أفضل مكتبة رقمية جربتها. التنزيل فوري والمحتوى احترافي جداً. استثمار حقيقي في نفسي.",
    name: "سارة م.",
    role: "مديرة تسويق — رام الله",
  },
  {
    quote: "كورسات تغيّر الحياة بسعر في متناول الجميع. أنصح كل شخص يريد التطوير المهني.",
    name: "يوسف ع.",
    role: "مهندس برمجيات — عمّان",
  },
  {
    quote: "القوالب والكتب ساعدتني على إطلاق مشروعي في أسبوعين. خدمة ممتازة ودعم سريع.",
    name: "هند ك.",
    role: "رائدة أعمال — نابلس",
  },
];

function getFileTypeBadge(product: ProductWithImages): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  if (product.is_digital) {
    return { label: "ملف رقمي", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  }
  return { label: "كتاب ورقي", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
}

interface BookCardProps {
  product: ProductWithImages;
  slug: string;
  currency: string;
}

function BookCard({ product, slug, currency }: BookCardProps) {
  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ??
    product.product_images?.[0]?.url ??
    null;
  const badge = getFileTypeBadge(product);
  const authorTag = product.tags.length > 0 ? product.tags[0] : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:border-amber-300 hover:shadow-md transition-all group">
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {primaryImage ? (
          <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-amber-50">
            <BookOpen className="h-12 w-12 text-amber-200" />
          </div>
        )}
        <span className={`absolute top-2 start-2 px-2 py-0.5 rounded-md text-[9px] font-bold border ${badge.bg} ${badge.text} ${badge.border} font-cairo`}>
          {badge.label}
        </span>
        {product.compare_price != null && product.compare_price > product.price && (
          <span className="absolute top-2 end-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-600 text-white font-cairo">
            خصم
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {authorTag && <p className="text-[10px] text-amber-600 font-bold font-cairo text-right">{authorTag}</p>}
        <h3 className="text-sm font-bold text-foreground text-right line-clamp-2 font-cairo leading-snug">{product.name}</h3>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <Link
            href={`/store/${slug}/product/${product.slug}`}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg transition-all font-cairo"
          >
            اطلب الآن
          </Link>
          <div className="text-right">
            <p className="text-sm font-black text-amber-600 font-cairo">
              {product.price.toLocaleString("ar-SA")}{" "}
              <span className="text-[10px] font-bold text-muted-foreground">{currency}</span>
            </p>
            {product.compare_price != null && product.compare_price > product.price && (
              <p className="text-[9px] text-muted-foreground line-through font-cairo">
                {product.compare_price.toLocaleString("ar-SA")} {currency}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BooksTheme({ store, categories, products, settings }: StorefrontThemeProps) {
  const currency = store.currency;
  const slug = store.slug;

  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 4);
  const newReleases = products.slice(0, 4);
  const allProducts = products.slice(4);

  const heroTitle = settings.hero_title || "مكتبتك الرقمية في مكان واحد";
  const heroSubtitle =
    settings.hero_subtitle ||
    "آلاف الكتب الإلكترونية، الكورسات، والقوالب الاحترافية — تحميل فوري بعد الشراء مباشرة.";

  const heroPills =
    categories.length > 0
      ? categories.slice(0, 4).map((c) => ({ label: c.name, href: `/store/${slug}/category/${c.slug}` }))
      : [
          { label: "الكتب", href: `/store/${slug}/products` },
          { label: "الدورات", href: `/store/${slug}/products` },
          { label: "القوالب", href: `/store/${slug}/products` },
          { label: "ملفات PDF", href: `/store/${slug}/products` },
        ];

  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["books"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative overflow-hidden bg-slate-900 py-20 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 w-[500px] h-[400px] bg-amber-600/8 rounded-full blur-[140px]" />
          <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-amber-800/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-2xl ms-auto text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold font-cairo">
              <BookOpen className="h-3.5 w-3.5" />
              مكتبة رقمية متجددة باستمرار
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight font-cairo">{heroTitle}</h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-cairo">{heroSubtitle}</p>
            <div className="relative max-w-md">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-slate-400 cursor-default select-none">
                <Search className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-sm font-cairo text-slate-500">ابحث في المكتبة...</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {heroPills.map((pill) => (
                <Link
                  key={pill.label}
                  href={pill.href}
                  className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-white text-xs font-semibold transition-all font-cairo"
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    ),

    categories: () =>
      categories.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
          <div className="flex items-baseline justify-between">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 font-cairo">
              كل التصنيفات
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-lg font-bold text-foreground font-cairo">تصفح حسب التصنيف</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((category, idx) => {
              const Icon = GENRE_ICONS[idx % GENRE_ICONS.length];
              return (
                <Link
                  key={category.id}
                  href={`/store/${slug}/category/${category.slug}`}
                  className="group bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3 text-center hover:border-amber-300 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <Icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground group-hover:text-amber-700 transition-colors font-cairo leading-tight">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null,

    featured_products: () =>
      featuredProducts.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 font-cairo">
              مشاهدة الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <div className="text-right">
              <h2 className="text-xl font-bold text-foreground font-cairo">اختيارات المحررين</h2>
              <p className="text-xs text-muted-foreground font-cairo mt-0.5">أبرز ما في المكتبة لهذا الموسم</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <BookCard key={product.id} product={product} slug={slug} currency={currency} />
            ))}
          </div>
        </section>
      ) : null,

    latest_products: () =>
      newReleases.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 font-cairo">
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-xl font-bold text-foreground font-cairo">جديد الإصدارات</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {newReleases.map((product) => (
              <BookCard key={product.id} product={product} slug={slug} currency={currency} />
            ))}
          </div>
        </section>
      ) : null,

    testimonials: () => (
      <section className="py-16 bg-amber-50/50 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground font-cairo">آراء القرّاء والمتعلمين</h2>
            <p className="text-muted-foreground text-xs font-cairo">تجارب حقيقية من مستخدمين فعليين</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard
                key={t.name}
                quote={t.quote}
                name={t.name}
                role={t.role}
                rating={5}
                accentColor="amber"
              />
            ))}
          </div>
        </div>
      </section>
    ),

    promo_banner: () => (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-amber-50 border border-amber-100 rounded-3xl py-12 px-8 flex flex-col sm:flex-row items-center gap-8 justify-between">
          <div className="text-right space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold font-cairo">
              <Download className="h-3.5 w-3.5" />
              تسليم رقمي فوري
            </div>
            <h3 className="text-xl font-black text-foreground font-cairo">حمّل فورياً — بدون انتظار</h3>
            <p className="text-muted-foreground text-sm font-cairo leading-relaxed max-w-md">
              جميع المنتجات الرقمية تُسلَّم في ثوانٍ بعد إتمام الدفع. احتفظ بها للأبد.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-3">
            <Link
              href={`/store/${slug}/products`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-200 font-cairo"
            >
              استعرض المكتبة
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <p className="text-[10px] text-muted-foreground font-cairo">معاينة مجانية متاحة لبعض المنتجات</p>
          </div>
        </div>
      </section>
    ),

    best_sellers: () =>
      allProducts.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 font-cairo">
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-xl font-bold text-foreground font-cairo">جميع المنتجات</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {allProducts.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ??
                product.product_images?.[0]?.url ??
                null;
              return (
                <ProductCard key={product.id} product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
              );
            })}
          </div>
        </section>
      ) : null,
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
