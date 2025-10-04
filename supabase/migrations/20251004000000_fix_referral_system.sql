-- ================================================================
-- MIGRASI PERBAIKAN REFERRAL SYSTEM
-- ================================================================
-- Tanggal: 4 Oktober 2025
-- Deskripsi: Memperbaiki sistem referral dengan kolom yang benar dan RLS policy

-- 1. BACKUP DATA EXISTING (opsional - untuk safety)
-- CREATE TABLE IF NOT EXISTS referrals_backup AS SELECT * FROM referrals;

-- 2. DROP FUNCTION LAMA JIKA ADA
DROP FUNCTION IF EXISTS handle_referral_signup(UUID, TEXT);

-- 3. BUAT FUNCTION BARU DENGAN KOLOM YANG BENAR
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
  v_signup_points INTEGER := 0;
  v_referrer_points INTEGER := 0;
BEGIN
  -- Log function call
  RAISE LOG 'handle_referral_signup called: referred_id=%, code=%', p_referred_id, p_referral_code;
  
  -- Validasi input
  IF p_referred_id IS NULL THEN
    RAISE LOG 'Error: referred_id is NULL';
    RETURN json_build_object('success', false, 'error', 'User ID is required');
  END IF;
  
  IF p_referral_code IS NULL OR trim(p_referral_code) = '' THEN
    RAISE LOG 'Error: referral_code is empty';
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
  
  -- Ambil pengaturan poin referral (sesuai struktur tabel yang ada)
  BEGIN
    SELECT 
      COALESCE(CAST(reward_value AS INTEGER), 0),
      COALESCE(CAST(reward_value AS INTEGER), 0)
    INTO v_signup_points, v_referrer_points
    FROM referral_settings 
    WHERE active = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE LOG 'Points: signup=%, referrer=%', v_signup_points, v_referrer_points;
    
    -- Update poin untuk yang direferral (referee)
    IF v_signup_points > 0 THEN
      UPDATE profiles 
      SET referral_points = COALESCE(referral_points, 0) + v_signup_points,
          updated_at = now()
      WHERE id = p_referred_id;
      RAISE LOG 'Added % points to referee', v_signup_points;
    END IF;
    
    -- Update poin dan counter untuk referrer
    UPDATE profiles 
    SET referral_points = COALESCE(referral_points, 0) + v_referrer_points,
        referrals_count = COALESCE(referrals_count, 0) + 1,
        updated_at = now()
    WHERE id = v_referrer_profile.id;
    RAISE LOG 'Added % points to referrer, count updated', v_referrer_points;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error updating points: %', SQLERRM;
    -- Jangan gagalkan proses jika update poin error
  END;
  
  -- Return success response
  v_result := json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_profile.id,
    'referrer_name', v_referrer_profile.full_name,
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

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO anon;

-- 5. PERBAIKI RLS POLICIES (jika diperlukan)
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert referrals for themselves" ON referrals;
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;

-- Recreate with correct logic
CREATE POLICY "Users can insert referrals for themselves" ON referrals
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = referred_id
    )
  );

CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT TO public
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = referrer_id
    ) OR 
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = referred_id
    )
  );

-- 6. BUAT INDEXES UNTUK PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_settings_active ON referral_settings(active) WHERE active = true;

-- 7. FUNCTION UNTUK TEST MIGRASI
CREATE OR REPLACE FUNCTION test_referral_migration()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_function_exists BOOLEAN;
  v_policies_count INTEGER;
  v_indexes_count INTEGER;
BEGIN
  -- Check function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_referral_signup'
  ) INTO v_function_exists;
  
  -- Check policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies 
  WHERE tablename = 'referrals';
  
  -- Check indexes
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes 
  WHERE tablename IN ('referrals', 'profiles')
  AND indexname LIKE 'idx_%';
  
  RETURN json_build_object(
    'success', true,
    'function_exists', v_function_exists,
    'policies_count', v_policies_count,
    'indexes_count', v_indexes_count,
    'migration_status', CASE 
      WHEN v_function_exists AND v_policies_count >= 2 THEN 'COMPLETED'
      ELSE 'INCOMPLETE'
    END
  );
END;
$$;

-- 8. JALANKAN TEST
SELECT test_referral_migration();

-- ================================================================
-- VERIFICATION QUERIES - Jalankan untuk memverifikasi
-- ================================================================

-- Cek function ada
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_referral_signup';

-- Cek policies RLS
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'referrals';

-- Cek indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('referrals', 'profiles')
ORDER BY tablename, indexname;

-- Cek data referral settings
SELECT * FROM referral_settings WHERE active = true;

-- Cek profiles dengan referral code
SELECT id, full_name, referral_code, referrals_count, referral_points
FROM profiles 
WHERE referral_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;