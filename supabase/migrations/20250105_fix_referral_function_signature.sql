-- ================================================================
-- FIX REFERRAL FUNCTION SIGNATURE MISMATCH
-- ================================================================
-- Tanggal: 5 Januari 2025
-- Deskripsi: Memperbaiki signature function handle_referral_signup agar sesuai dengan frontend

-- 1. ENSURE REQUIRED COLUMNS EXIST
-- Add referral_points column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='referral_points'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN referral_points integer NOT NULL DEFAULT 0;
  END IF;
END$$;

-- Add referred_invites_count column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='referred_invites_count'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN referred_invites_count integer NOT NULL DEFAULT 0;
  END IF;
END$$;

-- 2. DROP FUNCTION LAMA YANG BERTENTANGAN
DROP FUNCTION IF EXISTS handle_referral_signup(UUID, TEXT);
DROP FUNCTION IF EXISTS handle_referral_signup(TEXT, UUID);

-- 2. BUAT FUNCTION BARU DENGAN SIGNATURE YANG BENAR
CREATE OR REPLACE FUNCTION handle_referral_signup(
  referral_code_input TEXT,
  new_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_profile RECORD;
  v_new_profile RECORD;
  v_referral_id UUID;
  v_result JSON;
  v_signup_points INTEGER := 0;
  v_referrer_points INTEGER := 0;
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
      v_signup_points := COALESCE(CAST(v_referral_settings.reward_value AS INTEGER), 100);
      v_referrer_points := v_signup_points; -- Same points for both
      RAISE LOG 'Using settings: signup_points=%, referrer_points=%', v_signup_points, v_referrer_points;
    ELSE
      v_signup_points := 100; -- Default points
      v_referrer_points := 100;
      RAISE LOG 'No settings found, using defaults: signup_points=%, referrer_points=%', v_signup_points, v_referrer_points;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error getting settings, using defaults: %', SQLERRM;
    v_signup_points := 100;
    v_referrer_points := 100;
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
    v_signup_points,
    now()
  ) RETURNING id INTO v_referral_id;
  
  RAISE LOG 'Created referral record: %', v_referral_id;
  
  -- Update poin untuk yang direferral (referee)
  IF v_signup_points > 0 THEN
    UPDATE profiles 
    SET referral_points = COALESCE(referral_points, 0) + v_signup_points,
        referred_by = v_referrer_profile.id,
        updated_at = now()
    WHERE id = v_new_profile.id;
    RAISE LOG 'Added % points to referee and set referred_by', v_signup_points;
  END IF;
  
  -- Update poin dan counter untuk referrer
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
    'reward_points', v_signup_points,
    'signup_points', v_signup_points,
    'referrer_points', v_referrer_points
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

-- 3. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION handle_referral_signup(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_signup(TEXT, UUID) TO anon;

-- 4. VERIFY FUNCTION EXISTS
SELECT 
  proname as function_name,
  proargnames as parameter_names,
  proargtypes::regtype[] as parameter_types
FROM pg_proc 
WHERE proname = 'handle_referral_signup';
