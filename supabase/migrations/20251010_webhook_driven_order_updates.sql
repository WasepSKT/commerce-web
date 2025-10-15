-- Webhook-driven payment and shipping updates
-- Adds provider/reference/status columns and RPCs for server-side updates

-- 1) Add columns if missing
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS shipping_status text;

-- 2) RPC: update order payment status (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.update_order_payment_from_webhook(
  p_order_id uuid,
  p_status text,
  p_provider text,
  p_reference text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev_status text;
BEGIN
  IF p_order_id IS NULL OR p_status IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Missing order id or status');
  END IF;

  SELECT status INTO v_prev_status FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Only allow forward transitions
  UPDATE public.orders
  SET status = CASE 
        WHEN p_status = 'paid' AND v_prev_status IN ('pending') THEN 'paid'
        WHEN p_status = 'completed' AND v_prev_status IN ('paid','shipped') THEN 'completed'
        WHEN p_status = 'cancelled' AND v_prev_status IN ('pending','paid') THEN 'cancelled'
        ELSE v_prev_status
      END,
      payment_provider = COALESCE(p_provider, payment_provider),
      payment_reference = COALESCE(p_reference, payment_reference),
      updated_at = now()
  WHERE id = p_order_id;

  RETURN json_build_object('success', true, 'order_id', p_order_id);
END;
$$;

-- 3) RPC: update order shipping status (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.update_order_shipping_from_webhook(
  p_order_id uuid,
  p_courier text,
  p_tracking text,
  p_shipping_status text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_order_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Missing order id');
  END IF;

  UPDATE public.orders
  SET 
    shipping_courier = COALESCE(p_courier, shipping_courier),
    tracking_number = COALESCE(p_tracking, tracking_number),
    shipping_status = COALESCE(p_shipping_status, shipping_status),
    status = CASE WHEN p_shipping_status = 'delivered' THEN 'completed' ELSE status END,
    updated_at = now()
  WHERE id = p_order_id;

  RETURN json_build_object('success', true, 'order_id', p_order_id);
END;
$$;

-- 4) Grants (server-side usage)
GRANT EXECUTE ON FUNCTION public.update_order_payment_from_webhook(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_shipping_from_webhook(uuid, text, text, text) TO authenticated;


