-- ============================================================
-- Saba Store — Seed Data
-- Packages + Themes initial data
-- ============================================================

-- ============================================================
-- PACKAGES SEED
-- ============================================================

INSERT INTO public.packages (
  id, name, slug, description,
  price_monthly, price_yearly,
  max_products, max_ai_credits, max_themes,
  has_custom_domain, has_advanced_theme, has_custom_css,
  has_custom_html, has_whatsapp_notif, has_email_notif,
  has_reports, has_priority_support, is_active, sort_order
) VALUES
(
  uuid_generate_v4(),
  'باقة الانطلاقة',
  'starter',
  'مثالية للتجار الصغار والمبتدئين الراغبين في إطلاق متجرهم الأول بسهولة',
  49.00, 490.00,
  50, 50, 2,
  false, false, false,
  false, false, false,
  false, false, true, 1
),
(
  uuid_generate_v4(),
  'باقة النمو',
  'growth',
  'للمتاجر النامية التي تحتاج ميزات متقدمة وأدوات احترافية لزيادة المبيعات',
  99.00, 990.00,
  500, 300, 8,
  true, true, false,
  false, false, true,
  true, false, true, 2
),
(
  uuid_generate_v4(),
  'باقة الاحتراف',
  'pro',
  'للمتاجر الاحترافية والكبيرة التي تريد كامل التحكم والأولوية في الدعم',
  199.00, 1990.00,
  NULL, 1000, 8,
  true, true, true,
  true, true, true,
  true, true, true, 3
);

-- ============================================================
-- THEMES SEED
-- ============================================================

INSERT INTO public.themes (
  id, name, slug, description, category,
  preview_image, is_active, is_premium, sort_order, config
) VALUES
(
  uuid_generate_v4(),
  'قالب الملابس',
  'fashion',
  'تصميم أزياء قوي، صور كبيرة، بنرات عروض، أقسام وصل حديثًا والأكثر مبيعًا، بطاقات منتجات أنيقة.',
  'fashion',
  '/themes/fashion/preview.jpg',
  true, false, 1,
  '{"hero_style": "fullscreen_image", "product_card": "minimal", "color_scheme": "light_elegant", "font_style": "serif_arabic"}'
),
(
  uuid_generate_v4(),
  'قالب الأدوات الإلكترونية والكهربائية',
  'electronics',
  'تصميم تقني قوي، بطاقات منتجات تعرض مواصفات مختصرة، عروض واضحة، ألوان تقنية، مناسب للأجهزة والأدوات الكهربائية.',
  'electronics',
  '/themes/electronics/preview.jpg',
  true, true, 2,
  '{"hero_style": "video_bg", "product_card": "comparison_table", "color_scheme": "tech_blue", "font_style": "bold_arabic"}'
),
(
  uuid_generate_v4(),
  'قالب متجر الاشتراكات الرقمية',
  'subscriptions',
  'تصميم قريب من SaaS/pricing pages، بطاقات اشتراك، فوائد الخدمة، مقارنة باقات، CTA قوي، مناسب لبيع اشتراكات رقمية وخدمات عضوية.',
  'subscriptions',
  '/themes/subscriptions/preview.jpg',
  true, true, 3,
  '{"hero_style": "pricing_grid", "product_card": "subscription_card", "color_scheme": "purple_neon", "font_style": "modern_arabic"}'
),
(
  uuid_generate_v4(),
  'قالب الكتب والمنتجات الرقمية',
  'books',
  'تصميم مكتبة رقمية، عرض أغلفة كتب/ملفات، تصنيفات معرفية، وصف واضح، مناسب للكتب وPDF والدورات والقوالب الرقمية.',
  'books',
  '/themes/books/preview.jpg',
  true, true, 4,
  '{"hero_style": "tech_gradient", "product_card": "card_dark", "color_scheme": "dark_neon", "font_style": "mono_arabic"}'
),
(
  uuid_generate_v4(),
  'قالب الإكسسوارات',
  'accessories',
  'تصميم فاخر، راقٍ، مناسب للهدايا والساعات والمجوهرات والإكسسوارات، تفاصيل دقيقة وبطاقات أنيقة.',
  'accessories',
  '/themes/accessories/preview.jpg',
  true, false, 5,
  '{"hero_style": "split_screen", "product_card": "luxury", "color_scheme": "gold_dark", "font_style": "modern_arabic"}'
),
(
  uuid_generate_v4(),
  'القالب الفارغ للتخصيص من الصفر',
  'blank',
  'قالب مرن ومحايد وقوي، مبني على Sections منظمة، يصلح لأي نشاط، ويكون الأساس لاحقًا للـ page builder.',
  'blank',
  '/themes/blank/preview.jpg',
  true, false, 6,
  '{"hero_style": "lifestyle_grid", "product_card": "room_scene", "color_scheme": "neutral_warm", "font_style": "clean_arabic"}'
),
(
  uuid_generate_v4(),
  'قالب الخدمات الشخصية',
  'personal_services',
  'مناسب للمدربين والاستشاريين والمصممين ومقدمي الخدمات، يحتوي أقسام خدمات، آراء العملاء، نبذة عن صاحب الخدمة، CTA للحجز أو الطلب.',
  'personal_services',
  '/themes/personal_services/preview.jpg',
  true, false, 7,
  '{"hero_style": "gradient_banner", "product_card": "rounded_soft", "color_scheme": "rose_pink", "font_style": "soft_arabic"}'
),
(
  uuid_generate_v4(),
  'قالب المتجر العام متعدد الاستخدامات',
  'general',
  'قالب عملي وقوي لأي متجر، فئات واضحة، شبكة منتجات، عروض، مناسب للمبتدئين والمتاجر المتنوعة.',
  'general',
  '/themes/general/preview.jpg',
  true, false, 8,
  '{"hero_style": "deals_banner", "product_card": "classic_grid", "color_scheme": "vibrant_green", "font_style": "clear_arabic"}'
);

