// ============================================================
// Saba Store — D1 Theme Customization Types
// All stored inside store_theme_settings.settings JSONB (no migration)
// ============================================================

// ── Section Types ─────────────────────────────────────────────
export const SECTION_TYPES = [
  "hero",
  "categories",
  "featured_products",
  "best_sellers",
  "latest_products",
  "promo_banner",
  "testimonials",
  "trust_badges",
  "pricing_cards",
  "services_list",
  "faq",
  "about_text",
  "contact_section",
  "image_gallery",
  "newsletter",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "الهيرو الرئيسي",
  categories: "التصنيفات",
  featured_products: "المنتجات المميزة",
  best_sellers: "الأكثر مبيعاً",
  latest_products: "أحدث المنتجات",
  promo_banner: "البانر الترويجي",
  testimonials: "آراء العملاء",
  trust_badges: "عوامل الثقة",
  pricing_cards: "الباقات والأسعار",
  services_list: "قائمة الخدمات",
  faq: "الأسئلة الشائعة",
  about_text: "من نحن",
  contact_section: "تواصل معنا",
  image_gallery: "معرض الصور",
  newsletter: "النشرة البريدية",
};

// ── Section Config ─────────────────────────────────────────────
export interface SectionVisibility {
  mobile: boolean;
  desktop: boolean;
}

export interface SectionConfig {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  label: string;
  settings: Record<string, unknown>;
  visibility: SectionVisibility;
}

// Per-type section settings
export interface HeroSectionSettings {
  title?: string;
  subtitle?: string;
  image_url?: string;
  cta_primary_label?: string;
  cta_secondary_label?: string;
}

export interface PromoBannerSettings {
  title?: string;
  description?: string;
  badge_label?: string;
  cta_label?: string;
  variant?: "primary" | "emerald" | "rose" | "amber" | "violet";
}

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface TestimonialsSectionSettings {
  title?: string;
  items?: TestimonialItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSectionSettings {
  title?: string;
  items?: FaqItem[];
}

export interface ProductsSectionSettings {
  title?: string;
  subtitle?: string;
  limit?: 4 | 8 | 12;
  show_discount_badge?: boolean;
}

export interface AboutTextSettings {
  title?: string;
  content?: string;
}

export interface GenericSectionSettings {
  title?: string;
  subtitle?: string;
}

export type SectionSettings =
  | HeroSectionSettings
  | PromoBannerSettings
  | TestimonialsSectionSettings
  | FaqSectionSettings
  | ProductsSectionSettings
  | AboutTextSettings
  | GenericSectionSettings
  | Record<string, unknown>;

// ── Header Config ──────────────────────────────────────────────
export type LogoStyle = "square" | "circle" | "rounded";
export type HeaderBackground = "white" | "card" | "primary";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderConfig {
  logo_style: LogoStyle;
  show_nav: boolean;
  nav_links: NavLink[];
  sticky: boolean;
  show_search: boolean;
  background: HeaderBackground;
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  logo_style: "rounded",
  show_nav: true,
  nav_links: [
    { label: "الرئيسية", href: "/" },
    { label: "المنتجات", href: "/products" },
  ],
  sticky: true,
  show_search: false,
  background: "white",
};

// ── Footer Config ──────────────────────────────────────────────
export type FooterLayout = "simple" | "columns" | "minimal";

export interface FooterConfig {
  layout: FooterLayout;
  text?: string;
  show_social: boolean;
  show_newsletter: boolean;
  show_powered_by: boolean;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  layout: "simple",
  text: "",
  show_social: true,
  show_newsletter: false,
  show_powered_by: true,
};

// ── Homepage Config ────────────────────────────────────────────
export interface HomepageConfig {
  meta_title?: string;
  meta_description?: string;
  show_announcement_bar: boolean;
  announcement_text?: string;
  announcement_link?: string;
  announcement_style?: "primary" | "amber" | "emerald" | "rose";
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  show_announcement_bar: false,
  announcement_style: "primary",
};

// ── Colors + Typography ────────────────────────────────────────
export interface ColorsConfig {
  primary: string;
  secondary: string;
  accent: string;
}

export type HeadingWeight = "700" | "800" | "900";
export type BodySize = "sm" | "base";

export interface TypographyConfig {
  font_family: string;
  heading_weight: HeadingWeight;
  body_size: BodySize;
}

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  font_family: "Cairo",
  heading_weight: "800",
  body_size: "base",
};

// ── Full Draft Config ──────────────────────────────────────────
// Saved in settings.draft_config — NOT live until published
export interface ThemeDraftConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  // Optional — not all themes use every field
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  footer_content?: string;
  store_description?: string;
  sections_config: SectionConfig[];
  header_config: HeaderConfig;
  footer_config: FooterConfig;
  homepage_config: HomepageConfig;
}

// ── Extended Settings Shape (inside settings JSONB) ───────────
// This is what we write/read from store_theme_settings.settings
export interface ExtendedThemeSettings {
  sections_config?: SectionConfig[];
  header_config?: HeaderConfig;
  footer_config?: FooterConfig;
  homepage_config?: HomepageConfig;
  draft_config?: ThemeDraftConfig;
  published_at?: string;
  // Updated on every draft write (save / AI apply).
  // Used in clientKey so React remounts the form even when hasDraft stays true.
  draft_saved_at?: string;
  // D4 — Safe Custom CSS draft (independent publish cycle)
  // Live state is stored in store_theme_settings.custom_css (top-level DB column).
  // Only the draft lives here in JSONB until publishCssDraftAction promotes it.
  custom_css_draft?: string;
  // Set when CSS is published; drives cache-busting version query in storefront layout.
  css_published_at?: string;
}

// ── Default Sections Per Theme ─────────────────────────────────
function makeSect(
  type: SectionType,
  label: string,
  order: number,
  settings: Record<string, unknown> = {}
): SectionConfig {
  return {
    id: `default-${type}-${order}`,
    type,
    enabled: true,
    order,
    label,
    settings,
    visibility: { mobile: true, desktop: true },
  };
}

export const THEME_DEFAULT_SECTIONS: Record<string, SectionConfig[]> = {
  fashion: [
    makeSect("hero", "الهيرو الرئيسي", 0),
    makeSect("trust_badges", "عوامل الثقة", 1),
    makeSect("latest_products", "وصل حديثاً", 2),
    makeSect("categories", "التصنيفات", 3),
    makeSect("best_sellers", "الأكثر مبيعاً", 4),
    makeSect("promo_banner", "عرض الموسم", 5),
    makeSect("newsletter", "النشرة البريدية", 6),
  ],
  electronics: [
    makeSect("hero", "الهيرو الرئيسي", 0),
    makeSect("categories", "التصنيفات", 1),
    makeSect("best_sellers", "عروض اليوم", 2),
    makeSect("featured_products", "منتجات مميزة", 3),
    makeSect("trust_badges", "لماذا تختارنا", 4),
    makeSect("latest_products", "وصل حديثاً", 5),
  ],
  subscriptions: [
    makeSect("hero", "الهيرو", 0),
    makeSect("trust_badges", "المميزات", 1),
    makeSect("pricing_cards", "الباقات والأسعار", 2),
    makeSect("testimonials", "آراء العملاء", 3),
    makeSect("promo_banner", "ابدأ الاشتراك", 4),
  ],
  books: [
    makeSect("hero", "الهيرو", 0),
    makeSect("categories", "الأقسام", 1),
    makeSect("featured_products", "اختيارات المحررين", 2),
    makeSect("latest_products", "جديد الإصدارات", 3),
    makeSect("testimonials", "آراء القراء", 4),
    makeSect("promo_banner", "تسليم رقمي", 5),
    makeSect("best_sellers", "جميع المنتجات", 6),
  ],
  accessories: [
    makeSect("hero", "الهيرو", 0),
    makeSect("trust_badges", "عوامل الثقة", 1),
    makeSect("categories", "التصنيفات", 2),
    makeSect("featured_products", "المختارات الذهبية", 3),
    makeSect("promo_banner", "مجموعات حصرية", 4),
    makeSect("best_sellers", "الأكثر مبيعاً", 5),
  ],
  blank: [
    makeSect("hero", "الهيرو", 0),
    makeSect("categories", "التصنيفات", 1),
    makeSect("featured_products", "المنتجات المميزة", 2),
    makeSect("promo_banner", "بانر ترويجي", 3),
    makeSect("latest_products", "أحدث المنتجات", 4),
    makeSect("trust_badges", "لماذا تختارنا", 5),
  ],
  personal_services: [
    makeSect("hero", "الهيرو", 0),
    makeSect("trust_badges", "أرقام الثقة", 1),
    makeSect("categories", "مجالات العمل", 2),
    makeSect("services_list", "الخدمات المتاحة", 3),
    makeSect("testimonials", "آراء العملاء", 4),
    makeSect("about_text", "كيف نعمل معاً", 5),
    makeSect("promo_banner", "احجز جلستك", 6),
  ],
  general: [
    makeSect("hero", "الهيرو", 0),
    makeSect("trust_badges", "عوامل الثقة", 1),
    makeSect("categories", "التصنيفات", 2),
    makeSect("best_sellers", "الأكثر طلباً", 3),
    makeSect("featured_products", "المنتجات المميزة", 4),
    makeSect("promo_banner", "عرض خاص", 5),
    makeSect("latest_products", "وصل حديثاً", 6),
  ],
};

// Map old sections_order strings → SectionType
export const LEGACY_SECTION_MAP: Record<string, SectionType> = {
  hero: "hero",
  categories: "categories",
  featured: "featured_products",
  banner: "promo_banner",
  products: "latest_products",
  best_sellers: "best_sellers",
  testimonials: "testimonials",
  trust_badges: "trust_badges",
  pricing: "pricing_cards",
  services: "services_list",
  faq: "faq",
  about: "about_text",
  contact: "contact_section",
  gallery: "image_gallery",
  newsletter: "newsletter",
};
