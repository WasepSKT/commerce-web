-- Remove Admin write product images policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'Admin write product images' AND n.nspname = 'storage' AND c.relname = 'objects'
  ) THEN
    DROP POLICY "Admin write product images" ON storage.objects;
  END IF;
END$$;

-- Return remaining product-images related policies for verification
SELECT p.polname, CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL' ELSE p.polcmd END AS command, pg_get_expr(p.polqual, p.polrelid) AS using_expr, pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'storage' AND c.relname = 'objects' AND (p.polname ILIKE '%product%' OR pg_get_expr(p.polqual, p.polrelid) ILIKE '%product-images%' OR pg_get_expr(p.polwithcheck, p.polrelid) ILIKE '%product-images%')
ORDER BY p.polname;