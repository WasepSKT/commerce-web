-- Update RLS policies to allow admin-like roles (marketing, admin_sales) where appropriate
-- This migration updates existing policies that check for role = 'admin' to include
-- marketing and admin_sales so they can manage resources intended for admin users.

-- Example: update referral_settings policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_settings') THEN
    -- rename existing policy if present (safe-noop if not present)
    BEGIN
      ALTER POLICY "Admins can manage referral settings" ON public.referral_settings
        RENAME TO "Admins and related roles can manage referral settings";
    EXCEPTION WHEN undefined_object THEN
      -- ignore if the named policy does not exist
      NULL;
    END;

    DROP POLICY IF EXISTS "Admins and related roles can manage referral settings" ON public.referral_settings;

    CREATE POLICY "Admins and related roles can manage referral settings" ON public.referral_settings
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing','admin_sales'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing','admin_sales'))
      );
  END IF;
END
$$;

-- Update other policies that were originally admin-only. Add more updates below as needed.

-- Example update for referral_levels policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_levels') THEN
    DROP POLICY IF EXISTS "Admins can manage referral levels" ON public.referral_levels;
    CREATE POLICY "Admins and related roles can manage referral levels" ON public.referral_levels
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing','admin_sales'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing','admin_sales'))
      );
  END IF;
END
$$;

-- Add similar policy replacements for tables that need to be managed by marketing/admin_sales
-- (products, orders, campaigns, blogs, etc.). Below are templates you can copy/modify.

-- Products
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
    CREATE POLICY "Admins and related roles can manage products" ON public.products
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','admin_sales'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','admin_sales'))
      );
  END IF;
END
$$;

-- Orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
    CREATE POLICY "Admins and related roles can manage orders" ON public.orders
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','admin_sales'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','admin_sales'))
      );
  END IF;
END
$$;

-- Campaigns (marketing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.campaigns;
    CREATE POLICY "Admins and related roles can manage campaigns" ON public.campaigns
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing'))
      );
  END IF;
END
$$;

-- Blogs (marketing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blogs') THEN
    ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;
    CREATE POLICY "Admins and related roles can manage blogs" ON public.blogs
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','marketing'))
      );
  END IF;
END
$$;

-- Payments: only admin and admin_sales
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
    CREATE POLICY "Admins and related roles can manage payments" ON public.payments
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','admin_sales'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','admin_sales'))
      );
  END IF;
END
$$;

-- Note: This migration is additive and intended to align RLS checks with frontend role semantics.
-- Review each policy to ensure the intended roles have appropriate access.
