-- ================================================================
-- STATUS FINAL SISTEM REFERRAL - SIAP DEPLOYMENT
-- ================================================================
-- Tanggal: 4 Oktober 2025
-- Status: ✅ READY TO GO!

-- KONFIRMASI DATA YANG SUDAH DICEK:
-- =================================

-- ✅ TABEL REFERRALS - Struktur Complete:
-- - id, referrer_id, referred_id, referral_code
-- - reward_points, created_at, updated_at, status

-- ✅ REFERRAL SETTINGS - Active & Ready:
-- - reward_value: 100 points
-- - reward_type: points  
-- - active: true
-- - min_purchase_amount: 200,000

-- ✅ FILES READY:
-- - PERBAIKAN_REFERRAL_FINAL.sql (parameter fixed)
-- - src/pages/Signup.tsx (TypeScript fixed)
-- - TEST_MANUAL_REFERRAL.sql (testing guide)

-- DEPLOYMENT STEPS:
-- =================

-- STEP 1: Jalankan PERBAIKAN_REFERRAL_FINAL.sql
-- Akan menghasilkan output seperti:
-- - "Added referral_points column" atau "Renamed reward_points to referral_points"  
-- - "Added referrals_count column"
-- - Function handle_referral_signup created
-- - Test result: {"status": "READY", "function_exists": true, ...}

-- STEP 2: Verifikasi dengan query ini:
SELECT 
  'Migration Success' as status,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('referral_points', 'referrals_count')) as required_columns,
  (SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_referral_signup')) as function_exists,
  (SELECT COUNT(*) FROM referral_settings WHERE active = true) as active_settings;

-- Expected Result:
-- status: "Migration Success"
-- required_columns: 2
-- function_exists: true  
-- active_settings: 1

-- STEP 3: Test Manual Referral
-- 1. Ambil referral code:
SELECT referral_code, id, full_name 
FROM profiles 
WHERE referral_code IS NOT NULL
LIMIT 1;

-- 2. Test dengan user baru (ganti UUID):
-- SELECT handle_referral_signup(
--   'NEW_USER_UUID'::UUID,
--   'REFERRAL_CODE_FROM_STEP1'
-- );

-- EXPECTED SUCCESS RESPONSE:
-- {
--   "success": true,
--   "referral_id": "uuid",
--   "referrer_id": "uuid", 
--   "referrer_name": "name",
--   "reward_points": 100,
--   "message": "Referral berhasil diproses!"
-- }

-- FRONTEND TESTING:
-- ================
-- 1. Buka signup page dengan: /signup?ref=REFERRAL_CODE
-- 2. Signup user baru
-- 3. Check browser console untuk logs referral
-- 4. Verify toast notification: "Selamat! Anda mendapat 100 poin bonus dari referral!"
-- 5. Check database: referral record + updated points

-- TROUBLESHOOTING:
-- ===============
-- Jika ada error, cek:
-- ❌ "column referral_points does not exist" → Jalankan ulang migration
-- ❌ "function handle_referral_signup not found" → Check GRANT permissions  
-- ❌ "Kode referral tidak valid" → Pastikan referral code benar
-- ❌ "User sudah pernah menggunakan kode referral" → Normal, expected behavior
-- ❌ TypeScript error → File Signup.tsx sudah diperbaiki

-- MONITORING QUERIES:
-- ==================
-- Total referrals hari ini:
SELECT COUNT(*) as today_referrals 
FROM referrals 
WHERE DATE(created_at) = CURRENT_DATE;

-- Top referrers:
SELECT 
  p.full_name,
  p.referrals_count,
  p.referral_points
FROM profiles p
WHERE p.referrals_count > 0
ORDER BY p.referrals_count DESC
LIMIT 10;

-- Recent referral activity:
SELECT 
  r.created_at,
  r.referral_code,
  r.reward_points,
  referrer.full_name as referrer,
  referee.full_name as referee
FROM referrals r
LEFT JOIN profiles referrer ON r.referrer_id = referrer.id
LEFT JOIN profiles referee ON r.referred_id = referee.id  
ORDER BY r.created_at DESC
LIMIT 10;

-- STATUS: 🚀 SYSTEM READY FOR PRODUCTION! 🚀