# 🚀 PANDUAN MIGRASI REFERRAL SYSTEM

## 📋 File yang Digunakan

### ✅ UTAMA (Jalankan ini):

- **`JALANKAN_DI_SQL_EDITOR.sql`** - Script lengkap untuk Supabase SQL Editor

### ✅ BACKUP (Jangan dihapus):

- **`supabase/migrations/20251004000000_fix_referral_system.sql`** - File migrasi resmi

## 🎯 Cara Menjalankan

1. **Buka Supabase Dashboard** → SQL Editor
2. **Copy semua isi** file `JALANKAN_DI_SQL_EDITOR.sql`
3. **Paste ke SQL Editor**
4. **Klik "Run"**

## ✅ Output yang Diharapkan

```json
{
  "success": true,
  "function_exists": true,
  "policies_count": 2,
  "status": "READY"
}
```

## 🔧 Yang Akan Dibuat/Diperbaiki

- ✅ Function `handle_referral_signup()` dengan kolom yang benar
- ✅ RLS Policies untuk tabel `referrals`
- ✅ Database indexes untuk performance
- ✅ Test function untuk verifikasi

## 🧪 Testing Setelah Migrasi

1. Buka `/signup?ref=KODE_REFERRAL_VALID`
2. Sign up dengan email atau Google
3. Check console browser untuk logs
4. Verify data masuk ke tabel `referrals`

## ⚠️ Semua Error Sudah Diperbaiki ✅

- **Column `is_active` not found** → Fixed menjadi `active`
- **Parameter mismatch** → Fixed menjadi `p_referred_id`, `p_referral_code`
- **RLS policy conflicts** → Fixed dengan logic yang benar
- **Wrong referral_settings columns** → Fixed menggunakan `reward_value` sesuai struktur tabel sebenarnya

## 📊 Struktur Referral Settings (Sudah Sesuai)

Berdasarkan data yang ada:

```json
{
  "name": "default",
  "reward_type": "points",
  "reward_value": "100",
  "active": true,
  "min_purchase_amount": "200000"
}
```

Function akan memberikan **100 poin** untuk referrer dan referee sesuai `reward_value`.

## 📁 File yang Dihapus

File-file berikut sudah tidak diperlukan:

- ~~`COPY_TO_SQL_EDITOR.sql`~~ (versi lama dengan error)
- ~~`referral_system_setup.sql`~~ (versi lama)
- ~~`run_migration.ps1`~~ (script PowerShell tidak berhasil)

---

**Hanya gunakan file `JALANKAN_DI_SQL_EDITOR.sql` untuk migrasi!** 🎯
