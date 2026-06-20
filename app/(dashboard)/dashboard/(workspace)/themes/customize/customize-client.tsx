"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Palette,
  Loader2,
  Save,
  Upload,
  Eye,
  Sliders,
  Smartphone,
  Monitor,
  Globe,
  Layout,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Send,
  Image as ImageIcon,
  Megaphone,
  Navigation,
  Footprints,
  Sparkles,
  Code2,
} from "lucide-react";
import { TabAi } from "./tab-ai";
import { TabCss } from "./tab-css";
import { cn } from "@/lib/utils";
import {
  themeDraftConfigSchema,
  type ThemeDraftConfigInput,
} from "@/lib/validations/theme-d1";
import {
  saveThemeDraftAction,
  publishThemeDraftAction,
  discardThemeDraftAction,
  uploadThemeAssetAction,
} from "@/actions/theme-customizer";
import { ThemeRenderer } from "@/components/storefront/themes/theme-renderer";
import { ThemeHeader, ThemeFooter } from "@/components/storefront/themes/theme-renderer";
import {
  SECTION_LABELS,
  THEME_DEFAULT_SECTIONS,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_HOMEPAGE_CONFIG,
  type SectionConfig,
  type SectionType,
  type HeaderConfig,
  type FooterConfig,
  SECTION_TYPES,
} from "@/lib/themes/customization-types";
import type { StoreWithTheme } from "@/components/storefront/themes/theme-types";
import type { Theme, Package, StoreThemeSettings, Category } from "@/lib/types/database";
import type { ProductWithImages } from "@/components/storefront/themes/theme-types";
import type { ExtendedThemeSettings } from "@/lib/themes/customization-types";

// ── Props ─────────────────────────────────────────────────────
interface CustomizeClientProps {
  store: StoreWithTheme;
  activeTheme: Theme | null;
  initialSettings: StoreThemeSettings;
  extended: ExtendedThemeSettings;
  hasDraft: boolean;
  categories: Category[];
  products: ProductWithImages[];
  packageData: Package | null;
  availableCredits: number;
  liveCss: string;
  draftCss: string;
}

// ── Tab definition ────────────────────────────────────────────
type TabId =
  | "branding"
  | "colors"
  | "homepage"
  | "sections"
  | "header"
  | "footer"
  | "seo"
  | "preview"
  | "ai"
  | "css";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "branding", label: "الهوية", icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { id: "colors", label: "الألوان", icon: <Palette className="h-3.5 w-3.5" /> },
  { id: "homepage", label: "الرئيسية", icon: <Megaphone className="h-3.5 w-3.5" /> },
  { id: "sections", label: "الأقسام", icon: <Layout className="h-3.5 w-3.5" /> },
  { id: "header", label: "الهيدر", icon: <Navigation className="h-3.5 w-3.5" /> },
  { id: "footer", label: "الفوتر", icon: <Footprints className="h-3.5 w-3.5" /> },
  { id: "seo", label: "SEO", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "preview", label: "المعاينة", icon: <Eye className="h-3.5 w-3.5" /> },
  { id: "ai", label: "الذكاء الاصطناعي", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: "css", label: "CSS مخصص", icon: <Code2 className="h-3.5 w-3.5" /> },
];

const ANNOUNCEMENT_STYLES_MAP: Record<string, string> = {
  primary: "bg-primary text-white",
  amber: "bg-amber-400 text-amber-950",
  emerald: "bg-emerald-600 text-white",
  rose: "bg-rose-500 text-white",
};

const FONTS = [
  { value: "Cairo", label: "Cairo — كلاسيكي عريض" },
  { value: "Tajawal", label: "Tajawal — ناعم وحديث" },
  { value: "Changa", label: "Changa — عريض وهندسي" },
  { value: "Alexandria", label: "Alexandria — هندسي ناعم" },
  { value: "Amiri", label: "Amiri — كلاسيكي شريفي" },
  { value: "IBM Plex Sans Arabic", label: "IBM Plex Arabic — تقني" },
] as const;

// ── Image Upload Helper ───────────────────────────────────────
function useImageUpload(
  onSuccess: (url: string) => void,
  assetType: "logo" | "hero" | "banner" | "favicon"
) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trigger = () => inputRef.current?.click();

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target?.result as string;
          const res = await uploadThemeAssetAction(
            base64,
            file.name,
            file.type,
            assetType
          );
          if (res.url) {
            onSuccess(res.url);
            toast.success("تم رفع الصورة بنجاح ✓");
          } else {
            toast.error(res.error || "فشل رفع الصورة");
          }
          setUploading(false);
        };
        reader.onerror = () => {
          toast.error("فشل قراءة الملف");
          setUploading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        toast.error("حدث خطأ أثناء رفع الصورة");
        setUploading(false);
      }
      // reset input so same file can be re-uploaded
      e.target.value = "";
    },
    [assetType, onSuccess]
  );

  return { trigger, uploading, inputRef, handleFile };
}

// ── Image Field Component ─────────────────────────────────────
function ImageField({
  label,
  value,
  onUpload,
  onClear,
  hint,
  assetType,
}: {
  label: string;
  value: string;
  onUpload: (url: string) => void;
  onClear: () => void;
  hint: string;
  assetType: "logo" | "hero" | "banner" | "favicon";
}) {
  const { trigger, uploading, inputRef, handleFile } = useImageUpload(
    onUpload,
    assetType
  );
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-foreground">{label}</label>
      <div className="flex gap-2 items-start">
        {/* Preview */}
        <div className="w-16 h-16 shrink-0 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => onUpload(e.target.value)}
            placeholder="رابط الصورة أو ارفع من جهازك"
            className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-left font-mono"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={trigger}
              disabled={uploading}
              className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/8 border border-primary/20 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              رفع صورة
            </button>
            {value && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 text-[11px] font-bold text-destructive/70 hover:text-destructive bg-destructive/5 border border-destructive/20 px-2 py-1 rounded-lg transition-all"
              >
                <X className="h-3 w-3" />
                حذف
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ── Color Field Component ─────────────────────────────────────
function ColorField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 bg-transparent border-0 rounded cursor-pointer p-0 shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          placeholder="#1B4FD8"
          className="flex-1 px-3 py-2 bg-input border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-left font-mono"
        />
      </div>
      {error && <p className="text-destructive text-[10px]">{error}</p>}
    </div>
  );
}

// ── Section Item Component ────────────────────────────────────
function SectionItem({
  section,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggle,
  onLabelChange,
  onVisibilityChange,
  onDelete,
}: {
  section: SectionConfig;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onLabelChange: (label: string) => void;
  onVisibilityChange: (field: "mobile" | "desktop", value: boolean) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div
      className={cn(
        "border rounded-xl transition-all",
        section.enabled
          ? "border-border bg-card"
          : "border-dashed border-border bg-muted/40 opacity-60"
      )}
    >
      <div className="flex items-center gap-2 p-3">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="أعلى"
          >
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="أسفل"
          >
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Toggle enabled */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-8 h-5 rounded-full transition-all shrink-0 relative",
            section.enabled ? "bg-primary" : "bg-border"
          )}
          title={section.enabled ? "إخفاء القسم" : "إظهار القسم"}
        >
          <span
            className={cn(
              "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
              section.enabled ? "right-0.5" : "left-0.5"
            )}
          />
        </button>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{section.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {SECTION_LABELS[section.type] || section.type}
          </p>
        </div>

        {/* Expand + Delete */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-[10px] font-bold"
            title="إعدادات"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`حذف قسم "${section.label}"؟`)) onDelete();
            }}
            className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            title="حذف القسم"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/30">
          {/* Label editor */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground">
              اسم القسم (يظهر للتاجر فقط)
            </label>
            <input
              type="text"
              value={section.label}
              onChange={(e) => onLabelChange(e.target.value)}
              maxLength={60}
              className="w-full px-2 py-1.5 bg-input border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right"
            />
          </div>

          {/* Visibility toggles */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground">
              الظهور
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.visibility.desktop}
                  onChange={(e) =>
                    onVisibilityChange("desktop", e.target.checked)
                  }
                  className="rounded"
                />
                <Monitor className="h-3 w-3 text-muted-foreground" />
                كمبيوتر
              </label>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.visibility.mobile}
                  onChange={(e) =>
                    onVisibilityChange("mobile", e.target.checked)
                  }
                  className="rounded"
                />
                <Smartphone className="h-3 w-3 text-muted-foreground" />
                جوال
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export function CustomizeClient({
  store,
  activeTheme,
  initialSettings,
  extended,
  hasDraft,
  categories,
  products,
  availableCredits,
  liveCss,
  draftCss,
}: CustomizeClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("branding");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isSavingDraft, startSaveDraft] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const [isDiscarding, startDiscard] = useTransition();
  const [isDirty, setIsDirty] = useState(false);

  const themeSlug = activeTheme?.slug || "fashion";
  const defaultSections =
    THEME_DEFAULT_SECTIONS[themeSlug] || THEME_DEFAULT_SECTIONS["fashion"];

  // Resolve initial values: draft → live
  const draft = extended.draft_config;
  const liveSectionsConfig =
    extended.sections_config && extended.sections_config.length > 0
      ? extended.sections_config
      : defaultSections;

  const defaultValues: ThemeDraftConfigInput = {
    primary_color: draft?.primary_color ?? initialSettings.primary_color ?? "#1B4FD8",
    secondary_color: draft?.secondary_color ?? initialSettings.secondary_color ?? "#7C3AED",
    accent_color: draft?.accent_color ?? initialSettings.accent_color ?? "#F59E0B",
    font_family: (draft?.font_family ?? initialSettings.font_family ?? "Cairo") as ThemeDraftConfigInput["font_family"],
    hero_title: draft?.hero_title ?? initialSettings.hero_title ?? "",
    hero_subtitle: draft?.hero_subtitle ?? initialSettings.hero_subtitle ?? "",
    hero_image_url: draft?.hero_image_url ?? initialSettings.hero_image_url ?? "",
    logo_url: draft?.logo_url ?? initialSettings.logo_url ?? "",
    favicon_url: draft?.favicon_url ?? initialSettings.favicon_url ?? "",
    footer_content: draft?.footer_content ?? initialSettings.footer_content ?? "",
    sections_config: (draft?.sections_config ?? liveSectionsConfig) as SectionConfig[],
    header_config: draft?.header_config ?? extended.header_config ?? DEFAULT_HEADER_CONFIG,
    footer_config: draft?.footer_config ?? extended.footer_config ?? DEFAULT_FOOTER_CONFIG,
    homepage_config: draft?.homepage_config ?? extended.homepage_config ?? DEFAULT_HOMEPAGE_CONFIG,
  };

  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ThemeDraftConfigInput>({
    resolver: zodResolver(themeDraftConfigSchema),
    defaultValues,
  });

  // Watch for preview
  const watched = watch();
  const markDirty = () => setIsDirty(true);

  // Sections state (managed separately for better UX)
  const [sections, setSections] = useState<SectionConfig[]>(
    defaultValues.sections_config as SectionConfig[]
  );

  // Sync sections into form
  const updateSections = (next: SectionConfig[]) => {
    setSections(next);
    setValue("sections_config", next);
    markDirty();
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const next = [...sections];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    next.forEach((s, i) => (s.order = i));
    updateSections(next);
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const next = [...sections];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    next.forEach((s, i) => (s.order = i));
    updateSections(next);
  };

  const toggleSection = (index: number) => {
    const next = [...sections];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    updateSections(next);
  };

  const updateSectionLabel = (index: number, label: string) => {
    const next = [...sections];
    next[index] = { ...next[index], label };
    updateSections(next);
  };

  const updateSectionVisibility = (
    index: number,
    field: "mobile" | "desktop",
    value: boolean
  ) => {
    const next = [...sections];
    next[index] = {
      ...next[index],
      visibility: { ...next[index].visibility, [field]: value },
    };
    updateSections(next);
  };

  const deleteSection = (index: number) => {
    const next = sections.filter((_, i) => i !== index);
    next.forEach((s, i) => (s.order = i));
    updateSections(next);
  };

  const addSection = (type: SectionType) => {
    const newSection: SectionConfig = {
      id: `custom-${type}-${Date.now()}`,
      type,
      enabled: true,
      order: sections.length,
      label: SECTION_LABELS[type],
      settings: {},
      visibility: { mobile: true, desktop: true },
    };
    updateSections([...sections, newSection]);
  };

  // Nav links state
  const navLinks = watch("header_config.nav_links") || [];
  const addNavLink = () => {
    const current = getValues("header_config.nav_links") || [];
    setValue("header_config.nav_links", [
      ...current,
      { label: "رابط جديد", href: "/" },
    ]);
    markDirty();
  };
  const removeNavLink = (i: number) => {
    const current = getValues("header_config.nav_links") || [];
    setValue(
      "header_config.nav_links",
      current.filter((_, idx) => idx !== i)
    );
    markDirty();
  };

  // ── Save Draft ──────────────────────────────────────────────
  const handleSaveDraft = () => {
    startSaveDraft(async () => {
      const data = getValues();
      data.sections_config = sections;
      const res = await saveThemeDraftAction(data);
      if (res.success) {
        toast.success("تم حفظ المسودة ✓");
        setIsDirty(false);
        router.refresh();
      } else {
        toast.error(res.error || "فشل حفظ المسودة");
      }
    });
  };

  // ── Publish ─────────────────────────────────────────────────
  const handlePublish = () => {
    // Always save current form state as draft first, then publish.
    // This ensures Publish works even if the user hasn't explicitly saved a draft.
    startPublish(async () => {
      const data = getValues();
      data.sections_config = sections;
      const saveRes = await saveThemeDraftAction(data);
      if (!saveRes.success) {
        toast.error(saveRes.error || "فشل حفظ المسودة");
        return;
      }
      const res = await publishThemeDraftAction();
      if (res.success) {
        toast.success("تم نشر التعديلات على المتجر الحي! 🚀");
        setIsDirty(false);
        router.refresh();
      } else {
        toast.error(res.error || "فشل النشر");
      }
    });
  };

  // ── Discard Draft ───────────────────────────────────────────
  const handleDiscard = () => {
    startDiscard(async () => {
      const res = await discardThemeDraftAction();
      if (res.success) {
        toast.info("تم تجاهل المسودة");
        setIsDirty(false);
        router.refresh();
      } else {
        toast.error(res.error || "فشل تجاهل المسودة");
      }
    });
  };

  // ── Build draft settings for live preview ──────────────────
  // Inject current form values into .settings JSONB so theme components
  // reading getOrderedSections(settings, defaults) and header/footer configs
  // reflect live changes without requiring a save/publish cycle.
  const previewSettings: StoreThemeSettings = {
    ...initialSettings,
    primary_color: watched.primary_color || initialSettings.primary_color,
    secondary_color: watched.secondary_color || initialSettings.secondary_color,
    accent_color: watched.accent_color || initialSettings.accent_color,
    font_family: watched.font_family || initialSettings.font_family,
    hero_title: watched.hero_title || null,
    hero_subtitle: watched.hero_subtitle || null,
    hero_image_url: watched.hero_image_url || null,
    logo_url: watched.logo_url || null,
    footer_content: watched.footer_config?.text || watched.footer_content || null,
    sections_order: sections.filter((s) => s.enabled).map((s) => s.type),
    hidden_sections: sections.filter((s) => !s.enabled).map((s) => s.type),
    settings: {
      ...(initialSettings.settings as any ?? {}),
      sections_config: sections,
      header_config: watched.header_config,
      footer_config: watched.footer_config,
      homepage_config: watched.homepage_config,
    } as any,
  };

  // Demo click interceptor for preview panel
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    if (!href || href === "#" || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("https://") || href.startsWith("http://")) return;
    if (href.startsWith("/dashboard/")) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const themeIsPublished = !!extended.published_at;
  const isWorking = isSavingDraft || isPublishing || isDiscarding;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="font-cairo text-right" dir="rtl">
      {/* ── Top Action Bar ── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">
            تخصيص: {activeTheme?.name || "الثيم الحالي"}
          </h1>
          {/* Draft / Dirty indicator */}
          {(hasDraft || isDirty) && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="h-3 w-3" />
              {isDirty ? "تعديلات غير محفوظة" : "مسودة محفوظة"}
            </span>
          )}
          {themeIsPublished && !hasDraft && !isDirty && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3 w-3" />
              منشور
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Discard */}
          {(hasDraft || isDirty) && (
            <button
              type="button"
              data-testid="discard-draft-btn"
              onClick={handleDiscard}
              disabled={isWorking}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-muted-foreground border border-border bg-card hover:bg-muted rounded-xl transition-all disabled:opacity-50"
            >
              {isDiscarding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              تجاهل المسودة
            </button>
          )}

          {/* Save Draft */}
          <button
            type="button"
            data-testid="save-draft-btn"
            onClick={handleSaveDraft}
            disabled={isWorking}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-foreground border border-border bg-card hover:bg-muted rounded-xl transition-all disabled:opacity-50"
          >
            {isSavingDraft ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            حفظ مسودة
          </button>

          {/* Publish */}
          <button
            type="button"
            data-testid="publish-btn"
            onClick={handlePublish}
            disabled={isWorking}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl transition-all disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            نشر التعديلات
          </button>
        </div>
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-190px)]">

        {/* ── LEFT: Form Panel ── */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl flex flex-col h-full overflow-hidden shadow-card">
          {/* Tabs — 2 rows of 5 */}
          {[TABS.slice(0, 5), TABS.slice(5)].map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-5 border-b border-border bg-muted/20 shrink-0">
              {row.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  data-state={activeTab === tab.id ? "active" : "inactive"}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2.5 border-b-2 text-[10px] font-bold transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          ))}

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* ── TAB 1: BRANDING ── */}
            {activeTab === "branding" && (
              <div className="space-y-5">
                <ImageField
                  label="شعار المتجر (Logo)"
                  value={watched.logo_url || ""}
                  onUpload={(url) => { setValue("logo_url", url); markDirty(); }}
                  onClear={() => { setValue("logo_url", ""); markDirty(); }}
                  hint="المقاس المناسب: 512×512 بكسل — PNG أو SVG"
                  assetType="logo"
                />
                <ImageField
                  label="أيقونة المتجر (Favicon)"
                  value={watched.favicon_url || ""}
                  onUpload={(url) => { setValue("favicon_url", url); markDirty(); }}
                  onClear={() => { setValue("favicon_url", ""); markDirty(); }}
                  hint="المقاس المناسب: 32×32 أو 64×64 — ICO أو PNG"
                  assetType="favicon"
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    خط المتجر
                  </label>
                  <select
                    value={watched.font_family || "Cairo"}
                    onChange={(e) => { setValue("font_family", e.target.value as ThemeDraftConfigInput["font_family"]); markDirty(); }}
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── TAB 2: COLORS ── */}
            {activeTab === "colors" && (
              <div className="space-y-4">
                <ColorField
                  label="اللون الأساسي"
                  value={watched.primary_color || "#1B4FD8"}
                  onChange={(v) => { setValue("primary_color", v); markDirty(); }}
                  error={errors.primary_color?.message}
                />
                <ColorField
                  label="اللون الثانوي"
                  value={watched.secondary_color || "#7C3AED"}
                  onChange={(v) => { setValue("secondary_color", v); markDirty(); }}
                  error={errors.secondary_color?.message}
                />
                <ColorField
                  label="لون التمييز والأزرار"
                  value={watched.accent_color || "#F59E0B"}
                  onChange={(v) => { setValue("accent_color", v); markDirty(); }}
                  error={errors.accent_color?.message}
                />
                {/* Color Presets */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-[10px] font-bold text-muted-foreground">
                    ألوان جاهزة
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: "أزرق", p: "#1B4FD8", s: "#7C3AED", a: "#F59E0B" },
                      { name: "أخضر", p: "#059669", s: "#047857", a: "#10B981" },
                      { name: "وردي", p: "#e11d48", s: "#be185d", a: "#f43f5e" },
                      { name: "بنفسجي", p: "#7c3aed", s: "#6d28d9", a: "#a78bfa" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setValue("primary_color", preset.p);
                          setValue("secondary_color", preset.s);
                          setValue("accent_color", preset.a);
                          markDirty();
                        }}
                        className="flex flex-col items-center gap-1 p-2 border border-border rounded-xl hover:border-primary/40 hover:bg-muted transition-all"
                      >
                        <div className="flex gap-0.5">
                          <span className="w-3 h-3 rounded-full" style={{ background: preset.p }} />
                          <span className="w-3 h-3 rounded-full" style={{ background: preset.s }} />
                          <span className="w-3 h-3 rounded-full" style={{ background: preset.a }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: HOMEPAGE ── */}
            {activeTab === "homepage" && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    عنوان الهيرو الرئيسي
                  </label>
                  <input
                    {...register("hero_title", { onChange: markDirty })}
                    type="text"
                    placeholder="مثال: تشكيلة الموسم الجديد"
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right"
                  />
                  {errors.hero_title && (
                    <p className="text-destructive text-[10px]">{errors.hero_title.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    العنوان الفرعي للهيرو
                  </label>
                  <textarea
                    {...register("hero_subtitle", { onChange: markDirty })}
                    rows={3}
                    placeholder="نص قصير يدعم عنوان الهيرو..."
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right resize-none"
                  />
                </div>
                <ImageField
                  label="صورة خلفية الهيرو"
                  value={watched.hero_image_url || ""}
                  onUpload={(url) => { setValue("hero_image_url", url); markDirty(); }}
                  onClear={() => { setValue("hero_image_url", ""); markDirty(); }}
                  hint="المقاس المناسب: 1400×900 بكسل — JPG أو WebP"
                  assetType="hero"
                />

                {/* Announcement Bar */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={watched.homepage_config?.show_announcement_bar ?? false}
                        onChange={(e) => {
                          setValue("homepage_config.show_announcement_bar", e.target.checked);
                          markDirty();
                        }}
                        className="rounded"
                      />
                      <span className="text-xs font-bold text-foreground">
                        شريط الإعلان (Announcement Bar)
                      </span>
                    </label>
                  </div>
                  {watched.homepage_config?.show_announcement_bar && (
                    <div className="space-y-3 pr-4 border-r-2 border-primary/30">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground">
                          نص الإعلان
                        </label>
                        <input
                          {...register("homepage_config.announcement_text", { onChange: markDirty })}
                          type="text"
                          placeholder="مثال: شحن مجاني للطلبات فوق 150 ₪"
                          maxLength={200}
                          className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-right"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground">
                          رابط الإعلان (اختياري)
                        </label>
                        <input
                          {...register("homepage_config.announcement_link", { onChange: markDirty })}
                          type="text"
                          placeholder="/products أو /offers"
                          className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-left"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground">
                          لون شريط الإعلان
                        </label>
                        <select
                          value={watched.homepage_config?.announcement_style || "primary"}
                          onChange={(e) => {
                            setValue("homepage_config.announcement_style", e.target.value as "primary" | "amber" | "emerald" | "rose");
                            markDirty();
                          }}
                          className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="primary">أزرق (الأساسي)</option>
                          <option value="amber">عنبري</option>
                          <option value="emerald">أخضر</option>
                          <option value="rose">وردي</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: SECTIONS ── */}
            {activeTab === "sections" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    {sections.filter((s) => s.enabled).length} قسم مفعّل من {sections.length}
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    الأقسام ({sections.length})
                  </p>
                </div>

                {/* Section list */}
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <SectionItem
                      key={section.id}
                      section={section}
                      index={index}
                      total={sections.length}
                      onMoveUp={() => moveSectionUp(index)}
                      onMoveDown={() => moveSectionDown(index)}
                      onToggle={() => toggleSection(index)}
                      onLabelChange={(label) => updateSectionLabel(index, label)}
                      onVisibilityChange={(field, value) =>
                        updateSectionVisibility(index, field, value)
                      }
                      onDelete={() => deleteSection(index)}
                    />
                  ))}
                </div>

                {/* Add Section */}
                {sections.length < 20 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-[10px] font-bold text-muted-foreground mb-2">
                      إضافة قسم جديد:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SECTION_TYPES.filter(
                        (t) =>
                          !["hero", "about_text", "contact_section"].includes(t) ||
                          !sections.some((s) => s.type === t)
                      )
                        .slice(0, 8)
                        .map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addSection(type)}
                            className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          >
                            <Plus className="h-3 w-3 shrink-0" />
                            {SECTION_LABELS[type]}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 5: HEADER ── */}
            {activeTab === "header" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">شكل الشعار</label>
                    <select
                      value={watched.header_config?.logo_style || "rounded"}
                      onChange={(e) => { setValue("header_config.logo_style", e.target.value as "square" | "circle" | "rounded"); markDirty(); }}
                      className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="rounded">مستدير الزوايا</option>
                      <option value="circle">دائري</option>
                      <option value="square">مربع</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">خلفية الهيدر</label>
                    <select
                      value={watched.header_config?.background || "white"}
                      onChange={(e) => { setValue("header_config.background", e.target.value as "white" | "card" | "primary"); markDirty(); }}
                      className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="white">أبيض</option>
                      <option value="card">كارد (رمادي فاتح)</option>
                      <option value="primary">اللون الأساسي</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { key: "sticky", label: "هيدر ثابت عند التمرير" },
                    { key: "show_nav", label: "إظهار قائمة التنقل" },
                    { key: "show_search", label: "إظهار أيقونة البحث" },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(watched.header_config as Record<string, unknown>)?.[opt.key] as boolean ?? true}
                        onChange={(e) => {
                          setValue(`header_config.${opt.key as "sticky" | "show_nav" | "show_search"}`, e.target.checked);
                          markDirty();
                        }}
                        className="rounded"
                      />
                      <span className="text-xs font-bold text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Nav Links */}
                {watched.header_config?.show_nav && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={addNavLink}
                        disabled={(navLinks?.length ?? 0) >= 8}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                        إضافة رابط
                      </button>
                      <p className="text-xs font-bold text-foreground">
                        روابط القائمة ({navLinks?.length ?? 0}/8)
                      </p>
                    </div>
                    <div className="space-y-2">
                      {(navLinks || []).map((link, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => removeNavLink(i)}
                            className="p-1 text-destructive/60 hover:text-destructive shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <input
                            value={link.href}
                            onChange={(e) => {
                              const next = [...navLinks];
                              next[i] = { ...next[i], href: e.target.value };
                              setValue("header_config.nav_links", next);
                              markDirty();
                            }}
                            placeholder="/products"
                            className="flex-1 px-2 py-1.5 bg-input border border-border rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50 text-left font-mono"
                          />
                          <input
                            value={link.label}
                            onChange={(e) => {
                              const next = [...navLinks];
                              next[i] = { ...next[i], label: e.target.value };
                              setValue("header_config.nav_links", next);
                              markDirty();
                            }}
                            placeholder="المنتجات"
                            maxLength={40}
                            className="w-24 px-2 py-1.5 bg-input border border-border rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50 text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 6: FOOTER ── */}
            {activeTab === "footer" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">تخطيط الفوتر</label>
                  <select
                    value={watched.footer_config?.layout || "simple"}
                    onChange={(e) => { setValue("footer_config.layout", e.target.value as "simple" | "columns" | "minimal"); markDirty(); }}
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="simple">بسيط (3 أعمدة)</option>
                    <option value="minimal">مُصغَّر (سطر واحد)</option>
                    <option value="columns">أعمدة (قريباً)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    نص حول المتجر (Footer Content)
                  </label>
                  <textarea
                    value={watched.footer_config?.text || watched.footer_content || ""}
                    onChange={(e) => {
                      setValue("footer_config.text", e.target.value);
                      setValue("footer_content", e.target.value);
                      markDirty();
                    }}
                    rows={3}
                    maxLength={500}
                    placeholder="نص قصير يظهر أسفل الموقع حول متجرك..."
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-right resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground text-left">
                    {(watched.footer_config?.text || "").length}/500
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { key: "show_social", label: "إظهار أيقونات التواصل الاجتماعي" },
                    { key: "show_newsletter", label: "إظهار نموذج النشرة البريدية" },
                    { key: "show_powered_by", label: "إظهار \"مشغّل بواسطة سبأ ستور\"" },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(watched.footer_config as Record<string, unknown>)?.[opt.key] as boolean ?? true}
                        onChange={(e) => {
                          setValue(`footer_config.${opt.key as "show_social" | "show_newsletter" | "show_powered_by"}`, e.target.checked);
                          markDirty();
                        }}
                        className="rounded"
                      />
                      <span className="text-xs font-bold text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 7: SEO ── */}
            {activeTab === "seo" && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-700 leading-relaxed">
                  إعدادات SEO تساعد محركات البحث على فهم محتوى متجرك وعرضه في نتائج البحث بشكل أفضل.
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    عنوان الصفحة الرئيسية (Meta Title)
                  </label>
                  <input
                    {...register("homepage_config.meta_title", { onChange: markDirty })}
                    type="text"
                    placeholder="اسم متجرك — وصف قصير"
                    maxLength={100}
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-right"
                  />
                  <p className="text-[10px] text-muted-foreground text-left">
                    {(watched.homepage_config?.meta_title || "").length}/100 حرف
                  </p>
                  {errors.homepage_config?.meta_title && (
                    <p className="text-destructive text-[10px]">{errors.homepage_config.meta_title.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    وصف الصفحة الرئيسية (Meta Description)
                  </label>
                  <textarea
                    {...register("homepage_config.meta_description", { onChange: markDirty })}
                    rows={3}
                    placeholder="وصف مختصر للمتجر يظهر في نتائج البحث..."
                    maxLength={300}
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-right resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground text-left">
                    {(watched.homepage_config?.meta_description || "").length}/300 حرف
                  </p>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <TabAi
                availableCredits={availableCredits}
                onDraftApplied={() => { router.refresh(); setActiveTab("branding"); }}
              />
            )}

            {activeTab === "css" && (
              <TabCss liveCss={liveCss} draftCss={draftCss} />
            )}

            {activeTab === "preview" && (
              <div className="space-y-3">
                <div className="p-3 bg-muted border border-border rounded-xl text-xs text-muted-foreground leading-relaxed">
                  المعاينة الحية تعكس التعديلات الحالية. استخدم الشاشة اليمنى لمعاينة النتيجة الكاملة.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border rounded-xl transition-all",
                      previewMode === "desktop"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Monitor className="h-4 w-4" />
                    كمبيوتر
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border rounded-xl transition-all",
                      previewMode === "mobile"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                    جوال
                  </button>
                </div>
                <a
                  href={`/store/${store.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted transition-all"
                >
                  <Globe className="h-4 w-4" />
                  فتح المتجر في تبويب جديد
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Live Preview Panel ── */}
        <div className="lg:col-span-7 h-full flex flex-col">
          {/* Preview toolbar */}
          <div className="flex justify-between items-center bg-card border border-border px-4 py-2.5 rounded-t-2xl shadow-card shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                  previewMode === "desktop"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
                كمبيوتر
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                  previewMode === "mobile"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                جوال
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Eye className="h-4 w-4 text-primary" />
              معاينة حية — {previewMode === "desktop" ? "سطح المكتب" : "الجوال"}
            </div>
          </div>

          {/* Preview area */}
          <div
            className={cn(
              "flex-1 border-x border-b border-border rounded-b-2xl overflow-hidden",
              previewMode === "mobile" ? "bg-slate-100 flex items-start justify-center py-6" : "bg-background"
            )}
          >
            <div
              className={cn(
                "flex flex-col overflow-auto transition-all duration-300",
                previewMode === "mobile"
                  ? "w-[390px] max-h-full shadow-2xl rounded-[2rem] border-4 border-slate-300 bg-background overflow-hidden"
                  : "w-full h-full"
              )}
              style={{
                "--primary": previewSettings.primary_color,
                "--secondary": previewSettings.secondary_color,
                "--accent": previewSettings.accent_color,
                fontFamily: `${previewSettings.font_family || "Cairo"}, sans-serif`,
              } as React.CSSProperties}
              onClickCapture={handlePreviewClick}
            >
              {/* Announcement bar — mirrors storefront layout */}
              {watched.homepage_config?.show_announcement_bar && watched.homepage_config.announcement_text && (
                <div
                  className={cn(
                    "w-full py-2 px-4 text-center text-xs font-semibold font-cairo",
                    ANNOUNCEMENT_STYLES_MAP[watched.homepage_config.announcement_style ?? "primary"] ?? "bg-primary text-white"
                  )}
                  dir="rtl"
                >
                  {watched.homepage_config.announcement_text}
                </div>
              )}
              <ThemeHeader store={store} settings={previewSettings} headerConfig={watched.header_config as HeaderConfig} />
              <main className="flex-1 flex flex-col bg-background">
                <ThemeRenderer
                  store={store}
                  categories={categories}
                  products={products}
                  settings={previewSettings}
                />
              </main>
              <ThemeFooter store={store} settings={previewSettings} footerConfig={watched.footer_config as FooterConfig} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
