-- ============================================================
-- VERIFICATION SCRIPT - Pastikan migration consolidate bekerja
-- Jalankan script ini SETELAH menjalankan 20251102_consolidate_fixes.sql
-- ============================================================

-- ============================================================
-- 1. CHECK HERO SLIDER ITEMS POLICY (Fix Bug)
-- ============================================================
SELECT 
  'Hero Slider Items Policy' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies p
      JOIN pg_class c ON c.relname = p.tablename
      JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
      WHERE p.tablename = 'hero_slider_items' 
        AND p.policyname = 'Allow admin full access to hero slider items'
        AND pg_get_expr(pol.polqual, c.oid) LIKE '%user_id%'
        AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%profiles.id%'
    ) THEN '✅ FIXED - Using user_id'
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies p
      JOIN pg_class c ON c.relname = p.tablename
      JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
      WHERE p.tablename = 'hero_slider_items' 
        AND p.policyname = 'Allow admin full access to hero slider items'
        AND pg_get_expr(pol.polqual, c.oid) LIKE '%profiles.id%'
    ) THEN '❌ BUG - Still using profiles.id instead of user_id'
    ELSE '⚠️ Policy not found'
  END as status;

-- ============================================================
-- 2. CHECK WITH CHECK CLAUSES
-- ============================================================
SELECT 
  'WITH CHECK Clauses' as check_name,
  COUNT(*) as missing_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All policies have WITH CHECK'
    ELSE '⚠️ ' || COUNT(*) || ' policies missing WITH CHECK'
  END as status
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE p.cmd = 'ALL'
  AND p.tablename IN ('fixed_banners', 'hero_slider_items', 'order_items', 'popup_campaigns')
  AND pg_get_expr(pol.polwithcheck, c.oid) IS NULL;

-- ============================================================
-- 3. CHECK REFERRAL TRIGGER FUNCTION (Final Version)
-- ============================================================
SELECT 
  'Referral Trigger Function' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'trigger_handle_referral_purchase'
        AND p.prosrc LIKE '%paid%completed%'
    ) THEN '✅ CORRECT - Handles both paid and completed'
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'trigger_handle_referral_purchase'
    ) THEN '⚠️ EXISTS but might be old version'
    ELSE '❌ Function not found'
  END as status;

-- ============================================================
-- 4. CHECK TRIGGER EXISTS WITH CORRECT WHEN CLAUSE
-- ============================================================
SELECT 
  'Referral Trigger' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = 'trg_handle_referral_purchase'
        AND c.relname = 'orders'
    ) THEN '✅ Trigger exists'
    ELSE '❌ Trigger not found'
  END as status;

-- ============================================================
-- 5. CHECK USER_ROLE ENUM VALUES
-- ============================================================
SELECT 
  'User Role Enum' as check_name,
  STRING_AGG(enumlabel, ', ' ORDER BY enumsortorder) as roles,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All roles present'
    WHEN COUNT(*) >= 2 THEN '⚠️ Some roles missing'
    ELSE '❌ Enum not found'
  END as status
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- ============================================================
-- 6. SUMMARY REPORT
-- ============================================================
SELECT 
  '=== CONSOLIDATION STATUS ===' as report_section,
  NULL as detail
UNION ALL
SELECT 
  'Hero Slider Policy',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies p
      JOIN pg_class c ON c.relname = p.tablename
      JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
      WHERE p.tablename = 'hero_slider_items' 
        AND p.policyname = 'Allow admin full access to hero slider items'
        AND pg_get_expr(pol.polqual, c.oid) LIKE '%user_id%'
        AND pg_get_expr(pol.polqual, c.oid) NOT LIKE '%profiles.id%'
    ) THEN '✅ FIXED'
    ELSE '❌ NOT FIXED'
  END
UNION ALL
SELECT 
  'WITH CHECK Clauses',
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_policies p
      JOIN pg_class c ON c.relname = p.tablename
      JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
      WHERE p.cmd = 'ALL'
        AND p.tablename IN ('fixed_banners', 'hero_slider_items', 'order_items', 'popup_campaigns')
        AND pg_get_expr(pol.polwithcheck, c.oid) IS NULL
    ) = 0 THEN '✅ ALL ADDED'
    ELSE '⚠️ SOME MISSING'
  END
UNION ALL
SELECT 
  'Referral Trigger',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_handle_referral_purchase'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT 
  'User Role Enum',
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) >= 4 THEN '✅ COMPLETE'
    ELSE '⚠️ INCOMPLETE'
  END;

