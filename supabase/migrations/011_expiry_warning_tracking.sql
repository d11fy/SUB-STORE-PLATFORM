-- ============================================================
-- Migration 011: Expiry warning email de-duplication tracking
-- ============================================================
-- Adds expiry_warning_sent_at to subscriptions so the daily cron
-- does not send duplicate "7 days remaining" emails in the same period.
-- Reset to NULL by approvePaymentRequest on each new subscription cycle.
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS expiry_warning_sent_at TIMESTAMPTZ;

-- Index used by the cron query:
--   WHERE status = 'active'
--     AND current_period_end BETWEEN NOW()+6d AND NOW()+7d
--     AND expiry_warning_sent_at IS NULL
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_warning
  ON public.subscriptions (current_period_end, expiry_warning_sent_at)
  WHERE status = 'active';
