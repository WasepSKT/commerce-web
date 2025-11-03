-- ============================================================
-- CONSOLIDATED FIXES MIGRATION
-- Date: 2025-11-02
-- Purpose: Consolidate all recent fixes to avoid duplicates and conflicts
-- This migration is IDEMPOTENT - safe to run multiple times
-- Best Practices: Atomic transactions, safety checks, error handling
-- ============================================================

BEGIN;

-- ============================================================
-- PRE-FLIGHT CHECKS - Ensure dependencies exist
-- ============================================================
DO $$
DECLARE
  missing_tables TEXT[];
  missing_functions TEXT[];
BEGIN
  -- Check required tables exist
  SELECT ARRAY_AGG(table_name) INTO missing_tables
  FROM (
    VALUES ('profiles'), ('hero_slider_items'), ('fixed_banners'), 
           ('order_items'), ('popup_campaigns'), ('orders')
  ) AS required(tbl)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = required.tbl
  );

  IF missing_tables IS NOT NULL AND array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %. Please run base migrations first.', 
      array_to_string(missing_tables, ', ');
  END IF;

  -- Check required function exists (for trigger)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_referral_purchase'
  ) THEN
    RAISE WARNING 'handle_referral_purchase function not found. Trigger will fail if called.';
  END IF;

END $$;

-- ============================================================
-- 1. FIX HERO SLIDER ITEMS POLICY BUG
-- ============================================================
-- Fix: Change profiles.id to profiles.user_id in policy
DROP POLICY IF EXISTS "Allow admin full access to hero slider items" ON hero_slider_items;

CREATE POLICY "Allow admin full access to hero slider items" ON hero_slider_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()  -- ✅ Fixed: user_id instead of id
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'marketing'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()  -- ✅ Fixed: user_id instead of id
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'marketing'::user_role])
  )
);

-- ============================================================
-- 2. ADD WITH CHECK CLAUSES TO POLICIES
-- ============================================================
-- Add WITH CHECK to policies that are missing it for better INSERT protection

-- fixed_banners policies (only if policy exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'fixed_banners' 
      AND policyname = 'Admin full access to fixed banners'
  ) THEN
    ALTER POLICY "Admin full access to fixed banners" ON fixed_banners
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid() 
          AND profiles.role = 'admin'::user_role
      )
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'fixed_banners' 
      AND policyname = 'Marketing access to fixed banners'
  ) THEN
    ALTER POLICY "Marketing access to fixed banners" ON fixed_banners
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid() 
          AND profiles.role = ANY (ARRAY['admin'::user_role, 'marketing'::user_role])
      )
    );
  END IF;
END $$;

-- hero_slider_items policies (only if policy exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'hero_slider_items' 
      AND policyname = 'Admin full access to hero sliders'
  ) THEN
    ALTER POLICY "Admin full access to hero sliders" ON hero_slider_items
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid() 
          AND profiles.role = 'admin'::user_role
      )
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'hero_slider_items' 
      AND policyname = 'Marketing access to hero sliders'
  ) THEN
    ALTER POLICY "Marketing access to hero sliders" ON hero_slider_items
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid() 
          AND profiles.role = ANY (ARRAY['admin'::user_role, 'marketing'::user_role])
      )
    );
  END IF;
END $$;

-- order_items policies (only if policy exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'order_items' 
      AND policyname = 'Admins can manage all order items'
  ) THEN
    ALTER POLICY "Admins can manage all order items" ON order_items
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid() 
          AND profiles.role = 'admin'::user_role
      )
    );
  END IF;
END $$;

-- popup_campaigns policies (only if policy exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'popup_campaigns' 
      AND policyname = 'Admin full access to popup campaigns'
  ) THEN
    ALTER POLICY "Admin full access to popup campaigns" ON popup_campaigns
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid() 
          AND profiles.role = 'admin'::user_role
      )
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'popup_campaigns' 
      AND policyname = 'Marketing access to popup campaigns'
  ) THEN
    ALTER POLICY "Marketing access to popup campaigns" ON popup_campaigns
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid() 
          AND profiles.role = ANY (ARRAY['admin'::user_role, 'marketing'::user_role])
      )
    );
  END IF;
END $$;

-- ============================================================
-- 3. CONSOLIDATE REFERRAL TRIGGER FUNCTION (FINAL VERSION)
-- ============================================================
-- This is the FINAL and CORRECT version that handles both 'paid' and 'completed'
-- Replaces all previous versions

CREATE OR REPLACE FUNCTION public.trigger_handle_referral_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act on updates where status changed to 'paid' or 'completed'
  IF TG_OP = 'UPDATE' AND NEW.status IN ('paid','completed') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    BEGIN
      -- Call existing handler. It is idempotent (checks referral_purchases existence).
      PERFORM public.handle_referral_purchase(NEW.id::text, NEW.user_id::uuid, NEW.total_amount::numeric);
    EXCEPTION WHEN OTHERS THEN
      -- Don't abort the order transaction if referral processing fails; log a notice instead.
      RAISE NOTICE 'trigger_handle_referral_purchase: handle_referral_purchase failed for order %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists with correct WHEN clause
DROP TRIGGER IF EXISTS trg_handle_referral_purchase ON public.orders;

CREATE TRIGGER trg_handle_referral_purchase
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (NEW.status IN ('paid','completed') AND (OLD.status IS DISTINCT FROM NEW.status))
EXECUTE FUNCTION public.trigger_handle_referral_purchase();

-- ============================================================
-- 4. ENSURE USER_ROLE ENUM HAS ALL VALUES
-- ============================================================
-- Idempotent: Only adds if doesn't exist
-- Note: ALTER TYPE ADD VALUE cannot be rolled back, so we check first
DO $$
DECLARE
  enum_exists BOOLEAN;
BEGIN
  -- Check if enum type exists
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) INTO enum_exists;

  IF NOT enum_exists THEN
    RAISE WARNING 'user_role enum type does not exist. Skipping enum value additions.';
    RETURN;
  END IF;

  -- Add 'marketing' role if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'marketing' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    BEGIN
      ALTER TYPE public.user_role ADD VALUE 'marketing';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to add marketing enum value: %', SQLERRM;
    END;
  END IF;

  -- Add 'admin_sales' role if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin_sales' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    BEGIN
      ALTER TYPE public.user_role ADD VALUE 'admin_sales';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to add admin_sales enum value: %', SQLERRM;
    END;
  END IF;
END $$;

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (Run separately to verify)
-- ============================================================
-- 
-- -- Check hero slider items policy
-- SELECT tablename, policyname, cmd, 
--   pg_get_expr(polqual, polrelid) as using_clause
-- FROM pg_policies p
-- JOIN pg_class c ON c.relname = p.tablename
-- JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
-- WHERE p.tablename = 'hero_slider_items' 
--   AND p.policyname = 'Allow admin full access to hero slider items';
--
-- -- Check trigger exists
-- SELECT tgname, tgrelid::regclass, tgenabled 
-- FROM pg_trigger 
-- WHERE tgname = 'trg_handle_referral_purchase';
--
-- -- Check user_role enum values
-- SELECT enumlabel FROM pg_enum 
-- WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
-- ORDER BY enumsortorder;

