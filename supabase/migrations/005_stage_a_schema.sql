-- ============================================================
-- Migration 005: Stage A Feature Gap Fixes
-- Adds: requires_shipping, product_type, subscription_duration
-- ============================================================

-- 1. requires_shipping column on stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN NOT NULL DEFAULT true;

-- 2. product_type enum type
DO $$ BEGIN
  CREATE TYPE product_type_enum AS ENUM ('physical', 'digital', 'subscription', 'service');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. product_type + subscription_duration columns on products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type product_type_enum NOT NULL DEFAULT 'physical';
ALTER TABLE products ADD COLUMN IF NOT EXISTS subscription_duration_value INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subscription_duration_unit VARCHAR(20);

-- 4. Backfill: mark existing is_digital=true products as 'digital'
UPDATE products SET product_type = 'digital' WHERE is_digital = true AND product_type = 'physical';
