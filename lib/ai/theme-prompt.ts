// ============================================================
// Saba Store — D3 AI Theme Prompt & Mock Generator
// System prompt for AI + rich mock generator for demo mode
// ============================================================

import type { ThemeConfigInput, AiThemeConfig, BaseTheme } from "@/lib/validations/ai-theme-config";
import { SECTION_LABELS } from "@/lib/themes/customization-types";

// ── System prompt — sent to real AI providers ─────────────────
export function buildThemeSystemPrompt(): string {
  return `أنت مصمم متاجر إلكترونية عربية متخصص في منصة سبأ ستور. مهمتك توليد إعدادات ثيم كاملة بتنسيق JSON فقط.

قواعد صارمة لا استثناء فيها:
- أخرج JSON صالح فقط — بدون أي markdown، بدون أي شرح، بدون \`\`\`json، بدون أي نص خارج JSON.
- الألوان: hex 6-digit فقط مثل #1B4FD8. لا أسماء ألوان (لا "red"، لا "gold").
- النصوص: عربية فقط. لا كلمات إنجليزية في العناوين والأوصاف.
- base_theme: واحد فقط من: fashion, electronics, subscriptions, books, accessories, blank, personal_services, general
- sections.type: من القائمة فقط: hero, categories, featured_products, best_sellers, latest_products, promo_banner, testimonials, trust_badges, pricing_cards, services_list, faq, about_text, contact_section, image_gallery, newsletter
- sections: 4 إلى 8 أقسام، بالترتيب المنطقي. لا أكثر من 10.
- لا HTML في أي حقل نصي. لا JavaScript. لا CSS. لا روابط خارجية.
- hero.style: واحد فقط من: light, split, branded, dark
- النتيجة مناسبة لتاجر عربي في فلسطين أو الأردن.

هيكل JSON المطلوب بالضبط:
{
  "base_theme": "...",
  "colors": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB" },
  "hero": { "title": "...", "subtitle": "...", "cta_label": "...", "style": "..." },
  "sections": [
    { "type": "...", "enabled": true, "order": 0, "label": "...", "settings": {}, "visibility": { "mobile": true, "desktop": true } }
  ],
  "footer": { "text": "..." },
  "seo": { "meta_title": "...", "meta_description": "..." }
}`;
}

export function buildThemeUserPrompt(
  input: ThemeConfigInput
): string {
  const parts: string[] = [`وصف المتجر: ${input.prompt}`];
  if (input.store_type) parts.push(`نوع المتجر: ${input.store_type}`);
  if (input.target_audience) parts.push(`الجمهور المستهدف: ${input.target_audience}`);
  if (input.tone) {
    const toneLabels: Record<string, string> = {
      luxury: "فاخر وأنيق",
      playful: "مرح وحيوي",
      professional: "احترافي ورسمي",
      minimal: "بسيط ومنظم",
      bold: "جريء وواثق",
    };
    parts.push(`نبرة التصميم: ${toneLabels[input.tone] ?? input.tone}`);
  }
  if (input.preferred_colors) parts.push(`الألوان المفضلة: ${input.preferred_colors}`);
  return parts.join("\n");
}

// ── Mock Theme Generator ──────────────────────────────────────
// Rich, realistic mock that adapts to the prompt keywords.
// Passes through the same Zod schema as real AI output.

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function detectBaseTheme(text: string): BaseTheme {
  if (/ملابس|أزياء|فاشن|بوتيك|موضة|قماش|فستان|قميص/.test(text)) return "fashion";
  if (/إلكترون|هاتف|تقني|كمبيوتر|جهاز|برمجة|شاشة|سماعة/.test(text)) return "electronics";
  if (/كتاب|مجلة|قراءة|أدب|ثقافة|رواية|تعليم/.test(text)) return "books";
  if (/اشتراك|عضوية|باقة|اشتراكات|شهري|سنوي/.test(text)) return "subscriptions";
  if (/إكسسوار|مجوهرات|حلي|خاتم|سوار|أساور|ذهب/.test(text)) return "accessories";
  if (/خدمة|صالون|مطعم|حلاق|عيادة|شخصي|مستقل/.test(text)) return "personal_services";
  return "general";
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

function detectColors(text: string, tone?: string): ColorScheme {
  const isLuxury = /فاخر|luxury|راقي/.test(text) || tone === "luxury";
  const isBold = tone === "bold";

  if (/ذهبي|عاجي|ذهب|golden/.test(text) || (isLuxury && /إكسسوار|مجوهرات|ملابس/.test(text))) {
    return { primary: "#92660F", secondary: "#1C1917", accent: "#C9A84C" };
  }
  if (/وردي|زهري|pink|بنات/.test(text)) {
    return { primary: "#DB2777", secondary: "#BE185D", accent: "#FCE7F3" };
  }
  if (/أخضر|green|طازج|صحي|عضوي/.test(text)) {
    return { primary: "#047857", secondary: "#065F46", accent: "#ECFDF5" };
  }
  if (/أحمر|red/.test(text) || isBold) {
    return { primary: "#DC2626", secondary: "#B91C1C", accent: "#FEF2F2" };
  }
  if (/أسود|black|dark|داكن/.test(text) || isLuxury) {
    return { primary: "#18181B", secondary: "#27272A", accent: "#D4AF37" };
  }
  if (/بنفسجي|violet|purple/.test(text)) {
    return { primary: "#7C3AED", secondary: "#6D28D9", accent: "#F5F3FF" };
  }
  if (/برتقالي|orange/.test(text)) {
    return { primary: "#EA580C", secondary: "#C2410C", accent: "#FFF7ED" };
  }
  if (/سماوي|cyan|فيروزي/.test(text)) {
    return { primary: "#0891B2", secondary: "#0E7490", accent: "#ECFEFF" };
  }

  // Default by theme
  if (/ملابس|فاشن|أزياء/.test(text)) return { primary: "#BE123C", secondary: "#9F1239", accent: "#FFF1F2" };
  if (/إلكترون|تقني/.test(text)) return { primary: "#1D4ED8", secondary: "#1E40AF", accent: "#EFF6FF" };
  if (/كتاب/.test(text)) return { primary: "#92400E", secondary: "#78350F", accent: "#FFFBEB" };

  return { primary: "#1B4FD8", secondary: "#1E3A8A", accent: "#F59E0B" };
}

interface SectionSpec {
  type: AiThemeConfig["sections"][number]["type"];
  label: string;
  settings?: Record<string, unknown>;
}

function buildSections(
  baseTheme: BaseTheme,
  text: string
): SectionSpec[] {
  const hasPromo = /عرض|خصم|تخفيض|بانر|تسويق|ترويج/.test(text);
  const hasTestimonials = /آراء|عملاء|تقييم|مراجعات|رأي/.test(text);
  const hasFaq = /سؤال|استفسار|faq|أسئلة/.test(text);
  const hasNewsletter = /نشرة|اشتراك بريد|إيميل|newsletter/.test(text);
  const hasContact = /تواصل|اتصال|هاتف|عنوان/.test(text);
  const hasAbout = /من نحن|قصتنا|هويتنا|نبذة/.test(text);
  const hasTrust = /ثقة|ضمان|أمان|جودة مضمونة/.test(text);

  const templates: Record<BaseTheme, SectionSpec[]> = {
    fashion: [
      { type: "hero", label: "الهيرو الرئيسي", settings: { style: "dark" } },
      { type: "categories", label: "التصنيفات" },
      { type: "featured_products", label: "أحدث التشكيلات", settings: { title: "أحدث التشكيلات", limit: 8 } },
      { type: "promo_banner", label: "عرض مميز", settings: { title: "عروض موسم الأناقة", badge_label: "خصم 20%" } },
      { type: "best_sellers", label: "الأكثر مبيعاً" },
      { type: "testimonials", label: "آراء عميلاتنا" },
    ],
    electronics: [
      { type: "hero", label: "الهيرو الرئيسي" },
      { type: "categories", label: "الأقسام" },
      { type: "best_sellers", label: "الأكثر مبيعاً" },
      { type: "trust_badges", label: "لماذا تختارنا" },
      { type: "featured_products", label: "منتجات مميزة", settings: { limit: 8 } },
      { type: "promo_banner", label: "عرض الأسبوع" },
      { type: "latest_products", label: "وصل حديثاً" },
    ],
    books: [
      { type: "hero", label: "الهيرو الرئيسي" },
      { type: "categories", label: "الأقسام الأدبية" },
      { type: "featured_products", label: "أبرز الإصدارات", settings: { title: "أبرز الإصدارات" } },
      { type: "latest_products", label: "أحدث الإضافات" },
      { type: "testimonials", label: "آراء القراء" },
    ],
    subscriptions: [
      { type: "hero", label: "الهيرو الرئيسي" },
      { type: "pricing_cards", label: "الباقات والأسعار" },
      { type: "trust_badges", label: "لماذا نحن" },
      { type: "testimonials", label: "آراء المشتركين" },
      { type: "faq", label: "الأسئلة الشائعة" },
    ],
    accessories: [
      { type: "hero", label: "الهيرو الرئيسي" },
      { type: "categories", label: "التصنيفات" },
      { type: "featured_products", label: "تشكيلة مميزة", settings: { limit: 8 } },
      { type: "trust_badges", label: "الجودة والثقة" },
      { type: "latest_products", label: "وصل حديثاً" },
    ],
    personal_services: [
      { type: "hero", label: "الهيرو الرئيسي" },
      { type: "services_list", label: "خدماتنا" },
      { type: "testimonials", label: "آراء العملاء" },
      { type: "about_text", label: "من نحن" },
      { type: "faq", label: "الأسئلة الشائعة" },
      { type: "contact_section", label: "تواصل معنا" },
    ],
    blank: [
      { type: "hero", label: "الهيرو الرئيسي" },
      { type: "categories", label: "التصنيفات" },
      { type: "featured_products", label: "المنتجات", settings: { limit: 8 } },
      { type: "promo_banner", label: "عرض خاص" },
    ],
    general: [
      { type: "hero", label: "الهيرو الرئيسي" },
      { type: "categories", label: "التصنيفات" },
      { type: "best_sellers", label: "الأكثر طلباً" },
      { type: "featured_products", label: "منتجات مختارة", settings: { limit: 8 } },
      { type: "promo_banner", label: "عرض خاص" },
      { type: "trust_badges", label: "لماذا تختارنا" },
    ],
  };

  let sections = [...(templates[baseTheme] ?? templates.general)];

  // Add optional sections based on prompt keywords
  const hasSection = (t: string) => sections.some((s) => s.type === t);

  if (hasPromo && !hasSection("promo_banner")) {
    sections.push({ type: "promo_banner", label: "عرض ترويجي مميز", settings: { title: "عروض حصرية لفترة محدودة", badge_label: "عرض مميز" } });
  }
  if (hasTestimonials && !hasSection("testimonials")) {
    sections.push({ type: "testimonials", label: "آراء عملائنا" });
  }
  if (hasTrust && !hasSection("trust_badges")) {
    sections.push({ type: "trust_badges", label: "لماذا تختارنا" });
  }
  if (hasFaq && !hasSection("faq")) {
    sections.push({ type: "faq", label: "الأسئلة الشائعة" });
  }
  if (hasAbout && !hasSection("about_text")) {
    sections.push({ type: "about_text", label: "من نحن" });
  }
  if (hasContact && !hasSection("contact_section")) {
    sections.push({ type: "contact_section", label: "تواصل معنا" });
  }
  if (hasNewsletter && !hasSection("newsletter")) {
    sections.push({ type: "newsletter", label: "النشرة البريدية" });
  }

  // Keep max 10
  sections = sections.slice(0, 10);

  return sections.map((s, i) => ({ ...s, order: i }));
}

function buildHero(baseTheme: BaseTheme, text: string, tone?: string): AiThemeConfig["hero"] {
  const isLuxury = /فاخر|luxury|راقي/.test(text) || tone === "luxury";

  const heroes: Record<BaseTheme, AiThemeConfig["hero"]> = {
    fashion: {
      title: isLuxury ? "أناقة لا حدود لها — مجموعتنا الحصرية" : "اكتشفي أحدث صيحات الموضة",
      subtitle: isLuxury ? "تشكيلات حصرية من أرقى دور الأزياء لكل مناسبة" : "ملابس عصرية بأسعار تنافسية — شحن سريع لباب بيتك",
      cta_label: "تسوقي الآن",
      style: isLuxury ? "dark" : "light",
    },
    electronics: {
      title: "أحدث التقنية بين يديك",
      subtitle: "أجهزة ومنتجات تقنية عالية الجودة بأفضل الأسعار مع ضمان الأصالة",
      cta_label: "استكشف المنتجات",
      style: "branded",
    },
    books: {
      title: "عالمك في كتاب",
      subtitle: "آلاف العناوين في كل الأصناف — كتبك الأثيرة في متناول يدك",
      cta_label: "تصفح الإصدارات",
      style: "light",
    },
    subscriptions: {
      title: "انضم إلى مجتمعنا اليوم",
      subtitle: "اختر الباقة التي تناسبك واستمتع بمزايا لا حصر لها",
      cta_label: "ابدأ الآن",
      style: "branded",
    },
    accessories: {
      title: "إكسسوارات تعكس شخصيتك",
      subtitle: "تشكيلة مختارة بعناية من الإكسسوارات والمجوهرات لكل مناسبة",
      cta_label: "اكتشف التشكيلة",
      style: isLuxury ? "dark" : "light",
    },
    personal_services: {
      title: "خدمات احترافية بجودة عالية",
      subtitle: "نقدم لك أفضل خدماتنا المتخصصة بأسعار منافسة — احجز موعدك الآن",
      cta_label: "احجز الآن",
      style: "light",
    },
    blank: {
      title: "مرحباً بك في متجرنا",
      subtitle: "نقدم لك أفضل المنتجات بأسعار تنافسية مع شحن سريع لباب بيتك",
      cta_label: "تسوق الآن",
      style: "light",
    },
    general: {
      title: "كل ما تحتاجه في مكان واحد",
      subtitle: "تشكيلة متنوعة من المنتجات عالية الجودة مع توصيل سريع لجميع المدن",
      cta_label: "تسوق الآن",
      style: "light",
    },
  };

  return heroes[baseTheme] ?? heroes.general;
}

function buildFooter(baseTheme: BaseTheme): string {
  const footers: Record<BaseTheme, string> = {
    fashion: "جميع الحقوق محفوظة — متجرك لأحدث الأزياء والموضة",
    electronics: "جميع الحقوق محفوظة — متجرك الموثوق للإلكترونيات والتقنية",
    books: "جميع الحقوق محفوظة — متجرك للكتب والمعرفة",
    subscriptions: "جميع الحقوق محفوظة — خدمات الاشتراك المميزة",
    accessories: "جميع الحقوق محفوظة — تشكيلاتنا المختارة بعناية",
    personal_services: "جميع الحقوق محفوظة — خدمات احترافية بمعايير عالية",
    blank: "جميع الحقوق محفوظة",
    general: "جميع الحقوق محفوظة — متجرنا الإلكتروني",
  };
  return footers[baseTheme] ?? footers.general;
}

function buildSeo(baseTheme: BaseTheme, text: string): AiThemeConfig["seo"] {
  const titles: Record<BaseTheme, string> = {
    fashion: "أحدث الأزياء والملابس | تسوق أونلاين",
    electronics: "إلكترونيات وتقنية | أفضل الأسعار",
    books: "كتب ومجلات متنوعة | مكتبتك الإلكترونية",
    subscriptions: "اشتراكات وعضويات | أفضل الباقات",
    accessories: "إكسسوارات ومجوهرات | تشكيلات مختارة",
    personal_services: "خدمات احترافية | احجز موعدك الآن",
    blank: "متجرنا الإلكتروني | تسوق بثقة",
    general: "متجر إلكتروني | منتجات متنوعة وأسعار مميزة",
  };
  const descriptions: Record<BaseTheme, string> = {
    fashion: "تسوق أحدث الأزياء والملابس العصرية بأسعار تنافسية. شحن سريع وإرجاع مجاني.",
    electronics: "أفضل الأجهزة الإلكترونية بأسعار مميزة مع ضمان الجودة والأصالة. توصيل لجميع المدن.",
    books: "آلاف العناوين في كل الأصناف والتخصصات. اطلب كتبك المفضلة وتصلك لباب بيتك.",
    subscriptions: "اختر باقتك المناسبة واستمتع بمزايا حصرية. اشترك الآن وابدأ رحلتك معنا.",
    accessories: "تشكيلة منتقاة من الإكسسوارات والمجوهرات عالية الجودة بأسعار تنافسية.",
    personal_services: "خدمات احترافية متميزة. احجز موعدك الآن واحصل على أفضل تجربة.",
    blank: "تسوق أونلاين بثقة وأمان. منتجات متنوعة وتوصيل سريع.",
    general: "تسوق منتجات متنوعة بأسعار تنافسية مع شحن سريع وخدمة عملاء مميزة.",
  };
  return {
    meta_title: titles[baseTheme] ?? titles.general,
    meta_description: descriptions[baseTheme] ?? descriptions.general,
  };
}

// ── Public API: Generate mock theme config ────────────────────
export function generateMockThemeConfig(input: ThemeConfigInput): string {
  const text =
    `${input.prompt} ${input.store_type ?? ""} ${input.tone ?? ""} ${input.target_audience ?? ""}`.toLowerCase();

  const base_theme = detectBaseTheme(text);
  const colors = detectColors(text, input.tone);
  const hero = buildHero(base_theme, text, input.tone);
  const rawSections = buildSections(base_theme, text);
  const sections: AiThemeConfig["sections"] = rawSections.map((s, i) => ({
    type: s.type,
    enabled: true,
    order: i,
    label: s.label ?? SECTION_LABELS[s.type],
    settings: s.settings ?? {},
    visibility: { mobile: true, desktop: true },
  }));

  const config: AiThemeConfig = {
    base_theme,
    colors,
    hero,
    sections,
    footer: { text: buildFooter(base_theme) },
    seo: buildSeo(base_theme, text),
  };

  return JSON.stringify(config);
}
