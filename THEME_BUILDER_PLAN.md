# THEME_BUILDER_PLAN.md
# Stage D0 — Advanced Theme Builder, Pages Builder & Safe Custom Code
# خطة معمارية كاملة — لا تنفيذ حتى اعتماد هذا الملف

> آخر تحديث: Stage D0 Planning — يونيو 2026
> الحالة: **مقترح للمراجعة — لم يُعتمد بعد**

---

## 1. الوضع الحالي (ما يوجد فعلاً)

### جدول `store_theme_settings` — موجود بالفعل
```
primary_color, secondary_color, accent_color   → 3 ألوان فقط
font_family                                     → خط واحد
hero_title, hero_subtitle, hero_image_url       → Hero فقط
logo_url, favicon_url                           → Branding
sections_order: string[]                        → ترتيب بسيط
hidden_sections: string[]                       → إخفاء بسيط
footer_content                                  → نص فوتر
custom_css: string | null                       → موجود، غير مُفعّل
custom_html: Json                               → موجود، غير مُفعّل
settings: Json                                  → catch-all فارغ حالياً
```

### package flags — موجودة بالفعل
```
has_advanced_theme: boolean
has_custom_css: boolean
has_custom_html: boolean
```

### ما يوجد من بنية تقنية
- `ThemeRenderer` → switch على `themes.slug`، يعرض React component ثابت
- `ThemeHeader` / `ThemeFooter` → مكوّنات hardcoded في theme-renderer.tsx
- `updateStoreThemeSettingsAction` → server action موجود + Zod validation
- `themeSettingsSchema` → validation موجود في lib/validations/theme.ts
- AI system → يولّد نصوص فقط (hero_title, hero_subtitle)، لا JSON config
- `/dashboard/themes/customize/` → صفحة موجودة مع `CustomizeClient`

### الفجوات الحالية
- `sections_order` و `hidden_sections` مجرد arrays بدون config لكل section
- لا per-section settings (لون، نص، صورة لكل قسم)
- Header/Footer غير قابلَين للتخصيص — hardcoded
- لا Pages Builder — لا جدول store_pages
- لا Draft/Publish workflow — الحفظ يؤثر فوراً على المتجر الحي
- لا AI Theme Builder — AI لا يولّد config كاملاً
- لا preview آمن في iframe منفصل

---

## 2. Architecture المقترحة

### 2-A. مبدأ التوسع التدريجي (Additive-Only)

**القاعدة**: نوسّع ما هو موجود بدون كسره.

```
store_theme_settings.settings: Json  ←  هذا العمود هو مستودع الإضافات
```

كل ميزة جديدة تُكتب داخل `settings` كـ sub-key قبل أن نضيف عمود DB خاص.
هذا يعني Stage D1 يمكن أن يبدأ **بدون migration** في كثير من الأجزاء.

### 2-B. نموذج البيانات المقترح

#### `SectionConfig` — النموذج الجوهري
```typescript
interface SectionConfig {
  id: string;           // uuid4 — فريد لكل instance
  type: SectionType;    // enum — أنواع محددة فقط
  enabled: boolean;
  order: number;        // 0-based
  label?: string;       // اسم مخصص للتاجر
  settings: Record<string, unknown>; // per-type settings
  visibility: {
    mobile: boolean;
    desktop: boolean;
  };
}

type SectionType =
  | "hero"
  | "categories"
  | "featured_products"
  | "best_sellers"
  | "latest_products"
  | "promo_banner"
  | "testimonials"
  | "trust_badges"
  | "pricing_cards"      // subscriptions theme
  | "services_list"      // personal_services theme
  | "faq"
  | "about_text"
  | "contact_section"
  | "image_gallery"
  | "newsletter";
  // video_embed_safe → Stage D4+ فقط
  // custom_html_safe → Stage D3+ فقط
```

#### `ThemeCustomizationState` — الحالة الكاملة
```typescript
interface ThemeCustomizationState {
  // يُخزَّن في store_theme_settings.settings
  
  sections_config: SectionConfig[];   // يستبدل sections_order + hidden_sections
  
  colors: {
    primary: string;       // hex — موجود (primary_color)
    secondary: string;     // hex — موجود (secondary_color)
    accent: string;        // hex — موجود (accent_color)
    hero_bg?: string;      // لون Hero المخصص (جديد)
    button_text?: string;  // لون نص الأزرار (جديد)
  };
  
  typography: {
    font_family: string;        // موجود
    heading_weight: "700" | "800" | "900";
    body_size: "sm" | "base";
  };
  
  header: HeaderConfig;
  footer: FooterConfig;
  
  homepage: HomepageConfig;
  
  draft_state?: ThemeCustomizationState;  // مسودة غير منشورة
  published_at?: string;
}

interface HeaderConfig {
  logo_style: "square" | "circle" | "rounded";
  logo_url?: string;
  show_nav: boolean;
  nav_links: { label: string; href: string; }[];
  sticky: boolean;
  show_search: boolean;
  background: "white" | "card" | "primary";
}

interface FooterConfig {
  layout: "simple" | "columns" | "minimal";
  text: string;
  show_social: boolean;
  show_newsletter: boolean;
  show_powered_by: boolean;
  columns?: FooterColumn[];
}

interface HomepageConfig {
  meta_title?: string;
  meta_description?: string;
  show_announcement_bar: boolean;
  announcement_text?: string;
  announcement_link?: string;
}
```

### 2-C. Per-Section Settings Examples

كل `type` له schema خاص في `settings`:

```typescript
// hero section settings
interface HeroSectionSettings {
  title: string;
  subtitle: string;
  image_url?: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label?: string;
  cta_secondary_href?: string;
  style: "dark" | "light" | "branded" | "split";
  overlay_opacity?: number;
}

// promo_banner section settings
interface PromoBannerSettings {
  title: string;
  description: string;
  badge_label?: string;
  cta_label: string;
  cta_href: string;
  variant: "primary" | "emerald" | "rose" | "amber" | "violet";
}

// testimonials section settings
interface TestimonialsSectionSettings {
  title: string;
  items: {
    quote: string;
    name: string;
    role: string;
    rating: 1 | 2 | 3 | 4 | 5;
  }[];
  accent_color: "violet" | "amber" | "rose" | "emerald";
}

// featured_products section settings
interface FeaturedProductsSectionSettings {
  title: string;
  subtitle?: string;
  limit: 4 | 8 | 12;
  source: "is_featured" | "latest" | "on_sale" | "category";
  category_id?: string;
  show_discount_badge: boolean;
  card_style: "default" | "portrait" | "minimal";
}
```

---

## 3. الجداول المطلوبة

### 3-A. تعديل `store_theme_settings` (Migration مطلوب)

```sql
-- إضافة columns جديدة فقط (لا حذف للموجودة)
ALTER TABLE store_theme_settings
  ADD COLUMN IF NOT EXISTS sections_config    JSONB    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS header_config      JSONB    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_config      JSONB    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS homepage_config    JSONB    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS draft_config       JSONB    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_at       TIMESTAMPTZ DEFAULT NULL;

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_store_theme_settings_store_id 
  ON store_theme_settings(store_id);
```

**ملاحظة**: `sections_order` و `hidden_sections` القديمتان تبقيان للـ backward compat.
يُقرأ `sections_config` أولاً؛ إن كان فارغاً يُستخدم `sections_order` القديم.

### 3-B. جدول `store_pages` (جديد — Migration مطلوب)

```sql
CREATE TABLE store_pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,       -- e.g. "about", "faq", "privacy"
  title           TEXT NOT NULL,
  seo_title       TEXT,
  seo_description TEXT,
  sections_config JSONB DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(store_id, slug)  -- لا slugs مكررة لنفس المتجر
);

-- RLS
ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_pages_owner_only" ON store_pages
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_store_pages_store_id ON store_pages(store_id);
CREATE INDEX idx_store_pages_slug ON store_pages(store_id, slug);
```

### 3-C. جدول `ai_theme_generations` (جديد — اختياري)

يمكن استخدام جدول `ai_generations` الموجود مع إضافة نوع جديد:

```sql
-- الخيار الأبسط: إضافة type جديد للـ ai_generation_type enum
-- + حقظ JSON config في generated_text كـ JSON string

-- الخيار الأفضل: عمود إضافي في ai_generations
ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS config_output JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT NULL 
    CHECK (review_status IN ('pending', 'applied', 'rejected'));
```

### 3-D. لاحقاً فقط: `custom_code_snippets`

```sql
-- Stage D4+ فقط — لا تنفيذ الآن
CREATE TABLE custom_code_snippets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('css', 'html')),
  content      TEXT NOT NULL,
  sanitized    TEXT,                    -- النسخة المُعقَّمة
  is_active    BOOLEAN DEFAULT false,
  scope        TEXT DEFAULT 'global' 
    CHECK (scope IN ('global', 'homepage', 'product', 'category')),
  review_status TEXT DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Advanced Theme Customizer — المواصفات

### 4-A. الهيكل التقني

```
app/(dashboard)/dashboard/(workspace)/themes/customize/
├── page.tsx                    ← Server component — جلب البيانات
├── customize-client.tsx        ← Client component — موجود، يُوسَّع
├── tabs/
│   ├── tab-identity.tsx        ← الشعار، الاسم، الألوان
│   ├── tab-homepage.tsx        ← الصفحة الرئيسية
│   ├── tab-sections.tsx        ← إدارة الأقسام (drag & drop)
│   ├── tab-header.tsx          ← الهيدر
│   ├── tab-footer.tsx          ← الفوتر
│   ├── tab-pages.tsx           ← الصفحات المخصصة
│   ├── tab-seo.tsx             ← SEO عام
│   └── tab-ai.tsx              ← AI Theme Builder
├── panels/
│   ├── preview-panel.tsx       ← iframe preview
│   ├── section-editor.tsx      ← تعديل قسم مختار
│   └── section-picker.tsx      ← إضافة قسم جديد
└── preview/
    └── route.tsx               ← Route لـ iframe preview بـ draft settings
```

### 4-B. Validation في `updateSectionsConfigAction`

```typescript
// lib/validations/sections.ts (جديد)
const sectionBaseSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "hero", "categories", "featured_products", "best_sellers",
    "latest_products", "promo_banner", "testimonials", "trust_badges",
    "pricing_cards", "services_list", "faq", "about_text",
    "contact_section", "image_gallery", "newsletter"
  ]),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(30),
  label: z.string().max(50).optional(),
  visibility: z.object({
    mobile: z.boolean(),
    desktop: z.boolean(),
  }),
  settings: z.record(z.unknown()),
});

const sectionsConfigSchema = z.array(sectionBaseSchema).max(20);
```

**لا custom code** في هذا الـ schema. `settings` يحتوي فقط على data primitives (string, number, boolean, string[], urls).

### 4-C. Draft/Publish Workflow

```
التاجر يعدّل → تُحفظ في draft_config فوراً (auto-save)
                ↓
             [معاينة] → iframe يعرض draft_config
                ↓
             [نشر] → draft_config يُنسخ إلى الـ columns الرئيسية
                    published_at = now()
                ↓
              المتجر الحي يتحدث
```

Server action:
```typescript
// saveDraftAction → يحفظ في draft_config فقط
// publishThemeAction → ينسخ draft_config إلى live columns
// discardDraftAction → يمسح draft_config
```

---

## 5. Sections System — التفاصيل

### 5-A. Section Renderer المقترح

```
components/storefront/sections/
├── section-renderer.tsx        ← يأخذ SectionConfig[] ويُرنجر
├── types.ts                    ← SectionConfig, SectionType interfaces
├── hero-section.tsx
├── categories-section.tsx
├── featured-products-section.tsx
├── best-sellers-section.tsx
├── latest-products-section.tsx
├── promo-banner-section.tsx
├── testimonials-section.tsx
├── trust-badges-section.tsx
├── pricing-cards-section.tsx
├── services-list-section.tsx
├── faq-section.tsx
├── about-text-section.tsx
├── contact-section.tsx
├── image-gallery-section.tsx
└── newsletter-section.tsx
```

### 5-B. ربط Theme + Sections

**الاستراتيجية الهجينة (Hybrid)**:

لا نكسر themes الحالية. بدلاً من ذلك:

1. كل theme له `default_sections_config` مُعرَّف statically في الكود
2. التاجر يتعديل على هذا الـ default → يُخزَّن في `store_theme_settings.sections_config`
3. عند render: إذا وُجد `sections_config` في DB → استخدمه، وإلا استخدم default للثيم

```typescript
// components/storefront/themes/fashion-theme.tsx
const FASHION_DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "fashion_hero", type: "hero", enabled: true, order: 0, ... },
  { id: "fashion_trust", type: "trust_badges", enabled: true, order: 1, ... },
  { id: "fashion_new_arrivals", type: "latest_products", enabled: true, order: 2, ... },
  { id: "fashion_categories", type: "categories", enabled: true, order: 3, ... },
  { id: "fashion_best_sellers", type: "best_sellers", enabled: true, order: 4, ... },
  { id: "fashion_promo", type: "promo_banner", enabled: true, order: 5, ... },
  { id: "fashion_newsletter", type: "newsletter", enabled: true, order: 6, ... },
];
```

### 5-C. Render الآمن

```typescript
// section-renderer.tsx
export function SectionRenderer({
  sections,
  store,
  categories,
  products,
  settings,
}: SectionRendererProps) {
  const sorted = [...sections]
    .filter(s => s.enabled && s.visibility.desktop)  // تحقق من visibility
    .sort((a, b) => a.order - b.order);
  
  return (
    <>
      {sorted.map(section => (
        <SectionSwitch
          key={section.id}
          section={section}
          store={store}
          categories={categories}
          products={products}
          settings={settings}
        />
      ))}
    </>
  );
}
```

**لا `dangerouslySetInnerHTML`** في أي section component حتى Stage D3.

---

## 6. Pages Builder — المواصفات

### 6-A. Route Structure

```
app/store/[slug]/
├── [pageSlug]/page.tsx    ← الصفحات المخصصة (جديد)
```

**تعارض الـ Routes**: يجب التحقق في middleware أو route handler أن `pageSlug` لا يساوي:
- `products` / `product` / `cart` / `checkout` / `orders` / `category`
- أي segment محجوز

```typescript
const RESERVED_SLUGS = new Set([
  "products", "product", "cart", "checkout",
  "orders", "order-confirmation", "category",
  "search", "wishlist", "account"
]);
```

### 6-B. الصفحات المدعومة (MVP)

| النوع | Slug المقترح | ملاحظات |
|------|------------|---------|
| عن المتجر | `about` | شائعة جداً |
| سياسة الإرجاع | `return-policy` | مطلوبة قانونياً |
| سياسة الخصوصية | `privacy` | |
| الشروط والأحكام | `terms` | |
| الأسئلة الشائعة | `faq` | |
| تواصل معنا | `contact` | |
| صفحة هبوط | `landing` | |
| مخصص | أي slug آمن | |

### 6-C. Preview Mode

```
/store/[slug]/preview/[pageSlug]?draft=true&token=<preview_token>
```

- `preview_token` = JWT قصير العمر (15 دقيقة)، يحتوي store_id فقط
- يُولَّد في server action مع check للملكية
- الـ preview page يقرأ `draft_config` بدلاً من published data
- لا يُفهرَس بـ robots.txt (noindex)

### 6-D. Slug Validation

```typescript
const pageSlugSchema = z.string()
  .min(2).max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug يجب أن يحتوي أحرف إنجليزية صغيرة وأرقام وشرطات فقط")
  .refine(slug => !RESERVED_SLUGS.has(slug), "هذا الـ slug محجوز من النظام");
```

### 6-E. ربط الصفحات بالهيدر/الفوتر

```typescript
// HeaderConfig يحتوي:
nav_links: {
  label: string;
  href: string;       // /store/${slug}/${pageSlug} أو رابط خارجي
  target?: "_blank";
}[];
```

التاجر يُضيف روابط يدوياً للهيدر. لا ربط تلقائي بالصفحات الجديدة.

---

## 7. AI Theme Builder — المواصفات

### 7-A. المدخلات والمخرجات

```typescript
// المدخل: نص حر من التاجر
const userPrompt = "أريد متجر ملابس فاخر بلون عاجي وذهبي مع بنر عروض وأقسام للنساء والرجال"

// المخرج: JSON config آمن — لا كود حر
interface AiThemeConfig {
  base_theme: ThemeSlug;             // fashion | electronics | ...
  sections: Omit<SectionConfig, 'id'>[];  // sections ordered
  colors: {
    primary: string;                 // hex only
    accent: string;                  // hex only
  };
  font_family: string;               // allowlisted فقط
  hero: {
    title: string;                   // max 150 chars
    subtitle: string;                // max 300 chars
    cta_label: string;               // max 30 chars
    style: "dark" | "light" | "split";
  };
  promo_banner?: {
    title: string;
    description: string;
    variant: "primary" | "amber" | "rose" | "emerald";
  };
  footer: {
    text: string;                    // max 200 chars
  };
  seo: {
    meta_title: string;              // max 60 chars
    meta_description: string;        // max 160 chars
  };
}
```

### 7-B. الـ Prompt Engineering

```typescript
const SYSTEM_PROMPT = `
أنت مساعد تصميم متاجر إلكترونية عربية. مهمتك توليد إعدادات ثيم بتنسيق JSON فقط.

قواعد صارمة:
- أخرج JSON فقط بدون أي شرح أو markdown
- الألوان: hex فقط (#RRGGBB)
- النصوص: عربية فقط
- الـ base_theme: واحد من [fashion, electronics, subscriptions, books, accessories, personal_services, general, blank]
- الـ sections: من القائمة المسموحة فقط
- لا code, لا scripts, لا HTML tags في النصوص
- لا روابط خارجية
- max 8 sections في المرة الواحدة

أخرج JSON يطابق الـ schema المحدد بالضبط.
`;
```

### 7-C. Server Action Pipeline

```typescript
export async function generateAiThemeConfig(prompt: string) {
  // 1. Validate input
  // 2. Check credits (10 credits للثيم الكامل)
  // 3. Call AI provider → raw JSON string
  // 4. Parse + Validate مخرجات AI بـ Zod (لا ثقة عمياء!)
  // 5. Sanitize strings (trim, max length)
  // 6. Save to ai_generations مع config_output + review_status: 'pending'
  // 7. Return generationId فقط (لا apply تلقائي)
  
  // لا حفظ تلقائي في store_theme_settings
  // التاجر يرى preview → يختار Apply أو Reject
}

export async function applyAiThemeConfig(generationId: string) {
  // 1. Verify ownership
  // 2. Load config من ai_generations
  // 3. Validate status === 'pending'
  // 4. Map config → ThemeSettingsInput
  // 5. Save to store_theme_settings.draft_config
  // 6. Update review_status → 'applied'
  // لا publish تلقائي — التاجر يُنشر يدوياً
}
```

### 7-D. مخاطر AI المخرجات

| الخطر | الحماية |
|-------|---------|
| AI يُخرج JS code | Zod parsing يرفضه — لا حقل code في schema |
| AI يُخرج HTML | sanitize strings بـ strip_tags |
| AI يُخرج ألوان غير hex | Zod regex يرفضه |
| AI يُخرج sections غير مسموحة | z.enum() يرفضه |
| AI يُخرج روابط خارجية | validation يرفض URLs خارجية في النصوص |
| AI يُخرج JSON مكسور | try/catch + fallback |

---

## 8. Safe Custom Code — خارطة الطريق

### Phase 1 — MVP (الآن)
**لا custom code إطلاقاً.**
Customizer + Sections + Pages فقط.

### Phase 2 — Custom CSS Variables فقط (Stage D4)

```typescript
// السماح فقط بـ:
--my-button-radius: 8px;
--my-accent-color: #FF5733;

// رفض:
a { color: red; }        // selector
@import url(...)         // import
content: "hack"          // content injection
```

```typescript
// Validation
function validateCustomCss(input: string): string {
  const lines = input.split('\n');
  const safe: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // فقط CSS custom properties
    if (/^--[\w-]+:\s*[^;{}()'"<>]+;$/.test(trimmed)) {
      safe.push(trimmed);
    }
    // تجاهل كل شيء آخر
  }
  
  return safe.join('\n');
}
```

```html
<!-- Render في storefront -->
<style data-custom-css>
  :root {
    /* CSS variables فقط — مُعقَّمة server-side */
    {{ sanitized_css }}
  }
</style>
```

### Phase 3 — Custom HTML بعد Sanitization (Stage D4+)

```typescript
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['p', 'b', 'i', 'u', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'img', 'a'];
const ALLOWED_ATTR = ['class', 'href', 'src', 'alt', 'title', 'target'];

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style', 'data-*'],
  });
}
```

**محظور دائماً حتى في Phase 3:**
- داخل checkout
- داخل cart
- داخل auth pages
- داخل order confirmation
- داخل payment proof pages
- داخل dashboard

### Phase 4 — Sandboxed JavaScript (Stage D5 — المستقبل البعيد)

```html
<!-- Render في iframe منفصل — sandbox صارم -->
<iframe
  src="/sandbox/custom-scripts"
  sandbox="allow-scripts"  <!-- لا allow-same-origin -->
  loading="lazy"
  title="custom content"
  style="border: none; width: 100%;"
/>
```

**postMessage API:**
```javascript
// script التاجر يتواصل مع الـ parent فقط عبر postMessage
window.parent.postMessage({
  type: 'SABA_STORE_API',
  action: 'getCartCount',
}, window.location.origin);

// الـ parent يُستجيب بـ allow-listed responses فقط
// لا وصول لـ cookies أو localStorage أو sessionStorage
```

---

## 9. قواعد الأمان — غير قابلة للتفاوض

### 9-A. Architecture Level

| القاعدة | التطبيق |
|---------|---------|
| لا store_id من client | `getMerchantStoreId()` دائماً من جلسة Auth |
| كل Action يتحقق من الملكية | `WHERE store_id = ?` مع check |
| كل input يمر بـ Zod | لا server action بدون schema |
| payment-proofs → private | signed URLs فقط، لا public |
| store-assets → public | صور المنتجات والشعارات فقط |
| لا service role في client | admin client في server-side فقط |
| RLS على كل جدول جديد | store_pages, custom_code_snippets |

### 9-B. Sections Level

| المسموح | الممنوع |
|---------|---------|
| Strings بحتة (text, labels) | HTML tags في النصوص |
| URLs محققة بـ Zod url() | JavaScript URIs (javascript:) |
| Hex colors | CSS expressions |
| Boolean flags | eval / Function constructor |
| Numbers (limit, order) | External scripts |
| Enum values محددة | Arbitrary function refs |

### 9-C. Custom Code Level (عند تفعيله لاحقاً)

```
NEVER في: checkout, cart, auth, admin, orders, payment proofs
ONLY في: homepage sections فقط (Phase 3+)
ALWAYS: server-side sanitization قبل الحفظ
ALWAYS: Content Security Policy header مُشدَّد
ALWAYS: No access to: cookies, sessionStorage, localStorage, fetch(*)
```

---

## 10. UI Proposal — شكل لوحة التخصيص

### 10-A. التخطيط العام

```
┌─────────────────────────────────────────────────────────┐
│  تخصيص المظهر        [معاينة] [مسودة] [نشر التغييرات]  │
├───────────────────────┬─────────────────────────────────┤
│ ← الهوية             │                                 │
│   الألوان             │                                 │
│   الخطوط             │        LIVE PREVIEW             │
│   الصفحة الرئيسية    │                                 │
│   الأقسام            │     [موبايل] [تابلت] [ديسكتوب] │
│   الهيدر والفوتر      │                                 │
│   الصفحات            │        ↕ قابل للتغيير الحجم    │
│   SEO               │                                 │
│   الذكاء الاصطناعي   │                                 │
│   ─────────          │                                 │
│   [كود متقدم] ⚠️    │                                 │
│   (مقفول للباقات     │                                 │
│    المتقدمة)         │                                 │
└───────────────────────┴─────────────────────────────────┘
```

### 10-B. Sections Tab — تفاصيل

```
┌── الأقسام ──────────────────────────────────────────────┐
│                                                         │
│  [+ إضافة قسم]                                          │
│                                                         │
│  ⠿  🏠 Hero Banner          ✓ مفعّل    [تعديل] [حذف]   │
│  ⠿  🗂️  الأقسام             ✓ مفعّل    [تعديل] [حذف]   │
│  ⠿  ⭐  المنتجات المميزة    ✓ مفعّل    [تعديل] [حذف]   │
│  ⠿  🏷️  بنر العروض          ✗ مخفي     [تعديل] [حذف]   │
│  ⠿  💬  آراء العملاء        ✓ مفعّل    [تعديل] [حذف]   │
│  ⠿  🆕  وصل حديثاً          ✓ مفعّل    [تعديل] [حذف]   │
│                                                         │
│  [← سحب للترتيب]   [إخفاء على الموبايل ↔]              │
└─────────────────────────────────────────────────────────┘
```

**Drag & Drop**: React DnD Kit (مكتبة موجودة في المشاريع المشابهة) أو HTML5 native drag.

### 10-C. AI Tab

```
┌── الذكاء الاصطناعي ─────────────────────────────────────┐
│                                                         │
│  صِف متجرك أو تصميمك المطلوب:                           │
│  ┌──────────────────────────────────────────────┐       │
│  │  أريد متجر ملابس فاخر بألوان ذهبية وعاجية    │       │
│  │  مع بنر ترحيبي وأقسام للنساء والرجال...      │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│  [⚡ توليد الثيم]  (يستهلك 10 رصيد)                    │
│                                                         │
│  ─── النتيجة المقترحة ──────────────────────────        │
│  الثيم: Fashion  |  الألوان: ذهبي + عاجي                │
│  الأقسام: Hero > Categories > Featured > Promo          │
│                                                         │
│  [👁️ معاينة]  [✓ تطبيق كمسودة]  [✗ رفض]              │
└─────────────────────────────────────────────────────────┘
```

---

## 11. مراحل التنفيذ

### Stage D1 — Advanced Theme Customizer (بدون Pages, بدون AI, بدون Code)

**الهدف**: تاجر يتحكم في كل عناصر المتجر من panel احترافي.

**الملفات المتوقعة:**
```
lib/validations/sections.ts          → Zod schemas للأقسام
lib/types/sections.ts                → TypeScript interfaces
actions/sections.ts                  → Server actions للأقسام
components/storefront/sections/      → Section components
app/(dashboard)/.../customize/       → توسيع customize-client الموجود
app/store/[slug]/preview/route.tsx   → Preview route
```

**Migration مطلوب:**
```sql
ALTER TABLE store_theme_settings ADD COLUMN sections_config JSONB;
ALTER TABLE store_theme_settings ADD COLUMN header_config JSONB;
ALTER TABLE store_theme_settings ADD COLUMN footer_config JSONB;
ALTER TABLE store_theme_settings ADD COLUMN draft_config JSONB;
ALTER TABLE store_theme_settings ADD COLUMN published_at TIMESTAMPTZ;
```

**لا تمسّ:**
- Cart / Checkout / Orders / Auth / Admin / Payments
- Theme Renderer core switch
- Business logic

**اختبار:**
1. تاجر يغيّر ألوان → يرى preview → ينشر
2. تاجر يُخفي قسم → يختفي من المتجر
3. تاجر يُرتب أقسام → يتغير ترتيب العرض
4. تاجر يعدّل Hero text → يُحدَّث في المتجر
5. Checkout يبقى كما هو تماماً

---

### Stage D2 — Pages Builder

**الهدف**: تاجر يُنشئ صفحات مخصصة (عن، تواصل، سياسات) بأقسام drag-and-drop.

**Migration مطلوب:**
```sql
CREATE TABLE store_pages (...);
```

**الملفات المتوقعة:**
```
app/(dashboard)/.../themes/pages/    → إدارة الصفحات
app/store/[slug]/[pageSlug]/         → عرض الصفحات
actions/pages.ts                     → CRUD للصفحات
lib/validations/pages.ts             → Zod + slug validation
```

**مخاطر:**
- Route conflicts: `[pageSlug]` vs. `products/cart/checkout/...`
- Slugs يُدخلها التاجر → يجب allowlist أو blocklist

**حماية:**
```typescript
// في [pageSlug]/page.tsx
const RESERVED = new Set(["products", "cart", "checkout", "orders", ...]);
if (RESERVED.has(pageSlug)) return notFound();

// من DB
const page = await supabase.from("store_pages")
  .select("*")
  .eq("store_id", storeId)
  .eq("slug", pageSlug)
  .eq("status", "published")
  .maybeSingle();
if (!page) return notFound();
```

---

### Stage D3 — AI Theme Builder

**الهدف**: التاجر يكتب وصف → AI يقترح ثيماً كاملاً → التاجر يعتمد أو يرفض.

**Migration مطلوب:**
```sql
ALTER TABLE ai_generations ADD COLUMN config_output JSONB;
ALTER TABLE ai_generations ADD COLUMN review_status TEXT;
```

**الملفات المتوقعة:**
```
actions/ai-theme.ts                  → generateAiThemeConfig, applyAiThemeConfig
lib/ai/theme-prompt.ts               → System prompt + output schema
lib/validations/ai-theme-config.ts   → Zod validation للـ AI output
app/(dashboard)/.../customize/tab-ai.tsx
```

**مخاطر:**
- AI قد يُخرج JSON غير صالح → try/catch + Zod parsing
- AI قد يُخرج colors سيئة → hex validation
- AI قد يستهلك credits للفشل → خصم فقط عند النجاح

---

### Stage D4 — Safe Custom CSS

**الهدف**: تاجر متقدم يضع CSS custom properties فقط.

**لا Migration إضافي** — `custom_css` موجود في DB + `has_custom_css` في packages.

**الملفات المتوقعة:**
```
lib/sanitize/css-sanitizer.ts        → strip كل شيء غير CSS variables
app/(dashboard)/.../themes/customize/tab-advanced-css.tsx
```

**Package gating**: `has_custom_css === true` فقط.

---

### Stage D5 — Advanced Custom Code Sandbox

**هذا المستقبل البعيد. لا تُنفَّذ الآن.**

متطلبات مسبقة:
- Content Security Policy مُطبَّق على كل صفحات المتجر
- Iframe sandbox architecture موثّقة ومختبرة
- Review workflow (يدوي أو AI) للكود المرسَل
- مراجعة قانونية لمسؤولية المحتوى المُدخَل

---

## 12. الملفات المتوقع تعديلها في Stage D1

```
تعديل:
  components/storefront/themes/theme-renderer.tsx  → قراءة sections_config
  components/storefront/themes/fashion-theme.tsx   → expose default sections
  (وبقية الثيمات...)
  actions/themes.ts                               → Draft/Publish actions
  lib/validations/theme.ts                        → إضافة sections_config schema
  lib/types/database.ts                           → إضافة types جديدة

إنشاء:
  lib/types/sections.ts
  lib/validations/sections.ts
  actions/sections.ts
  components/storefront/sections/*.tsx
  app/store/[slug]/preview/route.tsx
  app/(dashboard)/.../customize/tabs/*.tsx
  app/(dashboard)/.../customize/panels/*.tsx
```

**لا تُمسّ أبداً:**
- `app/store/[slug]/checkout/`
- `app/store/[slug]/cart/`
- `app/store/[slug]/orders/`
- `actions/orders.ts`
- `actions/payments.ts`
- `app/(auth)/` أي ملف auth
- `lib/supabase/`
- `lib/ai/ai-provider.ts`

---

## 13. الإجابة على الأسئلة العشرة

### 1. أفضل Architecture مقترحة
**Additive Hybrid**: توسيع `store_theme_settings.settings: Json` + إضافة columns جديدة في migration. الثيمات الحالية تبقى كـ default templates، `SectionRenderer` جديد يقرأ `sections_config` المخزَّن. ThemeRenderer الحالي لا يُكسر.

### 2. ما يُنفَّذ الآن (Stage D1)
- Advanced Customizer: ألوان + خطوط + أقسام + header/footer + draft/publish
- Section Renderer + Section Components
- Preview في iframe
- Zod validation لكل config

### 3. ما يُؤجَّل
- Pages Builder → Stage D2
- AI Theme Builder → Stage D3
- Custom CSS → Stage D4
- Custom JS/HTML → Stage D5

### 4. المخاطر الأمنية
| الخطر | الاحتمال | التأثير |
|-------|---------|--------|
| XSS عبر section settings | متوسط | عالٍ جداً |
| Route conflict مع pageSlug | منخفض | متوسط |
| AI يُخرج code ضار | منخفض | عالٍ |
| draft_config يُطبَّق على checkout | منخفض | عالٍ جداً |
| Custom CSS يكسر layout | متوسط | متوسط |

### 5. كيف نعالج المخاطر
- XSS: Zod validation تمنع HTML في strings + لا `dangerouslySetInnerHTML`
- Route conflict: blocklist صارم لـ RESERVED_SLUGS
- AI output: Zod parsing الصارم يرفض أي output لا يطابق schema
- checkout isolation: draft_config لا يُطبَّق على checkout routes أبداً
- Custom CSS: regex يسمح فقط بـ `--var: value;` pattern

### 6. الجداول المطلوبة
1. تعديل `store_theme_settings` — 5 columns إضافية
2. إنشاء `store_pages` — Stage D2
3. تعديل `ai_generations` — 2 columns إضافية — Stage D3
4. إنشاء `custom_code_snippets` — Stage D5 فقط

### 7. الملفات المتوقع تعديلها
انظر القسم 12 أعلاه.

### 8. ترتيب التنفيذ الأفضل
```
D1: Sections + Customizer + Draft/Publish + Preview
D2: Pages Builder
D3: AI Theme Builder
D4: Safe Custom CSS
D5: Sandboxed JS (المستقبل)
```

### 9. هل نضيف Custom Code الآن؟
**لا. بشكل قاطع.**

الأسباب:
1. **المخاطر كبيرة جداً على المرحلة الحالية** — XSS يمكن أن يسرق بيانات عملاء checkout
2. **لا قيمة تقنية فورية** — الـ Customizer والـ Sections يُغطيان 95% من احتياجات التجار
3. **لا بنية تحتية جاهزة** — CSP، sanitization library، review workflow كلها تحتاج تصميم منفصل
4. **المنافسون الناجحون (Salla, Zid) أضافوا custom code بعد سنوات** من إطلاق المنتج الأساسي

### 10. هل يجب إنشاء THEME_BUILDER_PLAN.md؟
**نعم.** الملف الذي تقرأه الآن هو ذلك الملف.

---

## 14. ملاحظة نهائية

هذه الخطة **للقراءة والاعتماد فقط**. لا يُبدأ بتنفيذ أي سطر كود حتى:

1. يعتمد صاحب المشروع هذا الملف
2. تُحدَّد أولويات Stage D1 بالضبط
3. يُؤكَّد قرار أي migration يُنفَّذ أولاً
4. تُراجَع قائمة `SectionType` المسموحة وتُعتمَد

---

*الخطة مكتوبة بناءً على قراءة كاملة لـ: PRODUCT.md, DESIGN.md, database.ts, theme-renderer.tsx, theme-types.ts, themes.ts (actions), themeSettingsSchema, ai.ts, customize/page.tsx, وجميع theme components.*
