-- Add latest_payment_id to orders to link the most recent payment
-- Idempotent: safe to run multiple times

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS latest_payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL;

-- Optional index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_latest_payment_id ON public.orders (latest_payment_id);

-- Grant select/update to authenticated as appropriate (adjust roles if needed)
GRANT SELECT, UPDATE ON public.orders TO authenticated;

-- Note: If you use RLS, ensure policies allow updating this column via server-side webhook or admin role.
