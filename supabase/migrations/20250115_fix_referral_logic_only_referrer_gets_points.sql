-- Fix referral logic: Only referrer gets points, referee gets no points
-- Migration: 20250115_fix_referral_logic_only_referrer_gets_points.sql

-- Drop existing function if exists
DROP FUNCTION IF EXISTS handle_referral_signup(TEXT, UUID);

-- Create updated function with corrected logic
CREATE OR REPLACE FUNCTION handle_referral_signup(
  referral_code_input TEXT,
  new_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_profile RECORD;
  v_referrer_profile RECORD;
  v_referral_id UUID;
  v_result JSON;
  v_signup_points INTEGER := 0; -- Yang diundang TIDAK mendapat poin
  v_referrer_points INTEGER := 0; -- Yang mengundang mendapat poin
  v_referral_settings RECORD;
BEGIN
  -- Log function call
  RAISE LOG 'handle_referral_signup called: new_user_id=%, referral_code=%', new_user_id, referral_code_input;
  
  -- Validasi input
  IF new_user_id IS NULL THEN
    RAISE LOG 'Error: new_user_id is NULL';
    RETURN json_build_object('success', false, 'error', 'User ID is required');
  END IF;
  
  IF referral_code_input IS NULL OR trim(referral_code_input) = '' THEN
    RAISE LOG 'Error: referral_code_input is empty';
    RETURN json_build_object('success', false, 'error', 'Referral code is required');
  END IF;
  
  -- Cari profile user baru berdasarkan user_id
  SELECT id, user_id, email, full_name, referral_code, referred_by, created_at, updated_at, role, referral_points, referred_invites_count
  INTO v_new_profile
  FROM profiles
  WHERE user_id = new_user_id;
  
  IF NOT FOUND THEN
    RAISE LOG 'Error: New user profile not found for user_id=%', new_user_id;
    RETURN json_build_object('success', false, 'error', 'User profile not found');
  END IF;
  
  RAISE LOG 'Found new user profile: % (ID: %)', v_new_profile.full_name, v_new_profile.id;
  
  -- Cari referrer berdasarkan kode referral
  SELECT id, user_id, email, full_name, referral_code, referred_by, created_at, updated_at, role, referral_points, referred_invites_count
  INTO v_referrer_profile
  FROM profiles
  WHERE referral_code = trim(referral_code_input)
  AND id != v_new_profile.id; -- Prevent self-referral
  
  IF NOT FOUND THEN
    RAISE LOG 'Invalid referral code: %', referral_code_input;
    RETURN json_build_object('success', false, 'error', 'Kode referral tidak valid');
  END IF;
  
  RAISE LOG 'Found referrer: % (ID: %)', v_referrer_profile.full_name, v_referrer_profile.id;
  
  -- Cek apakah user sudah pernah direferral
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = v_new_profile.id) THEN
    RAISE LOG 'User already referred: %', v_new_profile.id;
    RETURN json_build_object('success', false, 'error', 'User sudah pernah menggunakan kode referral');
  END IF;
  
  -- Ambil pengaturan poin referral
  BEGIN
    SELECT * INTO v_referral_settings
    FROM referral_settings 
    WHERE active = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF FOUND THEN
      v_signup_points := 0; -- Yang diundang TIDAK mendapat poin
      v_referrer_points := COALESCE(CAST(v_referral_settings.reward_value AS INTEGER), 100); -- Yang mengundang mendapat poin
      RAISE LOG 'Using settings: signup_points=%, referrer_points=%', v_signup_points, v_referrer_points;
    ELSE
      v_signup_points := 0; -- Default: yang diundang tidak mendapat poin
      v_referrer_points := 100; -- Default: yang mengundang mendapat 100 poin
      RAISE LOG 'No settings found, using defaults: signup_points=%, referrer_points=%', v_signup_points, v_referrer_points;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error getting settings, using defaults: %', SQLERRM;
    v_signup_points := 0; -- Yang diundang tidak mendapat poin
    v_referrer_points := 100; -- Yang mengundang mendapat poin
  END;
  
  -- Buat record referral baru
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    reward_points,
    created_at
  ) VALUES (
    v_referrer_profile.id,
    v_new_profile.id,
    trim(referral_code_input),
    v_referrer_points, -- Simpan poin yang diberikan ke referrer
    now()
  ) RETURNING id INTO v_referral_id;
  
  RAISE LOG 'Created referral record: %', v_referral_id;
  
  -- Update profile untuk yang direferral (referee) - TIDAK mendapat poin
  -- Hanya set referred_by untuk tracking
  UPDATE profiles 
  SET referred_by = v_referrer_profile.id,
      updated_at = now()
  WHERE id = v_new_profile.id;
  RAISE LOG 'Set referred_by for referee (no points awarded)';
  
  -- Update poin dan counter untuk referrer - MENDAPAT POIN
  UPDATE profiles 
  SET referral_points = COALESCE(referral_points, 0) + v_referrer_points,
      referred_invites_count = COALESCE(referred_invites_count, 0) + 1,
      updated_at = now()
  WHERE id = v_referrer_profile.id;
  RAISE LOG 'Added % points to referrer, count updated', v_referrer_points;
  
  -- Return success response
  v_result := json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_profile.id,
    'referrer_name', v_referrer_profile.full_name,
    'reward_points', v_referrer_points, -- Poin yang diberikan ke referrer
    'signup_points', v_signup_points, -- Poin untuk yang diundang (selalu 0)
    'referrer_points', v_referrer_points -- Poin untuk yang mengundang
  );
  
  RAISE LOG 'Referral success: %', v_result;
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Unexpected error: %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', 'Terjadi kesalahan sistem: ' || SQLERRM
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_referral_signup(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_signup(TEXT, UUID) TO anon;

-- Verify function exists
SELECT 
  proname as function_name,
  proargnames as parameter_names,
  proargtypes::regtype[] as parameter_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'handle_referral_signup';

-- Add comment explaining the logic
COMMENT ON FUNCTION handle_referral_signup(TEXT, UUID) IS 
'Processes referral signup. Only the referrer (person who invited) gets points. The referee (person who was invited) gets no points but is tracked for referral relationship.';
