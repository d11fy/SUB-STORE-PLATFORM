"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Crown, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/app/store/[slug]/components/product-card";
import { TrustStrip } from "@/components/ui/trust-badge";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps } from "./theme-types";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "منتجات أصلية 100%", sublabel: "ضمان الجودة والأصالة" },
  { icon: Truck, label: "توصيل مجاني", sublabel: "على الطلبات فوق 150 ₪" },
  { icon: RotateCcw, label: "إرجاع مجاني", sublabel: "خلال 14 يوماً بكل يسر" },
];

export default function AccessoriesTheme({ store, categories, products, settings }: StorefrontThemeProps) {
  const currency = store.currency;
  const slug = store.slug;

  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 8);
  const bestSellers = products.slice(0, 8);

  const heroTitle = settings.hero_title || "أناقة لا حدود لها";
  const heroSubtitle =
    settings.hero_subtitle ||
    "تشكيلة حصرية من الإكسسوارات الفاخرة المصنوعة بدقة متناهية — لأن التفاصيل هي ما يصنع الفرق.";
  const heroImage = settings.hero_image_url || store.cover_url || null;

  const editorialCats = categories.slice(0, 2);

  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["accessories"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative overflow-hidden border-b border-amber-100 bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/70 via-card to-card pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-7 text-right order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold font-cairo">
              <Crown className="h-3.5 w-3.5" />
              تصاميم حصرية فاخرة
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-foreground leading-tight font-cairo">{heroTitle}</h1>
            <p className="text-muted-foreground text-sm leading-loose max-w-md font-cairo font-light">{heroSubtitle}</p>
            <div className="flex flex-wrap gap-3 justify-start pt-2">
              <Link href={`/store/${slug}/products`} className="px-7 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-full transition-all shadow-md shadow-amber-200 font-cairo">
                تصفح التشكيلة الكاملة
              </Link>
              <Link href={`/store/${slug}/products`} className="px-7 py-3 bg-card border border-amber-200 hover:border-amber-400 text-amber-700 text-xs font-bold rounded-full transition-all font-cairo">
                اعرفي أكثر
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-100/60 to-stone-50 border border-amber-100 shadow-sm">
              {heroImage ? (
                <img src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <span className="text-6xl">💍</span>
                  <div className="flex gap-2">
                    <span className="text-2xl">⌚</span>
                    <span className="text-2xl">👜</span>
                    <span className="text-2xl">💎</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
      </section>
    ),

    trust_badges: () => (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TrustStrip badges={TRUST_BADGES} iconColor="text-amber-600" />
      </div>
    ),

    categories: () =>
      categories.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-foreground font-cairo">المجموعات والأقسام</h2>
            <p className="text-xs text-muted-foreground font-cairo">تسوقي حسب ما يناسبك</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/store/${slug}/category/${category.slug}`}
                className="px-5 py-2.5 rounded-full bg-card border border-amber-100 hover:border-amber-400 text-xs font-bold text-muted-foreground hover:text-amber-700 transition-all font-cairo"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null,

    featured_products: () =>
      featuredProducts.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-baseline justify-between border-b border-amber-100 pb-4">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 font-cairo">
              عرض التشكيلة كاملة
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <div className="text-right">
              <h2 className="text-xl font-black text-foreground font-cairo">المختارات الذهبية</h2>
              <p className="text-xs text-muted-foreground font-cairo mt-0.5">أبرز تشكيلاتنا المميزة لهذا الموسم</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              return (
                <div key={product.id} className="group relative overflow-hidden rounded-2xl bg-card border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all duration-300">
                  <div className="relative p-2">
                    <Link href={`/store/${slug}/product/${product.slug}`} className="block aspect-square rounded-xl overflow-hidden bg-muted">
                      {primaryImage ? (
                        <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-amber-50">💍</div>
                      )}
                    </Link>
                    {product.is_featured && (
                      <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-cairo">
                        مميز
                      </span>
                    )}
                  </div>
                  <div className="px-3 pb-3 space-y-2 text-right">
                    <Link href={`/store/${slug}/product/${product.slug}`}>
                      <h3 className="text-sm font-bold text-foreground line-clamp-1 hover:text-amber-700 transition-colors font-cairo">{product.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <Link href={`/store/${slug}/product/${product.slug}`} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 font-cairo">
                        إضافة
                      </Link>
                      <span className="text-sm font-black text-emerald-600 font-cairo">
                        {product.price.toLocaleString("ar")} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null,

    promo_banner: () => (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Editorial split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {editorialCats.length >= 2 ? (
            <>
              <Link href={`/store/${slug}/category/${editorialCats[0].slug}`} className="group bg-rose-50 border border-rose-100 rounded-3xl p-10 flex flex-col items-center text-center gap-5 hover:border-rose-200 hover:shadow-sm transition-all">
                {editorialCats[0].image_url ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-rose-200">
                    <img src={editorialCats[0].image_url} alt={editorialCats[0].name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-5xl">💄</span>
                )}
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground font-cairo">{editorialCats[0].name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-cairo">تشكيلة مميزة لهذا القسم</p>
                </div>
                <span className="px-6 py-2.5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all font-cairo group-hover:bg-rose-200">تسوقي الآن</span>
              </Link>
              <Link href={`/store/${slug}/category/${editorialCats[1].slug}`} className="group bg-stone-50 border border-stone-200 rounded-3xl p-10 flex flex-col items-center text-center gap-5 hover:border-stone-300 hover:shadow-sm transition-all">
                {editorialCats[1].image_url ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-300">
                    <img src={editorialCats[1].image_url} alt={editorialCats[1].name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-5xl">⌚</span>
                )}
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground font-cairo">{editorialCats[1].name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-cairo">تشكيلة مميزة لهذا القسم</p>
                </div>
                <span className="px-6 py-2.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold transition-all font-cairo group-hover:bg-stone-200">تسوقي الآن</span>
              </Link>
            </>
          ) : (
            <>
              <Link href={`/store/${slug}/products`} className="group bg-rose-50 border border-rose-100 rounded-3xl p-10 flex flex-col items-center text-center gap-5 hover:border-rose-200 hover:shadow-sm transition-all">
                <span className="text-5xl">💄</span>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground font-cairo">لها</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-cairo">إكسسوارات أنثوية فاخرة مختارة بحب</p>
                </div>
                <span className="px-6 py-2.5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold group-hover:bg-rose-200 transition-all font-cairo">تسوقي الآن</span>
              </Link>
              <Link href={`/store/${slug}/products`} className="group bg-stone-50 border border-stone-200 rounded-3xl p-10 flex flex-col items-center text-center gap-5 hover:border-stone-300 hover:shadow-sm transition-all">
                <span className="text-5xl">⌚</span>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground font-cairo">له</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-cairo">أناقة رجالية راقية من أرقى التشكيلات</p>
                </div>
                <span className="px-6 py-2.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold group-hover:bg-stone-200 transition-all font-cairo">تسوق الآن</span>
              </Link>
            </>
          )}
        </div>
        {/* Gift guide banner */}
        <div className="bg-gradient-to-r from-amber-50 to-stone-50 border border-amber-100 rounded-3xl px-8 sm:px-14 py-12 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-right space-y-2">
            <h3 className="text-xl font-black text-foreground font-cairo">دليل الهدايا المثالية</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-cairo font-light">
              اختاري الهدية المناسبة لكل مناسبة من تشكيلتنا المختارة بعناية فائقة.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <Link href={`/store/${slug}/products`} className="px-7 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-amber-100 font-cairo">
              اكتشفي دليل الهدايا
            </Link>
          </div>
        </div>
      </div>
    ),

    best_sellers: () =>
      bestSellers.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-baseline justify-between border-b border-amber-100 pb-4">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 font-cairo">
              رؤية المزيد
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-xl font-black text-foreground font-cairo">الأكثر مبيعاً</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {bestSellers.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              return (
                <div key={product.id} className="border border-amber-100 bg-card p-1.5 rounded-2xl hover:border-amber-300 transition-all shadow-sm">
                  <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null,
  };

  return (
    <div className="space-y-20 pb-24 bg-background text-foreground font-serif" dir="rtl">
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
