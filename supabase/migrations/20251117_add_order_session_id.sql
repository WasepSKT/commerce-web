-- Add session_id to orders so we can map external payment sessions (Xendit invoice id)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS session_id text;

CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders (session_id);
