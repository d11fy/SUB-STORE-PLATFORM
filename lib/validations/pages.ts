// ============================================================
// Saba Store — D2 Zod Schemas for Store Custom Pages
// ============================================================
import { z } from "zod";

// ── Reserved slugs — blocked to avoid route conflicts ─────────
export const RESERVED_SLUGS = new Set([
  "products",
  "product",
  "cart",
  "checkout",
  "orders",
  "order-confirmation",
  "category",
  "search",
  "wishlist",
  "account",
  "admin",
  "dashboard",
  "api",
  "login",
  "register",
  "verify-email",
]);

// ── Page section types allowed in custom pages ────────────────
export const PAGE_SECTION_TYPES = [
  "hero",
  "about_text",
  "faq",
  "contact_section",
  "testimonials",
  "trust_badges",
  "image_gallery",
  "promo_banner",
  "newsletter",
] as const;

export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];

export const PAGE_SECTION_LABELS: Record<PageSectionType, string> = {
  hero: "الهيرو الرئيسي",
  about_text: "من نحن",
  faq: "الأسئلة الشائعة",
  contact_section: "تواصل معنا",
  testimonials: "آراء العملاء",
  trust_badges: "عوامل الثقة",
  image_gallery: "معرض الصور",
  promo_banner: "البانر الترويجي",
  newsletter: "النشرة البريدية",
};

// ── Slug ──────────────────────────────────────────────────────
export const pageSlugSchema = z
  .string()
  .trim()
  .min(2, "الـ slug قصير جداً (الحد الأدنى حرفان)")
  .max(60, "الـ slug طويل جداً (الحد الأقصى 60 حرفاً)")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{2}$/,
    "الـ slug يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"
  )
  .refine((s) => !s.includes("--"), "الـ slug لا يمكن أن يحتوي على شرطتين متتاليتين")
  .refine((s) => !RESERVED_SLUGS.has(s), "هذا الـ slug محجوز للنظام");

// ── Section schema ────────────────────────────────────────────
export const pageSectionSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum([
    "hero",
    "about_text",
    "faq",
    "contact_section",
    "testimonials",
    "trust_badges",
    "image_gallery",
    "promo_banner",
    "newsletter",
  ]),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(99),
  label: z.string().trim().min(1).max(60),
  settings: z.record(z.string(), z.unknown()),
  visibility: z.object({
    mobile: z.boolean(),
    desktop: z.boolean(),
  }),
});

// ── Create page schema ────────────────────────────────────────
export const createPageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "عنوان الصفحة مطلوب")
    .max(200, "العنوان طويل جداً (الحد 200 حرف)"),
  slug: pageSlugSchema,
  meta_title: z
    .string()
    .trim()
    .max(100, "عنوان SEO طويل جداً")
    .optional()
    .or(z.literal("")),
  meta_description: z
    .string()
    .trim()
    .max(300, "وصف SEO طويل جداً")
    .optional()
    .or(z.literal("")),
  show_in_header: z.boolean().optional().default(false),
  show_in_footer: z.boolean().optional().default(true),
  sections_config: z
    .array(pageSectionSchema)
    .max(15, "الحد الأقصى 15 قسماً")
    .default([]),
});

// ── Update page schema ────────────────────────────────────────
export const updatePageSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: pageSlugSchema.optional(),
  status: z.enum(["draft", "published"]).optional(),
  meta_title: z.string().trim().max(100).optional().or(z.literal("")),
  meta_description: z.string().trim().max(300).optional().or(z.literal("")),
  show_in_header: z.boolean().optional(),
  show_in_footer: z.boolean().optional(),
  sections_config: z.array(pageSectionSchema).max(15).optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
