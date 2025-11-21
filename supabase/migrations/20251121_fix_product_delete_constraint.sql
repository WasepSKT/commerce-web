-- Migration: Fix product delete constraint for order_items
-- Allow product deletion by setting product_id to NULL in order_items when product is deleted
-- This preserves order history while allowing product deletion

-- First, check if constraint exists and get its name
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the foreign key constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.order_items'::regclass
      AND confrelid = 'public.products'::regclass
      AND contype = 'f'
    LIMIT 1;

    -- If constraint exists, drop it
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.order_items DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- Recreate constraint with ON DELETE SET NULL
-- This allows product deletion while preserving order history
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES public.products(id)
ON DELETE SET NULL;

-- Note: After this migration, when a product is deleted:
-- - order_items.product_id will be set to NULL
-- - Order history is preserved
-- - Product can be safely deleted even if referenced in orders

