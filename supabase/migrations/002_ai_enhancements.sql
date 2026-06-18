-- ============================================================
-- Saba Store — Migration 002: AI Enhancements
-- Adds new AI generation types and columns
-- ============================================================

-- ============================================================
-- SECTION 1: Add new values to ai_generation_type enum
-- ============================================================

-- Add missing tool types
ALTER TYPE ai_generation_type ADD VALUE IF NOT EXISTS 'homepage_title';
ALTER TYPE ai_generation_type ADD VALUE IF NOT EXISTS 'homepage_description';
ALTER TYPE ai_generation_type ADD VALUE IF NOT EXISTS 'terms_of_service';
ALTER TYPE ai_generation_type ADD VALUE IF NOT EXISTS 'instagram_post';
ALTER TYPE ai_generation_type ADD VALUE IF NOT EXISTS 'short_ad';
ALTER TYPE ai_generation_type ADD VALUE IF NOT EXISTS 'promo_message';

-- ============================================================
-- SECTION 2: Add new columns to ai_generations
-- ============================================================

-- User who triggered the generation
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Provider used (openai, gemini, mock)
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS provider TEXT;

-- Status of the generation
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';

-- Error message if generation failed
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- ============================================================
-- SECTION 3: Add index for new columns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_generations_user
  ON public.ai_generations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_generations_status
  ON public.ai_generations(status);
