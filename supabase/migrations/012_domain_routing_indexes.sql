-- Migration 012: Domain routing performance indexes
--
-- The middleware does two hot lookups on every storefront request:
--   1. domains.domain (custom domain routing)      — already has UNIQUE constraint = implicit index
--   2. stores.subdomain (sabastore.com subdomain routing) — TEXT UNIQUE, also already indexed
--
-- These explicit named indexes document the intent and survive table recreation.
-- IF NOT EXISTS makes the migration safe to re-run.

-- Custom domain lookup: domains WHERE domain = $1 AND is_verified = true
-- A partial index on verified-only rows halves the index size and speeds up middleware lookups.
CREATE INDEX IF NOT EXISTS idx_domains_domain_verified
  ON public.domains (domain)
  WHERE is_verified = true;

-- Subdomain lookup: stores WHERE subdomain = $1
-- This column is already UNIQUE (implicit btree index), but a named index
-- ensures it survives schema diffs and is visible in Supabase Studio.
CREATE INDEX IF NOT EXISTS idx_stores_subdomain
  ON public.stores (subdomain)
  WHERE subdomain IS NOT NULL;

-- Ensure RLS is enabled on domains (guard against accidental disabling)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
