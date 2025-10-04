-- ================================================================
-- PERBAIKAN REFERRAL FUNCTION - Tanpa kolom yang tidak ada
-- ================================================================
-- Jalankan di SQL Editor untuk update function

-- 1. DROP dan BUAT ULANG FUNCTION dengan kolom yang benar
DROP FUNCTION IF EXISTS handle_referral_signup(UUID, TEXT);

CREATE OR REPLACE FUNCTION handle_referral_signup(
  p_referred_id UUID,
  p_referral_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_profile RECORD;
  v_referral_id UUID;
  v_result JSON;
  v_reward_points INTEGER := 0;
  v_settings RECORD;
BEGIN
  -- Log function call
  RAISE LOG 'handle_referral_signup called: referred_id=%, code=%', p_referred_id, p_referral_code;
  
  -- Validasi input
  IF p_referred_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID is required');
  END IF;
  
  IF p_referral_code IS NULL OR trim(p_referral_code) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Referral code is required');
  END IF;
  
  -- Cari referrer berdasarkan kode referral
  SELECT * INTO v_referrer_profile
  FROM profiles
  WHERE referral_code = trim(p_referral_code)
  AND id != p_referred_id; -- Prevent self-referral
  
  IF NOT FOUND THEN
    RAISE LOG 'Invalid referral code: %', p_referral_code;
    RETURN json_build_object('success', false, 'error', 'Kode referral tidak valid');
  END IF;
  
  RAISE LOG 'Found referrer: % (ID: %)', v_referrer_profile.full_name, v_referrer_profile.id;
  
  -- Cek apakah user sudah pernah direferral
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RAISE LOG 'User already referred: %', p_referred_id;
    RETURN json_build_object('success', false, 'error', 'User sudah pernah menggunakan kode referral');
  END IF;
  
  -- Buat record referral baru
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code_used,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_referrer_profile.id,
    p_referred_id,
    trim(p_referral_code),
    'active',
    now(),
    now()
  ) RETURNING id INTO v_referral_id;
  
  RAISE LOG 'Created referral record: %', v_referral_id;
  
  -- Ambil pengaturan referral
  BEGIN
    SELECT * INTO v_settings
    FROM referral_settings 
    WHERE active = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Set reward points berdasarkan reward_value dari settings
    IF v_settings.reward_type = 'points' AND v_settings.reward_value IS NOT NULL THEN
      v_reward_points := CAST(v_settings.reward_value AS INTEGER);
    ELSE
      v_reward_points := 100; -- Default fallback
    END IF;
    
    RAISE LOG 'Reward points: %', v_reward_points;
    
    -- Update poin untuk yang direferral (referee)
    UPDATE profiles 
    SET referral_points = COALESCE(referral_points, 0) + v_reward_points,
        updated_at = now()
    WHERE id = p_referred_id;
    RAISE LOG 'Added % points to referee', v_reward_points;
    
    -- Update poin untuk referrer (tanpa counter karena kolom tidak ada)
    UPDATE profiles 
    SET referral_points = COALESCE(referral_points, 0) + v_reward_points,
        updated_at = now()
    WHERE id = v_referrer_profile.id;
    RAISE LOG 'Added % points to referrer', v_reward_points;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error updating points: %', SQLERRM;
  END;
  
  -- Return success response
  v_result := json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_profile.id,
    'referrer_name', v_referrer_profile.full_name,
    'reward_points', v_reward_points,
    'reward_type', COALESCE(v_settings.reward_type, 'points')
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

-- 2. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO anon;

-- 3. TEST FUNCTION UPDATED
SELECT test_referral_migration();