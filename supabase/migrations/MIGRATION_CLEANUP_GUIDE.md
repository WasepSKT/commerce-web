# Migration Cleanup Guide

**Tanggal**: 2025-11-02  
**Status**: ✅ Migration sudah dikonsolidasi

---

## 🎯 Tujuan

File ini membantu memahami migration mana yang sudah dikonsolidasi dan bisa dihapus untuk menghindari duplikasi dan konflik.

---

## ✅ Migration Baru (Gunakan Ini)

### **`20251102_consolidate_fixes.sql`** - **Gunakan file ini**

File ini menggabungkan semua perbaikan terbaru dan **IDEMPOTENT** (aman dijalankan berkali-kali):

1. ✅ Fix hero slider items policy bug
2. ✅ Add WITH CHECK clauses ke 8 policies
3. ✅ Consolidate referral trigger function (final version)
4. ✅ Ensure user_role enum values exist

**Status**: ✅ **INI YANG HARUS DIGUNAKAN**

---

## 🗑️ Migration Lama Yang Sudah Dikonsolidasi

Migration berikut **SUDAH DIGABUNG** ke `20251102_consolidate_fixes.sql` dan **BOLEH DIHAPUS**:

### **1. Hero Slider Items Policy Fix**

- ❌ `20251102_fix_hero_slider_items_policy.sql` → **Sudah di consolidate**
- ❌ `20251102_add_with_check_to_policies.sql` → **Sudah di consolidate**

**Action**: Hapus kedua file ini, gunakan `20251102_consolidate_fixes.sql` saja.

---

### **2. Referral Trigger Functions (5 files → 1 konsolidasi)**

Migration berikut **SEMUA** membuat/modify `trigger_handle_referral_purchase()` dan saling konflik:

- ❌ `20251007_trigger_referral_purchase.sql`
- ❌ `20251007_trigger_handle_referral_purchase.sql`
- ❌ `20251007_update_referral_trigger_function_include_paid.sql`
- ❌ `20251007_update_referral_trigger_include_paid.sql`
- ❌ `20251007_fix_referral_trigger_status_aliases.sql`

**Masalah**:

- Semua file ini membuat function yang sama dengan versi berbeda
- Versi terakhir yang benar sudah ada di `20251102_consolidate_fixes.sql`

**Action**:

- ✅ **Jika database sudah di production**, JANGAN hapus (untuk tracking history)
- ✅ **Jika database baru**, bisa dihapus atau di-archive ke folder `_archive/`
- ✅ Pastikan jalankan `20251102_consolidate_fixes.sql` untuk mendapatkan versi final

---

### **3. Duplicate Referral Functions**

- ⚠️ `20251004_fix_referral_policies.sql` - Membuat `handle_referral_signup()` dengan parameter `(referral_code_input TEXT, new_user_id UUID)`
- ⚠️ `20251004000000_fix_referral_system.sql` - Membuat `handle_referral_signup()` dengan parameter `(p_referred_id UUID, p_referral_code TEXT)`

**Masalah**:

- Kedua file membuat function dengan nama sama tapi signature berbeda
- Bisa menyebabkan error "function already exists with different parameters"

**Action**:

- ✅ Pilih salah satu yang sesuai dengan aplikasi Anda
- ✅ Hapus atau rename yang tidak digunakan
- ✅ Pastikan semua code menggunakan signature yang sama

**Rekomendasi**: Gunakan `20251004_fix_referral_policies.sql` (lebih lengkap dengan `handle_referral_purchase` juga).

---

## 📋 Checklist Sebelum Menghapus

Sebelum menghapus migration files, pastikan:

- [ ] ✅ Database production sudah menjalankan migration lama
- [ ] ✅ Migration baru (`20251102_consolidate_fixes.sql`) sudah di-test
- [ ] ✅ Tidak ada dependency dari code lain ke migration lama
- [ ] ✅ Sudah backup database
- [ ] ✅ Tim sudah diberi tahu tentang perubahan

---

## 🔄 Workflow untuk Developer Baru

### **Jika clone database baru:**

1. ✅ Jalankan semua migration **SELAIN** yang sudah dikonsolidasi
2. ✅ Jalankan `20251102_consolidate_fixes.sql` di akhir
3. ✅ Verifikasi dengan query di bawah

### **Jika database sudah ada:**

1. ✅ Pastikan semua migration lama sudah dijalankan
2. ✅ Jalankan `20251102_consolidate_fixes.sql` untuk update ke versi terbaru
3. ✅ Migration ini idempotent, aman dijalankan berkali-kali

---

## ✅ Verification Queries

Setelah menjalankan `20251102_consolidate_fixes.sql`, jalankan query ini untuk verifikasi:

```sql
-- 1. Check hero slider items policy (should show user_id, not id)
SELECT tablename, policyname,
  pg_get_expr(polqual, polrelid) as using_clause
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE p.tablename = 'hero_slider_items'
  AND p.policyname = 'Allow admin full access to hero slider items';
-- Should show: profiles.user_id = auth.uid() (NOT profiles.id)

-- 2. Check trigger exists with correct WHEN clause
SELECT
  tgname,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'trg_handle_referral_purchase';
-- Should show: WHEN (NEW.status IN ('paid','completed') ...)

-- 3. Check user_role enum has all values
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
-- Should show: admin, customer, marketing, admin_sales

-- 4. Check policies have WITH CHECK
SELECT tablename, policyname, cmd,
  CASE
    WHEN pg_get_expr(polwithcheck, polrelid) IS NOT NULL THEN '✅ Has WITH CHECK'
    ELSE '❌ Missing WITH CHECK'
  END as with_check_status
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE p.cmd = 'ALL'
  AND p.tablename IN ('fixed_banners', 'hero_slider_items', 'order_items', 'popup_campaigns')
ORDER BY tablename, policyname;
```

---

## 🎯 Kesimpulan

**Untuk database baru:**

- Gunakan `20251102_consolidate_fixes.sql`
- Migration lama bisa dihapus atau di-archive

**Untuk database existing:**

- Jalankan `20251102_consolidate_fixes.sql` untuk update
- Migration lama tetap dipertahankan untuk tracking history

---

**Last Updated**: 2025-11-02
