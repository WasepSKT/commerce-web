-- Add secure wrapper for decrement_stock_for_order and restrict execute privileges
-- The wrapper validates the caller JWT and that the order belongs to the caller

CREATE OR REPLACE FUNCTION decrement_stock_for_order_secure(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_order_id ALIAS FOR $1;
  uid UUID;
  res JSON;
BEGIN
  -- Try to read the authenticated user's sub from the request JWT claims
  BEGIN
    uid := current_setting('request.jwt.claims.sub', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
  END;

  IF uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthenticated');
  END IF;

  -- Verify that the order belongs to the authenticated user
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = uid) THEN
    RETURN json_build_object('success', false, 'error', 'Order not found or forbidden');
  END IF;

  -- Delegate to core function (assumes core function exists)
  res := decrement_stock_for_order(p_order_id);
  RETURN res;
END;
$$;

-- Grant execute only to authenticated users (not anon)
GRANT EXECUTE ON FUNCTION decrement_stock_for_order_secure(UUID) TO authenticated;

-- Ensure core function is not executable by anon (revoke if granted earlier)
REVOKE EXECUTE ON FUNCTION decrement_stock_for_order(UUID) FROM anon;
-- Keep core function executable by service/owner; optionally keep for authenticated if desired
-- (Do not grant anon execute)

-- Comment
COMMENT ON FUNCTION decrement_stock_for_order_secure(UUID) IS
  'Secure wrapper that checks order ownership from JWT then calls core decrement function.';
