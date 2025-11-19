-- ============================================
-- TEST: Apakah RPC function bisa membaca request.jwt.claims.sub
-- ============================================

-- Test 1: Panggil RPC function dengan session yang valid
-- Pastikan Anda sudah login di Supabase dashboard atau menggunakan access token yang valid

-- Langkah 1: Ambil access token dari localStorage browser
-- Format: eyJhbGciOiJIUzI1NiIsImtpZCI6IlFlTyszdGRQSGlUbXRnRkgiLCJ0eXAiOiJKV1QifQ...

-- Langkah 2: Test RPC dengan curl atau Postman
-- Ganti YOUR_ACCESS_TOKEN dengan token dari localStorage
-- Ganti YOUR_ORDER_ID dengan order ID yang valid

/*
curl -X POST 'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/decrement_stock_for_order_secure' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "YOUR_ORDER_ID"}'
*/

-- Test 2: Cek apakah RPC bisa membaca JWT claims
-- Buat test function untuk melihat JWT claims

CREATE OR REPLACE FUNCTION test_jwt_claims()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
  claims JSON;
BEGIN
  -- Try to read JWT claims
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

-- Grant execute untuk authenticated users
GRANT EXECUTE ON FUNCTION test_jwt_claims() TO authenticated;

-- Test function ini dengan:
-- SELECT test_jwt_claims();

-- ============================================
-- TEST: Apakah ada masalah dengan RLS policy
-- ============================================

-- Test 1: Cek RLS policy untuk orders table
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

-- Test 2: Cek apakah user bisa membaca order mereka sendiri
-- Ganti YOUR_USER_ID dengan user ID dari JWT (sub claim)
SELECT 
  id,
  user_id,
  status,
  total_amount
FROM orders
WHERE user_id = 'YOUR_USER_ID'::uuid;

-- Test 3: Cek apakah RPC function bisa mengakses orders table
-- Test dengan memanggil RPC dan lihat apakah bisa membaca order

-- ============================================
-- TEST: Apakah order benar-benar tersimpan sebelum RPC dipanggil
-- ============================================

-- Test 1: Cek order yang baru dibuat
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

-- Test 2: Cek order items untuk order tertentu
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.quantity,
  oi.price,
  p.name as product_name
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = 'YOUR_ORDER_ID'::uuid;

-- Test 3: Verifikasi order ownership
SELECT 
  o.id as order_id,
  o.user_id,
  o.status,
  auth.uid() as current_user_id,
  (o.user_id = auth.uid()) as is_owner
FROM orders o
WHERE o.id = 'YOUR_ORDER_ID'::uuid;

-- ============================================
-- VERIFIKASI RPC FUNCTION
-- ============================================

-- Test 1: Cek apakah RPC function ada dan bisa diakses
SELECT 
  proname as function_name,
  proargnames as parameters,
  prorettype::regtype as return_type,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'decrement_stock_for_order_secure';

-- Test 2: Cek permissions untuk RPC function
SELECT 
  p.proname as function_name,
  r.rolname as role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'decrement_stock_for_order_secure'
  AND r.rolname IN ('anon', 'authenticated', 'postgres')
ORDER BY r.rolname;

-- Test 3: Cek apakah RPC function bisa dipanggil oleh authenticated user
-- (Test ini harus dilakukan dengan access token yang valid)



