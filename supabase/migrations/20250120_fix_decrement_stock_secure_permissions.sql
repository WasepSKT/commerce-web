-- Fix permissions for decrement_stock_for_order_secure
-- Revoke execute permission from anon role
-- Only authenticated and postgres should be able to execute

-- Step 1: Revoke execute from anon (try multiple times to ensure it works)
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM anon CASCADE;

-- Step 2: Revoke from PUBLIC role (which includes anon)
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM PUBLIC;

-- Step 3: Ensure authenticated can execute
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) TO authenticated;

-- Step 4: Note about default privileges
-- Default privileges from supabase_admin grant execute to anon
-- We cannot change default privileges (permission denied), but we can:
-- 1. Explicitly revoke from existing functions (done in steps above)
-- 2. Drop and recreate function to avoid default privileges (alternative approach)
-- For now, we'll rely on explicit revoke which should work

-- Step 5: Re-apply permissions to existing function
-- Default privileges only affect NEW objects, so we need to explicitly fix existing function
-- Revoke from anon again (in case default privileges re-granted it)
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM PUBLIC;

-- Ensure authenticated can still execute
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) TO authenticated;

-- Step 6: Use REVOKE ALL to remove all permissions from anon
-- This is more aggressive and should override default privileges
REVOKE ALL ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM PUBLIC;

-- Re-grant only to authenticated
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) TO authenticated;

-- Step 7: Verify current permissions on the function
-- This will show us if anon still has permission
DO $$
DECLARE
  anon_has_permission BOOLEAN;
BEGIN
  SELECT has_function_privilege('anon', 'public.decrement_stock_for_order_secure(uuid)', 'EXECUTE')
  INTO anon_has_permission;
  
  IF anon_has_permission THEN
    RAISE WARNING 'anon still has execute permission after REVOKE ALL!';
    RAISE WARNING 'This means default privileges are overriding explicit revoke.';
    RAISE WARNING 'You may need to drop and recreate the function (see alternative solution below).';
  ELSE
    RAISE NOTICE 'anon permission successfully revoked';
  END IF;
END $$;

-- Verify permissions
-- Run this query to verify:
-- SELECT 
--   p.proname as function_name,
--   r.rolname as role_name,
--   has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
-- FROM pg_proc p
-- CROSS JOIN pg_roles r
-- WHERE p.proname = 'decrement_stock_for_order_secure'
--   AND r.rolname IN ('anon', 'authenticated', 'postgres')
-- ORDER BY r.rolname;

-- Expected result after this migration:
-- anon: can_execute = false
-- authenticated: can_execute = true
-- postgres: can_execute = true

-- ============================================
-- ALTERNATIVE SOLUTION (if revoke doesn't work)
-- ============================================
-- If anon still has permission after running this migration,
-- it means default privileges are overriding explicit revoke.
-- In that case, drop and recreate the function:
--
-- DROP FUNCTION IF EXISTS public.decrement_stock_for_order_secure(UUID);
--
-- Then recreate it (copy from 20251119_add_secure_wrapper_decrement_stock.sql):
-- CREATE OR REPLACE FUNCTION decrement_stock_for_order_secure(order_id UUID)
-- RETURNS JSON
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   p_order_id ALIAS FOR $1;
--   uid UUID;
--   res JSON;
-- BEGIN
--   BEGIN
--     uid := current_setting('request.jwt.claims.sub', true)::uuid;
--   EXCEPTION WHEN OTHERS THEN
--     uid := NULL;
--   END;
--
--   IF uid IS NULL THEN
--     RETURN json_build_object('success', false, 'error', 'Unauthenticated');
--   END IF;
--
--   IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = uid) THEN
--     RETURN json_build_object('success', false, 'error', 'Order not found or forbidden');
--   END IF;
--
--   res := decrement_stock_for_order(p_order_id);
--   RETURN res;
-- END;
-- $$;
--
-- -- IMPORTANT: Grant ONLY to authenticated, NOT to anon or PUBLIC
-- GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) TO authenticated;
-- -- Do NOT grant to anon or PUBLIC
--
-- After recreating, default privileges will apply, but we can immediately revoke:
-- REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM anon;
-- REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM PUBLIC;

