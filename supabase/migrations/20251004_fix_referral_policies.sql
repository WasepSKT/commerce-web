-- Fix referral policies to work with the complex referral system
-- Safe migration with IF EXISTS and CREATE OR REPLACE

-- SAFETY CHECK: Only proceed if required tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
    RAISE EXCEPTION 'referrals table does not exist. Please run base migrations first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_settings') THEN
    RAISE EXCEPTION 'referral_settings table does not exist. Please run base migrations first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_purchases') THEN
    RAISE EXCEPTION 'referral_purchases table does not exist. Please run base migrations first.';
  END IF;
END $$;

-- 1. Fix policies for referrals table (basic referral relationships)
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can insert referrals for themselves" ON public.referrals;

CREATE POLICY "Users can insert referrals for themselves" 
ON public.referrals 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = referred_id
  )
);

-- 2. Ensure profiles can be updated with referred_by
-- Add missing columns safely if they don't exist
DO $$
BEGIN
  -- Add reward_points if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'reward_points'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN reward_points INTEGER DEFAULT 0;
  END IF;
  
  -- Add referred_invites_count if not exists  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referred_invites_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referred_invites_count INTEGER DEFAULT 0;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can update their own referred_by" ON public.profiles;
CREATE POLICY "Users can update their own referred_by" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Add function to properly handle referral signup with settings integration
-- Use CREATE OR REPLACE for safe updates
CREATE OR REPLACE FUNCTION public.handle_referral_signup(
  referral_code_input TEXT,
  new_user_id UUID
) 
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_profile RECORD;
  new_profile RECORD;
  referral_settings_record RECORD;
  signup_reward_points INTEGER;
  result JSON;
BEGIN
  -- Get active referral settings
  SELECT * INTO referral_settings_record 
  FROM referral_settings 
  WHERE active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Use default values if no settings found
    signup_reward_points := 10;
  ELSE
    -- Use reward_value from settings for signup rewards
    signup_reward_points := COALESCE(referral_settings_record.reward_value::INTEGER, 10);
  END IF;

  -- Get the referrer profile
  SELECT id, referral_code, reward_points, referred_invites_count INTO referrer_profile 
  FROM profiles 
  WHERE referral_code = referral_code_input;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Referral code not found');
  END IF;
  
  -- Get the new user profile
  SELECT id, user_id INTO new_profile 
  FROM profiles 
  WHERE user_id = new_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'New user profile not found');
  END IF;
  
  -- Prevent self-referral
  IF referrer_profile.id = new_profile.id THEN
    RETURN json_build_object('success', false, 'message', 'Cannot refer yourself');
  END IF;
  
  -- Check if user already has a referrer
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = new_profile.id) THEN
    RETURN json_build_object('success', false, 'message', 'User already has a referrer');
  END IF;
  
  -- Check max_per_referrer limit if set
  IF referral_settings_record.max_per_referrer IS NOT NULL THEN
    IF COALESCE(referrer_profile.referred_invites_count, 0) >= referral_settings_record.max_per_referrer THEN
      RETURN json_build_object('success', false, 'message', 'Referrer has reached maximum referral limit');
    END IF;
  END IF;
  
  -- Update new user's profile with referrer
  UPDATE profiles 
  SET referred_by = referrer_profile.id
  WHERE id = new_profile.id;
  
  -- Update referrer's profile: increment invite count and reward points
  UPDATE profiles 
  SET referred_invites_count = COALESCE(referred_invites_count, 0) + 1,
      reward_points = COALESCE(reward_points, 0) + signup_reward_points
  WHERE id = referrer_profile.id;
  
  -- Insert referral record with proper reward points
  INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_points)
  VALUES (referrer_profile.id, new_profile.id, referral_code_input, signup_reward_points);
  
  -- Recompute referral score for the referrer (considers purchase levels)
  PERFORM fn_recompute_referrer_score(referrer_profile.id);
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Referral processed successfully',
    'reward_points', signup_reward_points,
    'referrer_id', referrer_profile.id
  );
END;
$$;

-- 4. Add function to handle referral purchase rewards  
-- Safe function creation with error handling
CREATE OR REPLACE FUNCTION public.handle_referral_purchase(
  order_id_input TEXT,
  buyer_user_id UUID,
  purchase_amount NUMERIC
) 
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_profile RECORD;
  referrer_profile RECORD;
  referral_settings_record RECORD;
  purchase_reward_points INTEGER;
BEGIN
  -- Get active referral settings (optional)
  SELECT * INTO referral_settings_record 
  FROM referral_settings 
  WHERE active = true 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Get buyer profile and their referrer
  SELECT p.id, p.user_id, p.referred_by INTO buyer_profile 
  FROM profiles p
  WHERE p.user_id = buyer_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Buyer profile not found');
  END IF;

  -- Check if buyer has a referrer
  IF buyer_profile.referred_by IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Buyer has no referrer');
  END IF;

  -- Get referrer profile
  SELECT * INTO referrer_profile 
  FROM profiles 
  WHERE id = buyer_profile.referred_by;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Referrer profile not found');
  END IF;

  -- Check minimum purchase amount requirement
  -- NOTE: min_purchase_amount was removed from schema; previously this checked a threshold. Keep behavior permissive here.

  -- Check if this order already has a referral purchase record
  IF EXISTS (SELECT 1 FROM referral_purchases WHERE order_id = order_id_input) THEN
    RETURN json_build_object('success', false, 'message', 'Order already processed for referral');
  END IF;

  -- Calculate purchase reward points (used later on approval)
  purchase_reward_points := GREATEST((purchase_amount * 0.01)::INTEGER, 1);

  -- Insert referral purchase record with status 'pending'. Admin must approve to credit the referrer.
  INSERT INTO referral_purchases (referrer_id, referred_id, order_id, amount, status)
  VALUES (referrer_profile.id, buyer_profile.id, order_id_input, purchase_amount, 'pending');

  RETURN json_build_object(
    'success', true,
    'message', 'Purchase recorded for referral approval',
    'referrer_id', referrer_profile.id,
    'purchase_amount', purchase_amount
  );
END;
$$;

-- New function: approve a pending referral purchase and credit reward points to the referrer
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
  purchase_reward_points INTEGER;
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

  -- Compute reward points (same logic as when created)
  purchase_reward_points := GREATEST((rp.amount * 0.01)::INTEGER, 1);

  -- Credit referrer's reward points
  UPDATE profiles
  SET reward_points = COALESCE(reward_points, 0) + purchase_reward_points
  WHERE id = rp.referrer_id;

  -- Mark referral purchase as completed
  UPDATE referral_purchases
  SET status = 'completed', updated_at = now()
  WHERE id = purchase_id_input;

  -- Recompute referral score
  PERFORM fn_recompute_referrer_score(rp.referrer_id);

  RETURN json_build_object(
    'success', true,
    'message', 'Referral approved and referrer credited',
    'referrer_id', rp.referrer_id,
    'reward_points', purchase_reward_points
  );
END;
$$;