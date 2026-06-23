// ============================================================
// Saba Store — D1 Zod Schemas for Theme Customization
// ============================================================
import { z } from "zod";

// ── Guards ────────────────────────────────────────────────────
const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "اللون يجب أن يكون hex صالح (مثال: #1B4FD8)");

// Internal-only hrefs: / or /path or /path/sub — no javascript: or external scripts
const safeInternalHrefSchema = z
  .string()
  .trim()
  .max(200, "الرابط طويل جداً")
  .refine(
    (v) =>
      v === "" ||
      v.startsWith("/") ||
      v.startsWith("https://") ||
      v.startsWith("http://"),
    "الرابط غير مسموح (يجب أن يبدأ بـ / أو https://)"
  )
  .refine(
    (v) => !v.toLowerCase().startsWith("javascript:"),
    "روابط javascript: ممنوعة"
  );

const safeUrlSchema = z
  .string()
  .trim()
  .url("الرابط غير صالح")
  .max(2000, "الرابط طويل جداً")
  .optional()
  .nullable()
  .or(z.literal(""));

// ── Section Schemas ───────────────────────────────────────────
export const sectionVisibilitySchema = z.object({
  mobile: z.boolean(),
  desktop: z.boolean(),
});

export const sectionBaseSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(["hero", "categories", "featured_products", "best_sellers", "latest_products", "promo_banner", "testimonials", "trust_badges", "pricing_cards", "services_list", "faq", "about_text", "contact_section", "image_gallery", "newsletter"]),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(99),
  label: z.string().trim().min(1).max(60, "اسم القسم طويل جداً (الحد 60 حرفاً)"),
  settings: z.record(z.string(), z.unknown()),
  visibility: sectionVisibilitySchema,
});

export const sectionsConfigSchema = z
  .array(sectionBaseSchema)
  .max(20, "الحد الأقصى 20 قسماً")
  .refine(
    (arr) => {
      // Ensure no duplicate types (except products/latest/best which can repeat)
      const singles: string[] = [
        "hero",
        "about_text",
        "contact_section",
        "newsletter",
      ];
      for (const t of singles) {
        if (arr.filter((s) => s.type === t).length > 1) return false;
      }
      return true;
    },
    "لا يمكن تكرار بعض الأقسام (الهيرو، من نحن، تواصل معنا)"
  );

// ── Hero Section Settings ─────────────────────────────────────
export const heroSectionSettingsSchema = z.object({
  title: z.string().trim().max(150).optional(),
  subtitle: z.string().trim().max(300).optional(),
  image_url: safeUrlSchema,
  cta_primary_label: z.string().trim().max(60).optional(),
  cta_secondary_label: z.string().trim().max(60).optional(),
});

// ── Promo Banner Settings ─────────────────────────────────────
export const promoBannerSettingsSchema = z.object({
  title: z.string().trim().max(100).optional(),
  description: z.string().trim().max(250).optional(),
  badge_label: z.string().trim().max(30).optional(),
  cta_label: z.string().trim().max(60).optional(),
  variant: z.enum(["primary", "emerald", "rose", "amber", "violet"]).optional(),
});

// ── Testimonials ──────────────────────────────────────────────
export const testimonialItemSchema = z.object({
  quote: z.string().trim().max(500, "الاقتباس طويل جداً"),
  name: z.string().trim().max(60),
  role: z.string().trim().max(80),
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export const testimonialsSectionSettingsSchema = z.object({
  title: z.string().trim().max(100).optional(),
  items: z.array(testimonialItemSchema).max(10).optional(),
});

// ── FAQ ───────────────────────────────────────────────────────
export const faqItemSchema = z.object({
  question: z.string().trim().max(200, "السؤال طويل جداً"),
  answer: z.string().trim().max(800, "الإجابة طويلة جداً"),
});

export const faqSectionSettingsSchema = z.object({
  title: z.string().trim().max(100).optional(),
  items: z.array(faqItemSchema).max(20).optional(),
});

// ── About Text ────────────────────────────────────────────────
export const aboutTextSettingsSchema = z.object({
  title: z.string().trim().max(100).optional(),
  content: z.string().trim().max(2000, "المحتوى طويل جداً (الحد 2000 حرف)").optional(),
});

// ── Products Section ──────────────────────────────────────────
export const productsSectionSettingsSchema = z.object({
  title: z.string().trim().max(100).optional(),
  subtitle: z.string().trim().max(200).optional(),
  limit: z.union([z.literal(4), z.literal(8), z.literal(12)]).optional(),
  show_discount_badge: z.boolean().optional(),
});

// ── Generic Section ───────────────────────────────────────────
export const genericSectionSettingsSchema = z.object({
  title: z.string().trim().max(100).optional(),
  subtitle: z.string().trim().max(200).optional(),
});

// ── Header Config ─────────────────────────────────────────────
export const navLinkSchema = z.object({
  label: z.string().trim().min(1).max(40, "اسم الرابط طويل جداً"),
  href: safeInternalHrefSchema,
});

export const headerConfigSchema = z.object({
  logo_style: z.enum(["square", "circle", "rounded"]),
  show_nav: z.boolean(),
  nav_links: z.array(navLinkSchema).max(8, "الحد الأقصى 8 روابط في الهيدر"),
  sticky: z.boolean(),
  show_search: z.boolean(),
  background: z.enum(["white", "card", "primary"]),
});

export type HeaderConfigInput = z.infer<typeof headerConfigSchema>;

// ── Footer Config ─────────────────────────────────────────────
export const footerConfigSchema = z.object({
  layout: z.enum(["simple", "columns", "minimal"]),
  text: z.string().trim().max(500, "نص الفوتر طويل جداً").optional().or(z.literal("")),
  show_social: z.boolean(),
  show_newsletter: z.boolean(),
  show_powered_by: z.boolean(),
});

export type FooterConfigInput = z.infer<typeof footerConfigSchema>;

// ── Homepage Config ───────────────────────────────────────────
export const homepageConfigSchema = z.object({
  meta_title: z.string().trim().max(100, "عنوان SEO طويل جداً (الحد 100 حرف)").optional().or(z.literal("")),
  meta_description: z
    .string()
    .trim()
    .max(300, "وصف SEO طويل جداً (الحد 300 حرف)")
    .optional()
    .or(z.literal("")),
  show_announcement_bar: z.boolean(),
  announcement_text: z
    .string()
    .trim()
    .max(200, "نص الإعلان طويل جداً")
    .optional()
    .or(z.literal("")),
  announcement_link: safeInternalHrefSchema.optional().or(z.literal("")),
  announcement_style: z.enum(["primary", "amber", "emerald", "rose"]).optional(),
});

export type HomepageConfigInput = z.infer<typeof homepageConfigSchema>;

// ── Full Draft Config Schema ──────────────────────────────────
export const themeDraftConfigSchema = z.object({
  primary_color: hexColorSchema,
  secondary_color: hexColorSchema,
  accent_color: hexColorSchema,
  font_family: z.enum(
    ["Cairo", "Tajawal", "Changa", "Alexandria", "Amiri", "IBM Plex Sans Arabic"],
    { message: "خط غير مدعوم" }
  ),
  hero_title: z.string().trim().max(150).optional().or(z.literal("")),
  hero_subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  hero_image_url: safeUrlSchema,
  logo_url: safeUrlSchema,
  favicon_url: safeUrlSchema,
  footer_content: z.string().trim().max(500).optional().or(z.literal("")),
  store_description: z.string().trim().max(1000).optional().or(z.literal("")),
  sections_config: sectionsConfigSchema,
  header_config: headerConfigSchema,
  footer_config: footerConfigSchema,
  homepage_config: homepageConfigSchema,
});

export type ThemeDraftConfigInput = z.infer<typeof themeDraftConfigSchema>;
