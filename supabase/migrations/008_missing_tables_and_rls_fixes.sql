-- ============================================================
-- Saba Store — Migration 008: Missing Tables and RLS Fixes
-- ============================================================

-- 1. Create public.platform_settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only platform admins can perform operations on platform settings
CREATE POLICY "platform_settings_admin_all" ON public.platform_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'platform_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'platform_admin'));


-- 2. Create public.payment_requests Table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  plan               TEXT NOT NULL,
  transaction_number TEXT,
  notes              TEXT,
  receipt_url        TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,
  admin_note         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can read their own payment requests
CREATE POLICY "payment_requests_owner_select" ON public.payment_requests
  FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Policy: Platform admins can manage all payment requests
CREATE POLICY "payment_requests_admin_all" ON public.payment_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'platform_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'platform_admin'));


-- 3. Fix: Update admin_logs RLS SELECT policy to check for 'platform_admin' instead of 'admin'
DROP POLICY IF EXISTS "admin_logs_admin_only" ON public.admin_logs;

CREATE POLICY "admin_logs_admin_only" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );
