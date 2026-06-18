"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Truck, RotateCcw, Headphones, ArrowLeft } from "lucide-react";
import { ProductCard } from "@/app/store/[slug]/components/product-card";
import { FeatureGrid } from "@/components/ui/feature-grid";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps } from "./theme-types";

const CATEGORY_ICONS: Record<string, string> = {
  default: "🔌",
  جوال: "📱",
  هاتف: "📱",
  لابتوب: "💻",
  حاسوب: "💻",
  كمبيوتر: "💻",
  ألعاب: "🎮",
  كاميرا: "📷",
  سماعات: "🎧",
  ساعة: "⌚",
  تلفاز: "📺",
  طابعة: "🖨️",
  راوتر: "📡",
};

function getCategoryIcon(name: string): string {
  const key = Object.keys(CATEGORY_ICONS).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return key ? CATEGORY_ICONS[key] : CATEGORY_ICONS.default;
}

function discountPercent(price: number, comparePrice: number): number {
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export default function ElectronicsTheme({ store, categories, products, settings }: StorefrontThemeProps) {
  const currency = store.currency;
  const slug = store.slug;

  const flashDeals = products
    .filter((p) => p.compare_price !== null && p.compare_price > p.price)
    .slice(0, 4);
  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 8);
  const newArrivals = products.slice(0, 8);

  const heroTitle = settings.hero_title || "أحدث الأجهزة الذكية بأفضل الأسعار";
  const heroSubtitle =
    settings.hero_subtitle ||
    "تشكيلة واسعة من أحدث الإلكترونيات والأجهزة الذكية — بضمان أصلي وشحن سريع لجميع المناطق.";
  const heroImage = settings.hero_image_url || store.cover_url || null;

  const TRUST_FEATURES = [
    { icon: ShieldCheck, title: "ضمان الجودة", description: "جميع منتجاتنا أصلية 100% مع ضمان رسمي معتمد من الوكيل.", iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
    { icon: Truck, title: "شحن سريع", description: "توصيل خلال 24-48 ساعة لجميع المناطق مع تتبع مباشر للطلب.", iconColor: "text-blue-600", iconBg: "bg-blue-50" },
    { icon: RotateCcw, title: "إرجاع مجاني", description: "سياسة إرجاع مرنة خلال 14 يوماً بدون أي شروط معقدة.", iconColor: "text-amber-600", iconBg: "bg-amber-50" },
    { icon: Headphones, title: "دعم فني متخصص", description: "فريق دعم متخصص متاح على مدار الساعة لمساعدتك في أي وقت.", iconColor: "text-violet-600", iconBg: "bg-violet-50" },
  ];

  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["electronics"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative overflow-hidden bg-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-900/20 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7 text-right order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/25 text-blue-400 text-[10px] font-black font-cairo">
              <Zap className="h-3.5 w-3.5 fill-blue-400" />
              ضمان أصلي لمدة عامين كاملين
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.05] font-cairo">{heroTitle}</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md font-cairo">{heroSubtitle}</p>
            <div className="flex flex-wrap gap-3 justify-start">
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-blue-900/40 font-cairo"
              >
                تصفح الأجهزة الآن
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
              {flashDeals.length > 0 && (
                <Link
                  href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all font-cairo"
                >
                  عروض اليوم
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { icon: Truck, label: "شحن مجاني" },
                { icon: ShieldCheck, label: "ضمان سنتين" },
                { icon: RotateCcw, label: "إرجاع مجاني" },
                { icon: Headphones, label: "دعم 24/7" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 px-2">
                  <Icon className="h-4 w-4 text-blue-400" />
                  <span className="text-[9px] font-bold text-slate-400 font-cairo text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative order-1 lg:order-2 flex justify-center">
            <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-3xl scale-90" />
            <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden bg-card border border-blue-500/20 shadow-2xl shadow-blue-950/50">
              {heroImage ? (
                <img src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-7xl">💻</div>
              )}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-blue-400/20 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
    ),

    categories: () =>
      categories.length > 0 ? (
        <section className="py-10 border-b border-border bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none justify-start">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/category/${cat.slug}`}
                  className="group shrink-0 flex flex-col items-center gap-2 px-4 py-3 bg-card border border-border hover:border-blue-400 rounded-2xl transition-all shadow-sm min-w-[72px]"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform block">
                    {getCategoryIcon(cat.name)}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground group-hover:text-blue-600 transition-colors font-cairo text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null,

    best_sellers: () =>
      flashDeals.length > 0 ? (
        <section className="bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <Link href={`/store/${slug}/products`} className="text-[10px] font-bold text-white/70 hover:text-white transition-colors font-cairo flex items-center gap-1">
                عرض الكل
                <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
              </Link>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <h2 className="text-white font-black text-lg font-cairo leading-none">عروض اليوم فقط</h2>
                  <p className="text-blue-200 text-[10px] font-cairo mt-0.5">خصومات حصرية — كميات محدودة</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
                  <Zap className="h-5 w-5 fill-white" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {flashDeals.map((product) => {
                const primaryImage =
                  product.product_images?.find((img) => img.is_primary)?.url ||
                  product.product_images?.[0]?.url ||
                  null;
                const pct = discountPercent(product.price, product.compare_price!);
                return (
                  <Link
                    key={product.id}
                    href={`/store/${slug}/product/${product.slug}`}
                    className="group relative bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl overflow-hidden transition-all"
                  >
                    <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg font-cairo">
                      خصم {pct}%
                    </div>
                    <div className="aspect-square bg-white/5 flex items-center justify-center overflow-hidden">
                      {primaryImage ? (
                        <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <div className="p-3 text-right space-y-1">
                      <p className="text-white text-xs font-bold line-clamp-1 font-cairo">{product.name}</p>
                      {product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {product.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="bg-white/15 text-white/80 text-[9px] px-1.5 py-0.5 rounded font-cairo">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-white font-black text-sm font-cairo">
                          {product.price.toLocaleString("ar-SA")} {currency}
                        </span>
                        <span className="text-blue-200 text-[10px] line-through font-cairo">
                          {product.compare_price!.toLocaleString("ar-SA")}
                        </span>
                      </div>
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
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-baseline justify-between border-b border-border pb-5">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 font-cairo">
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <div className="text-right">
              <h2 className="text-xl font-black text-foreground font-cairo">أبرز المنتجات التقنية</h2>
              <p className="text-xs text-muted-foreground font-cairo mt-0.5">منتجات مختارة بعناية لأفضل تجربة</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              const hasDiscount = product.compare_price !== null && product.compare_price > product.price;
              return (
                <div key={product.id} className="relative bg-card border border-border rounded-2xl overflow-hidden hover:border-blue-300 transition-colors shadow-sm group">
                  {hasDiscount && (
                    <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg font-cairo">
                      خصم {discountPercent(product.price, product.compare_price!)}%
                    </div>
                  )}
                  <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                  {product.tags.length > 0 && (
                    <div className="px-3 pb-3 flex flex-wrap gap-1 justify-end">
                      {product.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded font-cairo border border-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null,

    trust_badges: () => (
      <section className="py-16 bg-muted border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-right">
            <h2 className="text-xl font-black text-foreground font-cairo">لماذا تتسوق معنا؟</h2>
            <p className="text-xs text-muted-foreground font-cairo mt-1">ضمان جودة وخدمة تتجاوز توقعاتك</p>
          </div>
          <FeatureGrid features={TRUST_FEATURES} columns={4} />
        </div>
      </section>
    ),

    latest_products: () =>
      newArrivals.length > 0 ? (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-baseline justify-between border-b border-border pb-5">
            <Link href={`/store/${slug}/products`} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 font-cairo">
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
            <h2 className="text-xl font-black text-foreground font-cairo">وصل حديثاً</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {newArrivals.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              const hasDiscount = product.compare_price !== null && product.compare_price > product.price;
              return (
                <div key={product.id} className="relative bg-card border border-border rounded-2xl overflow-hidden hover:border-blue-300 transition-colors shadow-sm">
                  {hasDiscount && (
                    <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg font-cairo">
                      خصم {discountPercent(product.price, product.compare_price!)}%
                    </div>
                  )}
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
