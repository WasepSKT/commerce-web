-- ============================================================
-- VERIFY ALL POLICIES - Check if they're properly secured
-- Run this to ensure ALL policies have proper admin checks
-- ============================================================

-- Check all policies with ALL operation and their security
WITH policy_security AS (
  SELECT 
    p.tablename,
    p.policyname,
    pg_get_expr(pol.polqual, c.oid) as using_clause,
    pg_get_expr(pol.polwithcheck, c.oid) as with_check_clause,
    CASE 
      -- Check if it requires admin role
      WHEN pg_get_expr(pol.polqual, c.oid) LIKE '%role%admin%' 
        OR pg_get_expr(pol.polqual, c.oid) LIKE '%role IN%'
        OR pg_get_expr(pol.polqual, c.oid) LIKE '%admin_sales%'
        OR pg_get_expr(pol.polqual, c.oid) LIKE '%marketing%'
      THEN '✅ Secured (checks role)'
      
      -- Check if it requires authentication
      WHEN pg_get_expr(pol.polqual, c.oid) LIKE '%auth.uid()%'
      THEN '⚠️ Requires auth (but might not check role - review needed)'
      
      -- Check if it's too permissive
      WHEN pg_get_expr(pol.polqual, c.oid) LIKE '%true%'
        OR pg_get_expr(pol.polqual, c.oid) IS NULL
      THEN '🔴 TOO PERMISSIVE - Allows all users!'
      
      ELSE '⚠️ Review needed - check policy condition'
    END as security_status
  FROM pg_policies p
  JOIN pg_class c ON c.relname = p.tablename
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
  WHERE n.nspname = 'public'
    AND p.cmd = 'ALL'
)
SELECT 
  tablename,
  policyname,
  using_clause,
  with_check_clause,
  security_status
FROM policy_security
ORDER BY 
  CASE security_status
    WHEN '🔴 TOO PERMISSIVE - Allows all users!' THEN 1
    WHEN '⚠️ Requires auth (but might not check role - review needed)' THEN 2
    WHEN '⚠️ Review needed - check policy condition' THEN 3
    ELSE 4
  END,
  tablename,
  policyname;

-- ============================================================
-- Check for duplicate policy names (potential issues)
-- ============================================================
SELECT 
  tablename,
  policyname,
  COUNT(*) as policy_count,
  STRING_AGG(cmd::text, ', ' ORDER BY cmd) as operations
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename, policyname;

