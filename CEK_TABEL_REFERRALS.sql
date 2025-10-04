-- ================================================================
-- CEK DAN PERBAIKAN TABEL REFERRALS
-- ================================================================
-- Berdasarkan informasi struktur tabel referrals yang ada

-- 1. CEK STRUKTUR TABEL REFERRALS SAAT INI
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'referrals' 
ORDER BY ordinal_position;

-- 2. CEK DATA YANG ADA DI TABEL REFERRALS
SELECT 
  COUNT(*) as total_referrals,
  COUNT(DISTINCT referrer_id) as unique_referrers,
  COUNT(DISTINCT referred_id) as unique_referred,
  MIN(created_at) as earliest_referral,
  MAX(created_at) as latest_referral
FROM referrals;

-- 3. PERBAIKAN KOLOM JIKA DIPERLUKAN
-- Kolom created_at sudah ada, tidak perlu perbaikan
-- DO $$
-- BEGIN
--   -- Cek apakah kolom created_ad ada tapi created_at tidak ada
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_name = 'referrals' AND column_name = 'created_ad'
--   ) AND NOT EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_name = 'referrals' AND column_name = 'created_at'
--   ) THEN
--     ALTER TABLE referrals RENAME COLUMN created_ad TO created_at;
--     RAISE NOTICE 'Renamed created_ad to created_at in referrals table';
--   END IF;
-- END $$;

-- 4. TAMBAH KOLOM YANG MUNGKIN DIPERLUKAN
-- Tambah updated_at jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrals' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE referrals ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Added updated_at column to referrals table';
  END IF;
END $$;

-- Tambah status jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrals' AND column_name = 'status'
  ) THEN
    ALTER TABLE referrals ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE 'Added status column to referrals table';
  END IF;
END $$;

-- 5. CEK STRUKTUR SETELAH PERBAIKAN
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'referrals' 
ORDER BY ordinal_position;

-- 6. SAMPLE DATA UNTUK VERIFIKASI
SELECT 
  id,
  referrer_id,
  referred_id,
  referral_code,
  reward_points,
  created_at as created_time,
  status
FROM referrals 
ORDER BY created_at DESC 
LIMIT 5;