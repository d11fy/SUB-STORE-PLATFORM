// ============================================================
// Saba Store — D3 AI Theme Config Zod Schemas
// Strict validation for AI-generated theme JSON output.
// No HTML, no JS, no external code — JSON config only.
// ============================================================
import { z } from "zod";
import { SECTION_TYPES } from "@/lib/themes/customization-types";

// ── Security helper — block HTML/JS in any string field ──────
function noHtml(val: string): boolean {
  if (/<[a-z!]/i.test(val)) return false;
  if (/javascript:/i.test(val)) return false;
  if (/on\w+\s*=/i.test(val)) return false;
  if (/<script/i.test(val)) return false;
  if (/style\s*=/i.test(val)) return false;
  return true;
}

const safeText = (max: number, fieldName = "الحقل") =>
  z
    .string()
    .trim()
    .max(max, `${fieldName} يتجاوز ${max} حرفاً`)
    .refine(noHtml, "النص يحتوي على محتوى غير مسموح (HTML أو JavaScript)");

// ── Hex color — exactly #RRGGBB ───────────────────────────────
export const hexColorSchema = z
  .string()
  .trim()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    "اللون يجب أن يكون hex 6-digit (مثال: #1B4FD8)"
  );

// ── Base theme enum ───────────────────────────────────────────
export const BASE_THEMES = [
  "fashion",
  "electronics",
  "subscriptions",
  "books",
  "accessories",
  "blank",
  "personal_services",
  "general",
] as const;
export type BaseTheme = (typeof BASE_THEMES)[number];

export const BASE_THEME_LABELS: Record<BaseTheme, string> = {
  fashion: "أزياء وملابس",
  electronics: "إلكترونيات وتقنية",
  subscriptions: "اشتراكات وعضويات",
  books: "كتب ومجلات",
  accessories: "إكسسوارات ومجوهرات",
  blank: "عام (فارغ)",
  personal_services: "خدمات شخصية",
  general: "متجر عام",
};

// ── AI Output Schema — strict JSON config only ────────────────
// This is what the AI must return, and what Zod validates.
export const aiThemeConfigOutputSchema = z.object({
  base_theme: z.enum(BASE_THEMES, {
    error: "base_theme غير صالح — يجب أن يكون أحد القيم المسموحة",
  }),

  colors: z.object({
    primary: hexColorSchema,
    secondary: hexColorSchema,
    accent: hexColorSchema,
  }),

  hero: z.object({
    title: safeText(120, "عنوان الهيرو"),
    subtitle: safeText(250, "الوصف الفرعي"),
    cta_label: safeText(40, "نص زر CTA"),
    style: z.enum(["light", "split", "branded", "dark"]),
  }),

  sections: z
    .array(
      z.object({
        type: z.enum(SECTION_TYPES, {
          error: "نوع القسم غير مسموح",
        }),
        enabled: z.boolean(),
        order: z.number().int().min(0).max(20),
        label: safeText(60, "اسم القسم").optional(),
        settings: z.record(z.string(), z.unknown()).optional().default({}),
        visibility: z
          .object({ mobile: z.boolean(), desktop: z.boolean() })
          .optional()
          .default({ mobile: true, desktop: true }),
      })
    )
    .min(1, "يجب أن يحتوي الثيم على قسم واحد على الأقل")
    .max(10, "الحد الأقصى 10 أقسام"),

  footer: z.object({
    text: safeText(200, "نص الفوتر"),
  }),

  seo: z.object({
    meta_title: safeText(60, "عنوان SEO"),
    meta_description: safeText(160, "وصف SEO"),
  }),
});

export type AiThemeConfig = z.infer<typeof aiThemeConfigOutputSchema>;

// ── AI Input Schema — user prompt from the merchant ──────────
export const aiThemeConfigInputSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, "الوصف قصير جداً — اكتب على الأقل 10 أحرف")
    .max(1000, "الوصف طويل جداً — الحد الأقصى 1000 حرف")
    .refine(noHtml, "الوصف يحتوي على محتوى غير مسموح"),
  store_type: z.string().trim().max(100).optional(),
  target_audience: z.string().trim().max(100).optional(),
  tone: z
    .enum(["luxury", "playful", "professional", "minimal", "bold"])
    .optional(),
  preferred_colors: z.string().trim().max(100).optional(),
});

export type ThemeConfigInput = z.infer<typeof aiThemeConfigInputSchema>;

// ── Credits cost for D3 AI Theme generation ──────────────────
export const AI_THEME_CREDITS_COST = 10;
