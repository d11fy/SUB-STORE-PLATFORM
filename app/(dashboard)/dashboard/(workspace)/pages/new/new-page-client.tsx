"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { createStorePageAction } from "@/actions/store-pages";
import type { SectionConfig } from "@/lib/themes/customization-types";
import { PAGE_SECTION_LABELS, RESERVED_SLUGS, type CreatePageInput } from "@/lib/validations/pages";

// ── Seed templates ─────────────────────────────────────────────
type TemplateSections = Omit<SectionConfig, "id">[];

interface Template {
  id: string;
  label: string;
  description: string;
  suggestedSlug: string;
  suggestedTitle: string;
  sections: TemplateSections;
}

const TEMPLATES: Template[] = [
  {
    id: "blank",
    label: "فارغة",
    description: "صفحة فارغة تبدأ من الصفر",
    suggestedSlug: "",
    suggestedTitle: "",
    sections: [
      {
        type: "hero",
        enabled: true,
        order: 0,
        label: "الهيرو",
        settings: { title: "", subtitle: "" },
        visibility: { mobile: true, desktop: true },
      },
    ],
  },
  {
    id: "about",
    label: "من نحن",
    description: "قصة متجرك وقيمك",
    suggestedSlug: "about-us",
    suggestedTitle: "من نحن",
    sections: [
      {
        type: "about_text",
        enabled: true,
        order: 0,
        label: "من نحن",
        settings: { title: "من نحن", content: "" },
        visibility: { mobile: true, desktop: true },
      },
      {
        type: "trust_badges",
        enabled: true,
        order: 1,
        label: "لماذا تختارنا",
        settings: { title: "لماذا تختارنا" },
        visibility: { mobile: true, desktop: true },
      },
    ],
  },
  {
    id: "contact",
    label: "تواصل معنا",
    description: "معلومات التواصل وطرق التواصل",
    suggestedSlug: "contact",
    suggestedTitle: "تواصل معنا",
    sections: [
      {
        type: "contact_section",
        enabled: true,
        order: 0,
        label: "تواصل معنا",
        settings: { title: "تواصل معنا", email: "", phone: "", address: "" },
        visibility: { mobile: true, desktop: true },
      },
    ],
  },
  {
    id: "faq",
    label: "الأسئلة الشائعة",
    description: "إجابات على الأسئلة الأكثر شيوعاً",
    suggestedSlug: "faq",
    suggestedTitle: "الأسئلة الشائعة",
    sections: [
      {
        type: "hero",
        enabled: true,
        order: 0,
        label: "الهيرو",
        settings: { title: "الأسئلة الشائعة", subtitle: "إجابات على أسئلتكم" },
        visibility: { mobile: true, desktop: true },
      },
      {
        type: "faq",
        enabled: true,
        order: 1,
        label: "الأسئلة الشائعة",
        settings: { title: "الأسئلة الشائعة", items: [] },
        visibility: { mobile: true, desktop: true },
      },
    ],
  },
  {
    id: "return_policy",
    label: "سياسة الاستبدال",
    description: "سياسة الإرجاع والاستبدال",
    suggestedSlug: "return-policy",
    suggestedTitle: "سياسة الاستبدال والإرجاع",
    sections: [
      {
        type: "about_text",
        enabled: true,
        order: 0,
        label: "سياسة الاستبدال",
        settings: {
          title: "سياسة الاستبدال والإرجاع",
          content:
            "نحن ملتزمون برضاك التام. يمكنك إعادة أي منتج خلال 14 يوماً من الاستلام بشرط أن يكون بحالته الأصلية.",
        },
        visibility: { mobile: true, desktop: true },
      },
    ],
  },
  {
    id: "privacy",
    label: "سياسة الخصوصية",
    description: "كيف نحمي بياناتك وخصوصيتك",
    suggestedSlug: "privacy-policy",
    suggestedTitle: "سياسة الخصوصية",
    sections: [
      {
        type: "about_text",
        enabled: true,
        order: 0,
        label: "سياسة الخصوصية",
        settings: {
          title: "سياسة الخصوصية",
          content:
            "نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. هذه السياسة توضح كيفية جمع واستخدام معلوماتك.",
        },
        visibility: { mobile: true, desktop: true },
      },
    ],
  },
];

export function NewPageClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [step, setStep] = useState<"template" | "details">("template");

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    if (template.suggestedTitle) {
      setTitle(template.suggestedTitle);
    }
    if (template.suggestedSlug) {
      setSlug(template.suggestedSlug);
    }
    setStep("details");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched && val) {
      // Generate a basic slug from title (only for English/numeric chars found)
      const auto = val
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "");
      if (auto.length >= 2) setSlug(auto);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("العنوان مطلوب");
      return;
    }
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      toast.error("الـ slug مطلوب");
      return;
    }
    if (RESERVED_SLUGS.has(cleanSlug)) {
      toast.error("هذا الـ slug محجوز للنظام ولا يمكن استخدامه");
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{2}$/.test(cleanSlug)) {
      toast.error("الـ slug يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط");
      return;
    }
    if (cleanSlug.includes("--")) {
      toast.error("الـ slug لا يمكن أن يحتوي على شرطتين متتاليتين");
      return;
    }

    // Build sections with unique IDs
    const sections: SectionConfig[] = selectedTemplate.sections.map(
      (s, i) => ({
        ...s,
        id: `${s.type}-${Date.now()}-${i}`,
      })
    );

    startTransition(async () => {
      const res = await createStorePageAction({
        title: title.trim(),
        slug: cleanSlug,
        // SectionConfig uses full 15-type union; page sections use a subset.
        // Action's Zod schema filters unknown types at runtime.
        sections_config: sections as unknown as CreatePageInput["sections_config"],
        show_in_header: false,
        show_in_footer: true,
      });

      if (res.id) {
        toast.success("تم إنشاء الصفحة كمسودة");
        router.push(`/dashboard/pages/${res.id}/edit`);
      } else {
        toast.error(res.error ?? "فشل إنشاء الصفحة");
      }
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/pages"
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground">
            إنشاء صفحة جديدة
          </h1>
          <p className="text-sm text-muted-foreground">
            اختر قالباً ثم خصّص المحتوى
          </p>
        </div>
      </div>

      {step === "template" && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground font-cairo">
            اختر قالباً للبدء:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateSelect(t)}
                className="text-right p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-accent/30 transition-all space-y-2 group"
              >
                <p className="font-bold text-sm text-foreground font-cairo group-hover:text-primary transition-colors">
                  {t.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.sections.map((s) => (
                    <span
                      key={s.type}
                      className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                    >
                      {PAGE_SECTION_LABELS[s.type as keyof typeof PAGE_SECTION_LABELS] ?? s.type}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-5">
          {/* Selected template badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
              {selectedTemplate.label}
            </span>
            <button
              onClick={() => setStep("template")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              تغيير القالب
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground font-cairo">
                عنوان الصفحة *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="مثال: من نحن"
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-right"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground font-cairo">
                الـ Slug (رابط الصفحة) *
              </label>
              <div
                className="flex items-center rounded-lg border border-border overflow-hidden bg-input focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent"
                dir="ltr"
              >
                <span className="px-3 py-3 text-xs text-muted-foreground bg-muted border-l border-border shrink-0">
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase());
                    setSlugTouched(true);
                  }}
                  placeholder="about-us"
                  className="flex-1 px-3 py-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                أحرف إنجليزية صغيرة وأرقام وشرطات فقط (مثال: about-us)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Link
              href="/dashboard/pages"
              className="px-5 py-2.5 bg-muted text-foreground text-sm font-bold rounded-xl border border-border hover:bg-muted/80 transition-all font-cairo"
            >
              إلغاء
            </Link>
            <button
              onClick={handleCreate}
              disabled={isPending || !title.trim() || !slug.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء وتعديل الصفحة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
