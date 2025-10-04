-- ================================================================
-- TEST MANUAL SISTEM REFERRAL SETELAH MIGRATION
-- ================================================================
-- Jalankan setelah PERBAIKAN_REFERRAL_FINAL.sql berhasil

-- 1. CEK STATUS SISTEM REFERRAL
SELECT test_referral_system();

-- 2. CEK STRUKTUR TABEL PROFILES (pastikan kolom sudah ada)
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('referral_points', 'referrals_count', 'referral_code')
ORDER BY column_name;

-- 3. CEK USER DENGAN REFERRAL CODE (untuk test)
SELECT 
  id,
  full_name,
  email,
  referral_code,
  referral_points,
  referrals_count
FROM profiles 
WHERE referral_code IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 3;

-- 4. CEK REFERRAL SETTINGS AKTIF
SELECT 
  name,
  active,
  reward_type,
  reward_value,
  min_purchase_amount
FROM referral_settings 
WHERE active = true;

-- ================================================================
-- TEST FUNCTION REFERRAL (GANTI UUID DENGAN YANG SEBENARNYA)
-- ================================================================

-- CONTOH TEST (sesuaikan UUID):
-- Ambil referral code dari query #3 di atas
-- Buat user baru atau gunakan user existing yang belum pernah pakai referral

-- TEST FUNCTION:
-- SELECT handle_referral_signup(
--   'UUID_USER_BARU'::UUID,        -- Ganti dengan UUID user yang akan dapat referral  
--   'REFERRAL_CODE_YANG_ADA'       -- Ganti dengan referral code dari query #3
-- );

-- ================================================================
-- VERIFIKASI HASIL TEST
-- ================================================================

-- Cek record referral baru
-- SELECT 
--   r.*,
--   p1.full_name as referrer_name,
--   p2.full_name as referred_name
-- FROM referrals r
-- LEFT JOIN profiles p1 ON r.referrer_id = p1.id  
-- LEFT JOIN profiles p2 ON r.referred_id = p2.id
-- ORDER BY r.created_at DESC
-- LIMIT 1;

-- Cek update poin di profiles
-- SELECT 
--   id,
--   full_name,
--   referral_points,
--   referrals_count,
--   updated_at
-- FROM profiles 
-- WHERE referral_points > 0 OR referrals_count > 0
-- ORDER BY updated_at DESC
-- LIMIT 5;

-- ================================================================
-- EXPECTED RESULTS SETELAH TEST BERHASIL:
-- ================================================================
-- ✅ Function mengembalikan JSON: {"success": true, "reward_points": 100, ...}
-- ✅ Record baru di tabel referrals
-- ✅ referral_points bertambah +100 untuk referrer
-- ✅ referral_points bertambah +100 untuk referee  
-- ✅ referrals_count bertambah +1 untuk referrer
-- ✅ updated_at terupdate untuk kedua user

-- TROUBLESHOOT JIKA ERROR:
-- - Pastikan UUID valid dan user exists
-- - Pastikan referral_code valid dan tidak self-referral
-- - Pastikan user belum pernah pakai referral code
-- - Cek log dengan: SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_referral%';