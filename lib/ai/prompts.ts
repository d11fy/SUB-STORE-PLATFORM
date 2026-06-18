// ============================================================
// Saba Store — AI System Prompts
// Arabic prompts for each AI tool type
// ============================================================

import type { AiToolType } from "./mock-responses";

// ============================================================
// TOOL METADATA (Arabic labels & descriptions)
// ============================================================
export interface AiToolMeta {
  type: AiToolType;
  label: string;
  description: string;
  category: "product" | "store" | "policy" | "marketing";
  inputFields: {
    key: string;
    label: string;
    placeholder: string;
    type: "text" | "textarea";
    required: boolean;
  }[];
  creditsPerUse: number;
}

export const AI_TOOLS: AiToolMeta[] = [
  // ── أدوات المنتجات ──
  {
    type: "product_name",
    label: "توليد اسم منتج",
    description: "اقترح اسماً جذاباً واحترافياً للمنتج",
    category: "product",
    inputFields: [
      { key: "category", label: "تصنيف المنتج", placeholder: "مثال: ملابس، إلكترونيات، مستحضرات تجميل...", type: "text", required: true },
      { key: "keywords", label: "كلمات مفتاحية", placeholder: "مثال: فاخر، قطني، رياضي...", type: "text", required: false },
    ],
    creditsPerUse: 1,
  },
  {
    type: "product_description",
    label: "توليد وصف منتج",
    description: "اكتب وصفاً تسويقياً مفصلاً للمنتج",
    category: "product",
    inputFields: [
      { key: "product_name", label: "اسم المنتج", placeholder: "مثال: قميص قطني فاخر", type: "text", required: true },
      { key: "features", label: "المميزات الرئيسية", placeholder: "مثال: قطن 100%، مقاسات متعددة...", type: "textarea", required: false },
    ],
    creditsPerUse: 2,
  },
  {
    type: "product_seo_title",
    label: "توليد عنوان SEO للمنتج",
    description: "عنوان محسّن لمحركات البحث",
    category: "product",
    inputFields: [
      { key: "product_name", label: "اسم المنتج", placeholder: "مثال: حقيبة جلدية يدوية", type: "text", required: true },
    ],
    creditsPerUse: 1,
  },
  {
    type: "product_seo_description",
    label: "توليد وصف SEO للمنتج",
    description: "وصف مختصر يظهر في نتائج محركات البحث",
    category: "product",
    inputFields: [
      { key: "product_name", label: "اسم المنتج", placeholder: "مثال: ساعة يد كلاسيكية", type: "text", required: true },
    ],
    creditsPerUse: 1,
  },

  // ── أدوات المتجر ──
  {
    type: "homepage_title",
    label: "توليد عنوان الصفحة الرئيسية",
    description: "عنوان ترحيبي جذاب للصفحة الرئيسية",
    category: "store",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "مثال: بوتيك الأناقة", type: "text", required: true },
      { key: "store_type", label: "نوع المتجر", placeholder: "مثال: ملابس نسائية، إلكترونيات...", type: "text", required: false },
    ],
    creditsPerUse: 1,
  },
  {
    type: "homepage_description",
    label: "توليد وصف الصفحة الرئيسية",
    description: "فقرة وصفية ترحيبية للمتجر",
    category: "store",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
    ],
    creditsPerUse: 1,
  },
  {
    type: "about_us",
    label: "توليد نبذة «من نحن»",
    description: "صفحة تعريفية احترافية عن المتجر",
    category: "store",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
      { key: "store_type", label: "نوع المنتجات", placeholder: "مثال: عطور، أزياء...", type: "text", required: false },
    ],
    creditsPerUse: 2,
  },
  {
    type: "store_slogan",
    label: "توليد شعار / سلوغان",
    description: "جملة قصيرة تعبّر عن هوية المتجر",
    category: "store",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
      { key: "store_type", label: "نوع المتجر", placeholder: "مثال: متجر هدايا...", type: "text", required: false },
    ],
    creditsPerUse: 1,
  },

  // ── أدوات السياسات ──
  {
    type: "return_policy",
    label: "توليد سياسة الاستبدال والاسترجاع",
    description: "سياسة احترافية للاسترجاع والاستبدال",
    category: "policy",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
    ],
    creditsPerUse: 3,
  },
  {
    type: "privacy_policy",
    label: "توليد سياسة الخصوصية",
    description: "سياسة حماية بيانات العملاء",
    category: "policy",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
    ],
    creditsPerUse: 3,
  },
  {
    type: "terms_of_service",
    label: "توليد شروط الاستخدام",
    description: "شروط وأحكام استخدام المتجر",
    category: "policy",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
    ],
    creditsPerUse: 3,
  },

  // ── أدوات التسويق ──
  {
    type: "instagram_post",
    label: "توليد منشور إنستغرام",
    description: "منشور تسويقي جاهز للنشر",
    category: "marketing",
    inputFields: [
      { key: "product_name", label: "اسم المنتج أو العرض", placeholder: "مثال: عرض الصيف...", type: "text", required: true },
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
    ],
    creditsPerUse: 1,
  },
  {
    type: "short_ad",
    label: "توليد إعلان قصير",
    description: "نص إعلاني مختصر وجذاب",
    category: "marketing",
    inputFields: [
      { key: "product_name", label: "اسم المنتج", placeholder: "المنتج المراد الإعلان عنه", type: "text", required: true },
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
    ],
    creditsPerUse: 1,
  },
  {
    type: "promo_message",
    label: "توليد رسالة ترويجية",
    description: "رسالة ترويجية للواتساب أو SMS",
    category: "marketing",
    inputFields: [
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
      { key: "offer_details", label: "تفاصيل العرض (اختياري)", placeholder: "مثال: خصم 20% على الملابس...", type: "text", required: false },
    ],
    creditsPerUse: 1,
  },
  {
    type: "category_description",
    label: "توليد وصف تصنيف",
    description: "وصف جذاب لتصنيف المنتجات",
    category: "marketing",
    inputFields: [
      { key: "category_name", label: "اسم التصنيف", placeholder: "مثال: ملابس رجالية", type: "text", required: true },
      { key: "store_name", label: "اسم المتجر", placeholder: "اسم متجرك", type: "text", required: true },
    ],
    creditsPerUse: 1,
  },
];

// ============================================================
// CATEGORY LABELS
// ============================================================
export const AI_TOOL_CATEGORIES: Record<string, { label: string; icon: string }> = {
  product: { label: "أدوات المنتجات", icon: "📦" },
  store: { label: "أدوات المتجر", icon: "🏪" },
  policy: { label: "أدوات السياسات", icon: "📋" },
  marketing: { label: "أدوات التسويق", icon: "📢" },
};

// ============================================================
// SYSTEM PROMPT BUILDER
// ============================================================
export function buildSystemPrompt(toolType: AiToolType): string {
  const base = `أنت مساعد ذكاء اصطناعي متخصص في كتابة المحتوى التجاري باللغة العربية.
قواعد ثابتة:
- اكتب بالعربية الفصيحة التسويقية المفهومة.
- المحتوى يجب أن يكون مناسباً للتجار في فلسطين والأردن.
- كن احترافياً ومختصراً عندما يكون المطلوب مختصراً.
- لا تضف وعوداً قانونية أو معلومات غير مؤكدة.
- لا تستخدم إيموجي إلا في المحتوى التسويقي (منشورات، إعلانات).
- لا تذكر منافسين أو علامات تجارية أخرى.`;

  const specific: Record<AiToolType, string> = {
    product_name: "مهمتك: اقترح اسماً واحداً جذاباً ومختصراً لمنتج تجاري. الاسم يجب أن يكون قصيراً (3-8 كلمات) ومعبّراً عن جودة المنتج.",
    product_description: "مهمتك: اكتب وصفاً تسويقياً مفصلاً لمنتج. يجب أن يشمل: فقرة تعريفية، المميزات الرئيسية كنقاط، ودعوة للشراء. بين 80-200 كلمة.",
    product_seo_title: "مهمتك: اكتب عنوان SEO مُحسَّن لمحركات البحث لمنتج. يجب ألا يتجاوز 60 حرفاً. يتضمن اسم المنتج واسم المتجر.",
    product_seo_description: "مهمتك: اكتب وصف SEO مُحسَّن لمحركات البحث لمنتج. يجب ألا يتجاوز 155 حرفاً. يكون وصفاً مختصراً وجذاباً.",
    homepage_title: "مهمتك: اكتب عنواناً ترحيبياً جذاباً للصفحة الرئيسية لمتجر إلكتروني. يجب أن يكون مختصراً (5-12 كلمة) ومحفزاً للتسوق.",
    homepage_description: "مهمتك: اكتب فقرة وصفية قصيرة (30-60 كلمة) للصفحة الرئيسية لمتجر إلكتروني. تعرّف بالمتجر وتدعو للتصفح.",
    about_us: "مهمتك: اكتب صفحة 'من نحن' احترافية لمتجر إلكتروني. تشمل: التعريف بالمتجر، الرؤية، القيم، والالتزام تجاه العملاء. بين 150-300 كلمة.",
    store_slogan: "مهمتك: اكتب شعاراً (سلوغان) قصيراً وجذاباً لمتجر إلكتروني. يجب ألا يتجاوز 8 كلمات. يعبّر عن هوية وقيمة المتجر.",
    return_policy: "مهمتك: اكتب سياسة استبدال واسترجاع احترافية لمتجر إلكتروني. تشمل: المدة، الشروط، الاستثناءات، وطريقة الاسترجاع. لا تضف وعوداً قانونية ملزمة.",
    privacy_policy: "مهمتك: اكتب سياسة خصوصية مبسطة لمتجر إلكتروني. تشمل: البيانات المجموعة، كيفية الاستخدام، الحماية، والحقوق. لا تضف بنوداً قانونية معقدة.",
    terms_of_service: "مهمتك: اكتب شروط استخدام مبسطة لمتجر إلكتروني. تشمل: الشروط العامة، الطلبات، الدفع، التوصيل، والمسؤولية.",
    instagram_post: "مهمتك: اكتب منشور إنستغرام تسويقي جاهز للنشر. يتضمن إيموجي، هاشتاغات عربية، ودعوة للتسوق. بين 50-150 كلمة.",
    short_ad: "مهمتك: اكتب إعلاناً قصيراً وجذاباً (3-5 أسطر) مع إيموجي. مناسب للمنشورات السريعة والستوريز.",
    promo_message: "مهمتك: اكتب رسالة ترويجية مناسبة للإرسال عبر الواتساب أو SMS. مختصرة وجذابة مع دعوة واضحة للتسوق.",
    category_description: "مهمتك: اكتب وصفاً مختصراً (30-50 كلمة) لتصنيف منتجات في متجر إلكتروني. يكون جذاباً ومحفزاً للتصفح.",
  };

  return `${base}\n\n${specific[toolType]}`;
}

// ============================================================
// GET TOOL METADATA
// ============================================================
export function getToolMeta(toolType: AiToolType): AiToolMeta | undefined {
  return AI_TOOLS.find((t) => t.type === toolType);
}
