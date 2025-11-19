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

