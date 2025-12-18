-- Create Admin can manage hero slider images policy (ALL) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Admin can manage hero slider images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    CREATE POLICY "Admin can manage hero slider images" ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'hero-slider-images' AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid() AND p.role = ANY (ARRAY['admin'::user_role, 'marketing'::user_role, 'admin_sales'::user_role])
        )
      )
      WITH CHECK (
        bucket_id = 'hero-slider-images' AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid() AND p.role = ANY (ARRAY['admin'::user_role, 'marketing'::user_role, 'admin_sales'::user_role])
        )
      );
  END IF;
END$$;

-- Return the policy if present
SELECT p.polname, pg_get_expr(p.polqual, p.polrelid) AS using_expr, pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'storage' AND c.relname = 'objects' AND p.polname = 'Admin can manage hero slider images';
