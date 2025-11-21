-- Migration: Remove storage_delete_queue table and related RPCs
-- This migration removes the queue-based deletion system in favor of inline deletion

-- Drop RPC functions first (they depend on the table)
DROP FUNCTION IF EXISTS public.rpc_update_product_gallery(uuid, text, text[], text, text[], text[]);
DROP FUNCTION IF EXISTS public.rpc_delete_product_enqueue(uuid, text[]);

-- Drop the storage_delete_queue table
DROP TABLE IF EXISTS public.storage_delete_queue;

-- Note: Inline deletion is now handled directly in useProductCRUD.ts
-- No worker or queue processing is needed

