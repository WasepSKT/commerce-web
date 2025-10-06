-- RLS policies: allow users to insert their own product_reviews and allow RPC/owner to update orders

-- Enable RLS if not already enabled
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;


-- Make policies idempotent by dropping them first if they exist
DROP POLICY IF EXISTS product_reviews_insert_owner ON public.product_reviews;
CREATE POLICY product_reviews_insert_owner ON public.product_reviews
  FOR INSERT
  WITH CHECK ( auth.uid()::uuid = user_id );

DROP POLICY IF EXISTS orders_select_owner ON public.orders;
CREATE POLICY orders_select_owner ON public.orders
  FOR SELECT
  USING ( auth.uid()::uuid = user_id );

DROP POLICY IF EXISTS orders_update_owner ON public.orders;
CREATE POLICY orders_update_owner ON public.orders
  FOR UPDATE
  USING ( auth.uid()::uuid = user_id )
  WITH CHECK ( auth.uid()::uuid = user_id );

-- Note: Because RPC is SECURITY DEFINER, ensure the function validates auth.uid() as done in the RPC.
