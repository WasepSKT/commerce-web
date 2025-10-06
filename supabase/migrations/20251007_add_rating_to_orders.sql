-- Add rating and rated_at columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS rating integer NULL,
  ADD COLUMN IF NOT EXISTS rated_at timestamptz NULL;

-- optional index to help queries by rated_at
CREATE INDEX IF NOT EXISTS idx_orders_rated_at ON public.orders (rated_at);
