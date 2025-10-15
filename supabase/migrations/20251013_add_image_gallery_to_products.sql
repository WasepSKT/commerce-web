-- 2025-10-13: Add image_gallery jsonb column to products and backfill from image_url
/*
    Migration: add image_gallery jsonb column to products
    - Adds column with default '[]' to avoid table rewrite where possible
    - Backfills existing rows where appropriate using image_url as the first element
    - Ensures column is NOT NULL and indexed with GIN
*/

BEGIN;

-- 1) Add column with default empty array if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='image_gallery'
    ) THEN
        ALTER TABLE public.products ADD COLUMN image_gallery jsonb DEFAULT '[]'::jsonb;
    END IF;
END$$;

-- 2) Backfill: convert existing image_url into an array (preserve as first item) only when image_gallery is empty
UPDATE public.products
SET image_gallery = to_jsonb(ARRAY[image_url]::text[])
WHERE (image_gallery IS NULL OR jsonb_array_length(coalesce(image_gallery, '[]'::jsonb)) = 0)
    AND image_url IS NOT NULL AND trim(image_url) <> '';

-- 3) Ensure NOT NULL constraint to enforce array shape going forward
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='image_gallery' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.products ALTER COLUMN image_gallery SET NOT NULL;
    END IF;
END$$;

-- 4) Create a GIN index for jsonb if it's not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_image_gallery'
    ) THEN
        CREATE INDEX idx_products_image_gallery ON public.products USING gin (image_gallery);
    END IF;
END$$;

COMMIT;
