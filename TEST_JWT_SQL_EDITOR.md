# Test JWT dan RPC Function di SQL Editor

## Query yang Bisa Dijalankan di SQL Editor

File `test_jwt_debug.sql` sudah diperbarui dengan query yang bisa dijalankan langsung di Supabase SQL Editor. Query ini akan memberikan output detail tentang konfigurasi RPC function.

## Langkah Test

### 1. Jalankan Query Test di SQL Editor

Jalankan query berikut di Supabase SQL Editor secara berurutan:

#### A. Cek Konfigurasi RPC Function

```sql
SELECT
  proname as function_name,
  proargnames as parameters,
  prorettype::regtype as return_type,
  prosecdef as is_security_definer,
  prosecdef::text as security_definer_status,
  pronargs as arg_count
FROM pg_proc
WHERE proname = 'decrement_stock_for_order_secure';
```

**Expected Output:**

- `function_name`: `decrement_stock_for_order_secure`
- `is_security_definer`: `true` (harus true)
- `return_type`: `json`

#### B. Cek Permissions

```sql
SELECT
  p.proname as function_name,
  r.rolname as role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute,
  CASE
    WHEN has_function_privilege(r.rolname, p.oid, 'EXECUTE') THEN '✅ YES'
    ELSE '❌ NO'
  END as status
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'decrement_stock_for_order_secure'
  AND r.rolname IN ('anon', 'authenticated', 'postgres')
ORDER BY r.rolname;
```

**Expected Output:**

```
function_name                          | role_name      | can_execute | status
---------------------------------------+----------------+-------------+--------
decrement_stock_for_order_secure      | anon           | false       | ❌ NO
decrement_stock_for_order_secure      | authenticated  | true        | ✅ YES
decrement_stock_for_order_secure      | postgres       | true        | ✅ YES
```

#### C. Cek Source Code RPC Function

```sql
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'decrement_stock_for_order_secure';
```

Ini akan menampilkan source code lengkap dari RPC function untuk melihat logic-nya.

#### D. Test JWT di SQL Editor (Akan NULL)

```sql
SELECT
  current_setting('request.jwt.claims.sub', true) as jwt_sub,
  current_setting('request.jwt.claims', true) as jwt_claims_full,
  CASE
    WHEN current_setting('request.jwt.claims.sub', true) IS NULL THEN '❌ JWT tidak tersedia (normal di SQL editor)'
    ELSE '✅ JWT tersedia'
  END as jwt_status;
```

**Expected Output:**

```
jwt_sub | jwt_claims_full | jwt_status
--------+-----------------+----------------------------------------
NULL    | NULL            | ❌ JWT tidak tersedia (normal di SQL editor)
```

**Catatan:** Ini normal karena di SQL Editor tidak ada HTTP request yang membawa JWT.

#### E. Cek Owner Function

```sql
SELECT
  p.proname as function_name,
  r.rolname as owner_name,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'decrement_stock_for_order_secure';
```

Ini akan menunjukkan siapa owner function (yang akan digunakan oleh SECURITY DEFINER).

### 2. Test Function yang Bisa Memberikan Output Detail

Jalankan semua CREATE FUNCTION di `test_jwt_debug.sql` untuk membuat test functions:

- `test_jwt_read()` - untuk test apakah JWT bisa dibaca
- `test_jwt_security_definer_detailed()` - untuk test JWT dengan SECURITY DEFINER (detail lengkap)
- `test_decrement_stock_debug(UUID)` - untuk test decrement dengan debug output
- `test_decrement_stock_detailed(UUID)` - untuk test decrement dengan detail lengkap (mirip dengan decrement_stock_for_order_secure)

**Catatan:** Jalankan semua CREATE FUNCTION di `test_jwt_debug.sql` di SQL Editor untuk membuat semua test functions.

### 3. Test via Browser Console (dengan JWT)

Karena di SQL Editor tidak ada JWT, kita perlu test via browser console atau HTTP client.

Setelah login di aplikasi, buka browser console dan jalankan:

```javascript
// Ambil session
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Session:", session);

// Test 1: Test JWT readability
const jwtTest = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_jwt_read`, {
  method: "POST",
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  },
});
const jwtResult = await jwtTest.json();
console.log("JWT Read Test:", JSON.stringify(jwtResult, null, 2));
```

**Expected Output jika JWT bisa dibaca:**

```json
{
  "user_id": "139c5959-2545-478f-b9c2-dc1d8561b74c",
  "claims": {...},
  "can_read_jwt": true,
  "claims_raw": "{...}"
}
```

**Expected Output jika JWT tidak bisa dibaca:**

```json
{
  "user_id": null,
  "claims": null,
  "can_read_jwt": false,
  "claims_raw": null,
  "error": "Cannot read JWT claims"
}
```

```javascript
// Test 2: Test decrement dengan debug mode
// Ganti YOUR_ORDER_ID dengan order ID yang valid dari checkout yang gagal
const orderId = "YOUR_ORDER_ID";
const debugTest = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/test_decrement_stock_debug`,
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
const debugResult = await debugTest.json();
console.log("Debug Test Result:", JSON.stringify(debugResult, null, 2));
```

**Test 3: Test JWT dengan SECURITY DEFINER detail**

```javascript
// Test apakah SECURITY DEFINER function bisa membaca JWT
const securityDefinerTest = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/test_jwt_security_definer_detailed`,
  {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  }
);
const securityDefinerResult = await securityDefinerTest.json();
console.log(
  "Security Definier Test:",
  JSON.stringify(securityDefinerResult, null, 2)
);
```

**Expected Output jika JWT bisa dibaca:**

```json
{
  "jwt_sub_raw": "139c5959-2545-478f-b9c2-dc1d8561b74c",
  "jwt_sub_uuid": "139c5959-2545-478f-b9c2-dc1d8561b74c",
  "jwt_claims_full": "{...}",
  "can_read_jwt": true,
  "can_cast_to_uuid": true,
  "error": null,
  "security_definer_owner": "postgres",
  "session_user": "authenticated",
  "current_user": "postgres",
  "is_authenticated": true
}
```

**Test 4: Test decrement dengan detail lengkap (mirip dengan decrement_stock_for_order_secure)**

```javascript
// Test decrement dengan output detail lengkap
// Ganti YOUR_ORDER_ID dengan order ID yang valid dari checkout yang gagal
const orderId = "YOUR_ORDER_ID";
const detailedTest = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/test_decrement_stock_detailed`,
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
const detailedResult = await detailedTest.json();
console.log("Detailed Test Result:", JSON.stringify(detailedResult, null, 2));
```

**Expected Output:**

```json
{
  "success": true,
  "error": null,
  "debug_info": {
    "jwt_sub_raw": "139c5959-2545-478f-b9c2-dc1d8561b74c",
    "jwt_sub_uuid": "139c5959-2545-478f-b9c2-dc1d8561b74c",
    "can_read_jwt": true,
    "can_cast_to_uuid": true,
    "order_id_param": "order-id-here",
    "order_exists": true,
    "order_user_id": "139c5959-2545-478f-b9c2-dc1d8561b74c",
    "current_user_from_jwt": "139c5959-2545-478f-b9c2-dc1d8561b74c",
    "is_owner": true,
    "error_msg": null,
    "security_definer_owner": "postgres",
    "session_user": "authenticated"
  }
}
```

**Expected Output jika JWT tidak bisa dibaca:**

```json
{
  "success": false,
  "error": "Unauthenticated - Cannot read JWT sub",
  "debug_info": {
    "jwt_sub_raw": null,
    "jwt_sub_uuid": null,
    "can_read_jwt": false,
    "can_cast_to_uuid": false,
    "order_id_param": "order-id-here",
    "order_exists": true,
    "order_user_id": "139c5959-2545-478f-b9c2-dc1d8561b74c",
    "current_user_from_jwt": null,
    "is_owner": false,
    "error_msg": "Failed to read JWT: ...",
    "security_definer_owner": "postgres",
    "session_user": "authenticated"
  }
}
```

**Expected Output:**

```json
{
  "success": false,
  "error": "Debug mode - not actually decrementing",
  "debug_info": {
    "user_id_from_jwt": "139c5959-2545-478f-b9c2-dc1d8561b74c",
    "can_read_jwt": true,
    "claims_json": "{...}",
    "order_id_param": "order-id-here",
    "order_exists": true,
    "order_user_id": "139c5959-2545-478f-b9c2-dc1d8561b74c",
    "is_owner": true
  }
}
```

Dari output ini, kita bisa melihat:

- Apakah JWT bisa dibaca? (`can_read_jwt`)
- Apakah order ada? (`order_exists`)
- Apakah user adalah owner order? (`is_owner`)

## Interpretasi Hasil

### Jika `can_read_jwt: false`:

- JWT tidak terkirim ke RPC
- Ada masalah dengan cara Supabase client mengirim JWT
- Solusi: Pastikan menggunakan fetch langsung dengan access token

### Jika `can_read_jwt: true` tapi `is_owner: false`:

- JWT bisa dibaca tapi order ownership tidak sesuai
- Solusi: Cek apakah order benar-benar milik user yang sedang login

### Jika `order_exists: false`:

- Order belum tersimpan saat RPC dipanggil
- Solusi: Tambahkan delay atau verifikasi order tersimpan sebelum memanggil RPC

### Jika semua true tapi masih error:

- Ada masalah dengan logic di RPC function
- Solusi: Cek source code RPC function dan pastikan logic benar
