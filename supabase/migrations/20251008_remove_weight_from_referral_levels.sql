-- Migration: remove legacy `weight` column from referral_levels (keep idempotent and safe)
BEGIN;

-- 1) Add commission_pct if not exists (safety — already handled in prior migration but keep idempotent)
ALTER TABLE public.referral_levels
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(6,4) DEFAULT 0.01;

-- 2) Backfill commission_pct from weight for any rows that still have the default or null commission_pct
-- Note: DB stores commission_pct as decimal fraction (0.05). weight was an integer percentage (5).
UPDATE public.referral_levels
SET commission_pct = (weight::numeric) / 100.0
WHERE (commission_pct IS NULL OR commission_pct = 0 OR commission_pct = 0.01) AND weight IS NOT NULL;

-- 3) Drop weight column if exists (keep caution for apps still using it; dropping is idempotent)
ALTER TABLE public.referral_levels
  DROP COLUMN IF EXISTS weight;

COMMIT;
