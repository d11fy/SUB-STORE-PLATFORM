-- ============================================================
-- Saba Store — Migration 007: D3 AI Theme Builder
-- Additive-only: adds config_output + review_status to ai_generations
-- Does NOT modify existing columns or data
-- ============================================================

-- 1. Add theme_config to the ai_generation_type enum
ALTER TYPE ai_generation_type ADD VALUE IF NOT EXISTS 'theme_config';

-- 2. Add D3 columns to ai_generations (additive-only — no existing data touched)
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS config_output    JSONB  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_status    TEXT   DEFAULT NULL
    CHECK (review_status IN ('pending', 'applied', 'rejected'));

-- 3. Sparse index — only theme_config rows with a review status
CREATE INDEX IF NOT EXISTS idx_ai_generations_theme_review
  ON public.ai_generations(store_id, review_status)
  WHERE review_status IS NOT NULL;
