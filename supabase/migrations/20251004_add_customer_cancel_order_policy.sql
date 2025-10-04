-- Add policies to allow customers to cancel their own orders and confirm delivery
-- Policy for cancelling pending orders
CREATE POLICY "Users can cancel pending orders" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id AND 
  status = 'cancelled'
);

-- Policy for confirming delivery of shipped orders
CREATE POLICY "Users can confirm delivery of shipped orders" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  status = 'shipped'
)
WITH CHECK (
  auth.uid() = user_id AND 
  status = 'completed'
);