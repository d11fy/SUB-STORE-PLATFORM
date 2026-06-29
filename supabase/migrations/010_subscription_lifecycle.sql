-- ============================================================
-- Migration 010: Subscription Lifecycle System
-- ============================================================
-- Fixes gap between TypeScript types and actual DB schema:
--   stores is missing: subscription_status, subscription_ends_at, trial_ends_at
--   subscriptions is missing: payment_proof_url, admin_note, plan
--   subscription_status enum is missing: pending, rejected, expired
-- Also creates expire_overdue_subscriptions() for cron-based bulk expiry.
-- ============================================================

-- ── 1. Extend subscription_status enum ─────────────────────────────────────────
-- ADD VALUE IF NOT EXISTS is idempotent — safe to re-run
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'expired';

-- ── 2. stores: add subscription lifecycle columns ───────────────────────────────
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'suspended')),
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at        TIMESTAMPTZ;

-- ── 3. subscriptions: add billing detail columns ────────────────────────────────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS admin_note        TEXT,
  ADD COLUMN IF NOT EXISTS plan              TEXT;

-- ── 4. Backfill: sync trial_ends_at from subscriptions → stores ─────────────────
UPDATE public.stores s
SET    trial_ends_at = sub.trial_ends_at
FROM   public.subscriptions sub
WHERE  sub.store_id       = s.id
  AND  s.trial_ends_at   IS NULL
  AND  sub.trial_ends_at IS NOT NULL;

-- ── 5. Backfill: mark stores with an active subscription ────────────────────────
UPDATE public.stores s
SET    subscription_status  = 'active',
       subscription_ends_at = sub.current_period_end
FROM   public.subscriptions sub
WHERE  sub.store_id          = s.id
  AND  sub.status            = 'active'
  AND  s.subscription_status = 'trial';

-- ── 6. Performance indexes for the expiry scan ──────────────────────────────────
-- Partial index: only active stores with a known expiry are evaluated by cron
CREATE INDEX IF NOT EXISTS idx_stores_sub_expiry
  ON public.stores (subscription_ends_at)
  WHERE subscription_status = 'active' AND subscription_ends_at IS NOT NULL;

-- Partial index: only active subscriptions need period-end checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
  ON public.subscriptions (current_period_end)
  WHERE status = 'active';

-- ── 7. expire_overdue_subscriptions() ───────────────────────────────────────────
-- Atomic bulk expiry — called by /api/cron/check-subscriptions or admin action.
-- Returns JSON: { "expired_count": N, "run_at": "<timestamp>" }
-- Uses a CTE chain so only rows expired in step 1 are touched in step 2.
CREATE OR REPLACE FUNCTION public.expire_overdue_subscriptions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  INT;
  v_result JSON;
BEGIN
  WITH newly_expired AS (
    UPDATE public.subscriptions
    SET    status     = 'expired',
           updated_at = NOW()
    WHERE  status              = 'active'
      AND  current_period_end IS NOT NULL
      AND  current_period_end  < NOW()
    RETURNING store_id
  ),
  synced_stores AS (
    UPDATE public.stores
    SET    subscription_status = 'expired',
           updated_at          = NOW()
    WHERE  id IN (SELECT store_id FROM newly_expired)
      AND  subscription_status = 'active'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM synced_stores;

  v_result := json_build_object(
    'expired_count', v_count,
    'run_at',        NOW()
  );

  RETURN v_result;
END;
$$;

-- Lock function to service_role only — merchants cannot call it via RPC
REVOKE ALL    ON FUNCTION public.expire_overdue_subscriptions() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.expire_overdue_subscriptions() TO service_role;
