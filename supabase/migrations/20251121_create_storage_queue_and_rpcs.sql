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
BEGIN
  -- Update product row
  UPDATE public.products
  SET image_url = new_image_url,
      image_gallery = new_image_gallery,
      image_path = new_image_path,
      image_gallery_paths = new_image_gallery_paths,
      updated_at = now()
  WHERE id = product_id;

  -- Enqueue any removed storage paths for background deletion
  IF removed_paths IS NOT NULL THEN
    PERFORM (
      SELECT 1 FROM unnest(removed_paths) AS p
      WHERE p IS NOT NULL
      -- Insert each non-null path into the queue
      -- We use INSERT ... SELECT to avoid plpgsql loops for simplicity
      -- Note: the resulting rows will have default id and created_at
    );

    INSERT INTO public.storage_delete_queue (bucket, path)
    SELECT 'product-images' AS bucket, p AS path
    FROM unnest(removed_paths) AS p
    WHERE p IS NOT NULL;
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
