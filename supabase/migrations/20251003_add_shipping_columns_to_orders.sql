-- Add shipping columns to orders table
-- Up
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_courier text,
ADD COLUMN IF NOT EXISTS tracking_number text;

-- Down (rollback)
-- To rollback, run the statements below
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_courier;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS tracking_number;
