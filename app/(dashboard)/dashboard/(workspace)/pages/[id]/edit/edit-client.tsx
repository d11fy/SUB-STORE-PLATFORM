"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Save,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  updateStorePageAction,
  publishStorePageAction,
  unpublishStorePageAction,
  deleteStorePageAction,
} from "@/actions/store-pages";
import {
  PAGE_SECTION_TYPES,
  PAGE_SECTION_LABELS,
  RESERVED_SLUGS,
  type PageSectionType,
  type UpdatePageInput,
} from "@/lib/validations/pages";
import type { SectionConfig } from "@/lib/themes/customization-types";
import type { StorePage } from "@/lib/types/database";

// ── Default settings per page section type ────────────────────
const DEFAULT_SETTINGS: Record<PageSectionType, Record<string, unknown>> = {
  hero: { title: "", subtitle: "", cta_primary_label: "تسوق الآن" },
  about_text: { title: "من نحن", content: "" },
  faq: { title: "الأسئلة الشائعة", items: [] },
  contact_section: { title: "تواصل معنا", email: "", phone: "", address: "" },
  testimonials: { title: "آراء العملاء", items: [] },
  trust_badges: { title: "لماذا تختارنا" },
  image_gallery: { title: "معرض الصور" },
  promo_banner: {
    title: "عرض خاص",
    description: "",
    badge_label: "",
    cta_label: "تسوق الآن",
  },
  newsletter: {
    title: "اشترك في نشرتنا البريدية",
    subtitle: "احصل على أحدث العروض",
  },
};

// ── Safe string accessor ──────────────────────────────────────
function str(s: Record<string, unknown>, k: string): string {
  return typeof s[k] === "string" ? (s[k] as string) : "";
}
function strArr(s: Record<string, unknown>, k: string): unknown[] {
  return Array.isArray(s[k]) ? (s[k] as unknown[]) : [];
}

interface EditPageClientProps {
  page: StorePage;
  initialSections: SectionConfig[];
  storeSlug: string;
}

type TabKey = "content" | "seo";

export function EditPageClient({
  page,
  initialSections,
  storeSlug,
}: EditPageClientProps) {
  const router = useRouter();
  const [isSaving, startSave] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  // Page fields
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [metaTitle, setMetaTitle] = useState(page.meta_title ?? "");
  const [metaDesc, setMetaDesc] = useState(page.meta_description ?? "");
  const [showInHeader, setShowInHeader] = useState(page.show_in_header);
  const [showInFooter, setShowInFooter] = useState(page.show_in_footer);

  // Sections state
  const [sections, setSections] = useState<SectionConfig[]>(initialSections);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialSections[0]?.id ?? null
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close add-section dropdown when clicking outside
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAddMenu]);

  const [activeTab, setActiveTab] = useState<TabKey>("content");

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? null;

  // ── Sections helpers ────────────────────────────────────────
  const updateSection = (id: string, patch: Partial<SectionConfig>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const updateSectionSettings = (
    id: string,
    settings: Record<string, unknown>
  ) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, settings } : s))
    );
  };

  const addSection = (type: PageSectionType) => {
    const newSection: SectionConfig = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      order: sections.length,
      label: PAGE_SECTION_LABELS[type],
      settings: { ...DEFAULT_SETTINGS[type] },
      visibility: { mobile: true, desktop: true },
    };
    setSections((prev) => [...prev, newSection]);
    setActiveSectionId(newSection.id);
    setShowAddMenu(false);
  };

  const deleteSection = (id: string) => {
    if (!window.confirm("حذف هذا القسم؟")) return;
    setSections((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, i) => ({ ...s, order: i }));
    });
    if (activeSectionId === id) {
      setActiveSectionId(sections.find((s) => s.id !== id)?.id ?? null);
    }
  };

  const moveSection = (id: string, dir: "up" | "down") => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  // ── Save draft ──────────────────────────────────────────────
  const handleSave = () => {
    startSave(async () => {
      const res = await updateStorePageAction(page.id, {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        // SectionConfig uses the full 15-type union; page sections use a subset.
        // Runtime Zod validation in the action filters unknown types.
        sections_config: sections as unknown as UpdatePageInput["sections_config"],
        meta_title: metaTitle || undefined,
        meta_description: metaDesc || undefined,
        show_in_header: showInHeader,
        show_in_footer: showInFooter,
      });
      if (res.success) {
        toast.success("تم حفظ التعديلات");
        router.refresh();
      } else {
        toast.error(res.error ?? "فشل الحفظ");
      }
    });
  };

  // ── Publish ─────────────────────────────────────────────────
  const handlePublish = () => {
    startPublish(async () => {
      // Save first, then publish
      const saveRes = await updateStorePageAction(page.id, {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        sections_config: sections as unknown as UpdatePageInput["sections_config"],
        meta_title: metaTitle || undefined,
        meta_description: metaDesc || undefined,
        show_in_header: showInHeader,
        show_in_footer: showInFooter,
      });
      if (!saveRes.success) {
        toast.error(saveRes.error ?? "فشل الحفظ");
        return;
      }
      const pubRes = await publishStorePageAction(page.id);
      if (pubRes.success) {
        toast.success("تم نشر الصفحة على المتجر 🚀");
        router.refresh();
      } else {
        toast.error(pubRes.error ?? "فشل النشر");
      }
    });
  };

  // ── Unpublish ───────────────────────────────────────────────
  const handleUnpublish = () => {
    startPublish(async () => {
      const res = await unpublishStorePageAction(page.id);
      if (res.success) {
        toast.success("تم إلغاء نشر الصفحة");
        router.refresh();
      } else {
        toast.error(res.error ?? "فشل إلغاء النشر");
      }
    });
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = () => {
    if (!window.confirm(`حذف صفحة "${title}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    startDelete(async () => {
      const res = await deleteStorePageAction(page.id);
      if (res.success) {
        toast.success("تم حذف الصفحة");
        router.push("/dashboard/pages");
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
    });
  };

  const isPending = isSaving || isPublishing || isDeleting;

  const slugError: string | null = (() => {
    const s = slug.trim();
    if (!s) return "الـ slug مطلوب";
    if (s.length > 60) return "الـ slug لا يمكن أن يتجاوز 60 حرفاً";
    if (s.includes("--")) return "الـ slug لا يمكن أن يحتوي على شرطتين متتاليتين";
    if (RESERVED_SLUGS.has(s)) return "هذا الـ slug محجوز للنظام ولا يمكن استخدامه";
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{2}$/.test(s))
      return "أحرف إنجليزية صغيرة وأرقام وشرطات فقط، ولا يبدأ أو ينتهي بشرطة";
    return null;
  })();

  return (
    <div className="flex flex-col h-full min-h-dvh bg-background">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pages"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-bold text-sm text-foreground font-cairo truncate max-w-xs">
              {title || "صفحة بدون عنوان"}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  page.status === "published"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {page.status === "published" ? "منشور" : "مسودة"}
              </span>
              {page.status === "published" && (
                <a
                  href={`/store/${storeSlug}/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  عرض <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save draft */}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-sm font-bold rounded-xl border border-border hover:bg-muted/80 transition-all font-cairo disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ
          </button>

          {/* Publish / Unpublish */}
          {page.status === "draft" ? (
            <button
              onClick={handlePublish}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo disabled:opacity-60"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              نشر
            </button>
          ) : (
            <button
              onClick={handleUnpublish}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold rounded-xl hover:bg-amber-100 transition-all font-cairo disabled:opacity-60"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              إلغاء النشر
            </button>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
            title="حذف الصفحة"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex gap-6">
          {(["content", "seo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-bold font-cairo border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "content" ? "المحتوى والأقسام" : "SEO والإعدادات"}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* ── Content Tab ── */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* Left: Section list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground font-cairo">
                  أقسام الصفحة
                </p>
                <div className="relative" ref={addMenuRef}>
                  <button
                    onClick={() => setShowAddMenu((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all font-cairo"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة قسم
                  </button>
                  {showAddMenu && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                      {PAGE_SECTION_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => addSection(type)}
                          className="w-full text-right px-4 py-2.5 text-sm hover:bg-muted text-foreground transition-colors font-cairo"
                        >
                          {PAGE_SECTION_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {sections.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm bg-muted/30 rounded-xl border border-border border-dashed">
                  لا توجد أقسام — أضف قسماً للبدء
                </div>
              )}

              <div className="space-y-2">
                {sections
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((section, idx) => (
                    <div
                      key={section.id}
                      onClick={() => setActiveSectionId(section.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        activeSectionId === section.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      {/* Toggle enable */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSection(section.id, {
                            enabled: !section.enabled,
                          });
                        }}
                        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          section.enabled
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                        title={section.enabled ? "تعطيل" : "تفعيل"}
                      >
                        {section.enabled && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>

                      <span className="flex-1 text-sm font-medium text-foreground font-cairo truncate text-right">
                        {section.label}
                      </span>

                      {/* Reorder */}
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "up");
                          }}
                          disabled={idx === 0}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "down");
                          }}
                          disabled={idx === sections.length - 1}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Section settings editor */}
            <div>
              {activeSection ? (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground font-cairo">
                      {activeSection.label}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-muted rounded-lg text-muted-foreground">
                      {PAGE_SECTION_LABELS[activeSection.type as PageSectionType] ?? activeSection.type}
                    </span>
                  </div>

                  {/* Section label (name) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground font-cairo">
                      اسم القسم في القائمة
                    </label>
                    <input
                      type="text"
                      value={activeSection.label}
                      onChange={(e) =>
                        updateSection(activeSection.id, { label: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-right"
                    />
                  </div>

                  <div className="border-t border-border" />

                  {/* Type-specific settings */}
                  <SectionSettingsEditor
                    section={activeSection}
                    onUpdate={(settings) =>
                      updateSectionSettings(activeSection.id, settings)
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-muted/30 rounded-2xl border border-border border-dashed text-muted-foreground space-y-2">
                  <Eye className="h-8 w-8 opacity-30" />
                  <p className="text-sm">اختر قسماً لتعديل محتواه</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SEO Tab ── */}
        {activeTab === "seo" && (
          <div className="max-w-xl space-y-5">
            {/* Page title and slug */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-foreground font-cairo">
                معلومات الصفحة
              </h3>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground font-cairo">
                  عنوان الصفحة *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground font-cairo">
                  الـ Slug (رابط الصفحة) *
                </label>
                <div
                  className={`flex items-center rounded-lg border overflow-hidden bg-input focus-within:ring-2 focus-within:ring-ring ${
                    slugError ? "border-red-400" : "border-border"
                  }`}
                  dir="ltr"
                >
                  <span className="px-3 py-3 text-xs text-muted-foreground bg-muted border-l border-border shrink-0">
                    /store/{storeSlug}/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    className="flex-1 px-3 py-3 bg-transparent text-sm text-foreground focus:outline-none"
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-red-600">{slugError}</p>
                )}
                {!slugError && page.status === "published" && (
                  <p className="text-xs text-amber-600">
                    ⚠️ تغيير الـ slug على صفحة منشورة سيُبطل الروابط المشاركة
                  </p>
                )}
              </div>
            </div>

            {/* SEO metadata */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-foreground font-cairo">SEO</h3>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground font-cairo">
                  عنوان SEO{" "}
                  <span className="text-xs text-muted-foreground/60">
                    ({metaTitle.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value.slice(0, 100))}
                  placeholder={title || "عنوان الصفحة كما يظهر في نتائج البحث"}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring text-right placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground font-cairo">
                  وصف SEO{" "}
                  <span className="text-xs text-muted-foreground/60">
                    ({metaDesc.length}/300)
                  </span>
                </label>
                <textarea
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value.slice(0, 300))}
                  placeholder="وصف الصفحة كما يظهر في نتائج البحث"
                  rows={3}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring text-right placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>

            {/* Navigation settings */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-foreground font-cairo">
                روابط التنقل
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInHeader}
                  onChange={(e) => setShowInHeader(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-sm text-foreground font-cairo">
                  إظهار في الهيدر (شريط التنقل العلوي)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInFooter}
                  onChange={(e) => setShowInFooter(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-sm text-foreground font-cairo">
                  إظهار في الفوتر (أسفل الصفحة)
                </span>
              </label>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo disabled:opacity-60"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                حفظ التعديلات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section settings editor (per type) ───────────────────────
interface SectionSettingsEditorProps {
  section: SectionConfig;
  onUpdate: (settings: Record<string, unknown>) => void;
}

function SectionSettingsEditor({
  section,
  onUpdate,
}: SectionSettingsEditorProps) {
  const s = section.settings;
  const update = (key: string, value: unknown) =>
    onUpdate({ ...s, [key]: value });

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان الرئيسي"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="مرحباً بكم في متجرنا"
          />
          <TextField
            label="العنوان الفرعي"
            value={str(s, "subtitle")}
            onChange={(v) => update("subtitle", v)}
            placeholder="اكتشف مجموعتنا المميزة"
          />
          <TextField
            label="نص زر CTA"
            value={str(s, "cta_primary_label")}
            onChange={(v) => update("cta_primary_label", v)}
            placeholder="تسوق الآن"
          />
        </div>
      );

    case "about_text":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="من نحن"
          />
          <TextAreaField
            label="المحتوى"
            value={str(s, "content")}
            onChange={(v) => update("content", v)}
            placeholder="اكتب هنا قصة متجرك..."
            rows={8}
            maxLength={2000}
          />
        </div>
      );

    case "faq":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="الأسئلة الشائعة"
          />
          <FaqItemsEditor
            items={strArr(s, "items") as Array<{ question: string; answer: string }>}
            onChange={(items) => update("items", items)}
          />
        </div>
      );

    case "contact_section":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="تواصل معنا"
          />
          <TextField
            label="البريد الإلكتروني"
            value={str(s, "email")}
            onChange={(v) => update("email", v)}
            placeholder="info@yourstore.com"
            dir="ltr"
          />
          <TextField
            label="رقم الهاتف"
            value={str(s, "phone")}
            onChange={(v) => update("phone", v)}
            placeholder="+970 59 000 0000"
            dir="ltr"
          />
          <TextField
            label="العنوان"
            value={str(s, "address")}
            onChange={(v) => update("address", v)}
            placeholder="رام الله، فلسطين"
          />
        </div>
      );

    case "testimonials":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="آراء العملاء"
          />
          <TestimonialsEditor
            items={
              strArr(s, "items") as Array<{
                quote: string;
                name: string;
                role: string;
                rating: number;
              }>
            }
            onChange={(items) => update("items", items)}
          />
        </div>
      );

    case "trust_badges":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="لماذا تختارنا"
          />
          <p className="text-xs text-muted-foreground">
            يتم عرض شارات الثقة الافتراضية: دفع آمن، شحن سريع، جودة مضمونة، دعم 24/7
          </p>
        </div>
      );

    case "image_gallery":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="معرض الصور"
          />
          <p className="text-xs text-muted-foreground">
            رفع الصور متاح في الإصدارات القادمة.
          </p>
        </div>
      );

    case "promo_banner":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="عرض خاص"
          />
          <TextAreaField
            label="الوصف"
            value={str(s, "description")}
            onChange={(v) => update("description", v)}
            placeholder="تفاصيل العرض..."
            rows={3}
            maxLength={250}
          />
          <TextField
            label="نص الـ Badge"
            value={str(s, "badge_label")}
            onChange={(v) => update("badge_label", v)}
            placeholder="خصم 20%"
          />
          <TextField
            label="نص زر CTA"
            value={str(s, "cta_label")}
            onChange={(v) => update("cta_label", v)}
            placeholder="تسوق الآن"
          />
        </div>
      );

    case "newsletter":
      return (
        <div className="space-y-4">
          <TextField
            label="العنوان"
            value={str(s, "title")}
            onChange={(v) => update("title", v)}
            placeholder="اشترك في نشرتنا البريدية"
          />
          <TextField
            label="العنوان الفرعي"
            value={str(s, "subtitle")}
            onChange={(v) => update("subtitle", v)}
            placeholder="احصل على أحدث العروض"
          />
        </div>
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          لا توجد إعدادات محددة لهذا القسم.
        </p>
      );
  }
}

// ── Reusable field components ─────────────────────────────────
function TextField({
  label,
  value,
  onChange,
  placeholder,
  dir = "rtl",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground font-cairo">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-right"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength = 2000,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground font-cairo">
          {label}
        </label>
        <span className="text-xs text-muted-foreground/60">
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        dir="rtl"
        className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none text-right leading-relaxed"
      />
    </div>
  );
}

// ── FAQ Items Editor ──────────────────────────────────────────
function FaqItemsEditor({
  items,
  onChange,
}: {
  items: Array<{ question: string; answer: string }>;
  onChange: (items: Array<{ question: string; answer: string }>) => void;
}) {
  const add = () =>
    onChange([...items, { question: "", answer: "" }]);
  const remove = (i: number) =>
    onChange(items.filter((_, idx) => idx !== i));
  const update = (
    i: number,
    key: "question" | "answer",
    val: string
  ) =>
    onChange(items.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground font-cairo">
          الأسئلة والأجوبة
        </label>
        <button
          onClick={add}
          className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors font-cairo"
        >
          + إضافة سؤال
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          لا توجد أسئلة بعد.
        </p>
      )}
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 bg-muted/30 border border-border rounded-xl space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">سؤال {i + 1}</span>
            <button
              onClick={() => remove(i)}
              className="text-xs text-muted-foreground hover:text-red-600 transition-colors"
            >
              حذف
            </button>
          </div>
          <input
            type="text"
            value={item.question}
            onChange={(e) => update(i, "question", e.target.value)}
            placeholder="السؤال..."
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-right"
          />
          <textarea
            value={item.answer}
            onChange={(e) => update(i, "answer", e.target.value.slice(0, 800))}
            placeholder="الإجابة..."
            rows={2}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none text-right"
          />
        </div>
      ))}
    </div>
  );
}

// ── Testimonials Editor ───────────────────────────────────────
function TestimonialsEditor({
  items,
  onChange,
}: {
  items: Array<{ quote: string; name: string; role: string; rating: number }>;
  onChange: (
    items: Array<{ quote: string; name: string; role: string; rating: number }>
  ) => void;
}) {
  const add = () =>
    onChange([...items, { quote: "", name: "", role: "", rating: 5 }]);
  const remove = (i: number) =>
    onChange(items.filter((_, idx) => idx !== i));
  const update = (
    i: number,
    key: keyof (typeof items)[number],
    val: string | number
  ) =>
    onChange(
      items.map((item, idx) => (idx === i ? { ...item, [key]: val } : item))
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground font-cairo">
          آراء العملاء
        </label>
        <button
          onClick={add}
          className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors font-cairo"
        >
          + إضافة رأي
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">لا توجد آراء بعد.</p>
      )}
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 bg-muted/30 border border-border rounded-xl space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">رأي {i + 1}</span>
            <button
              onClick={() => remove(i)}
              className="text-xs text-muted-foreground hover:text-red-600 transition-colors"
            >
              حذف
            </button>
          </div>
          <textarea
            value={item.quote}
            onChange={(e) => update(i, "quote", e.target.value.slice(0, 500))}
            placeholder="نص الرأي..."
            rows={2}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none text-right"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => update(i, "name", e.target.value.slice(0, 60))}
              placeholder="الاسم"
              className="px-3 py-2 bg-input border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-right"
            />
            <input
              type="text"
              value={item.role}
              onChange={(e) => update(i, "role", e.target.value.slice(0, 80))}
              placeholder="الوظيفة / الدور"
              className="px-3 py-2 bg-input border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground shrink-0">
              التقييم:
            </label>
            <select
              value={item.rating}
              onChange={(e) => update(i, "rating", Number(e.target.value))}
              className="px-2 py-1.5 bg-input border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {"★".repeat(r)} ({r})
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
