-- Enforce allowed MIME types for product-images on INSERT and UPDATE
DO $$
BEGIN
  -- Drop existing INSERT policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Authenticated users can upload product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    DROP POLICY "Authenticated users can upload product images" ON storage.objects;
  END IF;

  -- Create INSERT policy with MIME type check
  CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'product-images' AND
      auth.role() = 'authenticated' AND
      (content_type IS NOT NULL AND content_type IN ('image/jpeg','image/png','image/webp','image/gif'))
    );

  -- Drop existing UPDATE policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Authenticated users can update product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    DROP POLICY "Authenticated users can update product images" ON storage.objects;
  END IF;

  -- Create UPDATE policy with MIME type check on new values
  CREATE POLICY "Authenticated users can update product images" ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'product-images' AND auth.role() = 'authenticated'
    )
    WITH CHECK (
      bucket_id = 'product-images' AND
      auth.role() = 'authenticated' AND
      (content_type IS NOT NULL AND content_type IN ('image/jpeg','image/png','image/webp','image/gif'))
    );
END$$;

-- Return product-images related policies for verification
SELECT p.polname, CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL' ELSE p.polcmd END AS command,
  pg_get_expr(p.polqual, p.polrelid) AS using_expr, pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'storage' AND c.relname = 'objects' AND (p.polname ILIKE '%product%' OR pg_get_expr(p.polqual, p.polrelid) ILIKE '%product-images%' OR pg_get_expr(p.polwithcheck, p.polrelid) ILIKE '%product-images%')
ORDER BY p.polname;