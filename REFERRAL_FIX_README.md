# PERBAIKAN SISTEM REFERRAL

## Masalah yang Ditemukan

1. **Inkonsistensi Kolom Database**:

   - Migration awal membuat kolom `reward_points`
   - Kode frontend menggunakan `referral_points`
   - Function database menggunakan `referrals_count` yang tidak ada

2. **Function RPC Tidak Berfungsi**:

   - Parameter tidak sesuai dengan yang diharapkan
   - Error handling kurang spesifik

3. **Frontend Error Handling**:
   - Type casting yang salah untuk RPC call
   - Response parsing tidak konsisten

## Langkah Perbaikan

### 1. Database Migration

Jalankan file `PERBAIKAN_REFERRAL_FINAL.sql` di SQL Editor Supabase:

```sql
-- File ini akan:
-- 1. Memperbaiki nama kolom (reward_points → referral_points)
-- 2. Menambahkan kolom referrals_count jika belum ada
-- 3. Membuat ulang function handle_referral_signup yang benar
-- 4. Menambahkan test function untuk verifikasi
```

### 2. Frontend Fix

File `src/pages/Signup.tsx` telah diperbaiki:

- ✅ Menghapus type casting yang salah pada RPC call
- ✅ Memperbaiki error handling untuk response
- ✅ Memperbaiki parsing `data.error` vs `data.message`

### 3. Verifikasi Setelah Perbaikan

#### A. Cek Structure Database

```sql
-- Jalankan di SQL Editor
SELECT test_referral_system();
```

#### B. Test Manual Function

```sql
-- 1. Ambil referral code dari user yang ada
SELECT referral_code FROM profiles WHERE referral_code IS NOT NULL LIMIT 1;

-- 2. Test function (ganti UUID dengan yang sebenarnya)
SELECT handle_referral_signup(
  'USER_ID_YANG_SIGNUP'::UUID,
  'REFERRAL_CODE_YANG_ADA'
);
```

#### C. Test Frontend

1. Buka halaman signup dengan referral code: `/signup?ref=KODE_REFERRAL`
2. Daftar akun baru (email atau Google)
3. Perhatikan console browser untuk log debug
4. Cek apakah muncul toast notification berhasil

### 4. Monitoring & Debug

#### Console Logs yang Diharapkan:

```
=== REFERRAL DEBUG START ===
🚀 Calling supabase.rpc handle_referral_signup...
Parameters: { p_referred_id: "uuid", p_referral_code: "code" }
📊 RPC Response:
- data: { success: true, reward_points: 100, ... }
✅ Referral Success!
=== REFERRAL DEBUG END ===
```

#### Error Logs yang Mungkin:

- `Function handle_referral_signup tidak ditemukan` → Function belum di-deploy
- `Kode referral tidak valid` → Code tidak ada di database
- `User sudah pernah menggunakan kode referral` → User sudah pernah referral

### 5. File-file yang Diubah

1. **BARU**: `PERBAIKAN_REFERRAL_FINAL.sql` - Migration perbaikan
2. **DIPERBARUI**: `src/pages/Signup.tsx` - Fix RPC call dan error handling

### 6. Testing Checklist

- [ ] Migration berhasil dijalankan tanpa error
- [ ] Function `handle_referral_signup` tersedia di database
- [ ] Function `test_referral_system` mengembalikan status "READY"
- [ ] Test manual function berhasil
- [ ] Frontend signup dengan referral code berhasil
- [ ] Points bertambah di tabel profiles
- [ ] Record baru masuk ke tabel referrals

### 7. Troubleshooting

#### Jika Function Tidak Ditemukan:

```sql
-- Cek apakah function ada
SELECT proname FROM pg_proc WHERE proname = 'handle_referral_signup';

-- Jika tidak ada, re-run migration PERBAIKAN_REFERRAL_FINAL.sql
```

#### Jika Column Error:

```sql
-- Cek struktur kolom profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%referral%' OR column_name LIKE '%points%';
```

#### Jika Permission Error:

```sql
-- Grant ulang permissions
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_signup(UUID, TEXT) TO anon;
```

## Hasil yang Diharapkan

Setelah perbaikan ini:

1. ✅ User bisa signup dengan referral code
2. ✅ Points otomatis bertambah untuk referrer dan referee
3. ✅ Record referral tersimpan dengan benar
4. ✅ Error handling lebih baik di frontend
5. ✅ Debug logs memudahkan troubleshooting

## Notes

- Function menggunakan `RAISE NOTICE` untuk debugging (akan muncul di logs Supabase)
- Default reward adalah 100 points jika tidak ada setting
- System mencegah self-referral dan duplicate referral
- RLS policies tetap aktif untuk security
