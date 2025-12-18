-- Add product-images storage bucket and policies if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('product-images','product-images', true);
  END IF;
END$$;

-- Create public read policy for product-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Public read product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
  END IF;
END$$;

-- Create admin/marketing write policy for product-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Admin write product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    CREATE POLICY "Admin write product images" ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'product-images' AND (
          EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin'::user_role, 'marketing'::user_role, 'admin_sales'::user_role))
        )
      )
      WITH CHECK (
        bucket_id = 'product-images' AND (
          EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin'::user_role, 'marketing'::user_role, 'admin_sales'::user_role))
        )
      );
  END IF;
END$$;

-- Return bucket visibility
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
