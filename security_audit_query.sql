-- ============================================================
-- SECURITY AUDIT: Complete RLS Policy Analysis
-- Run this in Supabase SQL Editor to audit all security policies
-- ============================================================

-- ============================================================
-- 1. TABLE-LEVEL SECURITY CHECK
-- Find all tables without RLS enabled
-- ============================================================
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '⚠️ RLS DISABLED - VULNERABLE!' END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', '_realtime')
ORDER BY rowsecurity, tablename;

-- ============================================================
-- 2. POLICY COVERAGE ANALYSIS
-- Check which tables have policies and which don't
-- ============================================================
SELECT 
  t.tablename,
  CASE WHEN t.rowsecurity THEN 'RLS ON' ELSE 'RLS OFF' END as rls_status,
  COUNT(DISTINCT p.policyname) as policy_count,
  STRING_AGG(DISTINCT p.cmd::text, ', ' ORDER BY p.cmd::text) as covered_operations
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT IN ('schema_migrations', '_realtime')
GROUP BY t.tablename, t.rowsecurity
ORDER BY 
  CASE WHEN t.rowsecurity THEN 1 ELSE 0 END,
  policy_count,
  t.tablename;

-- ============================================================
-- 3. MISSING POLICIES CHECK
-- Tables with RLS enabled but missing policies (potential issues)
-- ============================================================
SELECT 
  t.tablename,
  '⚠️ RLS enabled but NO SELECT policy' as risk,
  'Users cannot read this table - potential broken functionality' as issue
FROM pg_tables t
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.schemaname = t.schemaname 
      AND p.tablename = t.tablename 
      AND p.cmd IN ('SELECT', 'ALL')
  )
UNION ALL
SELECT 
  t.tablename,
  '⚠️ RLS enabled but NO WRITE policies' as risk,
  'Users cannot insert/update/delete - intentional or oversight?' as issue
FROM pg_tables t
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.schemaname = t.schemaname 
      AND p.tablename = t.tablename 
      AND p.cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  )
ORDER BY tablename, risk;

-- ============================================================
-- 4. POLICY DETAIL ANALYSIS
-- Detailed view of all policies by operation type
-- ============================================================
SELECT 
  p.tablename,
  p.policyname,
  p.cmd as operation,
  CASE 
    WHEN p.cmd = 'SELECT' THEN '🟢 Read'
    WHEN p.cmd = 'INSERT' THEN '🔵 Create'
    WHEN p.cmd = 'UPDATE' THEN '🟡 Modify'
    WHEN p.cmd = 'DELETE' THEN '🔴 Remove'
    WHEN p.cmd = 'ALL' THEN '⚫ All Operations'
  END as operation_type,
  CASE 
    WHEN p.cmd = 'ALL' THEN '⚠️ Review carefully - applies to ALL operations'
    ELSE 'OK'
  END as warning,
  LEFT(pg_get_expr(pol.polqual, c.oid), 100) as using_clause_preview,
  LEFT(pg_get_expr(pol.polwithcheck, c.oid), 100) as with_check_preview
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE n.nspname = 'public'
ORDER BY p.tablename, 
  CASE p.cmd
    WHEN 'ALL' THEN 0
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END,
  p.policyname;

-- ============================================================
-- 5. FIND VULNERABLE POLICIES
-- Policies that might be too permissive or have issues
-- ============================================================
SELECT 
  p.tablename,
  p.policyname,
  p.cmd as operation,
  CASE 
    WHEN pg_get_expr(pol.polqual, c.oid) LIKE '%true%' 
      OR pg_get_expr(pol.polqual, c.oid) IS NULL 
      OR pg_get_expr(pol.polqual, c.oid) = ''
    THEN '⚠️ USING clause is TRUE or empty - allows all rows!'
    WHEN pg_get_expr(pol.polwithcheck, c.oid) LIKE '%true%'
      OR pg_get_expr(pol.polwithcheck, c.oid) IS NULL
    THEN '⚠️ WITH CHECK clause might be permissive'
    ELSE '✅ Has proper conditions'
  END as security_assessment
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE n.nspname = 'public'
  AND (
    pg_get_expr(pol.polqual, c.oid) LIKE '%true%' 
    OR pg_get_expr(pol.polqual, c.oid) IS NULL 
    OR pg_get_expr(pol.polqual, c.oid) = ''
    OR pg_get_expr(pol.polwithcheck, c.oid) LIKE '%true%'
  )
ORDER BY p.tablename, p.policyname;

-- ============================================================
-- 6. ANON USER ACCESS CHECK
-- What anon users can access (public access)
-- ============================================================
SELECT 
  p.tablename,
  p.cmd as operation,
  p.policyname,
  CASE 
    WHEN pg_get_expr(pol.polqual, c.oid) IS NOT NULL 
      AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%auth.uid()%'
      AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%profiles%'
      AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%role%'
    THEN '🟢 Anon users CAN access'
    ELSE '🔒 Requires authentication'
  END as anon_access
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE n.nspname = 'public'
  AND (
    pg_get_expr(pol.polqual, c.oid) IS NOT NULL
    AND (
      pg_get_expr(pol.polqual, c.oid) LIKE '%true%'
      OR pg_get_expr(pol.polqual, c.oid) LIKE '%is_active%'
      OR pg_get_expr(pol.polqual, c.oid) LIKE '%active = true%'
    )
  )
ORDER BY 
  CASE 
    WHEN pg_get_expr(pol.polqual, c.oid) IS NOT NULL 
      AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%auth.uid()%'
      AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%profiles%'
      AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%role%' THEN 1 
    ELSE 2 
  END,
  p.tablename,
  p.cmd;

-- ============================================================
-- 7. ADMIN-ONLY POLICIES
-- Verify admin protections are working
-- ============================================================
SELECT 
  p.tablename,
  p.policyname,
  p.cmd as operation,
  CASE 
    WHEN pg_get_expr(pol.polqual, c.oid) LIKE '%role%admin%' 
      OR pg_get_expr(pol.polqual, c.oid) LIKE '%role IN%'
    THEN '✅ Checks for admin role'
    WHEN pg_get_expr(pol.polqual, c.oid) LIKE '%auth.uid()%'
    THEN '⚠️ Checks auth but might not check role'
    ELSE '⚠️ No auth check visible'
  END as admin_protection
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE n.nspname = 'public'
  AND p.cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
ORDER BY p.tablename, p.policyname;

-- ============================================================
-- 8. SUMMARY REPORT
-- ============================================================
SELECT 
  '=== SECURITY SUMMARY ===' as section,
  NULL::text as tablename,
  NULL::text as detail
UNION ALL
SELECT 
  'RLS Enabled Tables' as section,
  COUNT(*)::text as tablename,
  NULL as detail
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'RLS Disabled Tables' as section,
  COUNT(*)::text as tablename,
  STRING_AGG(tablename, ', ') as detail
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false
  AND tablename NOT IN ('schema_migrations', '_realtime')
UNION ALL
SELECT 
  'Total Policies' as section,
  COUNT(*)::text as tablename,
  NULL as detail
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Policies with ALL operation' as section,
  COUNT(*)::text as tablename,
  STRING_AGG(tablename, ', ') as detail
FROM pg_policies 
WHERE schemaname = 'public' AND cmd = 'ALL';

