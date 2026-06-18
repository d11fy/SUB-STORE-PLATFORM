"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/app/store/[slug]/components/product-card";
import { TrustStrip } from "@/components/ui/trust-badge";
import { PromoBanner } from "@/components/ui/promo-banner";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps } from "./theme-types";

const CATEGORY_ICONS = ["🏠", "👗", "💻", "🍎", "⚽", "📚", "🎮", "🛋️", "💄", "🔧", "🎵", "🌿"];

export default function GeneralTheme({ store, categories, products, settings }: StorefrontThemeProps) {
  const currency = store.currency;
  const slug = store.slug;

  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 8);
  const dealProducts = products
    .filter((p) => p.compare_price !== null && p.compare_price > p.price)
    .slice(0, 10);
  const newArrivals = products.slice(0, 8);

  const heroTitle = settings.hero_title || "كل ما تحتاجه في مكان واحد";
  const heroSubtitle =
    settings.hero_subtitle ||
    "تسوق تشكيلتنا الواسعة من المنتجات بأفضل أسعار السوق، جودة عالية وشحن سريع إلى بابك.";
  const heroImage = settings.hero_image_url || store.cover_url || null;

  const collageImages = products
    .slice(0, 4)
    .map(
      (p) =>
        p.product_images?.find((img) => img.is_primary)?.url ||
        p.product_images?.[0]?.url ||
        null
    );

  // D5: Dynamic section ordering from DB config
  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["general"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-background to-background border-b border-emerald-100 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-right order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold font-cairo">
              🛒 أفضل الأسعار وأسرع التوصيل
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground leading-tight font-cairo">
              {heroTitle}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg font-cairo">
              {heroSubtitle}
            </p>
            <div className="flex gap-3 justify-start flex-wrap pt-2">
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md font-cairo"
              >
                <ShoppingBag className="h-4 w-4" />
                تسوق الآن
              </Link>
              {categories.length > 0 && (
                <Link
                  href={`/store/${slug}/category/${categories[0].slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-background border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-50 transition-all font-cairo"
                >
                  تصفح الأقسام
                </Link>
              )}
            </div>
          </div>

          <div className="relative order-1 lg:order-2 flex justify-center">
            {heroImage ? (
              <div className="w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-100 shadow-lg">
                <img src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const img = collageImages[idx] || null;
                  return (
                    <div key={idx} className="aspect-square bg-muted rounded-2xl overflow-hidden border border-emerald-100">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {CATEGORY_ICONS[idx]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    ),

    trust_badges: () => (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TrustStrip
          badges={[
            { icon: Truck, label: "شحن مجاني", sublabel: `على الطلبات فوق 200 ${currency}` },
            { icon: ShieldCheck, label: "ضمان أصلي", sublabel: "منتجات موثّقة 100%" },
            { icon: RotateCcw, label: "إرجاع 30 يوم", sublabel: "استرجاع سهل بدون أسئلة" },
          ]}
          iconColor="text-emerald-600"
        />
      </div>
    ),

    categories: () =>
      categories.length > 0 ? (
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <Link
              href={`/store/${slug}/products`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors font-cairo flex items-center gap-1"
            >
              كل الأقسام
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-xl font-black text-foreground font-cairo">تسوق حسب القسم</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((category, idx) => (
              <Link
                key={category.id}
                href={`/store/${slug}/category/${category.slug}`}
                className="group bg-card border border-border hover:border-emerald-200 hover:shadow-sm rounded-2xl p-4 text-center space-y-2 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl mx-auto group-hover:scale-105 transition-transform">
                  {CATEGORY_ICONS[idx % CATEGORY_ICONS.length]}
                </div>
                <h3 className="text-[10px] font-bold text-muted-foreground group-hover:text-emerald-600 transition-colors line-clamp-1 font-cairo">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null,

    best_sellers: () =>
      dealProducts.length > 0 ? (
        <section className="py-14 bg-muted/20 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
            <div className="flex items-center justify-between">
              <Link
                href={`/store/${slug}/products`}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors font-cairo"
              >
                عرض الكل
              </Link>
              <div className="flex items-center gap-3 text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold font-cairo">
                  ينتهي خلال ساعات
                </span>
                <h2 className="text-xl font-black text-foreground font-cairo">🔥 عروض اليوم</h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
              {dealProducts.map((product) => {
                const primaryImage =
                  product.product_images?.find((img) => img.is_primary)?.url ||
                  product.product_images?.[0]?.url ||
                  null;
                const discountPct =
                  product.compare_price && product.compare_price > 0
                    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
                    : null;
                return (
                  <Link
                    key={product.id}
                    href={`/store/${slug}/product/${product.slug}`}
                    className="flex-shrink-0 w-44 bg-card border border-border hover:border-emerald-200 rounded-xl p-3 space-y-2 transition-all hover:shadow-sm"
                  >
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                      {primaryImage ? (
                        <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                      {discountPct && (
                        <div className="absolute top-2 right-2 bg-red-100 text-red-700 border border-red-200 text-[10px] font-black px-2 py-0.5 rounded-full font-cairo">
                          -{discountPct}%
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-foreground line-clamp-1 font-cairo text-right">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-muted-foreground line-through font-cairo">
                        {product.compare_price?.toLocaleString("ar-SA")}
                      </span>
                      <span className="text-sm font-black text-emerald-600 font-cairo">
                        {product.price.toLocaleString("ar-SA")} {currency}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null,

    featured_products: () =>
      featuredProducts.length > 0 ? (
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <Link
              href={`/store/${slug}/products`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors font-cairo flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-xl font-black text-foreground font-cairo">الأكثر مبيعاً</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              return (
                <div
                  key={product.id}
                  className="bg-card border border-border p-1.5 rounded-2xl hover:border-emerald-200 transition-all shadow-sm hover:shadow-md"
                >
                  <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null,

    promo_banner: () => (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <PromoBanner
          title={`شحن مجاني على طلبات أكثر من 200 ${currency}`}
          description="تسوق الآن واستمتع بتوصيل مجاني لأي مكان — العرض على منتجات مختارة."
          ctaLabel="ابدأ التسوق"
          ctaHref={`/store/${slug}/products`}
          variant="emerald"
        />
      </section>
    ),

    latest_products: () =>
      newArrivals.length > 0 ? (
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <Link
              href={`/store/${slug}/products`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors font-cairo flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-xl font-black text-foreground font-cairo">وصل حديثاً</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              return (
                <div
                  key={product.id}
                  className="bg-card border border-border p-1.5 rounded-2xl hover:border-emerald-200 transition-all shadow-sm hover:shadow-md"
                >
                  <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null,
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
