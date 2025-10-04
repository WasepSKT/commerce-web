-- ================================================================
-- PERBAIKAN FINAL SISTEM REFERRAL - Fix Kolom dan Function
-- ================================================================
-- Tanggal: 4 Oktober 2025
-- Masalah: Inkonsistensi nama kolom reward_points vs referral_points
--          dan kolom referrals_count yang tidak ada

-- 1. CEK KOLOM YANG ADA DI TABEL PROFILES
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%points%' OR column_name LIKE '%referral%'
ORDER BY column_name;

-- 2. TAMBAH KOLOM YANG HILANG (JIKA BELUM ADA)
-- Menambahkan kolom referral_points jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='referral_points'
  ) THEN
    -- Jika referral_points belum ada, tapi ada reward_points, rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='profiles' AND column_name='reward_points'
    ) THEN
      ALTER TABLE public.profiles RENAME COLUMN reward_points TO referral_points;
      RAISE NOTICE 'Renamed reward_points to referral_points';
    ELSE
      -- Jika tidak ada keduanya, buat baru
      ALTER TABLE public.profiles ADD COLUMN referral_points INTEGER DEFAULT 0;
      RAISE NOTICE 'Added referral_points column';
    END IF;
  END IF;
END$$;

-- Menambahkan kolom referrals_count jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='referrals_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referrals_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added referrals_count column';
  END IF;
END$$;

-- 3. DROP FUNCTION LAMA DAN BUAT ULANG DENGAN BENAR
DROP FUNCTION IF EXISTS handle_referral_signup(UUID, TEXT);
DROP FUNCTION IF EXISTS handle_referral_signup(new_user_id UUID, referral_code_input TEXT);

CREATE OR REPLACE FUNCTION handle_referral_signup(
  new_user_id UUID,
  referral_code_input TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_profile RECORD;
  v_referral_id UUID;
  v_result JSON;
  v_reward_points INTEGER := 100; -- Default points
  v_settings RECORD;
BEGIN
  -- Log function call for debugging
  RAISE NOTICE 'handle_referral_signup called: referred_id=%, code=%', new_user_id, referral_code_input;
  
  -- Validasi input
  IF new_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID is required');
  END IF;
  
  IF referral_code_input IS NULL OR trim(referral_code_input) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Referral code is required');
  END IF;
  
  -- Cari referrer berdasarkan kode referral
  SELECT * INTO v_referrer_profile
  FROM profiles
  WHERE referral_code = trim(referral_code_input)
  AND id != new_user_id; -- Prevent self-referral
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Invalid referral code: %', referral_code_input;
    RETURN json_build_object('success', false, 'error', 'Kode referral tidak valid');
  END IF;
  
  RAISE NOTICE 'Found referrer: % (ID: %)', v_referrer_profile.full_name, v_referrer_profile.id;
  
  -- Cek apakah user sudah pernah direferral
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = new_user_id) THEN
    RAISE NOTICE 'User already referred: %', new_user_id;
    RETURN json_build_object('success', false, 'error', 'User sudah pernah menggunakan kode referral');
  END IF;
  
  -- Ambil pengaturan referral terlebih dahulu
  BEGIN
    SELECT * INTO v_settings
    FROM referral_settings 
    WHERE active = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF FOUND AND v_settings.reward_value IS NOT NULL THEN
      v_reward_points := COALESCE(CAST(v_settings.reward_value AS INTEGER), 100);
    END IF;
    
    RAISE NOTICE 'Using reward points: %', v_reward_points;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error getting settings, using default: %', SQLERRM;
    v_reward_points := 100; -- fallback
  END;
  
  -- Buat record referral baru (sesuai struktur tabel yang ada)
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    reward_points,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_referrer_profile.id,
    new_user_id,
    trim(referral_code_input),
    v_reward_points,
    'active',
    now(),
    now()
  ) RETURNING id INTO v_referral_id;
  
  RAISE NOTICE 'Created referral record: %', v_referral_id;
  
  -- Update poin untuk yang direferral (referee)
  BEGIN
    UPDATE profiles 
    SET referral_points = COALESCE(referral_points, 0) + v_reward_points,
        updated_at = now()
    WHERE id = new_user_id;
    
    IF NOT FOUND THEN
      RAISE NOTICE 'Failed to update referee points - user not found';
    ELSE
      RAISE NOTICE 'Added % points to referee (ID: %)', v_reward_points, new_user_id;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating referee points: %', SQLERRM;
  END;
  
  -- Update poin dan counter untuk referrer
  BEGIN
    UPDATE profiles 
    SET referral_points = COALESCE(referral_points, 0) + v_reward_points,
        referrals_count = COALESCE(referrals_count, 0) + 1,
        updated_at = now()
    WHERE id = v_referrer_profile.id;
    
    IF NOT FOUND THEN
      RAISE NOTICE 'Failed to update referrer points - user not found';
    ELSE
      RAISE NOTICE 'Added % points to referrer (ID: %), count updated', v_reward_points, v_referrer_profile.id;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating referrer points: %', SQLERRM;
  END;
  
  -- Return success response
  v_result := json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_profile.id,
    'referrer_name', v_referrer_profile.full_name,
    'reward_points', v_reward_points,
    'message', 'Referral berhasil diproses!'
  );
  
  RAISE NOTICE 'Referral success: %', v_result;
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Unexpected error in handle_referral_signup: %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', 'Terjadi kesalahan sistem: ' || SQLERRM
  );
END;
$$;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO anon;

-- 5. FUNCTION UNTUK TEST DAN DEBUG
CREATE OR REPLACE FUNCTION test_referral_system()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_function_exists BOOLEAN;
  v_columns_info JSON;
  v_settings_count INTEGER;
  v_referral_codes_count INTEGER;
  v_has_referral_points BOOLEAN;
BEGIN
  -- Check function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_referral_signup'
  ) INTO v_function_exists;
  
  -- Check column structure
  SELECT json_object_agg(column_name, data_type) INTO v_columns_info
  FROM information_schema.columns 
  WHERE table_name = 'profiles' 
  AND column_name IN ('referral_points', 'referrals_count', 'referral_code');
  
  -- Check if referral_points column exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referral_points'
  ) INTO v_has_referral_points;
  
  -- Check settings
  SELECT COUNT(*) INTO v_settings_count
  FROM referral_settings WHERE active = true;
  
  -- Check referral codes
  SELECT COUNT(*) INTO v_referral_codes_count
  FROM profiles WHERE referral_code IS NOT NULL;
  
  RETURN json_build_object(
    'success', true,
    'function_exists', v_function_exists,
    'columns_info', v_columns_info,
    'active_settings_count', v_settings_count,
    'users_with_referral_codes', v_referral_codes_count,
    'status', CASE 
      WHEN v_function_exists AND v_has_referral_points THEN 'READY'
      ELSE 'INCOMPLETE'
    END
  );
END;
$$;

-- 6. JALANKAN TEST
SELECT test_referral_system();

-- 7. SHOW CURRENT PROFILES STRUCTURE
SELECT 
  id,
  full_name,
  referral_code,
  referral_points,
  referrals_count,
  created_at
FROM profiles 
WHERE referral_code IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. SHOW CURRENT REFERRAL SETTINGS
SELECT * FROM referral_settings WHERE active = true;

-- ================================================================
-- MANUAL TEST SETELAH MIGRATION
-- ================================================================
-- Setelah menjalankan migration di atas, test manual dengan:
-- 
-- 1. Ambil referral code dari user yang ada:
-- SELECT referral_code FROM profiles WHERE referral_code IS NOT NULL LIMIT 1;
--
-- 2. Test function dengan UUID dummy:
-- SELECT handle_referral_signup(
--   'REPLACE_WITH_ACTUAL_USER_UUID'::UUID,
--   'REPLACE_WITH_ACTUAL_REFERRAL_CODE'
-- );
--
-- 3. Cek hasil:
-- SELECT * FROM referrals ORDER BY created_at DESC LIMIT 1;
-- SELECT id, referral_points, referrals_count FROM profiles 
-- WHERE referral_code IS NOT NULL OR referral_points > 0;