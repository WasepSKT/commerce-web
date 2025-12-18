-- Add authenticated client policies for product-images (upload/update/delete)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Authenticated users can upload product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload product images" ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Authenticated users can update product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can update product images" ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
      WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Authenticated users can delete product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can delete product images" ON storage.objects
      FOR DELETE
      USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
END$$;

-- Return created or existing policies for product-images
SELECT p.polname, pg_get_expr(p.polqual, p.polrelid) AS using_expr, pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'storage' AND c.relname = 'objects' AND p.polname ILIKE '%product%'
ORDER BY p.polname;
