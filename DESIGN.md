# DESIGN.md — Saba Store Visual System

> النظام البصري الرسمي لمنصة سبأ ستور. هذا الملف مرجع لكل قرار تصميمي في المشروع.
> أي تعديل على النظام البصري يجب أن يُعكس هنا أولاً.

---

## 1. Color Palette — Light Mode First

### Core Semantic Tokens (globals.css @theme)

```css
--background:   hsl(220, 20%, 97%)   /* off-white page background */
--foreground:   hsl(222, 47%, 12%)   /* near-black text */
--card:         hsl(0, 0%, 100%)     /* white card surfaces */
--card-foreground: hsl(222, 47%, 12%)
--border:       hsl(220, 18%, 88%)   /* subtle gray borders */
--input:        hsl(220, 20%, 97%)   /* input field background */
--muted:        hsl(220, 18%, 94%)   /* muted backgrounds */
--muted-foreground: hsl(220, 15%, 55%) /* secondary text */
--primary:      hsl(221, 80%, 48%)   /* brand blue */
--primary-foreground: hsl(0, 0%, 100%)
--accent:       hsl(221, 60%, 95%)   /* blue accent surface */
--accent-foreground: hsl(221, 80%, 35%)
--destructive:  hsl(0, 72%, 51%)
--ring:         hsl(221, 80%, 48%)
```

### Palette Rules

| الوضع | القاعدة |
|-------|---------|
| Light mode | الأساس دائماً. لا دارك مود كهوية عامة |
| Dark hero sections | مسموح فقط في `<section>` الـ Hero داخل الثيمات (fashion, electronics, subscriptions, books) — ليس الصفحة كاملة |
| Dashboard | Light-first دائماً |
| Cart + Checkout + Orders | Light دائماً بدون استثناء — ثقة المستخدم أولاً |
| Admin | Light دائماً |

### Status Colors (Light Mode Pattern)

```
success:  text-emerald-700 bg-emerald-50 border border-emerald-200
warning:  text-amber-700   bg-amber-50   border border-amber-200
error:    text-red-700     bg-red-50     border border-red-200
info:     text-blue-700    bg-blue-50    border border-blue-200
pending:  text-slate-600   bg-slate-50   border border-slate-200
```

> لا تستخدم `-400` variants في light mode — التباين غير كافٍ. استخدم `-600`/`-700` دائماً.

### Price / Financial Values

```
price:      text-emerald-600  (في light mode — ليس text-emerald-400)
discount:   text-red-600
old-price:  text-muted-foreground line-through
total:      text-foreground font-bold
```

---

## 2. Typography

### Font Stack

```css
font-family-cairo: 'Cairo', sans-serif          /* الواجهة، العناوين، الأزرار */
font-family-sans:  'Cairo', 'Inter', sans-serif  /* النصوص العامة */
font-family-serif: 'Cairo', 'Georgia', serif     /* ثيم accessories */
```

> **Cairo فقط** في الواجهة. لا Inter وحدها. لا Tajawal. لا Noto Naskh.

### Scale

| المستوى | الفئة | الاستخدام |
|---------|-------|-----------|
| Display | `text-5xl font-black` | Hero titles |
| H1 | `text-3xl font-bold font-cairo` | Page titles |
| H2 | `text-xl font-bold font-cairo` | Section headings |
| H3 | `text-base font-bold font-cairo` | Card titles, sub-sections |
| Body | `text-sm` | Default body text |
| Small | `text-xs` | Labels, captions, meta |
| Micro | `text-[10px]` | Badges, tags, timestamps |

### Arabic Typography Rules

- `lang="ar" dir="rtl"` على عنصر `<html>` — دائماً
- `font-cairo` على العناوين والأزرار — دائماً
- لا تستخدم `letter-spacing` على النصوص العربية
- `leading-relaxed` أو `leading-loose` للفقرات العربية الطويلة
- أرقام: `tabular-nums` في الجداول والإحصائيات

---

## 3. Spacing Scale

### Base Unit: 4px (Tailwind default)

| الرمز | القيمة | الاستخدام |
|-------|--------|-----------|
| `p-1` | 4px | داخل الـ badges الصغيرة |
| `p-2` | 8px | padding الـ chips والـ tags |
| `p-3` | 12px | padding الأزرار الصغيرة |
| `p-4` | 16px | padding البطاقات الصغيرة |
| `p-6` | 24px | padding البطاقات العادية |
| `p-8` | 32px | padding الأقسام الكبيرة |
| `gap-4` | 16px | المسافة الافتراضية بين العناصر |
| `gap-6` | 24px | المسافة بين البطاقات |
| `space-y-8` | 32px | المسافة العمودية بين الأقسام |
| `space-y-16` | 64px | المسافة بين أقسام الصفحة الكبيرة |

### Page Layout

```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

هذا هو الـ wrapper القياسي لكل المحتوى.

---

## 4. Border Radius Scale

| الرمز | الاستخدام |
|-------|-----------|
| `rounded` | 4px — حواف الـ badges والـ tags الصغيرة |
| `rounded-lg` | 8px — الأزرار الثانوية، الـ inputs |
| `rounded-xl` | 12px — الأزرار الرئيسية |
| `rounded-2xl` | 16px — البطاقات (cards) |
| `rounded-3xl` | 24px — الـ modals، الـ hero containers |
| `rounded-full` | — الـ badges الدائرية، الأيقونات |

> القاعدة: كلما كان العنصر أكبر، كان الـ radius أكبر.

---

## 5. Shadows

```css
shadow-sm   /* border بديل للبطاقات خفيفة */
shadow-card /* البطاقات القياسية */
shadow-md   /* الأزرار الرئيسية، النوافذ المنبثقة */
shadow-xl   /* الـ modals، الـ dropdowns */
```

> لا `shadow-2xl` في الـ cards العادية — يبدو مبالغاً فيه.
> استخدم `border border-border` مع `shadow-sm` بدلاً من الـ shadows الثقيلة.

---

## 6. Buttons

### Primary Button

```html
<button class="px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo">
  نص الزر
</button>
```

### Secondary Button

```html
<button class="px-6 py-3 bg-muted text-foreground text-sm font-bold rounded-xl border border-border hover:bg-muted/80 transition-all font-cairo">
  نص الزر
</button>
```

### Destructive Button

```html
<button class="px-6 py-3 bg-destructive text-white text-sm font-bold rounded-xl hover:bg-destructive/90 transition-all font-cairo">
  حذف
</button>
```

### Ghost Button

```html
<button class="px-4 py-2 text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted hover:text-foreground transition-colors font-cairo">
  إلغاء
</button>
```

### Rules

- لا أزرار بدون `font-cairo`
- لا أزرار بدون `transition-all` أو `transition-colors`
- الـ loading state: استبدل النص بـ spinner + "جاري..." مع `disabled:opacity-60 disabled:cursor-not-allowed`
- لا تستخدم `cursor-not-allowed` بدون `disabled` فعلي

---

## 7. Cards

### Standard Card

```html
<div class="bg-card border border-border rounded-2xl p-6 shadow-sm">
  محتوى البطاقة
</div>
```

### Elevated Card (للـ modals والعناصر المهمة)

```html
<div class="bg-card border border-border rounded-2xl p-6 shadow-xl">
  محتوى البطاقة
</div>
```

### Muted Card (للمعلومات الثانوية)

```html
<div class="bg-muted border border-border rounded-xl p-4">
  محتوى ثانوي
</div>
```

### Rules

- لا `bg-white` مباشرة — استخدم `bg-card` (semantic)
- لا `bg-gray-*` أو `bg-slate-*` في light mode — استخدم `bg-muted` أو `bg-background`
- الـ hover على البطاقات: `hover:border-primary/30` أو `hover:shadow-md`

---

## 8. Forms & Inputs

### Text Input

```html
<input class="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" />
```

### Select

```html
<select class="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
```

### Label

```html
<label class="text-sm font-medium text-muted-foreground font-cairo">اسم الحقل</label>
```

### Error Message

```html
<p class="text-xs text-red-600 mt-1">رسالة الخطأ هنا</p>
```

### Rules

- لا `bg-white` في الـ inputs — استخدم `bg-input`
- الـ focus ring: `focus:ring-2 focus:ring-ring focus:border-transparent`
- كل input له `placeholder:text-muted-foreground` — ليس placeholder افتراضي
- الـ disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- في RTL: `text-right` على الـ inputs

---

## 9. Tables

### Standard Table

```html
<table class="w-full text-sm text-right">
  <thead class="bg-muted">
    <tr>
      <th class="px-4 py-3 font-medium text-muted-foreground font-cairo">العمود</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-border">
    <tr class="hover:bg-muted/50 transition-colors">
      <td class="px-4 py-4 text-foreground">القيمة</td>
    </tr>
  </tbody>
</table>
```

### Rules

- `text-right` على الجدول كله (RTL)
- `divide-y divide-border` للفاصل بين الصفوف
- `hover:bg-muted/50` على الصفوف القابلة للنقر
- الأعمدة الرقمية: `tabular-nums font-mono` أو `font-semibold`
- Status badges داخل الجداول: pattern الـ status colors أعلاه

---

## 10. Empty States

```html
<div class="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
  <div class="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
    <!-- Lucide icon -->
    <Icon class="h-8 w-8 text-muted-foreground" />
  </div>
  <div class="space-y-1">
    <h3 class="text-sm font-bold text-foreground font-cairo">لا توجد عناصر</h3>
    <p class="text-xs text-muted-foreground max-w-xs">وصف قصير للحالة الفارغة</p>
  </div>
  <button class="... primary button ...">إضافة أول عنصر</button>
</div>
```

### Rules

- لا أيقونات SVG ملونة كثيراً في الـ empty states — `text-muted-foreground` فقط
- الـ CTA اختياري — فقط إذا كان هناك إجراء منطقي
- لا نصوص طويلة — جملة واحدة أو جملتان

---

## 11. Loading States

### Skeleton

```html
<div class="animate-pulse">
  <div class="h-4 bg-muted rounded w-3/4 mb-2"></div>
  <div class="h-4 bg-muted rounded w-1/2"></div>
</div>
```

### Spinner في الأزرار

```html
<svg class="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
</svg>
```

### Rules

- Skeleton للمحتوى الكبير (بطاقات، جداول، قوائم)
- Spinner للأفعال (أزرار Submit، Upload)
- لا `loading...` نصي وحده — يبدو rude للمستخدم العربي

---

## 12. Error States

### Inline Error (داخل Forms)

```html
<div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-cairo">
  <AlertCircle class="h-4 w-4 flex-shrink-0" />
  رسالة الخطأ هنا
</div>
```

### Page-Level Error

```html
<div class="flex flex-col items-center justify-center py-16 text-center space-y-4">
  <div class="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
    <AlertCircle class="h-8 w-8 text-red-600" />
  </div>
  <h3 class="text-sm font-bold text-foreground font-cairo">حدث خطأ</h3>
  <p class="text-xs text-muted-foreground">وصف الخطأ</p>
  <button class="... primary button ...">إعادة المحاولة</button>
</div>
```

---

## 13. RTL Rules

### Layout

- `dir="rtl"` على `<html>` — مرة واحدة، للأبد
- `text-right` افتراضي على النصوص — أو اترك Tailwind RTL يتعامل معها
- `flex-row-reverse` في بعض الحالات لعكس اتجاه Flex

### Spacing في RTL

```
ms-* / me-* (margin-start / margin-end) — بدل ml-* / mr-*
ps-* / pe-* (padding-start / padding-end) — بدل pl-* / pr-*
```

> استخدم `ms-` و`ps-` بدلاً من `ml-` و`pl-` في المكونات القابلة لإعادة الاستخدام.

### Icons في RTL

- الأيقونات التوجيهية (`ArrowLeft`, `ChevronRight`) تحتاج عكس في RTL
- استخدم `rtl:rotate-180` أو أيقونات محايدة
- أيقونات الـ close/check/star: محايدة، لا تحتاج عكس

### Absolute Positioning

```
inset-inline-start  بدل left
inset-inline-end    بدل right
```

---

## 14. Motion Rules

### Principles

- Motion للمعنى، لا للزينة
- `transition-all duration-200` الافتراضي
- `transition-colors duration-150` للـ hover states

### Approved Animations

```css
/* Button hover */
transition-all duration-200 hover:scale-[1.01]  /* خفيف جداً */

/* Card hover */
transition-all duration-200 hover:shadow-md

/* Modal entry */
animate-in fade-in-0 zoom-in-95 duration-200

/* Dropdown */
animate-in fade-in-0 slide-in-from-top-2 duration-150
```

### Prohibited Animations

- `animate-bounce` — يبدو رخيصاً
- Continuous spinning outside loading states
- `transition-all duration-500+` — بطيء جداً
- Parallax scrolling
- Entrance animations على كل عنصر في الصفحة

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 15. Storefront Theme Color Rules

كل ثيم له accent color خاص، لكن يشترك في نفس القواعد:

| الثيم | Accent | Hero |
|-------|--------|------|
| fashion | rose-500/600 | dark bg مقبول في section فقط |
| electronics | blue-600 | dark bg مقبول في section فقط |
| subscriptions | violet-600 | dark bg مقبول في section فقط |
| books | amber-600 | dark bg مقبول في section فقط |
| accessories | amber-500 | light hero (from-amber-100) |
| personal_services | rose-500 | light hero (from-rose-50) |
| general | emerald-600 | light hero (from-emerald-50) |
| blank | foreground | neutral light hero |

### قواعد الثيمات

1. الـ root container: `bg-background text-foreground` — دائماً
2. Hero section: يمكن أن يكون dark أو branded — محدود بـ `<section>` واحدة فقط
3. كل ما بعد الـ Hero: light mode بالكامل
4. Cart/Checkout داخل أي ثيم: light دائماً بدون استثناء
5. Product cards: `bg-card border-border` — نفس النمط في كل الثيمات

---

## 16. What to Avoid Visually

### ممنوع تماماً

| ما يجب تجنبه | البديل |
|------------|--------|
| `gradient-text` (bg-clip-text) | `text-foreground` أو `text-primary` |
| Glassmorphism (`backdrop-blur` + شفافية عالية) | `bg-card border-border` نظيف |
| Purple gradients في كل مكان | استخدم `primary` (blue) كـ accent |
| `text-white` في light mode | `text-foreground` |
| `bg-slate-900/950` في light pages | `bg-card` أو `bg-muted` |
| `border-white/5` و`border-white/10` | `border-border` |
| Dark overlays فوق كل الصفحة | Hero section فقط |
| Inter وحدها | Cairo دائماً للعربية |
| Shadowing ثقيل على كل بطاقة | `border-border shadow-sm` يكفي |
| Animations على كل شيء | Motion للمعنى فقط |
| `text-*-400` في light mode | `-600`/`-700` للتباين الصحيح |

### Anti-Patterns في Dashboard

- أعمدة بيانات بدون `tabular-nums`
- أزرار بدون `disabled` state واضح
- لا padding كافٍ في الـ mobile
- `z-index` عشوائي
- Modal بدون focus trap

---

## 17. Component Priority Order

عند تطبيق أي تعديل بصري، الأولوية هي:

1. **Checkout + Cart** — ثقة المستخدم المالية. light دائماً.
2. **Dashboard** — إنتاجية التاجر. واضح وسريع.
3. **Storefront** — انطباع العميل عن المتجر.
4. **Admin** — أداة داخلية. وضوح قبل الجماليات.
5. **Landing/Marketing** — brand polish.

---

## 18. Current Implementation Notes

- **Tailwind v4** مع `@theme {}` blocks في `globals.css`
- Semantic CSS tokens في `globals.css` تحت `@layer base`
- **Cairo** محمّل عبر `next/font/google`
- `bg-background`, `bg-card`, `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground` — هذه الكلاسات السبع هي العمود الفقري للنظام
- لا `dark:` variants في كود التطبيق — light mode فقط

---

*آخر تحديث: Stage B Complete — يونيو 2026*
