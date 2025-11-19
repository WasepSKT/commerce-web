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
  -- Prefer using Supabase helper `auth.uid()` to obtain the authenticated user's id.
  -- `auth.uid()` is safer in SECURITY DEFINER functions. Fall back to request.jwt.claims.sub
  -- only if `auth.uid()` is not available for some reason.
  BEGIN
    BEGIN
      -- Prefer auth.uid() which is the most reliable helper
      uid := auth.uid()::uuid;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback: try reading the full JWT claims and parse the 'sub' field
      BEGIN
        DECLARE
          claims_text TEXT;
          claims_json JSON;
          sub_text TEXT;
        BEGIN
          claims_text := current_setting('request.jwt.claims', true);
          IF claims_text IS NOT NULL THEN
            claims_json := claims_text::json;
            -- Prefer top-level 'sub', fall back to user_metadata.sub (provider id)
            sub_text := claims_json->>'sub';
            IF sub_text IS NULL THEN
              sub_text := claims_json->'user_metadata'->>'sub';
            END IF;

            IF sub_text IS NOT NULL THEN
              -- Try cast to uuid (normal Supabase user id). If that fails,
              -- attempt to resolve a provider id to a Supabase user id by
              -- looking into the auth.users raw_user_meta_data.
              BEGIN
                uid := sub_text::uuid;
              EXCEPTION WHEN OTHERS THEN
                BEGIN
                  SELECT id INTO uid
                  FROM auth.users
                  WHERE COALESCE((raw_user_meta_data::json->>'provider_id'), (raw_user_meta_data::json->>'sub')) = sub_text
                  LIMIT 1;
                EXCEPTION WHEN OTHERS THEN
                  uid := NULL;
                END;
              END;
            ELSE
              uid := NULL;
            END IF;
          ELSE
            uid := NULL;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          uid := NULL;
        END;
      END;
    END;
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

  -- If decrement succeeded, remove the user's cart (user completed checkout)
  BEGIN
    IF (res->>'success')::boolean THEN
      -- delete cart for this user; cart policies enforced, but SECURITY DEFINER owner can perform
      DELETE FROM carts WHERE user_id = uid;
      RAISE LOG 'Cart cleared for user % after successful decrement', uid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log but do not fail the whole transaction because stock decrement already happened
    RAISE LOG 'Failed to clear cart for user %: %', uid, SQLERRM;
  END;

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
