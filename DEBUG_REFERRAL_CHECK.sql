-- Debug: Cek referral code yang ada di localStorage
-- Jalankan di SQL Editor untuk debug

-- 1. Cek apakah ada user dengan referral code e0190bd6dcf8
SELECT 
  id,
  full_name,
  email,
  referral_code,
  referral_points,
  created_at
FROM profiles 
WHERE referral_code = 'e0190bd6dcf8';

-- 2. Cek semua referrals yang ada
SELECT 
  r.*,
  referrer.full_name as referrer_name,
  referred.full_name as referred_name
FROM referrals r
LEFT JOIN profiles referrer ON r.referrer_id = referrer.id
LEFT JOIN profiles referred ON r.referred_id = referred.id
ORDER BY r.created_at DESC;

-- 3. Cek profiles terbaru (untuk lihat user yang signup)
SELECT 
  id,
  full_name,
  email,
  referral_code,
  referral_points,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Test manual referral processing
-- Ganti USER_ID_BARU dengan ID user yang signup menggunakan referral
-- SELECT handle_referral_signup('USER_ID_BARU'::UUID, 'e0190bd6dcf8');