# Testing RPC JWT dan Order Verification

## 1. Test Apakah RPC Function Bisa Membaca `request.jwt.claims.sub`

### A. Test dengan SQL Function

Jalankan query berikut di Supabase SQL Editor:

```sql
-- Buat test function
CREATE OR REPLACE FUNCTION test_jwt_claims()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
  claims JSON;
BEGIN
  BEGIN
    uid := current_setting('request.jwt.claims.sub', true)::uuid;
    claims := current_setting('request.jwt.claims', true)::json;
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
    claims := NULL;
  END;

  RETURN json_build_object(
    'user_id', uid,
    'claims', claims,
    'can_read_jwt', uid IS NOT NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION test_jwt_claims() TO authenticated;
```

### B. Test dengan Browser Console

1. Buka browser console di aplikasi
2. Login ke aplikasi
3. Jalankan:

```javascript
// Ambil session
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Session:", session);

// Test RPC dengan access token
const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_jwt_claims`, {
  method: "POST",
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  },
});

const result = await response.json();
console.log("JWT Claims Test:", result);
```

### C. Test dengan cURL

```bash
# Ganti YOUR_ACCESS_TOKEN dengan token dari localStorage
# Ganti YOUR_PROJECT dengan project URL Supabase
# Ganti YOUR_ANON_KEY dengan anon key Supabase

curl -X POST 'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/test_jwt_claims' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result:**

```json
{
  "user_id": "139c5959-2545-478f-b9c2-dc1d8561b74c",
  "claims": {...},
  "can_read_jwt": true
}
```

## 2. Test Apakah Ada Masalah dengan RLS Policy

### A. Cek RLS Policy untuk Orders Table

```sql
-- Cek semua RLS policies untuk orders table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;
```

### B. Test Apakah User Bisa Membaca Order Mereka Sendiri

```sql
-- Ganti YOUR_USER_ID dengan user ID dari JWT (sub claim)
SELECT
  id,
  user_id,
  status,
  total_amount,
  created_at
FROM orders
WHERE user_id = 'YOUR_USER_ID'::uuid
ORDER BY created_at DESC
LIMIT 5;
```

### C. Test Order Ownership Verification

```sql
-- Test apakah RPC bisa verifikasi order ownership
-- Ganti YOUR_ORDER_ID dengan order ID yang valid
SELECT
  o.id as order_id,
  o.user_id as order_user_id,
  o.status,
  auth.uid() as current_user_id,
  (o.user_id = auth.uid()) as is_owner
FROM orders o
WHERE o.id = 'YOUR_ORDER_ID'::uuid;
```

**Expected Result:**

- `is_owner` harus `true` jika order milik user yang sedang login
- `is_owner` harus `false` jika order bukan milik user

## 3. Test Apakah Order Benar-Benar Tersimpan Sebelum RPC Dipanggil

### A. Cek Order yang Baru Dibuat

```sql
-- Cek order yang dibuat dalam 5 menit terakhir
SELECT
  o.id,
  o.user_id,
  o.status,
  o.total_amount,
  o.created_at,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY o.id, o.user_id, o.status, o.total_amount, o.created_at
ORDER BY o.created_at DESC;
```

### B. Cek Order Items untuk Order Tertentu

```sql
-- Ganti YOUR_ORDER_ID dengan order ID yang valid
SELECT
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.quantity,
  oi.price,
  p.name as product_name,
  p.stock_quantity as current_stock
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = 'YOUR_ORDER_ID'::uuid;
```

### C. Verifikasi di Browser Console

Tambahkan logging di `Checkout.tsx` (sudah ditambahkan):

```javascript
// Order sudah diverifikasi sebelum memanggil RPC
console.debug("[Checkout] Order verified:", {
  orderId: verifyOrder.data.id,
  userId: verifyOrder.data.user_id,
  status: verifyOrder.data.status,
});
```

## 4. Test RPC Function Langsung

### A. Cek RPC Function Exists

```sql
SELECT
  proname as function_name,
  proargnames as parameters,
  prorettype::regtype as return_type,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'decrement_stock_for_order_secure';
```

### B. Cek Permissions untuk RPC Function

```sql
SELECT
  p.proname as function_name,
  r.rolname as role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'decrement_stock_for_order_secure'
  AND r.rolname IN ('anon', 'authenticated', 'postgres')
ORDER BY r.rolname;
```

**Expected Result:**

- `anon`: `can_execute` = `false`
- `authenticated`: `can_execute` = `true`
- `postgres`: `can_execute` = `true`

### C. Test RPC dengan Browser Console

```javascript
// 1. Buat order dulu (melalui checkout flow)
// 2. Ambil order ID dari console log
// 3. Test RPC langsung

const orderId = "YOUR_ORDER_ID";
const {
  data: { session },
} = await supabase.auth.getSession();

const response = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/decrement_stock_for_order_secure`,
  {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order_id: orderId }),
  }
);

const result = await response.json();
console.log("RPC Result:", result);
```

## 5. Debugging Checklist

Jika RPC mengembalikan error "Unauthenticated", cek:

- [ ] Apakah session valid? (`supabase.auth.getSession()`)
- [ ] Apakah access token ada? (`session.access_token`)
- [ ] Apakah access token belum expired? (`session.expires_at`)
- [ ] Apakah order benar-benar tersimpan? (query orders table)
- [ ] Apakah order ownership benar? (`order.user_id === current_user_id`)
- [ ] Apakah RPC function bisa membaca JWT? (test dengan `test_jwt_claims()`)
- [ ] Apakah RLS policy memblokir akses? (cek pg_policies)
- [ ] Apakah RPC function punya permission untuk authenticated? (cek has_function_privilege)

## 6. Common Issues dan Solutions

### Issue 1: "Unauthenticated" Error

**Kemungkinan Penyebab:**

- JWT tidak terkirim ke RPC
- RPC function tidak bisa membaca `request.jwt.claims.sub`
- Session expired

**Solution:**

1. Pastikan session valid sebelum memanggil RPC
2. Test dengan `test_jwt_claims()` untuk verifikasi JWT bisa dibaca
3. Refresh session jika expired

### Issue 2: "Order not found or forbidden"

**Kemungkinan Penyebab:**

- Order belum tersimpan saat RPC dipanggil
- Order ownership tidak sesuai
- RLS policy memblokir akses

**Solution:**

1. Verifikasi order tersimpan sebelum memanggil RPC (sudah ditambahkan di code)
2. Cek order ownership dengan query SQL
3. Cek RLS policy untuk orders table

### Issue 3: RPC Function Tidak Bisa Dipanggil

**Kemungkinan Penyebab:**

- Permission tidak diberikan ke authenticated role
- Function tidak ada atau salah nama

**Solution:**

1. Cek permissions dengan query di section 4.B
2. Verifikasi function exists dengan query di section 4.A


