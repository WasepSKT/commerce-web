-- Migration: add commission_pct to referral_levels and commission fields to referral_purchases
-- Also replace approve_referral_purchase to compute commission based on referrer level
BEGIN;

-- 1) Add commission_pct to referral_levels
ALTER TABLE public.referral_levels
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(6,4) DEFAULT 0.01;

-- 2) Add commission columns to referral_purchases
ALTER TABLE public.referral_purchases
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(6,4) DEFAULT 0;

-- 3) Set sensible defaults for existing levels (only update rows that still have default commission_pct)
UPDATE public.referral_levels
SET commission_pct = CASE
  WHEN name ILIKE '%Pemula%' THEN 0.01
  WHEN name ILIKE '%Mahir%' THEN 0.03
  WHEN name ILIKE '%Pro%' THEN 0.05
  ELSE 0.01
END
WHERE commission_pct = 0.01;

-- 4) Replace approve_referral_purchase to compute commission based on referrer's total and level
CREATE OR REPLACE FUNCTION public.approve_referral_purchase(
  purchase_id_input UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rp RECORD;
  commission_pct_val NUMERIC(6,4);
  commission_amount_val NUMERIC(12,2);
  reward_points_to_add INTEGER;
  referrer_total NUMERIC;
  level_id uuid;
BEGIN
  -- Load the referral purchase
  SELECT * INTO rp FROM referral_purchases WHERE id = purchase_id_input;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Referral purchase not found');
  END IF;

  -- If already completed, return idempotent response
  IF rp.status = 'completed' THEN
    RETURN json_build_object('success', false, 'message', 'Referral already approved');
  END IF;

  -- Compute referrer's total completed referral amount including this purchase
  SELECT COALESCE(SUM(amount),0) + rp.amount INTO referrer_total
  FROM referral_purchases
  WHERE referrer_id = rp.referrer_id AND status = 'completed';

  -- Determine appropriate level for referrer_total using existing helper
  SELECT fn_get_level_id_for_amount(referrer_total) INTO level_id;

  IF level_id IS NOT NULL THEN
    SELECT commission_pct INTO commission_pct_val FROM referral_levels WHERE id = level_id LIMIT 1;
  END IF;

  -- Fallback: if no level commission found, use default top-level active level or 1%
  IF commission_pct_val IS NULL THEN
    SELECT commission_pct INTO commission_pct_val FROM referral_levels WHERE active = true ORDER BY priority DESC LIMIT 1;
  END IF;
  IF commission_pct_val IS NULL THEN
    commission_pct_val := 0.01;
  END IF;

  -- Compute commission amount and reward points
  commission_amount_val := round((rp.amount * commission_pct_val)::numeric, 2);
  reward_points_to_add := GREATEST(FLOOR(commission_amount_val)::INTEGER, 1);

  -- Credit referrer's reward points
  UPDATE profiles
  SET reward_points = COALESCE(reward_points, 0) + reward_points_to_add
  WHERE id = rp.referrer_id;

  -- Mark referral purchase as completed and store commission info
  UPDATE referral_purchases
  SET status = 'completed', updated_at = now(), commission_amount = commission_amount_val, commission_pct = commission_pct_val
  WHERE id = purchase_id_input;

  -- Recompute referral score and referred levels for this referrer
  PERFORM fn_recompute_score_and_levels_for_referrer(rp.referrer_id);

  RETURN json_build_object(
    'success', true,
    'message', 'Referral approved and referrer credited',
    'referrer_id', rp.referrer_id,
    'commission_amount', commission_amount_val,
    'commission_pct', commission_pct_val,
    'reward_points', reward_points_to_add
  );
END;
$$;

COMMIT;
