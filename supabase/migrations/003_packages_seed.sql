-- ============================================================
-- Saba Store — Packages Seed
-- Inserts default subscription packages
-- ============================================================

INSERT INTO public.packages (
  name, slug, description, price_monthly, max_products, max_ai_credits, max_themes, has_custom_domain, has_advanced_theme, sort_order, is_active
) VALUES 
(
  'باقة الانطلاقة', 
  'starter', 
  'مناسبة للمبتدئين ولتجربة التجارة الإلكترونية', 
  49.00, 
  50, 
  50, 
  2, 
  FALSE, 
  FALSE, 
  1, 
  TRUE
),
(
  'باقة النمو', 
  'growth', 
  'للمتاجر المتنامية التي تحتاج ميزات متقدمة', 
  99.00, 
  500, 
  300, 
  99, 
  TRUE, 
  FALSE, 
  2, 
  TRUE
),
(
  'باقة الاحتراف', 
  'pro', 
  'للمحترفين وأصحاب المتاجر الكبرى بقوة كاملة', 
  199.00, 
  NULL, 
  1000, 
  99, 
  TRUE, 
  TRUE, 
  3, 
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  max_products = EXCLUDED.max_products,
  max_ai_credits = EXCLUDED.max_ai_credits,
  max_themes = EXCLUDED.max_themes,
  has_custom_domain = EXCLUDED.has_custom_domain,
  has_advanced_theme = EXCLUDED.has_advanced_theme,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
