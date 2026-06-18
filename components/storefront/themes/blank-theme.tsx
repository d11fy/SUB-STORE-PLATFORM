"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Truck, Shield, RotateCcw, Phone } from "lucide-react";
import { ProductCard } from "@/app/store/[slug]/components/product-card";
import { PromoBanner } from "@/components/ui/promo-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { getOrderedSections } from "@/lib/themes/sections-runtime";
import { THEME_DEFAULT_SECTIONS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";
import type { StorefrontThemeProps } from "./theme-types";

const FEATURES = [
  { icon: Truck, title: "شحن سريع وموثوق", desc: "توصيل لجميع المناطق خلال أيام عمل معدودة مع تتبع فوري لطلبك." },
  { icon: Shield, title: "دفع آمن 100%", desc: "جميع طرق الدفع المتاحة مشفرة وآمنة بالكامل." },
  { icon: RotateCcw, title: "إرجاع بدون تعقيد", desc: "سياسة إرجاع مرنة خلال 14 يوماً — استرجاع سهل بدون أسئلة." },
  { icon: Phone, title: "دعم على مدار الساعة", desc: "فريق خدمة عملاء دائماً معك لمساعدتك في أي استفسار." },
];

export default function BlankTheme({ store, categories, products, settings }: StorefrontThemeProps) {
  const currency = store.currency;
  const slug = store.slug;

  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 8);
  const latestProducts = products.slice(0, 12);

  const heroTitle = settings.hero_title || "مرحباً بكم في متجرنا";
  const heroSubtitle =
    settings.hero_subtitle ||
    "نحن نقدم مجموعة واسعة من المنتجات بجودة عالية وتجربة تسوق آمنة وسهلة لكل ما تحتاجه.";
  const heroImage = settings.hero_image_url || store.cover_url || null;

  const orderedSections = getOrderedSections(settings as any, THEME_DEFAULT_SECTIONS["blank"]);

  const sectionRenderers: Partial<Record<SectionType, () => React.ReactNode>> = {
    hero: () => (
      <section className="relative overflow-hidden bg-card border-b border-border">
        {heroImage ? (
          <>
            <div className="absolute inset-0 z-0">
              <img src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/75" />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-6">
              <h1 className="text-4xl sm:text-6xl font-black text-foreground leading-tight font-cairo">{heroTitle}</h1>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed font-cairo">{heroSubtitle}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href={`/store/${slug}/products`} className="px-8 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm font-cairo">
                  تصفح المنتجات
                </Link>
                <Link href={`/store/${slug}/products`} className="px-8 py-3 bg-card border border-border text-foreground text-xs font-bold rounded-xl hover:border-primary/30 hover:bg-muted transition-all font-cairo">
                  اعرف أكثر
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-right space-y-6 order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-cairo">
                  {store.name}
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight font-cairo">{heroTitle}</h1>
                <p className="text-muted-foreground text-sm max-w-md leading-relaxed font-cairo">{heroSubtitle}</p>
                <div className="flex flex-wrap gap-3 justify-start">
                  <Link href={`/store/${slug}/products`} className="px-8 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm font-cairo">
                    تصفح المنتجات
                  </Link>
                  {categories.length > 0 && (
                    <Link href={`/store/${slug}/category/${categories[0].slug}`} className="px-8 py-3 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:border-primary/30 transition-all font-cairo">
                      استعرض الأقسام
                    </Link>
                  )}
                </div>
              </div>
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <span className="text-8xl sm:text-9xl font-black text-primary/30 font-cairo select-none">{store.name.charAt(0)}</span>
                  </div>
                  {products.slice(0, 2).map((p, i) => {
                    const img = p.product_images?.find((img) => img.is_primary)?.url || p.product_images?.[0]?.url;
                    return (
                      <div key={p.id} className={`absolute bg-card border border-border rounded-xl p-2 shadow-md w-24 ${i === 0 ? "-top-4 -right-4" : "-bottom-4 -left-4"}`}>
                        {img ? (
                          <img src={img} alt={p.name} className="w-full aspect-square object-cover rounded-lg" />
                        ) : (
                          <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-xl font-bold text-primary/40 font-cairo">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <p className="text-[9px] font-bold text-foreground mt-1.5 line-clamp-1 font-cairo text-center">{p.name}</p>
                        <p className="text-[9px] text-emerald-600 font-bold text-center font-cairo">{p.price.toLocaleString("ar-SA")} {currency}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="relative z-10 border-t border-border bg-muted/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {["شحن آمن", "إرجاع مجاني", "دعم 24/7"].map((label) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground font-cairo">
                <span className="text-primary font-black">✓</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>
    ),

    categories: () =>
      categories.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <SectionHeader title="تصفح الأقسام" href={`/store/${slug}/products`} align="right" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/store/${slug}/category/${category.slug}`}
                className="group bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-3 group-hover:bg-primary/20 transition-colors font-cairo">
                  {category.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors font-cairo">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null,

    featured_products: () =>
      featuredProducts.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <SectionHeader title="المنتجات المميزة" href={`/store/${slug}/products`} align="right" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              return (
                <div key={product.id} className="bg-card border border-border p-2 rounded-2xl hover:border-primary/20 hover:shadow-sm transition-all">
                  <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null,

    promo_banner: () => (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PromoBanner
          title="عروض حصرية هذا الأسبوع"
          description="لا تفوّت أفضل الصفقات — لفترة محدودة فقط"
          label="عروض الأسبوع"
          ctaLabel="تسوق الآن"
          ctaHref={`/store/${slug}/products`}
          variant="primary"
        />
      </section>
    ),

    latest_products: () =>
      latestProducts.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <SectionHeader title="أحدث المنتجات" href={`/store/${slug}/products`} align="right" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestProducts.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary)?.url ||
                product.product_images?.[0]?.url ||
                null;
              return (
                <div key={product.id} className="bg-card border border-border p-2 rounded-2xl hover:border-primary/20 hover:shadow-sm transition-all">
                  <ProductCard product={product} storeSlug={slug} primaryImage={primaryImage} currency={currency} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null,

    trust_badges: () => (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-muted rounded-3xl p-8 sm:p-12">
          <h2 className="text-lg font-black text-foreground font-cairo text-right mb-8">لماذا تتسوق معنا؟</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground font-cairo">{feature.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-cairo">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="space-y-16 pb-20 bg-background text-foreground font-sans" dir="rtl">
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
