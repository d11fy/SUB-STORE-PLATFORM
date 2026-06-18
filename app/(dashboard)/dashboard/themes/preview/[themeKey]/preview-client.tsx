"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Monitor,
  Smartphone,
  Check,
  Loader2,
  Sparkles,
  AlertTriangle,
  X,
  Tag,
  Truck,
  Download,
  Calendar,
  Wrench,
  ShoppingBag,
  Star,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { setActiveThemeAction } from "@/actions/themes";
import { ThemeRenderer } from "@/components/storefront/themes/theme-renderer";
import {
  ThemeHeader,
  ThemeFooter,
} from "@/components/storefront/themes/theme-renderer";
import {
  THEME_CARD_META,
  type DemoThemeKey,
} from "@/lib/themes/theme-demo-data";
import type { StoreWithTheme } from "@/components/storefront/themes/theme-types";
import type { Category, StoreThemeSettings } from "@/lib/types/database";
import type { ProductWithImages } from "@/components/storefront/themes/theme-types";

// ── Types ─────────────────────────────────────────────────────
interface PreviewClientProps {
  themeKey: DemoThemeKey;
  themeId: string;
  themeName: string;
  store: StoreWithTheme;
  categories: Category[];
  products: ProductWithImages[];
  settings: StoreThemeSettings;
  isLocked: boolean;
}

type ViewMode = "desktop" | "mobile";

// ── Demo Product Modal ────────────────────────────────────────
function DemoProductModal({
  product,
  store,
  accentColor,
  onClose,
}: {
  product: ProductWithImages;
  store: StoreWithTheme;
  accentColor: string;
  onClose: () => void;
}) {
  const discount =
    product.compare_price && product.compare_price > product.price
      ? Math.round(
          ((product.compare_price - product.price) / product.compare_price) *
            100
        )
      : null;

  // Delivery method label
  let deliveryLabel = "";
  let DeliveryIcon = Truck;
  if (
    product.product_type === "subscription" ||
    (product.product_type === "digital" && !store.requires_shipping)
  ) {
    deliveryLabel = "اشتراك رقمي — تفعيل فوري بعد الدفع";
    DeliveryIcon = Calendar;
  } else if (product.product_type === "service") {
    deliveryLabel = "خدمة — يُحجز عبر التواصل";
    DeliveryIcon = Wrench;
  } else if (product.is_digital) {
    deliveryLabel = "منتج رقمي — تحميل فوري بعد الدفع";
    DeliveryIcon = Download;
  } else if (!store.requires_shipping) {
    deliveryLabel = "يُسلَّم رقمياً — لا يتطلب شحناً";
    DeliveryIcon = Download;
  } else {
    deliveryLabel = "شحن وتوصيل — تختلف الرسوم حسب المنطقة";
    DeliveryIcon = Truck;
  }

  // Product type badge
  const typeBadge: Record<string, string> = {
    physical: "منتج فعلي",
    digital: "رقمي",
    subscription: "اشتراك",
    service: "خدمة",
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto font-cairo text-right z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-muted border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive text-muted-foreground transition-all z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Mock product image */}
        <div
          className="w-full aspect-[4/3] flex flex-col items-center justify-center rounded-t-2xl select-none"
          style={{ background: `${accentColor}18`, borderBottom: `2px solid ${accentColor}22` }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md mb-3"
            style={{ background: `${accentColor}22`, border: `2px solid ${accentColor}33` }}
          >
            {product.product_type === "subscription"
              ? "🎟️"
              : product.product_type === "service"
              ? "🌸"
              : product.is_digital
              ? "📦"
              : "🛍️"}
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: `${accentColor}22`,
              color: accentColor,
              border: `1px solid ${accentColor}44`,
            }}
          >
            {typeBadge[product.product_type] || "منتج"}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <h2 className="text-lg font-black text-foreground leading-tight">
            {product.name}
          </h2>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-foreground">
              {product.price} {store.currency}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {product.compare_price} {store.currency}
              </span>
            )}
            {discount && (
              <span className="text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
                خصم {discount}%
              </span>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {product.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-bold bg-muted border border-border px-2 py-0.5 rounded-full text-muted-foreground"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Delivery info */}
          <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-xl text-xs text-muted-foreground">
            <DeliveryIcon className="h-4 w-4 shrink-0 text-primary/70" />
            <span>{deliveryLabel}</span>
          </div>

          {/* Subscription info */}
          {product.product_type === "subscription" &&
            product.subscription_duration_value && (
              <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-xl text-xs text-muted-foreground">
                <Star className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  مدة الاشتراك:{" "}
                  {product.subscription_duration_value}{" "}
                  {product.subscription_duration_unit === "month"
                    ? "شهر"
                    : product.subscription_duration_unit === "year"
                    ? "سنة"
                    : product.subscription_duration_unit}
                </span>
              </div>
            )}

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Disabled CTA */}
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-3 bg-muted border border-dashed border-border text-muted-foreground text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <ShoppingBag className="h-4 w-4" />
              أضف للسلة
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              زر الشراء غير متاح في وضع المعاينة — فعّل الثيم لتجربة متجرك الحقيقي
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preview Client ────────────────────────────────────────────
export function PreviewClient({
  themeKey,
  themeId,
  themeName,
  store,
  categories,
  products,
  settings,
  isLocked,
}: PreviewClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithImages | null>(null);
  const [isPending, startTransition] = useTransition();
  const meta = THEME_CARD_META[themeKey];

  const handleActivate = () => {
    startTransition(async () => {
      const res = await setActiveThemeAction(themeId);
      if (res.success) {
        toast.success("تم تفعيل القالب بنجاح! 🎉");
      } else {
        toast.error(res.error || "فشل تفعيل القالب");
      }
    });
  };

  // Intercept ALL clicks inside the demo content area (capture phase)
  // This fires before Next.js Link's onClick, so we can stop navigation cleanly
  const handleDemoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;

    const href =
      anchor.getAttribute("href") || "";

    // Allow: hash-only, tel:, mailto:, absolute external URLs
    if (
      !href ||
      href === "#" ||
      href.startsWith("tel:") ||
      href.startsWith("mailto:") ||
      href.startsWith("https://") ||
      href.startsWith("http://")
    ) {
      return;
    }

    // Allow: dashboard navigation links (back button, upgrade CTA)
    if (href.startsWith("/dashboard/")) {
      return;
    }

    // Block and intercept: any /store/* or relative link inside demo
    e.preventDefault();
    e.stopPropagation();

    // Product detail page → open modal
    if (href.includes("/product/")) {
      const slug = href.split("/product/")[1]?.split("?")[0] || "";
      const product =
        products.find((p) => p.slug === slug || p.id === slug) ?? null;
      if (product) {
        setSelectedProduct(product);
      } else {
        toast("هذه معاينة تجريبية — فعّل الثيم لتجربته على متجرك الحقيقي.");
      }
      return;
    }

    // All other store links: products list, categories, cart, home
    toast("هذه معاينة تجريبية — فعّل الثيم لتجربته على متجرك الحقيقي.", {
      duration: 2500,
    });
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col font-cairo"
      dir="rtl"
    >
      {/* ── Control Bar ── */}
      <div className="fixed top-0 inset-x-0 z-[60] h-14 bg-card border-b border-border shadow-sm flex items-center gap-3 px-4">
        {/* Back */}
        <Link
          href="/dashboard/themes"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold shrink-0"
        >
          <ArrowRight className="h-4 w-4" />
          الثيمات
        </Link>

        <span className="h-5 w-px bg-border shrink-0" />

        {/* Theme Label */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{meta.icon}</span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground truncate block">
              {themeName}
            </span>
            <span className="text-[10px] text-muted-foreground truncate block hidden sm:block">
              {meta.field}
            </span>
          </div>
        </div>

        {isLocked && (
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0">
            <Lock className="h-3 w-3" />
            غير متوفر في باقتك
          </div>
        )}

        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex items-center bg-muted border border-border rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === "desktop"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">كمبيوتر</span>
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === "mobile"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">جوال</span>
          </button>
        </div>

        {/* Activate / Upgrade */}
        {isLocked ? (
          <Link
            href="/dashboard/subscription"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ترقية الباقة</span>
            <span className="sm:hidden">ترقية</span>
          </Link>
        ) : (
          <button
            onClick={handleActivate}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60 shrink-0"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {isPending ? "جارٍ التفعيل..." : "تفعيل هذا الثيم"}
            </span>
            <span className="sm:hidden">{isPending ? "..." : "تفعيل"}</span>
          </button>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="pt-14 flex-1 flex flex-col">
        {/* Demo Notice Banner */}
        {showDemoBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>
                معاينة تجريبية — البيانات والمنتجات وهمية. الروابط لا تؤدي إلى
                صفحات حقيقية. لن يُحفظ أي شيء.
              </span>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              className="text-amber-600 hover:text-amber-800 shrink-0 transition-colors"
              aria-label="إغلاق الإشعار"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Theme Preview Container */}
        <div
          className={`flex-1 transition-all duration-300 ${
            viewMode === "mobile"
              ? "bg-slate-100 py-8 flex justify-center"
              : "bg-background"
          }`}
        >
          {/* Demo click interceptor wraps ALL theme content (header + body + footer)
              onClickCapture fires before Next.js Link's onClick handler */}
          <div
            className={`flex flex-col min-h-full transition-all duration-300 ${
              viewMode === "mobile"
                ? "w-[390px] shadow-2xl rounded-[2rem] overflow-hidden border-4 border-slate-300"
                : "w-full"
            }`}
            style={{
              "--primary": settings.primary_color,
              "--secondary": settings.secondary_color,
              "--accent": settings.accent_color,
              fontFamily: `${settings.font_family || "Cairo"}, sans-serif`,
            } as React.CSSProperties}
            onClickCapture={handleDemoClick}
          >
            <ThemeHeader store={store} settings={settings} />
            <main className="flex-1 flex flex-col bg-background">
              <ThemeRenderer
                store={store}
                categories={categories}
                products={products}
                settings={settings}
              />
            </main>
            <ThemeFooter store={store} settings={settings} />
          </div>
        </div>
      </div>

      {/* ── Demo Product Modal ── */}
      {selectedProduct && (
        <DemoProductModal
          product={selectedProduct}
          store={store}
          accentColor={meta.accentColor}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
