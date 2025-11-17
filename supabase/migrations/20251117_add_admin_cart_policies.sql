-- Migration: add admin policies for carts
-- This migration grants admin-like roles permissions to read/update/delete carts
-- It safely drops any existing admin policies before creating new ones.

-- Admin SELECT
DROP POLICY IF EXISTS admin_select_cart ON public.carts;
CREATE POLICY admin_select_cart ON public.carts
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin','marketing','admin_sales')
  );

-- Admin UPDATE
DROP POLICY IF EXISTS admin_update_cart ON public.carts;
CREATE POLICY admin_update_cart ON public.carts
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin','marketing','admin_sales')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin','marketing','admin_sales')
  );

-- Admin DELETE
DROP POLICY IF EXISTS admin_delete_cart ON public.carts;
CREATE POLICY admin_delete_cart ON public.carts
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin','marketing','admin_sales')
  );

-- Optional: if you want admins to INSERT carts on behalf of users, add an INSERT policy similarly.
