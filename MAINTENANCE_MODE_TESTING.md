# Panduan Testing Maintenance Mode

## Setup Environment Variables

Edit file `.env`:

```env
# Maintenance Mode Settings
VITE_MAINTENANCE_AUTH=true        # Set true untuk maintenance mode auth (login/signup)
VITE_MAINTENANCE_PRODUCT=true     # Set true untuk maintenance mode produk (redirect ke marketplace)

# Marketplace Links
VITE_SHOPEE_URL=https://shopee.co.id/regalpurrfectshop
VITE_TIKTOK_SHOP_URL=https://www.tiktok.com/@regalpurrfectshop
```

## ⚠️ PENTING: Restart Dev Server

Setelah mengubah file `.env`, **WAJIB restart dev server**:

```powershell
# Stop dev server (Ctrl+C)
# Kemudian start lagi
npm run dev
```

Environment variables di Vite hanya di-load saat dev server start, tidak ter-refresh otomatis!

## Testing Checklist

### 1. Auth Maintenance Mode (VITE_MAINTENANCE_AUTH=true)

- [ ] **Tombol Login di Header Navigation** menampilkan "Coming Soon" modal saat diklik
- [ ] **Tombol Sign Up di Header Navigation** menampilkan "Coming Soon" modal saat diklik
- [ ] **Akses langsung ke `/auth`** otomatis redirect ke home page
- [ ] **Akses langsung ke `/auth/signup`** otomatis redirect ke home page
- [ ] **Ketik URL `/auth` di browser** langsung redirect ke `/` (tidak bisa diakses)
- [ ] **Search/bookmark ke halaman auth** tidak bisa diakses, langsung ke home
- [ ] Modal "Coming Soon" bisa di-close dengan:
  - Klik tombol X di pojok kanan atas
  - Klik area overlay (di luar modal)
  - Tekan ESC key
  - Klik tombol "Mengerti"

### 2. Product Maintenance Mode (VITE_MAINTENANCE_PRODUCT=true)

- [ ] Klik product card menampilkan "Belanja di Marketplace" modal
- [ ] TIDAK redirect ke halaman detail produk
- [ ] Modal marketplace bisa di-close dengan:
  - Klik tombol X di pojok kanan atas
  - Klik area overlay (di luar modal)
  - Tekan ESC key
  - Klik tombol "Batal"
- [ ] Tombol "Belanja di Shopee" membuka tab baru ke Shopee URL
- [ ] Tombol "Belanja di TikTok Shop" membuka tab baru ke TikTok URL
- [ ] Setelah klik marketplace button, modal otomatis close

### 3. Normal Mode (Both set to false)

Edit `.env`:

```env
VITE_MAINTENANCE_AUTH=false
VITE_MAINTENANCE_PRODUCT=false
```

Restart dev server, kemudian test:

- [ ] Login berfungsi normal (tidak ada modal)
- [ ] Signup link redirect ke /auth/signup (bukan modal)
- [ ] Klik product card redirect ke halaman detail produk
- [ ] Tidak ada modal marketplace yang muncul

## Troubleshooting

### Modal tidak bisa di-close

**Solusi**: Pastikan sudah restart dev server setelah update code MarketplaceModal.tsx

### Signup link masih redirect meski VITE_MAINTENANCE_AUTH=true

**Solusi**:

1. Pastikan sudah edit `.env` dengan benar
2. **WAJIB restart dev server** (Ctrl+C lalu `npm run dev` lagi)
3. Hard refresh browser (Ctrl+Shift+R)
4. Check di browser console: `console.log(import.meta.env.VITE_MAINTENANCE_AUTH)`

### Marketplace links tidak bekerja

**Solusi**:

1. Pastikan VITE_SHOPEE_URL dan VITE_TIKTOK_SHOP_URL sudah di set di `.env`
2. Restart dev server
3. Check di browser console: `console.log(import.meta.env.VITE_SHOPEE_URL)`

## Verifikasi di Browser Console

Buka Dev Tools (F12), kemudian ketik di console:

```javascript
// Check environment variables
console.log("Auth Maintenance:", import.meta.env.VITE_MAINTENANCE_AUTH);
console.log("Product Maintenance:", import.meta.env.VITE_MAINTENANCE_PRODUCT);
console.log("Shopee URL:", import.meta.env.VITE_SHOPEE_URL);
console.log("TikTok URL:", import.meta.env.VITE_TIKTOK_SHOP_URL);
```

Harusnya menampilkan values yang sesuai dengan `.env`

## Deployment ke Production

Saat deploy ke production (Vercel/Netlify/dll), jangan lupa set environment variables di dashboard hosting:

```
VITE_MAINTENANCE_AUTH=false
VITE_MAINTENANCE_PRODUCT=false
VITE_SHOPEE_URL=https://shopee.co.id/regalpurrfectshop
VITE_TIKTOK_SHOP_URL=https://www.tiktok.com/@regalpurrfectshop
```

Atau sesuai kebutuhan maintenance mode yang diinginkan.
