"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Mail, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/app/store/[slug]/components/product-card";
import { TrustStrip } from "@/components/ui/trust-badge";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps, ProductWithImages } from "./theme-types";

function FashionPortraitCard({
  product,
  storeSlug,
  currency,
}: {
  product: ProductWithImages;
  storeSlug: string;
  currency: string;
}) {
  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ||
    product.product_images?.[0]?.url ||
    null;
  const hasDiscount = product.compare_price !== null && product.compare_price > product.price;

  return (
    <Link
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden block shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-rose-50">
            <ShoppingBag className="h-12 w-12 text-rose-200" />
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-lg font-cairo">
            تخفيض
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3">
          <div className="bg-foreground/90 text-background text-xs font-bold py-2.5 rounded-xl text-center font-cairo flex items-center justify-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5" />
            إضافة للسلة
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1 text-right">
        <h3 className="text-xs font-bold text-foreground line-clamp-1 font-cairo">{product.name}</h3>
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm font-black text-emerald-600 font-cairo">
            {product.price.toLocaleString("ar-SA")} {currency}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-muted-foreground line-through font-cairo">
              {product.compare_price!.toLocaleString("ar-SA")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function FashionTheme({ store, categories, products, settings }: StorefrontThemeProps) {
  const currency = store.currency;
  const slug = store.slug;

  const newArrivals = products.slice(0, 4);
  const bestSellers = products.filter((p) => p.is_featured).slice(0, 4);
  const allLatest = products.slice(0, 8);

  const heroTitle = settings.hero_title || "أناقة لا تُقاوَم هذا الموسم";
  const heroSubtitle =
    settings.hero_subtitle ||
    "تشكيلة حصرية من أرقى الأزياء الفاخرة — لكل امرأة تعرف قيمة تفردها وجمالها.";
  const heroImage = settings.hero_image_url || store.cover_url || null;

  const TRUST_BADGES = [
    { icon: Truck, label: "توصيل سريع لبابك", sublabel: "خلال 24–48 ساعة" },
    { icon: RotateCcw, label: "إرجاع مجاني", sublabel: "خلال 14 يوماً بدون شروط" },
    { icon: ShieldCheck, label: "ضمان الأصالة", sublabel: "جميع المنتجات أصلية 100%" },
  ];

  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["fashion"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative min-h-[85vh] flex items-end bg-slate-900 overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={heroTitle}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-24 text-right">
          <span className="inline-block mb-5 text-[10px] font-black border border-rose-400/40 bg-rose-500/10 text-rose-300 px-4 py-1.5 rounded-full font-cairo">
            تشكيلة صيف 2026
          </span>
          <h1 className="text-5xl sm:text-7xl font-black text-white leading-[1.05] max-w-2xl font-cairo mb-6">
            {heroTitle}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg leading-relaxed font-cairo mb-10">
            {heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-4 justify-start">
            <Link
              href={`/store/${slug}/products`}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-900/30 font-cairo"
            >
              تسوقي الآن
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
            {categories.length > 0 && (
              <Link
                href={`/store/${slug}/category/${categories[0].slug}`}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all backdrop-blur-sm font-cairo"
              >
                تصفح التصنيفات
              </Link>
            )}
          </div>
        </div>
      </section>
    ),

    trust_badges: () => (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TrustStrip badges={TRUST_BADGES} iconColor="text-rose-500" />
      </div>
    ),

    latest_products: () =>
      newArrivals.length > 0 ? (
        <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex items-baseline justify-between border-b border-border pb-5">
            <Link
              href={`/store/${slug}/products`}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 font-cairo"
            >
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-2xl font-black text-foreground font-cairo">وصل حديثاً</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {newArrivals.map((product) => (
              <FashionPortraitCard key={product.id} product={product} storeSlug={slug} currency={currency} />
            ))}
          </div>
        </section>
      ) : null,

    categories: () =>
      categories.length > 0 ? (
        <section className="py-16 bg-muted border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-right">
              <h2 className="text-2xl font-black text-foreground font-cairo">تسوقي حسب القسم</h2>
              <p className="text-xs text-muted-foreground font-cairo mt-1">اختاري تصنيفك المفضل</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/category/${cat.slug}`}
                  className={`group relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ${
                    idx === 0 ? "row-span-1 md:row-span-2 aspect-[3/4] md:aspect-auto" : "aspect-square"
                  }`}
                >
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-rose-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 inset-x-4 text-right">
                    <span className="text-white text-sm font-black font-cairo block leading-tight">{cat.name}</span>
                    <span className="text-white/70 text-[10px] font-cairo mt-0.5 block group-hover:text-white/90 transition-colors">
                      تسوقي الآن
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null,

    best_sellers: () =>
      bestSellers.length > 0 ? (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex items-baseline justify-between border-b border-border pb-5">
            <Link
              href={`/store/${slug}/products`}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 font-cairo"
            >
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <div className="text-right">
              <h2 className="text-2xl font-black text-foreground font-cairo">الأكثر مبيعاً</h2>
              <p className="text-xs text-muted-foreground font-cairo mt-0.5">التشكيلات التي تُحبّها العميلات أكثر</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {bestSellers.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              return (
                <div
                  key={product.id}
                  className="relative bg-card border border-border rounded-2xl overflow-hidden group hover:border-rose-200 transition-colors shadow-sm"
                >
                  <div className="absolute top-3 right-3 z-10 bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded-lg font-cairo">
                    الأكثر مبيعاً
                  </div>
                  <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null,

    promo_banner: () => (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative rounded-3xl overflow-hidden bg-rose-50 border border-rose-100">
          <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-rose-100/60 pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-rose-100/40 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 px-8 sm:px-14 py-12">
            <Link
              href={`/store/${slug}/products`}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-200 font-cairo shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              تسوقي العروض الآن
            </Link>
            <div className="text-right space-y-2 max-w-lg">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground font-cairo leading-tight">
                تخفيضات نهاية الموسم
              </h3>
              <p className="text-rose-700/70 text-xs font-cairo leading-relaxed">
                خصومات تصل إلى{" "}
                <span className="text-rose-600 font-black text-lg">50%</span>{" "}
                على تشكيلات مختارة — لفترة محدودة فقط.
              </p>
            </div>
          </div>
        </div>
      </section>
    ),

    newsletter: () =>
      allLatest.length > 0 ? (
        <section className="py-16 bg-muted border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex items-baseline justify-between border-b border-border pb-5">
              <Link
                href={`/store/${slug}/products`}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 font-cairo"
              >
                عرض الكل
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
              <h2 className="text-xl font-black text-foreground font-cairo">كل المنتجات</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {allLatest.map((product) => {
                const primaryImage =
                  product.product_images?.find((img) => img.is_primary)?.url ||
                  product.product_images?.[0]?.url ||
                  null;
                return (
                  <div key={product.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-rose-200 transition-colors shadow-sm">
                    <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                  </div>
                );
              })}
            </div>

            {/* Newsletter strip */}
            <div className="bg-card border border-border rounded-3xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-foreground font-cairo">احصلي على عروض حصرية</p>
                  <p className="text-[10px] text-muted-foreground font-cairo">
                    سجّلي إيميلك واستلمي أحدث العروض أولاً
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 sm:w-64 text-right px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-200 font-cairo"
                />
                <button
                  type="button"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all font-cairo shrink-0"
                >
                  اشتركي
                </button>
              </div>
            </div>
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
