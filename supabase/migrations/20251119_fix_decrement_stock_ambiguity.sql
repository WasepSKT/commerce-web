-- Fix ambiguous reference to `order_id` parameter in decrement_stock_for_order
-- This migration replaces the function to use a local alias for the parameter

CREATE OR REPLACE FUNCTION decrement_stock_for_order(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_order_id ALIAS FOR $1;
  order_item RECORD;
  product_record RECORD;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  result JSON;
BEGIN
  RAISE LOG 'decrement_stock_for_order called for order_id: %', p_order_id;

  IF p_order_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order ID is required'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;

  FOR order_item IN 
    SELECT oi.product_id, oi.quantity, p.name as product_name, p.stock_quantity
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = p_order_id
  LOOP
    IF order_item.stock_quantity < order_item.quantity THEN
      RAISE LOG 'Insufficient stock for product % (ID: %). Required: %, Available: %', 
        order_item.product_name, order_item.product_id, order_item.quantity, order_item.stock_quantity;
      error_count := error_count + 1;
      CONTINUE;
    END IF;

    UPDATE products 
    SET 
      stock_quantity = GREATEST(stock_quantity - order_item.quantity, 0),
      updated_at = now()
    WHERE id = order_item.product_id;

    IF FOUND THEN
      updated_count := updated_count + 1;
      RAISE LOG 'Stock decremented for product % (ID: %). New stock: %', 
        order_item.product_name, 
        order_item.product_id, 
        (SELECT stock_quantity FROM products WHERE id = order_item.product_id);
    ELSE
      error_count := error_count + 1;
      RAISE LOG 'Failed to update stock for product % (ID: %)', 
        order_item.product_name, order_item.product_id;
    END IF;
  END LOOP;

  result := json_build_object(
    'success', error_count = 0,
    'updated_products', updated_count,
    'errors', error_count,
    'order_id', p_order_id
  );

  RAISE LOG 'Stock decrement completed. Result: %', result;
  RETURN result;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in decrement_stock_for_order: %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', 'System error: ' || SQLERRM
  );
END;
$$;

-- Grant execute to authenticated/anon if desired (keeps previous grants)
GRANT EXECUTE ON FUNCTION decrement_stock_for_order(UUID) TO authenticated;
