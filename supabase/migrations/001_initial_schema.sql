-- ============================================================
-- Saba Store — Initial Schema
-- Created: 2026-06-14
-- Description: Full multi-tenant e-commerce SaaS schema
-- ============================================================
-- نظام: سبأ ستور
-- قاعدة بيانات متعددة المستأجرين مع RLS كامل
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SECTION 1: ENUMS
-- ============================================================

-- User roles
CREATE TYPE user_role AS ENUM ('merchant', 'admin', 'customer');

-- Store status
CREATE TYPE store_status AS ENUM ('active', 'suspended', 'pending', 'trial');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- Order status (Arabic)
CREATE TYPE order_status AS ENUM (
  'جديد',
  'بانتظار_تأكيد_الدفع',
  'تم_تأكيد_الدفع',
  'فشل_الدفع',
  'قيد_التجهيز',
  'تم_الشحن',
  'مكتمل',
  'ملغي'
);

-- Payment method type
CREATE TYPE payment_method_type AS ENUM (
  'bank_transfer',
  'local_wallet',
  'cash_on_delivery',
  'custom'
);

-- Payment proof status
CREATE TYPE proof_status AS ENUM ('pending', 'approved', 'rejected');

-- Shipping method type
CREATE TYPE shipping_method_type AS ENUM (
  'fixed',
  'city_based',
  'free',
  'pickup',
  'custom'
);

-- AI generation type
CREATE TYPE ai_generation_type AS ENUM (
  'product_name',
  'product_description',
  'homepage_content',
  'about_us',
  'return_policy',
  'privacy_policy',
  'social_ad_copy',
  'store_slogan',
  'category_description',
  'product_seo_title',
  'product_seo_description'
);

-- Notification type
CREATE TYPE notification_type AS ENUM (
  'new_order',
  'payment_confirmed',
  'payment_rejected',
  'low_stock',
  'new_customer',
  'system'
);

-- ============================================================
-- SECTION 2: GLOBAL TABLES (no store_id)
-- ============================================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'merchant',
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription packages
CREATE TABLE public.packages (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,             -- e.g. باقة الانطلاقة
  slug                 TEXT NOT NULL UNIQUE,      -- e.g. starter
  description          TEXT,
  price_monthly        DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly         DECIMAL(10,2),
  max_products         INT,                       -- NULL = unlimited
  max_ai_credits       INT NOT NULL DEFAULT 0,
  max_themes           INT NOT NULL DEFAULT 2,
  has_custom_domain    BOOLEAN NOT NULL DEFAULT FALSE,
  has_advanced_theme   BOOLEAN NOT NULL DEFAULT FALSE,
  has_custom_css       BOOLEAN NOT NULL DEFAULT FALSE,
  has_custom_html      BOOLEAN NOT NULL DEFAULT FALSE,
  has_whatsapp_notif   BOOLEAN NOT NULL DEFAULT FALSE,
  has_email_notif      BOOLEAN NOT NULL DEFAULT FALSE,
  has_reports          BOOLEAN NOT NULL DEFAULT FALSE,
  has_priority_support BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Themes
CREATE TABLE public.themes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT,
  category       TEXT NOT NULL,    -- e.g. fashion, beauty, food
  preview_image  TEXT,
  thumbnail_url  TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_premium     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order     INT NOT NULL DEFAULT 0,
  config         JSONB NOT NULL DEFAULT '{}',   -- default theme config
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: TENANT-SCOPED TABLES (all have store_id)
-- ============================================================

-- Stores (root tenant table)
CREATE TABLE public.stores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,          -- used in /store/[slug]
  subdomain       TEXT UNIQUE,                   -- for future subdomain routing
  description     TEXT,
  logo_url        TEXT,
  favicon_url     TEXT,
  cover_url       TEXT,
  email           TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  address         TEXT,
  city            TEXT,
  country         TEXT NOT NULL DEFAULT 'PS',    -- Palestine default
  currency        TEXT NOT NULL DEFAULT 'ILS',
  status          store_status NOT NULL DEFAULT 'trial',
  current_theme_id UUID REFERENCES public.themes(id),
  package_id      UUID REFERENCES public.packages(id),
  meta_title      TEXT,
  meta_description TEXT,
  social_links    JSONB NOT NULL DEFAULT '{}',   -- { instagram, facebook, tiktok, twitter }
  settings        JSONB NOT NULL DEFAULT '{}',   -- misc store settings
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  package_id        UUID NOT NULL REFERENCES public.packages(id),
  status            subscription_status NOT NULL DEFAULT 'trialing',
  trial_starts_at   TIMESTAMPTZ,
  trial_ends_at     TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  canceled_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id)  -- one subscription per store
);

-- Categories
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

-- Products
CREATE TABLE public.products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  short_description TEXT,
  price             DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_price     DECIMAL(10,2),               -- original price (for discounts)
  sku               TEXT,
  barcode           TEXT,
  stock_quantity    INT NOT NULL DEFAULT 0,
  track_inventory   BOOLEAN NOT NULL DEFAULT TRUE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  is_digital        BOOLEAN NOT NULL DEFAULT FALSE,
  weight            DECIMAL(8,3),
  meta_title        TEXT,
  meta_description  TEXT,
  tags              TEXT[] DEFAULT '{}',
  attributes        JSONB NOT NULL DEFAULT '{}', -- { color, size, etc }
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

-- Product Images
CREATE TABLE public.product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers (per-store, not auth users)
CREATE TABLE public.customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  city        TEXT,
  address     TEXT,
  notes       TEXT,
  orders_count INT NOT NULL DEFAULT 0,
  total_spent  DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id         UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number        TEXT NOT NULL,              -- human-readable: ORD-2024-0001
  status              order_status NOT NULL DEFAULT 'جديد',
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  city                TEXT NOT NULL,
  address             TEXT NOT NULL,
  notes               TEXT,
  subtotal            DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost       DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method_id   UUID,                       -- references payment_methods
  shipping_method_id  UUID,                       -- references shipping_methods
  payment_status      TEXT,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  canceled_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,                    -- snapshot at time of order
  product_sku  TEXT,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  attributes  JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Methods (merchant configuration)
CREATE TABLE public.payment_methods (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  type                payment_method_type NOT NULL,
  account_holder_name TEXT,
  bank_name           TEXT,
  account_number      TEXT,
  iban                TEXT,
  instructions        TEXT,
  qr_image_url        TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Proofs (uploaded by customers)
CREATE TABLE public.payment_proofs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  uploaded_file_url   TEXT NOT NULL,
  transaction_reference TEXT,
  payer_name          TEXT,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review_status       proof_status NOT NULL DEFAULT 'pending',
  reviewed_by         UUID REFERENCES public.users(id),
  reviewed_at         TIMESTAMPTZ,
  rejection_reason    TEXT
);

-- Shipping Methods
CREATE TABLE public.shipping_methods (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id              UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  type                  shipping_method_type NOT NULL,
  base_price            DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2),
  pickup_address        TEXT,
  estimated_days_min    INT,
  estimated_days_max    INT,
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order            INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipping Zones (city-based shipping prices)
CREATE TABLE public.shipping_zones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  shipping_method_id UUID NOT NULL REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  city_name         TEXT NOT NULL,
  price             DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_days_min INT,
  estimated_days_max INT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store Theme Settings
CREATE TABLE public.store_theme_settings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  theme_id         UUID NOT NULL REFERENCES public.themes(id),
  primary_color    TEXT NOT NULL DEFAULT '#1B4FD8',
  secondary_color  TEXT NOT NULL DEFAULT '#7C3AED',
  accent_color     TEXT NOT NULL DEFAULT '#F59E0B',
  font_family      TEXT NOT NULL DEFAULT 'Cairo',
  hero_title       TEXT,
  hero_subtitle    TEXT,
  hero_image_url   TEXT,
  logo_url         TEXT,
  favicon_url      TEXT,
  sections_order   TEXT[] DEFAULT ARRAY['hero', 'featured', 'categories', 'banner', 'products'],
  hidden_sections  TEXT[] DEFAULT '{}',
  footer_content   TEXT,
  custom_css       TEXT,                          -- scoped, package-gated
  custom_html      JSONB NOT NULL DEFAULT '{}',   -- sanitized blocks
  settings         JSONB NOT NULL DEFAULT '{}',   -- additional theme-specific config
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id)
);

-- AI Generations History
CREATE TABLE public.ai_generations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type            ai_generation_type NOT NULL,
  prompt_input    TEXT,
  generated_text  TEXT NOT NULL,
  credits_used    INT NOT NULL DEFAULT 1,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  model_used      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Credits (per store, reset monthly)
CREATE TABLE public.ai_credits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  credits_total   INT NOT NULL DEFAULT 0,
  credits_used    INT NOT NULL DEFAULT 0,
  reset_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  data        JSONB NOT NULL DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom Domains
CREATE TABLE public.domains (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  domain        TEXT NOT NULL UNIQUE,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at   TIMESTAMPTZ,
  dns_records   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Logs (audit trail)
CREATE TABLE public.admin_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES public.users(id),
  store_id    UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECTION 4: INDEXES
-- (store_id always first in composite indexes)
-- ============================================================

-- Stores
CREATE INDEX idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_status ON public.stores(status);
CREATE INDEX idx_stores_package_id ON public.stores(package_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_store_id ON public.subscriptions(store_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_trial_ends ON public.subscriptions(trial_ends_at);

-- Categories
CREATE INDEX idx_categories_store_id ON public.categories(store_id);
CREATE INDEX idx_categories_store_parent ON public.categories(store_id, parent_id);
CREATE INDEX idx_categories_store_active ON public.categories(store_id, is_active);

-- Products
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_store_category ON public.products(store_id, category_id);
CREATE INDEX idx_products_store_active ON public.products(store_id, is_active);
CREATE INDEX idx_products_store_featured ON public.products(store_id, is_featured);
CREATE INDEX idx_products_store_created ON public.products(store_id, created_at DESC);
CREATE INDEX idx_products_slug ON public.products(store_id, slug);

-- Product Images
CREATE INDEX idx_product_images_store ON public.product_images(store_id);
CREATE INDEX idx_product_images_product ON public.product_images(store_id, product_id);

-- Orders
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_store_status ON public.orders(store_id, status);
CREATE INDEX idx_orders_store_created ON public.orders(store_id, created_at DESC);
CREATE INDEX idx_orders_store_customer ON public.orders(store_id, customer_id);
CREATE INDEX idx_orders_number ON public.orders(store_id, order_number);

-- Order Items
CREATE INDEX idx_order_items_store ON public.order_items(store_id);
CREATE INDEX idx_order_items_order ON public.order_items(store_id, order_id);

-- Customers
CREATE INDEX idx_customers_store_id ON public.customers(store_id);
CREATE INDEX idx_customers_store_email ON public.customers(store_id, email);
CREATE INDEX idx_customers_store_phone ON public.customers(store_id, phone);

-- Payment Methods
CREATE INDEX idx_payment_methods_store ON public.payment_methods(store_id);
CREATE INDEX idx_payment_methods_store_active ON public.payment_methods(store_id, is_active);

-- Payment Proofs
CREATE INDEX idx_payment_proofs_store ON public.payment_proofs(store_id);
CREATE INDEX idx_payment_proofs_order ON public.payment_proofs(store_id, order_id);
CREATE INDEX idx_payment_proofs_status ON public.payment_proofs(store_id, review_status);

-- Shipping
CREATE INDEX idx_shipping_methods_store ON public.shipping_methods(store_id);
CREATE INDEX idx_shipping_zones_store ON public.shipping_zones(store_id);
CREATE INDEX idx_shipping_zones_method ON public.shipping_zones(store_id, shipping_method_id);

-- AI
CREATE INDEX idx_ai_generations_store ON public.ai_generations(store_id);
CREATE INDEX idx_ai_generations_store_type ON public.ai_generations(store_id, type);
CREATE INDEX idx_ai_generations_store_created ON public.ai_generations(store_id, created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_store ON public.notifications(store_id);
CREATE INDEX idx_notifications_store_unread ON public.notifications(store_id, is_read, created_at DESC);

-- Domains
CREATE INDEX idx_domains_store ON public.domains(store_id);

-- Admin Logs
CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX idx_admin_logs_store ON public.admin_logs(store_id);
CREATE INDEX idx_admin_logs_created ON public.admin_logs(created_at DESC);

-- ============================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tenant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
-- packages and themes are global (no RLS needed)

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- USERS: Users can read/update their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- STORES: Owners can manage their store; public can read active stores
CREATE POLICY "stores_owner_all" ON public.stores
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "stores_public_read" ON public.stores
  FOR SELECT USING (status = 'active');

-- SUBSCRIPTIONS: Store owner only
CREATE POLICY "subscriptions_owner_all" ON public.subscriptions
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- CATEGORIES: Owner manages; public reads active
CREATE POLICY "categories_owner_all" ON public.categories
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (
    is_active = TRUE AND
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- PRODUCTS: Owner manages; public reads active products in active stores
CREATE POLICY "products_owner_all" ON public.products
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (
    is_active = TRUE AND
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- PRODUCT IMAGES: Owner manages; public reads for active products
CREATE POLICY "product_images_owner_all" ON public.product_images
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "product_images_public_read" ON public.product_images
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- CUSTOMERS: Owner only
CREATE POLICY "customers_owner_all" ON public.customers
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- ORDERS: Owner reads/updates; customers can insert
CREATE POLICY "orders_owner_all" ON public.orders
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- ORDER ITEMS: Owner manages; can be inserted with order
CREATE POLICY "order_items_owner_all" ON public.order_items
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "order_items_public_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- PAYMENT METHODS: Owner manages; public can read active methods
CREATE POLICY "payment_methods_owner_all" ON public.payment_methods
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "payment_methods_public_read" ON public.payment_methods
  FOR SELECT USING (
    is_active = TRUE AND
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- PAYMENT PROOFS: Owner reads; public can insert
CREATE POLICY "payment_proofs_owner_all" ON public.payment_proofs
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "payment_proofs_public_insert" ON public.payment_proofs
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- SHIPPING METHODS: Owner manages; public reads active
CREATE POLICY "shipping_methods_owner_all" ON public.shipping_methods
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "shipping_methods_public_read" ON public.shipping_methods
  FOR SELECT USING (
    is_active = TRUE AND
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- SHIPPING ZONES: Owner manages; public reads active
CREATE POLICY "shipping_zones_owner_all" ON public.shipping_zones
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "shipping_zones_public_read" ON public.shipping_zones
  FOR SELECT USING (
    is_active = TRUE AND
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- STORE THEME SETTINGS: Owner manages; public reads
CREATE POLICY "theme_settings_owner_all" ON public.store_theme_settings
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "theme_settings_public_read" ON public.store_theme_settings
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'active')
  );

-- AI GENERATIONS: Owner only
CREATE POLICY "ai_generations_owner_all" ON public.ai_generations
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- AI CREDITS: Owner only
CREATE POLICY "ai_credits_owner_all" ON public.ai_credits
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- NOTIFICATIONS: Owner only
CREATE POLICY "notifications_owner_all" ON public.notifications
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- DOMAINS: Owner only
CREATE POLICY "domains_owner_all" ON public.domains
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- ADMIN LOGS: Admin only (via service role - no policy needed for service role)
CREATE POLICY "admin_logs_admin_only" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SECTION 6: FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate sequential order number per store
CREATE OR REPLACE FUNCTION public.generate_order_number(p_store_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INT;
  v_year TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.orders
  WHERE store_id = p_store_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  RETURN 'ORD-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-set order number before insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number(NEW.store_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SECTION 7: TRIGGERS
-- ============================================================

-- User creation trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_shipping_methods_updated_at
  BEFORE UPDATE ON public.shipping_methods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON public.store_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ai_credits_updated_at
  BEFORE UPDATE ON public.ai_credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Order number trigger
CREATE TRIGGER set_order_number_before_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- ============================================================
-- SECTION 8: STORAGE BUCKETS (run after enabling storage)
-- ============================================================
-- Note: Run these separately in Supabase dashboard or via CLI

-- Store logos and assets (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-assets',
  'store-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Product images (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Payment proofs (private bucket — NOT public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- Store assets: owners can upload to their store folder
CREATE POLICY "store_assets_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "store_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

CREATE POLICY "store_assets_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Product images: owners upload
CREATE POLICY "product_images_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Payment proofs: anyone can upload (for checkout), only owner can read
CREATE POLICY "payment_proofs_public_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "payment_proofs_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.stores WHERE owner_id = auth.uid()
    )
  );
