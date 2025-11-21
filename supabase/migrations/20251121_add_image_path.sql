-- Migration: add image_path and image_gallery_paths to products
-- Generated: 2025-11-21

BEGIN;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS image_gallery_paths text[];

COMMIT;

-- Optional: if you'd like an index for faster lookups by path, uncomment below
-- CREATE INDEX IF NOT EXISTS idx_products_image_path ON public.products USING btree (image_path);
