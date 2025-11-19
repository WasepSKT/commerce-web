-- Test apakah RPC bisa membaca JWT
-- Jalankan ini di Supabase SQL Editor untuk membuat test function

CREATE OR REPLACE FUNCTION test_jwt_read()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
  claims_json TEXT;
  claims_obj JSON;
BEGIN
  -- Try to read JWT claims
  BEGIN
    uid := current_setting('request.jwt.claims.sub', true)::uuid;
    claims_json := current_setting('request.jwt.claims', true);
    claims_obj := claims_json::json;
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
    claims_obj := NULL;
  END;

  RETURN json_build_object(
    'user_id', uid,
    'claims', claims_obj,
    'can_read_jwt', uid IS NOT NULL,
    'claims_raw', claims_json,
    'error', CASE WHEN uid IS NULL THEN 'Cannot read JWT claims' ELSE NULL END
  );
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION test_jwt_read() TO authenticated;
REVOKE EXECUTE ON FUNCTION test_jwt_read() FROM anon;

-- Test function untuk decrement_stock_for_order_secure dengan debug
CREATE OR REPLACE FUNCTION test_decrement_stock_debug(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_order_id ALIAS FOR $1;
  uid UUID;
  claims_json TEXT;
  order_exists BOOLEAN;
  order_user_id UUID;
BEGIN
  -- Read JWT claims
  BEGIN
    uid := current_setting('request.jwt.claims.sub', true)::uuid;
    claims_json := current_setting('request.jwt.claims', true);
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
    claims_json := NULL;
  END;

  -- Debug info
  RETURN json_build_object(
    'success', false,
    'error', 'Debug mode - not actually decrementing',
    'debug_info', json_build_object(
      'user_id_from_jwt', uid,
      'can_read_jwt', uid IS NOT NULL,
      'claims_json', claims_json,
      'order_id_param', p_order_id,
      'order_exists', EXISTS (SELECT 1 FROM orders WHERE id = p_order_id),
      'order_user_id', (SELECT user_id FROM orders WHERE id = p_order_id LIMIT 1),
      'is_owner', EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = uid)
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION test_decrement_stock_debug(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION test_decrement_stock_debug(UUID) FROM anon;

-- ============================================
-- FUNCTION UNTUK TEST SECURITY DEFINER DENGAN DETAIL OUTPUT
-- ============================================

-- Test function yang menunjukkan detail JWT dan masalahnya
CREATE OR REPLACE FUNCTION test_jwt_security_definer_detailed()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  jwt_sub TEXT;
  jwt_claims_full TEXT;
  jwt_sub_uuid UUID;
  error_msg TEXT;
BEGIN
  -- Try to read JWT claims with detailed error handling
  BEGIN
    jwt_sub := current_setting('request.jwt.claims.sub', true);
    jwt_claims_full := current_setting('request.jwt.claims', true);
    
    -- Try to cast to UUID
    IF jwt_sub IS NOT NULL THEN
      BEGIN
        jwt_sub_uuid := jwt_sub::uuid;
      EXCEPTION WHEN OTHERS THEN
        jwt_sub_uuid := NULL;
        error_msg := 'Failed to cast JWT sub to UUID: ' || SQLERRM;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    jwt_sub := NULL;
    jwt_claims_full := NULL;
    jwt_sub_uuid := NULL;
    error_msg := 'Failed to read JWT claims: ' || SQLERRM;
  END;

  RETURN json_build_object(
    'jwt_sub_raw', jwt_sub,
    'jwt_sub_uuid', jwt_sub_uuid,
    'jwt_claims_full', jwt_claims_full,
    'can_read_jwt', jwt_sub IS NOT NULL,
    'can_cast_to_uuid', jwt_sub_uuid IS NOT NULL,
    'error', error_msg,
    'security_definer_owner', current_user,
    'session_user', session_user,
    'current_user', current_user,
    'is_authenticated', (jwt_sub IS NOT NULL)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION test_jwt_security_definer_detailed() TO authenticated;
REVOKE EXECUTE ON FUNCTION test_jwt_security_definer_detailed() FROM anon;

-- Test function yang mirip dengan decrement_stock_for_order_secure tapi dengan output detail
CREATE OR REPLACE FUNCTION test_decrement_stock_detailed(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_order_id ALIAS FOR $1;
  jwt_sub TEXT;
  jwt_sub_uuid UUID;
  error_msg TEXT;
  order_exists BOOLEAN;
  order_user_id UUID;
  is_owner BOOLEAN;
BEGIN
  -- Try to read JWT claims exactly like decrement_stock_for_order_secure does
  BEGIN
    jwt_sub := current_setting('request.jwt.claims.sub', true);
    IF jwt_sub IS NOT NULL THEN
      jwt_sub_uuid := jwt_sub::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    jwt_sub := NULL;
    jwt_sub_uuid := NULL;
    error_msg := 'Failed to read JWT: ' || SQLERRM;
  END;

  -- Check order
  IF p_order_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id) INTO order_exists;
    IF order_exists THEN
      SELECT user_id INTO order_user_id FROM orders WHERE id = p_order_id;
      is_owner := (order_user_id = jwt_sub_uuid);
    END IF;
  END IF;

  RETURN json_build_object(
    'success', jwt_sub_uuid IS NOT NULL AND is_owner,
    'error', CASE 
      WHEN jwt_sub IS NULL THEN 'Unauthenticated - Cannot read JWT sub'
      WHEN jwt_sub_uuid IS NULL THEN 'Unauthenticated - Cannot cast JWT sub to UUID'
      WHEN NOT order_exists THEN 'Order not found'
      WHEN NOT is_owner THEN 'Order not found or forbidden'
      ELSE NULL
    END,
    'debug_info', json_build_object(
      'jwt_sub_raw', jwt_sub,
      'jwt_sub_uuid', jwt_sub_uuid,
      'can_read_jwt', jwt_sub IS NOT NULL,
      'can_cast_to_uuid', jwt_sub_uuid IS NOT NULL,
      'order_id_param', p_order_id,
      'order_exists', order_exists,
      'order_user_id', order_user_id,
      'current_user_from_jwt', jwt_sub_uuid,
      'is_owner', is_owner,
      'error_msg', error_msg,
      'security_definer_owner', current_user,
      'session_user', session_user
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION test_decrement_stock_detailed(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION test_decrement_stock_detailed(UUID) FROM anon;

-- ============================================
-- QUERIES YANG BISA DIJALANKAN DI SQL EDITOR
-- ============================================

-- Test 1: Cek konfigurasi RPC function decrement_stock_for_order_secure
SELECT 
  proname as function_name,
  proargnames as parameters,
  prorettype::regtype as return_type,
  prosecdef as is_security_definer,
  prosecdef::text as security_definer_status,
  pronargs as arg_count
FROM pg_proc
WHERE proname = 'decrement_stock_for_order_secure';

-- Test 2: Cek permissions untuk RPC function (bisa dijalankan di SQL editor)
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

-- Test 3: Cek source code RPC function untuk melihat logic-nya
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'decrement_stock_for_order_secure';

-- Test 4: Test apakah bisa membaca JWT di SQL editor (akan NULL karena tidak ada HTTP request)
-- Jalankan ini untuk melihat bahwa di SQL editor tidak ada JWT
SELECT 
  current_setting('request.jwt.claims.sub', true) as jwt_sub,
  current_setting('request.jwt.claims', true) as jwt_claims_full,
  CASE 
    WHEN current_setting('request.jwt.claims.sub', true) IS NULL THEN '❌ JWT tidak tersedia (normal di SQL editor)'
    ELSE '✅ JWT tersedia'
  END as jwt_status;

-- Test 5: Cek apakah ada order yang baru dibuat (untuk test)
SELECT 
  o.id,
  o.user_id,
  o.status,
  o.total_amount,
  o.created_at,
  COUNT(oi.id) as item_count,
  NOW() - o.created_at as age
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at > NOW() - INTERVAL '10 minutes'
GROUP BY o.id, o.user_id, o.status, o.total_amount, o.created_at
ORDER BY o.created_at DESC
LIMIT 5;

-- Test 6: Verifikasi bahwa RPC function menggunakan SECURITY DEFINER
SELECT 
  proname,
  prosecdef as uses_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ YES - Function akan menggunakan privileges dari owner'
    ELSE '❌ NO - Function akan menggunakan privileges dari caller'
  END as security_definer_info
FROM pg_proc
WHERE proname IN ('decrement_stock_for_order_secure', 'decrement_stock_for_order');

-- Test 7: Cek owner function (yang akan digunakan oleh SECURITY DEFINER)
SELECT 
  p.proname as function_name,
  r.rolname as owner_name,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'decrement_stock_for_order_secure';

-- ============================================
-- INFORMASI UNTUK DEBUG
-- ============================================
-- Catatan penting:
-- 1. Di SQL Editor, tidak ada JWT karena tidak ada HTTP request
-- 2. Untuk test JWT, harus menggunakan browser console atau HTTP client (curl/Postman)
-- 3. Jika RPC function mengembalikan "Unauthenticated", kemungkinan:
--    - JWT tidak terkirim ke RPC
--    - RPC function tidak bisa membaca request.jwt.claims.sub
--    - Ada masalah dengan SECURITY DEFINER
--    - Session expired atau invalid

-- ============================================
-- TEST VIA BROWSER CONSOLE (setelah membuat test functions)
-- ============================================
/*
// Jalankan ini di browser console setelah login:

// 1. Test JWT readability
const { data: { session } } = await supabase.auth.getSession();
const jwtTest = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_jwt_read`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
});
const jwtResult = await jwtTest.json();
console.log('JWT Read Test:', JSON.stringify(jwtResult, null, 2));

// 2. Test decrement stock dengan debug mode
const orderId = 'YOUR_ORDER_ID'; // Ganti dengan order ID yang valid
const debugTest = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_decrement_stock_debug`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ order_id: orderId })
});
const debugResult = await debugTest.json();
console.log('Debug Test Result:', JSON.stringify(debugResult, null, 2));
*/

