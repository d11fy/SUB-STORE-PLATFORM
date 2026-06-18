// ============================================================
// Saba Store — Theme Demo Data
// Static demo content for theme preview — NO DB queries, NO auth
// ============================================================

import type { StoreThemeSettings } from "@/lib/types/database";
import type { ProductWithImages } from "@/components/storefront/themes/theme-types";

// ── Minimal mock types ────────────────────────────────────────
export interface DemoStore {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  subdomain: null;
  description: string;
  logo_url: null;
  favicon_url: null;
  cover_url: null;
  requires_shipping: boolean;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  country: string;
  currency: string;
  status: "active";
  current_theme_id: null;
  package_id: null;
  meta_title: null;
  meta_description: null;
  social_links: Record<string, string>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DemoCategory {
  id: string;
  store_id: string;
  parent_id: null;
  name: string;
  slug: string;
  description: null;
  image_url: null;
  sort_order: number;
  is_active: true;
  created_at: string;
  updated_at: string;
}

export interface ThemeDemoData {
  store: DemoStore;
  categories: DemoCategory[];
  products: ProductWithImages[];
  settings: StoreThemeSettings;
  meta: {
    themeType: string;
    accentColor: string;
    bgColor: string;
    description: string;
    storeTagline: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────
const DEMO_TS = "2026-01-01T00:00:00Z";

function makeStore(partial: Partial<DemoStore> & Pick<DemoStore, "name" | "slug" | "description">): DemoStore {
  return {
    id: `demo-store-${partial.slug}`,
    owner_id: "demo-owner",
    subdomain: null,
    logo_url: null,
    favicon_url: null,
    cover_url: null,
    requires_shipping: true,
    email: null,
    phone: null,
    whatsapp: null,
    address: null,
    city: null,
    country: "PS",
    currency: "₪",
    status: "active",
    current_theme_id: null,
    package_id: null,
    meta_title: null,
    meta_description: null,
    social_links: { instagram: "#", facebook: "#" },
    settings: {},
    created_at: DEMO_TS,
    updated_at: DEMO_TS,
    ...partial,
  };
}

function makeCategory(id: string, name: string, slug: string, order = 0): DemoCategory {
  return {
    id,
    store_id: "demo",
    parent_id: null,
    name,
    slug,
    description: null,
    image_url: null,
    sort_order: order,
    is_active: true,
    created_at: DEMO_TS,
    updated_at: DEMO_TS,
  };
}

let _pid = 1;
function makeProduct(partial: {
  name: string;
  price: number;
  comparePrice?: number;
  isFeatured?: boolean;
  isDigital?: boolean;
  productType?: "physical" | "digital" | "subscription" | "service";
  tags?: string[];
  subscriptionValue?: number;
  subscriptionUnit?: string;
  shortDescription?: string;
}): ProductWithImages {
  const id = `demo-product-${_pid++}`;
  return {
    id,
    store_id: "demo",
    category_id: null,
    name: partial.name,
    slug: id,
    description: null,
    short_description: partial.shortDescription || null,
    price: partial.price,
    compare_price: partial.comparePrice ?? null,
    sku: null,
    barcode: null,
    stock_quantity: 99,
    track_inventory: false,
    is_active: true,
    is_featured: partial.isFeatured ?? false,
    is_digital: partial.isDigital ?? false,
    product_type: partial.productType ?? "physical",
    subscription_duration_value: partial.subscriptionValue ?? null,
    subscription_duration_unit: partial.subscriptionUnit ?? null,
    weight: null,
    meta_title: null,
    meta_description: null,
    tags: partial.tags ?? [],
    attributes: {},
    created_at: DEMO_TS,
    updated_at: DEMO_TS,
    product_images: [],
  };
}

function makeSettings(partial: Partial<StoreThemeSettings>): StoreThemeSettings {
  return {
    id: "demo-settings",
    store_id: "demo",
    theme_id: "demo-theme",
    primary_color: "#1B4FD8",
    secondary_color: "#7C3AED",
    accent_color: "#F59E0B",
    font_family: "Cairo",
    hero_title: null,
    hero_subtitle: null,
    hero_image_url: null,
    logo_url: null,
    favicon_url: null,
    sections_order: ["hero", "categories", "featured", "banner", "products"],
    hidden_sections: [],
    footer_content: null,
    custom_css: null,
    custom_html: {},
    settings: {},
    updated_at: DEMO_TS,
    ...partial,
  };
}

// ============================================================
// FASHION — أناقة
// ============================================================
export const fashionDemo: ThemeDemoData = {
  store: makeStore({
    name: "أناقة",
    slug: "anaqah-demo",
    description: "متجر الأزياء الفاخرة",
    requires_shipping: true,
    email: "hello@anaqah.ps",
    city: "رام الله",
  }),
  categories: [
    makeCategory("fc1", "فساتين", "dresses", 0),
    makeCategory("fc2", "عبايات", "abayas", 1),
    makeCategory("fc3", "أحذية", "shoes", 2),
    makeCategory("fc4", "حقائب", "bags", 3),
    makeCategory("fc5", "عروض الموسم", "sale", 4),
  ],
  products: [
    makeProduct({ name: "فستان صيفي أنيق", price: 149, comparePrice: 199, isFeatured: true }),
    makeProduct({ name: "معطف كلاسيكي فاخر", price: 389, isFeatured: true }),
    makeProduct({ name: "حقيبة جلد إيطالي", price: 279, isFeatured: true }),
    makeProduct({ name: "حذاء كعب عالٍ", price: 219, comparePrice: 279, isFeatured: true }),
    makeProduct({ name: "عباية ناعمة مزخرفة", price: 329 }),
    makeProduct({ name: "طقم يومي عصري", price: 179, comparePrice: 229 }),
    makeProduct({ name: "جينز سليم فيت", price: 139 }),
    makeProduct({ name: "بلوزة كاجوال فاخرة", price: 89 }),
  ],
  settings: makeSettings({
    hero_title: "أناقتك تبدأ من هنا",
    hero_subtitle: "تشكيلة حصرية من الأزياء الفاخرة — مصممة بعناية لتعكس شخصيتك الفريدة.",
    footer_content: "أناقة — لأن التفاصيل هي ما يصنع الفرق.",
    accent_color: "#e11d48",
  }),
  meta: {
    themeType: "الملابس والأزياء",
    accentColor: "#e11d48",
    bgColor: "#1e293b",
    description: "قالب فاخر للأزياء والملابس — هيرو سينمائي داكن وبطاقات بورتريه 3:4 وشبكة تحريرية للتصنيفات.",
    storeTagline: "أزياء فاخرة / مجموعات موسمية / عروض محدودة",
  },
};

// ============================================================
// ELECTRONICS — تك زون
// ============================================================
export const electronicsDemo: ThemeDemoData = {
  store: makeStore({
    name: "تك زون",
    slug: "techzone-demo",
    description: "أحدث الأجهزة الذكية والإلكترونيات",
    requires_shipping: true,
    email: "info@techzone.ps",
    city: "القدس",
  }),
  categories: [
    makeCategory("ec1", "جوالات", "phones", 0),
    makeCategory("ec2", "لابتوبات", "laptops", 1),
    makeCategory("ec3", "سماعات", "headphones", 2),
    makeCategory("ec4", "أجهزة ذكية", "smart", 3),
    makeCategory("ec5", "إكسسوارات", "accessories", 4),
  ],
  products: [
    makeProduct({ name: "سماعات لاسلكية بلوتوث", price: 199, comparePrice: 259, isFeatured: true, tags: ["بلوتوث 5.0", "ضد الماء"] }),
    makeProduct({ name: "لابتوب للأعمال", price: 2499, isFeatured: true, tags: ["i7", "16GB RAM"] }),
    makeProduct({ name: "شاحن سريع 65W", price: 79, comparePrice: 99, tags: ["USB-C", "GaN"] }),
    makeProduct({ name: "ساعة ذكية", price: 549, isFeatured: true, tags: ["AMOLED", "GPS"] }),
    makeProduct({ name: "كيبورد ميكانيكي", price: 349, comparePrice: 429, tags: ["RGB", "مع إضاءة"] }),
    makeProduct({ name: "راوتر WiFi 6", price: 299, tags: ["Dual Band", "400Mbps"] }),
    makeProduct({ name: "سماعات أذن", price: 149, comparePrice: 199 }),
    makeProduct({ name: "كاميرا ويب 4K", price: 229, tags: ["4K", "Auto Focus"] }),
  ],
  settings: makeSettings({
    hero_title: "أحدث الأجهزة الذكية بأفضل الأسعار",
    hero_subtitle: "تشكيلة واسعة من أحدث الإلكترونيات والأجهزة — بضمان أصلي وشحن سريع.",
    footer_content: "تك زون — شريكك التقني الموثوق.",
    primary_color: "#2563eb",
    accent_color: "#2563eb",
  }),
  meta: {
    themeType: "الإلكترونيات والتقنية",
    accentColor: "#2563eb",
    bgColor: "#0f172a",
    description: "قالب تقني عالي التحويل — هيرو داكن، شريط عروض يوميّة، فلاش ديلز، بطاقات مواصفات.",
    storeTagline: "أجهزة ذكية / ضمان أصلي / شحن سريع",
  },
};

// ============================================================
// SUBSCRIPTIONS — ستريم بلس
// ============================================================
export const subscriptionsDemo: ThemeDemoData = {
  store: makeStore({
    name: "ستريم بلس",
    slug: "streamplus-demo",
    description: "اشتراكات رقمية مضمونة للأفراد والشركات",
    requires_shipping: false,
    email: "support@streamplus.ps",
    city: "رام الله",
  }),
  categories: [
    makeCategory("sc1", "باقات شهرية", "monthly", 0),
    makeCategory("sc2", "باقات سنوية", "yearly", 1),
    makeCategory("sc3", "باقات عائلية", "family", 2),
    makeCategory("sc4", "باقات أعمال", "business", 3),
  ],
  products: [
    makeProduct({ name: "باقة أساسية", price: 29, productType: "subscription", subscriptionValue: 1, subscriptionUnit: "month", shortDescription: "للمستخدم الفردي — تفعيل فوري" }),
    makeProduct({ name: "باقة متقدمة", price: 59, productType: "subscription", subscriptionValue: 1, subscriptionUnit: "month", isFeatured: true, shortDescription: "الأكثر شيوعاً — كل الميزات مفعّلة" }),
    makeProduct({ name: "باقة مميزة", price: 99, productType: "subscription", subscriptionValue: 1, subscriptionUnit: "month", shortDescription: "للفرق والمشاريع — دعم VIP" }),
    makeProduct({ name: "باقة سنوية", price: 499, comparePrice: 708, productType: "subscription", subscriptionValue: 1, subscriptionUnit: "year", isFeatured: true, shortDescription: "وفّر 30% — الاشتراك السنوي الأفضل" }),
  ],
  settings: makeSettings({
    hero_title: "كل أدواتك في اشتراك واحد",
    hero_subtitle: "اشتراكات رقمية مضمونة تُفعَّل فوراً — للأفراد والشركات.",
    footer_content: "ستريم بلس — جودة بلا انقطاع.",
    primary_color: "#7c3aed",
    accent_color: "#7c3aed",
  }),
  meta: {
    themeType: "الاشتراكات الرقمية",
    accentColor: "#7c3aed",
    bgColor: "#1e1b4b",
    description: "قالب SaaS — هيرو بنفسجي، بطاقات تسعير، جدول مقارنة، شهادات عملاء، CTA واضح.",
    storeTagline: "تفعيل فوري / ضمان كامل / إلغاء في أي وقت",
  },
};

// ============================================================
// BOOKS — مكتبة أثر
// ============================================================
export const booksDemo: ThemeDemoData = {
  store: makeStore({
    name: "مكتبة أثر",
    slug: "athar-demo",
    description: "مكتبتك الرقمية في مكان واحد",
    requires_shipping: false,
    email: "hello@athar.ps",
    city: "نابلس",
  }),
  categories: [
    makeCategory("bc1", "كتب إلكترونية", "ebooks", 0),
    makeCategory("bc2", "دورات رقمية", "courses", 1),
    makeCategory("bc3", "ملخصات", "summaries", 2),
    makeCategory("bc4", "أدلة تدريبية", "guides", 3),
    makeCategory("bc5", "تطوير الذات", "self-dev", 4),
    makeCategory("bc6", "ريادة الأعمال", "business", 5),
  ],
  products: [
    makeProduct({ name: "كيف تبدأ مشروعك — دليل عملي", price: 39, isDigital: true, isFeatured: true, tags: ["أ. محمد الخالد"] }),
    makeProduct({ name: "دورة التسويق الرقمي الشاملة", price: 149, isDigital: true, isFeatured: true, tags: ["د. سارة النمر"] }),
    makeProduct({ name: "ملخصات امتحانات 2026", price: 29, isDigital: true, tags: ["جامعة بيرزيت"] }),
    makeProduct({ name: "دليل ريادة الأعمال العربية", price: 49, isDigital: true, isFeatured: true, tags: ["أ. يوسف العمر"] }),
    makeProduct({ name: "كورس Excel احترافي", price: 89, isDigital: true, comparePrice: 129, tags: ["للمبتدئين"] }),
    makeProduct({ name: "قصص عربية معاصرة", price: 25, isDigital: false, tags: ["مجموعة كاملة"] }),
    makeProduct({ name: "كتاب الاستثمار الذكي", price: 55, isDigital: true, tags: ["تمويل شخصي"] }),
    makeProduct({ name: "مجموعة قوالب الأعمال", price: 69, isDigital: true, comparePrice: 99, tags: ["30+ قالب"] }),
  ],
  settings: makeSettings({
    hero_title: "مكتبتك الرقمية في مكان واحد",
    hero_subtitle: "آلاف الكتب والدورات والقوالب — تحميل فوري بعد الشراء مباشرة.",
    footer_content: "مكتبة أثر — المعرفة بين يديك.",
    primary_color: "#d97706",
    accent_color: "#d97706",
  }),
  meta: {
    themeType: "الكتب والمحتوى الرقمي",
    accentColor: "#d97706",
    bgColor: "#1c1917",
    description: "مكتبة رقمية — هيرو داكن بعنبري، بطاقات كتب بورتريه 3:4، شارات نوع الملف، شهادات قراء.",
    storeTagline: "تحميل فوري / مكتبة رقمية / دورات احترافية",
  },
};

// ============================================================
// ACCESSORIES — لمسة
// ============================================================
export const accessoriesDemo: ThemeDemoData = {
  store: makeStore({
    name: "لمسة",
    slug: "lamsa-demo",
    description: "تشكيلة حصرية من الإكسسوارات الفاخرة",
    requires_shipping: true,
    email: "hello@lamsa.ps",
    city: "الخليل",
  }),
  categories: [
    makeCategory("ac1", "خواتم", "rings", 0),
    makeCategory("ac2", "ساعات", "watches", 1),
    makeCategory("ac3", "هدايا", "gifts", 2),
    makeCategory("ac4", "إكسسوارات نسائية", "womens", 3),
    makeCategory("ac5", "إكسسوارات رجالية", "mens", 4),
  ],
  products: [
    makeProduct({ name: "خاتم ذهبي ناعم", price: 189, isFeatured: true }),
    makeProduct({ name: "ساعة كلاسيكية فاخرة", price: 599, isFeatured: true, comparePrice: 749 }),
    makeProduct({ name: "عقد لؤلؤ طبيعي", price: 249, isFeatured: true }),
    makeProduct({ name: "سوار فضي", price: 129, comparePrice: 169 }),
    makeProduct({ name: "حقيبة هدايا فاخرة", price: 159, isFeatured: true }),
    makeProduct({ name: "دبوس نحاسي مزخرف", price: 79 }),
    makeProduct({ name: "طقم مجوهرات كاملة", price: 449, comparePrice: 599 }),
    makeProduct({ name: "حلق دلايات مرصعة", price: 169 }),
  ],
  settings: makeSettings({
    hero_title: "أناقة لا حدود لها",
    hero_subtitle: "تشكيلة حصرية من الإكسسوارات الفاخرة — لأن التفاصيل هي ما يصنع الفرق.",
    footer_content: "لمسة — فخامة في كل تفصيلة.",
    primary_color: "#f59e0b",
    accent_color: "#f59e0b",
  }),
  meta: {
    themeType: "المجوهرات والهدايا",
    accentColor: "#f59e0b",
    bgColor: "#fefce8",
    description: "متجر فاخر فاتح — سبليت هيرو عاجي/ذهبي، شريط ثقة، بطاقات أنيقة، دليل هدايا.",
    storeTagline: "مجوهرات / ساعات / هدايا فاخرة",
  },
};

// ============================================================
// BLANK — متجر جديد
// ============================================================
export const blankDemo: ThemeDemoData = {
  store: makeStore({
    name: "متجر جديد",
    slug: "new-store-demo",
    description: "أنشئ متجرك وخصصه كما تريد",
    requires_shipping: true,
    email: "info@mystore.ps",
    city: "رام الله",
  }),
  categories: [
    makeCategory("bl1", "الفئة الأولى", "category-1", 0),
    makeCategory("bl2", "الفئة الثانية", "category-2", 1),
    makeCategory("bl3", "الفئة الثالثة", "category-3", 2),
    makeCategory("bl4", "عروض خاصة", "offers", 3),
  ],
  products: [
    makeProduct({ name: "المنتج الأول", price: 99, isFeatured: true }),
    makeProduct({ name: "المنتج الثاني", price: 149, comparePrice: 199, isFeatured: true }),
    makeProduct({ name: "المنتج الثالث", price: 79 }),
    makeProduct({ name: "المنتج الرابع", price: 199, isFeatured: true }),
    makeProduct({ name: "المنتج الخامس", price: 129, comparePrice: 159 }),
    makeProduct({ name: "المنتج السادس", price: 89 }),
    makeProduct({ name: "المنتج السابع", price: 249 }),
    makeProduct({ name: "المنتج الثامن", price: 59 }),
  ],
  settings: makeSettings({
    hero_title: "مرحباً بكم في متجرنا",
    hero_subtitle: "نقدم مجموعة واسعة من المنتجات بجودة عالية وتجربة تسوق سهلة وآمنة.",
    footer_content: "متجرك الجديد — ابدأ رحلتك التجارية اليوم.",
  }),
  meta: {
    themeType: "قالب مرن — لجميع الأنشطة",
    accentColor: "#6366f1",
    bgColor: "#f8fafc",
    description: "قالب محايد مرن — حرف أولي للمتجر، أيقونات الأقسام، بنر ترويجي، شبكة منتجات.",
    storeTagline: "متجر مرن / قابل للتخصيص / لكل نشاط",
  },
};

// ============================================================
// PERSONAL SERVICES — مستشارك
// ============================================================
export const personalServicesDemo: ThemeDemoData = {
  store: makeStore({
    name: "مستشارك",
    slug: "mustasharek-demo",
    description: "خبرتي في خدمتك — استشارات ومتابعة مخصصة",
    requires_shipping: false,
    email: "coach@mustasharek.ps",
    phone: "+970-59-000-0000",
    city: "رام الله",
  }),
  categories: [
    makeCategory("ps1", "استشارات", "consulting", 0),
    makeCategory("ps2", "جلسات تدريب", "coaching", 1),
    makeCategory("ps3", "خطط شخصية", "plans", 2),
    makeCategory("ps4", "باقات متابعة", "follow-up", 3),
  ],
  products: [
    makeProduct({ name: "جلسة استشارة فردية", price: 149, productType: "service", isFeatured: true, shortDescription: "ساعة كاملة — عبر الزوم أو حضورياً" }),
    makeProduct({ name: "باقة تدريب شهرية", price: 499, productType: "service", isFeatured: true, comparePrice: 649, shortDescription: "4 جلسات + متابعة يومية + خطة مخصصة" }),
    makeProduct({ name: "خطة تطوير شخصية", price: 299, productType: "service", isFeatured: true, shortDescription: "تقييم كامل + خطة 90 يوم مفصّلة" }),
    makeProduct({ name: "متابعة أسبوعية", price: 199, productType: "service", shortDescription: "تواصل أسبوعي مستمر ومتابعة تقدمك" }),
    makeProduct({ name: "ورشة عمل جماعية", price: 79, productType: "service", shortDescription: "مجموعات صغيرة — 3 ساعات مكثفة" }),
  ],
  settings: makeSettings({
    hero_title: "خبرتي في خدمتك",
    hero_subtitle: "استشارات مخصصة وجلسات تدريب تغيّر مسارك المهني — احجز جلستك الأولى الآن.",
    footer_content: "مستشارك — معك في كل خطوة.",
    primary_color: "#e11d48",
    accent_color: "#e11d48",
  }),
  meta: {
    themeType: "الاستشارات والخدمات",
    accentColor: "#e11d48",
    bgColor: "#fff1f2",
    description: "قالب الخدمات الشخصية — هيرو وردي بملف المقدم، باقات الخدمات، خطوات العمل، آراء العملاء.",
    storeTagline: "استشارات / تدريب / متابعة شخصية",
  },
};

// ============================================================
// GENERAL — سوق اليوم
// ============================================================
export const generalDemo: ThemeDemoData = {
  store: makeStore({
    name: "سوق اليوم",
    slug: "souq-demo",
    description: "كل ما تحتاجه في مكان واحد",
    requires_shipping: true,
    email: "info@souq.ps",
    city: "الضفة الغربية",
  }),
  categories: [
    makeCategory("gc1", "منتجات منزلية", "home", 0),
    makeCategory("gc2", "مواد غذائية", "food", 1),
    makeCategory("gc3", "العناية الشخصية", "personal", 2),
    makeCategory("gc4", "عروض اليوم", "deals", 3),
    makeCategory("gc5", "الأكثر طلباً", "bestsellers", 4),
  ],
  products: [
    makeProduct({ name: "زيت زيتون بكر فلسطيني", price: 45, isFeatured: true, comparePrice: 59 }),
    makeProduct({ name: "صابون نابلسي طبيعي", price: 35, isFeatured: true }),
    makeProduct({ name: "منظف متعدد الاستخدامات", price: 29, comparePrice: 39 }),
    makeProduct({ name: "بهارات مشكلة فاخرة", price: 25 }),
    makeProduct({ name: "عطر عود فاخر", price: 299, isFeatured: true, comparePrice: 379 }),
    makeProduct({ name: "قهوة عربية مطحونة", price: 65, isFeatured: true }),
    makeProduct({ name: "عسل سدر طبيعي", price: 89, comparePrice: 109 }),
    makeProduct({ name: "تمر مجدول ممتاز", price: 55 }),
    makeProduct({ name: "زعتر بلدي أصلي", price: 32, comparePrice: 42 }),
    makeProduct({ name: "معجون طماطم محلي", price: 18 }),
    makeProduct({ name: "شاي أعشاب طبيعي", price: 39 }),
    makeProduct({ name: "حبة البركة الأصلية", price: 22 }),
  ],
  settings: makeSettings({
    hero_title: "كل ما تحتاجه — بين يديك",
    hero_subtitle: "أكثر من 500 منتج من أفضل الأسواق المحلية — توصيل سريع وأسعار لا تُقاوم.",
    footer_content: "سوق اليوم — ثقتك أمانة.",
    primary_color: "#059669",
    accent_color: "#059669",
  }),
  meta: {
    themeType: "المتجر العام متعدد التصنيفات",
    accentColor: "#059669",
    bgColor: "#ecfdf5",
    description: "متجر عام عالي التحويل — شريط ترحيبي، شبكة أقسام، فلاش ديلز، بنر ترويجي، منتجات متنوعة.",
    storeTagline: "تسوق سهل / توصيل سريع / أسعار منافسة",
  },
};

// ============================================================
// EXPORT MAP
// ============================================================
export type DemoThemeKey =
  | "fashion"
  | "electronics"
  | "subscriptions"
  | "books"
  | "accessories"
  | "blank"
  | "personal_services"
  | "general";

export const THEME_DEMO_DATA: Record<DemoThemeKey, ThemeDemoData> = {
  fashion: fashionDemo,
  electronics: electronicsDemo,
  subscriptions: subscriptionsDemo,
  books: booksDemo,
  accessories: accessoriesDemo,
  blank: blankDemo,
  personal_services: personalServicesDemo,
  general: generalDemo,
};

// Card display metadata (for themes-client)
export const THEME_CARD_META: Record<
  DemoThemeKey,
  {
    label: string;
    field: string;
    tagline: string;
    accentColor: string;
    cardBg: string;
    cardAccentBg: string;
    icon: string;
  }
> = {
  fashion: {
    label: "قالب الأزياء والملابس",
    field: "الملابس والأزياء",
    tagline: "هيرو سينمائي، بطاقات بورتريه 3:4، أقسام تحريرية",
    accentColor: "#e11d48",
    cardBg: "from-slate-900 to-slate-800",
    cardAccentBg: "bg-rose-600",
    icon: "👗",
  },
  electronics: {
    label: "قالب الإلكترونيات",
    field: "الإلكترونيات والتقنية",
    tagline: "عروض يومية، مواصفات في الكروت، تصنيفات سريعة",
    accentColor: "#2563eb",
    cardBg: "from-slate-900 to-slate-800",
    cardAccentBg: "bg-blue-600",
    icon: "💻",
  },
  subscriptions: {
    label: "قالب الاشتراكات الرقمية",
    field: "الاشتراكات والخدمات الرقمية",
    tagline: "تسعير SaaS، جدول مقارنة، بدون شحن",
    accentColor: "#7c3aed",
    cardBg: "from-violet-950 to-slate-900",
    cardAccentBg: "bg-violet-600",
    icon: "🎟️",
  },
  books: {
    label: "قالب الكتب والمحتوى",
    field: "الكتب والدورات الرقمية",
    tagline: "مكتبة رقمية، بطاقات غلاف، شارات نوع الملف",
    accentColor: "#d97706",
    cardBg: "from-stone-900 to-slate-900",
    cardAccentBg: "bg-amber-600",
    icon: "📚",
  },
  accessories: {
    label: "قالب الإكسسوارات الفاخرة",
    field: "المجوهرات والهدايا",
    tagline: "فاتح فاخر، سبليت هيرو، ذهبي وعاجي",
    accentColor: "#f59e0b",
    cardBg: "from-amber-50 to-stone-50",
    cardAccentBg: "bg-amber-500",
    icon: "💍",
  },
  blank: {
    label: "القالب المحايد المرن",
    field: "مرن — لجميع الأنشطة",
    tagline: "حياد كامل، قابل للتخصيص، حرف أولي للمتجر",
    accentColor: "#6366f1",
    cardBg: "from-slate-50 to-white",
    cardAccentBg: "bg-indigo-500",
    icon: "⬜",
  },
  personal_services: {
    label: "قالب الخدمات الشخصية",
    field: "الاستشارات والتدريب",
    tagline: "هيرو شخصي، باقات خدمات، شهادات عملاء",
    accentColor: "#e11d48",
    cardBg: "from-rose-50 to-pink-50",
    cardAccentBg: "bg-rose-500",
    icon: "🌸",
  },
  general: {
    label: "قالب المتجر العام",
    field: "السوبرماركت والبضائع المتنوعة",
    tagline: "شبكة أقسام، فلاش ديلز، بنر ترويجي",
    accentColor: "#059669",
    cardBg: "from-emerald-50 to-teal-50",
    cardAccentBg: "bg-emerald-600",
    icon: "🛒",
  },
};
