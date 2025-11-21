-- Migration: create storage_delete_queue table and RPCs for enqueueing deletes
-- Run this in your Supabase SQL editor or apply via the Supabase CLI.

-- Ensure pgcrypto for gen_random_uuid is available (used for default ids)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Queue table for async storage deletions
CREATE TABLE IF NOT EXISTS public.storage_delete_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'product-images',
  path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text
);

-- RPC: update product row and enqueue removed storage paths for deletion
CREATE OR REPLACE FUNCTION public.rpc_update_product_gallery(
  product_id uuid,
  new_image_url text,
  new_image_gallery text[],
  new_image_path text,
  new_image_gallery_paths text[],
  removed_paths text[]
) RETURNS void AS $$
DECLARE
  prev_gallery text[];
  prev_gallery_paths text[];
  prev_image_path text;
  to_enqueue text[] := COALESCE(removed_paths, ARRAY[]::text[]);
  derived text;
BEGIN
  -- Read previous values (if any)
  SELECT image_gallery, image_gallery_paths, image_path
  INTO prev_gallery, prev_gallery_paths, prev_image_path
  FROM public.products WHERE id = product_id;

  -- Update product row
  UPDATE public.products
  SET image_url = new_image_url,
      image_gallery = new_image_gallery,
      image_path = new_image_path,
      image_gallery_paths = new_image_gallery_paths,
      updated_at = now()
  WHERE id = product_id;

  -- If caller didn't provide removed_paths, compute them server-side from previous values
  IF array_length(to_enqueue, 1) IS NULL THEN
    to_enqueue := ARRAY[]::text[];
  END IF;

  -- Enqueue previous single image_path if it changed
  IF prev_image_path IS NOT NULL AND (new_image_path IS NULL OR prev_image_path <> new_image_path) THEN
    to_enqueue := array_append(to_enqueue, prev_image_path);
  END IF;

  -- Enqueue previous gallery paths that are no longer present in the new gallery paths
  IF prev_gallery_paths IS NOT NULL THEN
    INSERT INTO public.storage_delete_queue (bucket, path)
    SELECT 'product-images', p
    FROM unnest(prev_gallery_paths) AS p
    WHERE p IS NOT NULL AND trim(p) <> '' AND NOT (p = ANY (COALESCE(new_image_gallery_paths, ARRAY[]::text[])))
    ON CONFLICT (path) DO NOTHING;
  ELSE
    -- If there were no stored gallery paths, try to derive storage paths from previous public URLs
    IF prev_gallery IS NOT NULL THEN
      -- iterate by index to get scalar text elements (avoids record loop errors)
      FOR i IN array_lower(prev_gallery, 1) .. array_upper(prev_gallery, 1) LOOP
        derived := regexp_replace(prev_gallery[i], '^.*?/storage/v1/object/public/product-images/', '');
        IF derived IS NOT NULL AND trim(derived) <> '' AND NOT (
          derived = ANY (COALESCE(new_image_gallery_paths, ARRAY[]::text[]))
          OR prev_gallery[i] = ANY (COALESCE(new_image_gallery, ARRAY[]::text[]))
        ) THEN
          INSERT INTO public.storage_delete_queue (bucket, path)
          VALUES ('product-images', derived)
          ON CONFLICT (path) DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- If caller supplied explicit removed_paths, enqueue them too (idempotent)
  IF array_length(removed_paths, 1) IS NOT NULL THEN
    INSERT INTO public.storage_delete_queue (bucket, path)
    SELECT 'product-images', p FROM unnest(removed_paths) AS p
    WHERE p IS NOT NULL AND trim(p) <> ''
    ON CONFLICT (path) DO NOTHING;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: delete product and enqueue its stored paths (if any)
CREATE OR REPLACE FUNCTION public.rpc_delete_product_enqueue(
  product_id uuid,
  removed_paths text[]
) RETURNS void AS $$
BEGIN
  -- Enqueue removed paths first
  IF removed_paths IS NOT NULL THEN
    INSERT INTO public.storage_delete_queue (bucket, path)
    SELECT 'product-images', p FROM unnest(removed_paths) AS p WHERE p IS NOT NULL;
  END IF;

  -- Delete the product row
  DELETE FROM public.products WHERE id = product_id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated role so logged-in admin users can call the RPCs
GRANT EXECUTE ON FUNCTION public.rpc_update_product_gallery(uuid, text, text[], text, text[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_product_enqueue(uuid, text[]) TO authenticated;
