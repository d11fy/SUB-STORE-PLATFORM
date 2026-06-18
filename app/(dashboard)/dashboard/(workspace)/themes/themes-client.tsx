"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Palette,
  ShieldAlert,
  Check,
  Loader2,
  Sparkles,
  Layout,
  Eye,
} from "lucide-react";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { toast } from "sonner";
import { setActiveThemeAction } from "@/actions/themes";
import type { Theme, Store, Package } from "@/lib/types/database";

interface ThemesClientProps {
  themes: Theme[];
  currentThemeId: string | null;
  store: Store & { packages: Package | null };
}

// Per-theme info for the card description
const THEME_INFO: Record<
  string,
  { name: string; field: string; tagline: string; description: string }
> = {
  fashion: {
    name: "قالب الأزياء والملابس",
    field: "الملابس والأزياء",
    tagline: "هيرو سينمائي داكن · بطاقات بورتريه 3:4 · أقسام تحريرية",
    description:
      "قالب أزياء متكامل بتخطيط عريض يعتمد على صور الموديلات والبنرات الكبيرة لإعطاء انطباع الفخامة وارتفاع معدلات التحويل.",
  },
  electronics: {
    name: "قالب الإلكترونيات",
    field: "الإلكترونيات والتقنية",
    tagline: "عروض يومية · مواصفات في الكروت · تصنيفات سريعة",
    description:
      "قالب تقني قوي يتميز بكروت منتجات تعرض المواصفات الفنية المباشرة وتصنيفات فرعية لتسهيل المقارنة.",
  },
  subscriptions: {
    name: "قالب الاشتراكات الرقمية",
    field: "الاشتراكات والخدمات الرقمية",
    tagline: "تسعير SaaS · جدول مقارنة · بدون شحن",
    description:
      "قالب مخصص لبيع باقات العضويات بتخطيط SaaS فريد يعرض جداول مقارنة الباقات بوضوح ومصداقية.",
  },
  books: {
    name: "قالب الكتب والمحتوى",
    field: "الكتب والملفات والدورات",
    tagline: "مكتبة رقمية · بطاقات غلاف · تحميل فوري",
    description:
      "مكتبة محتوى إلكترونية تعرض الكتب وملفات PDF والدورات التدريبية مع إبراز الغلاف وأزرار تحميل سلسة.",
  },
  accessories: {
    name: "قالب الإكسسوارات الفاخرة",
    field: "المجوهرات والهدايا والساعات",
    tagline: "فاتح فاخر · سبليت هيرو · عاجي وذهبي",
    description:
      "قالب فاخر عالي الأناقة للمنتجات الدقيقة يعتمد على كروت صغيرة وتخطيط واسع يركز على التفاصيل الجمالية.",
  },
  blank: {
    name: "القالب المحايد المرن",
    field: "مرن لجميع الأنشطة",
    tagline: "حياد كامل · قابل للتخصيص · لكل نشاط",
    description:
      "لوحة بيضاء بالكامل وتخطيط بسيط نظيف يمنحك المرونة الكاملة لبناء هوية متجرك من الصفر.",
  },
  personal_services: {
    name: "قالب الخدمات الشخصية",
    field: "الاستشارات والتدريب والخدمات",
    tagline: "هيرو شخصي · باقات خدمات · شهادات عملاء",
    description:
      "قالب مخصص للمدربين والخبراء يعرض سيرة مقدم الخدمة وآراء العملاء وقسم حجز مباشر بهوية موثوقة.",
  },
  general: {
    name: "قالب المتجر العام",
    field: "السوبرماركت والسلع المتنوعة",
    tagline: "شبكة أقسام · فلاش ديلز · منتجات متنوعة",
    description:
      "قالب عام سريع وشبكي عالي الكثافة يضم أقساماً متعددة وشريطاً ترويجياً مناسب لكافة الأنشطة.",
  },
};

// Per-theme visual style for the preview mini-card
const PREVIEW_STYLE: Record<
  string,
  {
    bg: string;
    accent: string;
    cardBg: string;
    textLight: boolean;
    icon: string;
    colors: [string, string, string];
  }
> = {
  fashion: {
    bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    accent: "#e11d48",
    cardBg: "#1e293b",
    textLight: true,
    icon: "👗",
    colors: ["#e11d48", "#f8fafc", "#1e293b"],
  },
  electronics: {
    bg: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    accent: "#2563eb",
    cardBg: "#0f172a",
    textLight: true,
    icon: "💻",
    colors: ["#2563eb", "#60a5fa", "#0f172a"],
  },
  subscriptions: {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)",
    accent: "#7c3aed",
    cardBg: "#1e1b4b",
    textLight: true,
    icon: "🎟️",
    colors: ["#7c3aed", "#a78bfa", "#1e1b4b"],
  },
  books: {
    bg: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
    accent: "#d97706",
    cardBg: "#1c1917",
    textLight: true,
    icon: "📚",
    colors: ["#d97706", "#fbbf24", "#1c1917"],
  },
  accessories: {
    bg: "linear-gradient(135deg, #fef3c7 0%, #fef9ee 100%)",
    accent: "#f59e0b",
    cardBg: "#fef3c7",
    textLight: false,
    icon: "💍",
    colors: ["#f59e0b", "#d97706", "#fef9ee"],
  },
  blank: {
    bg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    accent: "#6366f1",
    cardBg: "#f8fafc",
    textLight: false,
    icon: "⬜",
    colors: ["#6366f1", "#818cf8", "#f1f5f9"],
  },
  personal_services: {
    bg: "linear-gradient(135deg, #fff1f2 0%, #fdf2f8 100%)",
    accent: "#e11d48",
    cardBg: "#fff1f2",
    textLight: false,
    icon: "🌸",
    colors: ["#e11d48", "#fb7185", "#fff1f2"],
  },
  general: {
    bg: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
    accent: "#059669",
    cardBg: "#ecfdf5",
    textLight: false,
    icon: "🛒",
    colors: ["#059669", "#34d399", "#ecfdf5"],
  },
};

export function ThemesClient({ themes, currentThemeId, store }: ThemesClientProps) {
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const pkgSlug = store.packages?.slug || "starter";

  const handleActivate = async (themeId: string) => {
    setActivatingId(themeId);
    try {
      const res = await setActiveThemeAction(themeId);
      if (res.success) {
        toast.success("تم تفعيل القالب الجديد بنجاح! 🎉");
      } else {
        toast.error(res.error || "فشل تفعيل القالب");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع أثناء تفعيل القالب");
    } finally {
      setActivatingId(null);
    }
  };

  const isThemeLocked = (themeSlug: string) => {
    if (pkgSlug === "starter") {
      return themeSlug !== "fashion" && themeSlug !== "blank";
    }
    return false;
  };

  return (
    <div className="page-shell font-cairo text-right">
      <PremiumPageHeader
        icon={Palette}
        title="ثيمات المتجر والمظهر"
        description="اختر ثيماً مناسباً لطبيعة منتجاتك وقم بتخصيص الألوان والمحتوى لتعكس هويتك التجارية."
        actions={
          <div className="flex items-center gap-2 bg-muted border border-border px-4 py-2.5 rounded-xl">
            <span className="text-xs text-muted-foreground">الباقة الحالية:</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              {store.packages?.name || "باقة الانطلاقة"}
            </span>
          </div>
        }
      />

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {themes.map((theme) => {
          const isCurrent = theme.id === currentThemeId;
          const isLocked = isThemeLocked(theme.slug);
          const info = THEME_INFO[theme.slug] || {
            name: theme.name,
            field: "متجر عام",
            tagline: "قالب متنوع",
            description: theme.description || "ثيم متميز لعرض كافة المنتجات.",
          };
          const previewStyle = PREVIEW_STYLE[theme.slug];

          return (
            <div
              key={theme.id}
              className={`relative bg-card border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.01] shadow-card ${
                isCurrent
                  ? "border-primary shadow-[0_0_0_2px_rgba(27,79,216,0.15)]"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {/* ── Preview Box ── */}
              <div
                className="relative aspect-[4/3] overflow-hidden border-b border-border"
                style={
                  previewStyle
                    ? { background: previewStyle.bg }
                    : { background: "linear-gradient(135deg, #1e293b, #0f172a)" }
                }
              >
                {/* Mini browser wireframe */}
                {previewStyle && (
                  <div className="absolute inset-3 rounded-lg overflow-hidden flex flex-col" style={{ background: previewStyle.cardBg, opacity: 0.95 }}>
                    {/* Browser bar */}
                    <div
                      className="flex items-center gap-1 px-2 py-1.5 shrink-0"
                      style={{ background: previewStyle.accent + "22", borderBottom: `1px solid ${previewStyle.accent}33` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                      <div
                        className="flex-1 mx-2 h-2 rounded-full"
                        style={{ background: previewStyle.accent + "33" }}
                      />
                    </div>

                    {/* Hero block */}
                    <div
                      className="px-2 pt-2 pb-1.5 shrink-0"
                      style={{ background: previewStyle.accent + "18" }}
                    >
                      <div
                        className="h-2 w-1/2 rounded-full mb-1"
                        style={{ background: previewStyle.accent + "99" }}
                      />
                      <div
                        className="h-1.5 w-3/4 rounded-full"
                        style={{ background: previewStyle.accent + "55" }}
                      />
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 p-2 grid grid-cols-3 gap-1.5 content-start">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="aspect-square rounded"
                          style={{
                            background: i % 2 === 0
                              ? previewStyle.accent + "22"
                              : previewStyle.accent + "11",
                            border: `1px solid ${previewStyle.accent}22`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Active checkmark badge */}
                {isCurrent && (
                  <div className="absolute top-2 right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-10">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}

                {/* Locked overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-10">
                    <ShieldAlert className="h-7 w-7 text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-200 text-center px-3">
                      غير متوفر في باقتك الحالية
                    </span>
                  </div>
                )}

                {/* Theme icon */}
                {!isLocked && previewStyle && (
                  <div className="absolute bottom-2 left-2 text-lg opacity-80">
                    {previewStyle.icon}
                  </div>
                )}
              </div>

              {/* ── Card Body ── */}
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground shrink-0">
                    {info.field}
                  </span>
                  <h3 className="text-sm font-bold text-foreground text-right leading-tight">
                    {info.name}
                  </h3>
                </div>

                {/* Tagline */}
                <p className="text-[10px] text-muted-foreground leading-relaxed text-right">
                  {info.tagline}
                </p>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground leading-relaxed text-right line-clamp-2 flex-1">
                  {info.description}
                </p>

                {/* Color swatches */}
                {previewStyle && (
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground">الألوان:</span>
                    {previewStyle.colors.map((color, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-border shadow-sm"
                        style={{ background: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-border pt-3 space-y-2">
                  {/* Action Buttons */}
                  {isCurrent ? (
                    <>
                      {/* Preview + Customize for active theme */}
                      <Link
                        href={`/dashboard/themes/preview/${theme.slug}`}
                        className="w-full py-2 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        معاينة الثيم
                      </Link>
                      <Link
                        href="/dashboard/themes/customize"
                        className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <Layout className="h-3.5 w-3.5" />
                        تخصيص المظهر
                      </Link>
                    </>
                  ) : isLocked ? (
                    <>
                      {/* Preview (always allowed) + Upgrade */}
                      <Link
                        href={`/dashboard/themes/preview/${theme.slug}`}
                        className="w-full py-2 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        معاينة الثيم
                      </Link>
                      <Link
                        href="/dashboard/subscription"
                        className="w-full py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        ترقية الباقة للتفعيل
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Preview + Activate for available themes */}
                      <Link
                        href={`/dashboard/themes/preview/${theme.slug}`}
                        className="w-full py-2 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        معاينة الثيم
                      </Link>
                      <button
                        onClick={() => handleActivate(theme.id)}
                        disabled={activatingId !== null}
                        className="w-full py-2 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {activatingId === theme.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            جارٍ التفعيل...
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            تفعيل هذا الثيم
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
