-- Fix: Use FOREACH instead of subquery in RPCs to avoid 'more than one row returned by a subquery used as an expression' (error 21000)
-- Safe to run multiple times (CREATE OR REPLACE)

-- Update rpc_update_product_gallery to use FOREACH
CREATE OR REPLACE FUNCTION public.rpc_update_product_gallery(
  product_id uuid,
  new_image_url text,
  new_image_gallery text[],
  new_image_path text,
  new_image_gallery_paths text[],
  removed_paths text[]
) RETURNS void AS $$
DECLARE
  p text;
BEGIN
  -- Update product row
  UPDATE public.products
  SET image_url = new_image_url,
      image_gallery = new_image_gallery,
      image_path = new_image_path,
      image_gallery_paths = new_image_gallery_paths,
      updated_at = now()
  WHERE id = product_id;

  -- Enqueue any removed storage paths for background deletion using FOREACH
  IF removed_paths IS NOT NULL THEN
    FOREACH p IN ARRAY removed_paths LOOP
      IF p IS NOT NULL THEN
        INSERT INTO public.storage_delete_queue (bucket, path)
        VALUES ('product-images', p);
      END IF;
    END LOOP;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update rpc_delete_product_enqueue to use FOREACH
CREATE OR REPLACE FUNCTION public.rpc_delete_product_enqueue(
  product_id uuid,
  removed_paths text[]
) RETURNS void AS $$
DECLARE
  p text;
BEGIN
  -- Enqueue removed paths first
  IF removed_paths IS NOT NULL THEN
    FOREACH p IN ARRAY removed_paths LOOP
      IF p IS NOT NULL THEN
        INSERT INTO public.storage_delete_queue (bucket, path)
        VALUES ('product-images', p);
      END IF;
    END LOOP;
  END IF;

  -- Delete the product row
  DELETE FROM public.products WHERE id = product_id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.rpc_update_product_gallery(uuid, text, text[], text, text[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_product_enqueue(uuid, text[]) TO authenticated;
