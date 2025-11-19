-- Ensure core decrement RPC is not executable by client roles
-- Run this migration to revoke execute privileges that might exist from older migrations
-- and to ensure only the secure wrapper is callable by authenticated clients.

-- Revoke core access from clients
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order(UUID) FROM authenticated;

-- Ensure secure wrapper exists and is only executable by authenticated
-- (If wrapper not present yet, apply the wrapper migration first.)
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order_secure(UUID) TO authenticated;

-- Double-check core is still executable by database owner (postgres)
-- Note: do not grant core to authenticated/anon in future migrations.

-- Verification query (optional): run separately to confirm state
-- SELECT rolname,
--   has_function_privilege(rolname, 'public.decrement_stock_for_order(uuid)', 'EXECUTE') AS core_can_execute,
--   has_function_privilege(rolname, 'public.decrement_stock_for_order_secure(uuid)', 'EXECUTE') AS wrapper_can_execute
-- FROM pg_roles
-- WHERE rolname IN ('anon','authenticated','postgres');
