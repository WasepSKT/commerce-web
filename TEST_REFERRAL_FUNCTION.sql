-- ================================================================
-- TEST REFERRAL FUNCTION - Jalankan di SQL Editor untuk test
-- ================================================================

-- 1. Cek apakah function sudah ada dan bisa diakses
SELECT test_referral_migration();

-- 2. Cek profiles yang ada dengan referral code
SELECT id, full_name, referral_code, referral_points
FROM profiles 
WHERE referral_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 2b. Cek struktur kolom tabel profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%referral%'
ORDER BY column_name;

-- 3. Test function dengan data dummy (ganti UUID dengan yang sebenarnya)
-- CONTOH - Ganti dengan UUID profile yang benar:
-- SELECT handle_referral_signup(
--   'UUID_PROFILE_BARU'::UUID,
--   'KODE_REFERRAL_YANG_ADA'
-- );

-- 4. Cek data referrals yang sudah ada
SELECT 
  r.id,
  r.referral_code_used,
  r.status,
  r.created_at,
  p1.full_name as referrer_name,
  p2.full_name as referee_name
FROM referrals r
LEFT JOIN profiles p1 ON r.referrer_id = p1.id
LEFT JOIN profiles p2 ON r.referred_id = p2.id
ORDER BY r.created_at DESC
LIMIT 5;

-- 5. Cek current referral settings
SELECT * FROM referral_settings WHERE active = true;