# GitHub Secrets Setup untuk Maintenance Mode

## Panduan Setup GitHub Secrets

Karena deployment menggunakan **cPanel + GitHub Actions**, environment variables harus diset di **GitHub Repository Secrets**.

### Akses GitHub Secrets

1. Buka repository: `https://github.com/Fakihibrohim-SKT/regal-purrfect-shop`
2. Klik **Settings** tab
3. Di sidebar kiri, klik **Secrets and variables** → **Actions**
4. Klik tombol **New repository secret**

---

## Required Secrets untuk Maintenance Mode

### 1. Marketplace URLs (Shared untuk semua environment)

Tambahkan secrets berikut (digunakan oleh dev, staging, dan production):

```
Name: VITE_SHOPEE_URL
Value: https://shopee.co.id/regalpurrfectshop
```

```
Name: VITE_TIKTOK_SHOP_URL
Value: https://www.tiktok.com/@regalpurrfectshop
```

### 2. Development Environment (branch: dev)

```
Name: VITE_MAINTENANCE_AUTH_DEV
Value: false
```

```
Name: VITE_MAINTENANCE_PRODUCT_DEV
Value: false
```

### 3. Staging Environment (branch: stg/staging)

```
Name: VITE_MAINTENANCE_AUTH_STG
Value: false
```

```
Name: VITE_MAINTENANCE_PRODUCT_STG
Value: false
```

### 4. Production Environment (branch: main)

```
Name: VITE_MAINTENANCE_AUTH_PROD
Value: false
```

```
Name: VITE_MAINTENANCE_PRODUCT_PROD
Value: false
```

---

## Cara Menambahkan Secret

1. Klik **New repository secret**
2. Masukkan **Name** (contoh: `VITE_MAINTENANCE_AUTH_DEV`)
3. Masukkan **Value** (contoh: `false` atau `true`)
4. Klik **Add secret**
5. Ulangi untuk semua secrets yang diperlukan

---

## Cara Mengaktifkan Maintenance Mode

### Untuk Development (branch: dev)

1. Buka GitHub Secrets
2. Edit secret `VITE_MAINTENANCE_AUTH_DEV`
3. Ubah value menjadi `true`
4. Save
5. Push commit ke branch `dev` atau manual trigger workflow
6. GitHub Actions akan build dengan maintenance mode aktif

### Untuk Staging (branch: stg)

1. Edit secret `VITE_MAINTENANCE_AUTH_STG` → ubah ke `true`
2. Push ke branch `stg`

### Untuk Production (branch: main)

1. Edit secret `VITE_MAINTENANCE_AUTH_PROD` → ubah ke `true`
2. Push ke branch `main`

---

## Testing Maintenance Mode

### Skenario 1: Testing di Development

```bash
# Di GitHub Secrets, set:
VITE_MAINTENANCE_AUTH_DEV=true
VITE_MAINTENANCE_PRODUCT_DEV=true

# Push ke dev branch
git checkout dev
git add .
git commit -m "test maintenance mode"
git push origin dev

# GitHub Actions akan deploy dengan maintenance aktif
# Cek di URL development: https://dev.regalpaw.id
```

### Skenario 2: Production Tetap Normal, Dev Maintenance

```bash
# GitHub Secrets:
VITE_MAINTENANCE_AUTH_DEV=true      # Dev dalam maintenance
VITE_MAINTENANCE_AUTH_PROD=false    # Production tetap normal

# Push ke masing-masing branch
git push origin dev    # Deploy dengan maintenance
git push origin main   # Deploy tanpa maintenance
```

---

## Verification Checklist

Setelah setup secrets, verifikasi:

- [ ] `VITE_SHOPEE_URL` sudah di-set (shared untuk semua env)
- [ ] `VITE_TIKTOK_SHOP_URL` sudah di-set (shared untuk semua env)
- [ ] `VITE_MAINTENANCE_AUTH_DEV` sudah di-set
- [ ] `VITE_MAINTENANCE_PRODUCT_DEV` sudah di-set
- [ ] `VITE_MAINTENANCE_AUTH_STG` sudah di-set
- [ ] `VITE_MAINTENANCE_PRODUCT_STG` sudah di-set
- [ ] `VITE_MAINTENANCE_AUTH_PROD` sudah di-set
- [ ] `VITE_MAINTENANCE_PRODUCT_PROD` sudah di-set

---

## Troubleshooting

### Build gagal setelah push

**Kemungkinan penyebab:**
- Secret name salah (typo)
- Secret value kosong
- Branch name tidak sesuai (dev/stg/main)

**Solusi:**
1. Cek GitHub Actions logs: https://github.com/Fakihibrohim-SKT/regal-purrfect-shop/actions
2. Verifikasi semua secret names sesuai dokumentasi
3. Pastikan values tidak kosong (minimal `false`)

### Maintenance mode tidak aktif meski secret di-set `true`

**Penyebab:**
- Build cache dari deployment sebelumnya
- Secret baru ditambah setelah build

**Solusi:**
1. Trigger rebuild dengan push dummy commit:
   ```bash
   git commit --allow-empty -m "rebuild to apply maintenance mode"
   git push
   ```
2. Wait for GitHub Actions to complete
3. Hard refresh browser (Ctrl+Shift+R)

### Marketplace URLs tidak bekerja

**Penyebab:**
- `VITE_SHOPEE_URL` atau `VITE_TIKTOK_SHOP_URL` belum di-set

**Solusi:**
1. Tambahkan kedua secrets tersebut
2. Rebuild dengan push commit
3. Verifikasi di browser console:
   ```javascript
   console.log(window.location.href);
   // Saat klik marketplace button, harus redirect ke Shopee/TikTok URL
   ```

---

## Quick Reference

### Edit Secret

1. Settings → Secrets and variables → Actions
2. Klik secret yang mau diedit
3. Klik **Update secret**
4. Ubah value
5. Click **Update secret**

### Delete Secret (jika perlu)

1. Settings → Secrets and variables → Actions
2. Klik secret yang mau dihapus
3. Klik **Remove secret**
4. Confirm deletion

---

## Default Values (Recommended)

Untuk memulai, gunakan setting ini:

```
# Development - Boleh testing maintenance
VITE_MAINTENANCE_AUTH_DEV=false
VITE_MAINTENANCE_PRODUCT_DEV=false

# Staging - Mirror production
VITE_MAINTENANCE_AUTH_STG=false
VITE_MAINTENANCE_PRODUCT_STG=false

# Production - Always false (unless emergency)
VITE_MAINTENANCE_AUTH_PROD=false
VITE_MAINTENANCE_PRODUCT_PROD=false

# Marketplace (shared)
VITE_SHOPEE_URL=https://shopee.co.id/regalpurrfectshop
VITE_TIKTOK_SHOP_URL=https://www.tiktok.com/@regalpurrfectshop
```

---

## Emergency Maintenance

Jika perlu maintenance mendadak di production:

1. Edit `VITE_MAINTENANCE_AUTH_PROD` → `true`
2. Edit `VITE_MAINTENANCE_PRODUCT_PROD` → `true`
3. Push hotfix commit ke `main`:
   ```bash
   git checkout main
   git commit --allow-empty -m "enable emergency maintenance"
   git push origin main
   ```
4. Wait ~2-5 menit untuk deployment selesai
5. Verifikasi maintenance aktif di production
6. Setelah selesai maintenance, ubah kembali ke `false` dan push
