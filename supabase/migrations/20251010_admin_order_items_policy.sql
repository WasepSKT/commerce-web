-- Ensure admins can SELECT all order_items for viewing in admin UI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Admins can view all order_items'
  ) THEN
    CREATE POLICY "Admins can view all order_items"
    ON public.order_items
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;


