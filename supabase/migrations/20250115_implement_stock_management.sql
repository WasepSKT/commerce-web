-- Implement Stock Management System
-- Migration: 20250115_implement_stock_management.sql

-- Ensure we drop the existing function if it has a different return type
DROP FUNCTION IF EXISTS decrement_stock_for_order(UUID);

-- 1. Create function to decrement stock for an order
CREATE OR REPLACE FUNCTION decrement_stock_for_order(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Create a local alias to avoid ambiguity between the parameter name
  -- and any column named "order_id" in queries. We keep the external
  -- parameter name `order_id` so RPC callers don't need to change, but
  -- use `p_order_id` internally.
  p_order_id ALIAS FOR $1;
  order_item RECORD;
  product_record RECORD;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  result JSON;
BEGIN
  -- Log function call
  RAISE LOG 'decrement_stock_for_order called for order_id: %', p_order_id;
  
  -- Validate input
  IF p_order_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order ID is required'
    );
  END IF;
  
  -- Check if order exists
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;
  
  -- Loop through all order items and decrement stock
  FOR order_item IN 
    SELECT oi.product_id, oi.quantity, p.name as product_name, p.stock_quantity
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = p_order_id
  LOOP
    -- Check if sufficient stock is available
    IF order_item.stock_quantity < order_item.quantity THEN
      RAISE LOG 'Insufficient stock for product % (ID: %). Required: %, Available: %', 
        order_item.product_name, order_item.product_id, order_item.quantity, order_item.stock_quantity;
      
      error_count := error_count + 1;
      CONTINUE;
    END IF;
    
    -- Decrement stock (ensure it doesn't go below 0)
    UPDATE products 
    SET 
      stock_quantity = GREATEST(stock_quantity - order_item.quantity, 0),
      updated_at = now()
    WHERE id = order_item.product_id;
    
    -- Check if update was successful
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
  
  -- Build result
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

-- 2. Create function to check stock availability
CREATE OR REPLACE FUNCTION check_stock_availability(
  product_id UUID,
  required_quantity INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  result JSON;
BEGIN
  -- Validate input
  IF product_id IS NULL OR required_quantity IS NULL THEN
    RETURN json_build_object(
      'available', false,
      'error', 'Product ID and quantity are required'
    );
  END IF;
  
  -- Get product information
  SELECT id, name, stock_quantity, is_active
  INTO product_record
  FROM products
  WHERE id = product_id;
  
  -- Check if product exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'available', false,
      'error', 'Product not found'
    );
  END IF;
  
  -- Check if product is active
  IF NOT product_record.is_active THEN
    RETURN json_build_object(
      'available', false,
      'error', 'Product is not active'
    );
  END IF;
  
  -- Check stock availability
  IF product_record.stock_quantity >= required_quantity THEN
    result := json_build_object(
      'available', true,
      'product_id', product_id,
      'product_name', product_record.name,
      'required_quantity', required_quantity,
      'available_stock', product_record.stock_quantity,
      'remaining_after_purchase', product_record.stock_quantity - required_quantity
    );
  ELSE
    result := json_build_object(
      'available', false,
      'product_id', product_id,
      'product_name', product_record.name,
      'required_quantity', required_quantity,
      'available_stock', product_record.stock_quantity,
      'error', 'Insufficient stock'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- 3. Create function to restore stock (for order cancellation)
CREATE OR REPLACE FUNCTION restore_stock_for_order(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_item RECORD;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  result JSON;
BEGIN
  -- Log function call
  RAISE LOG 'restore_stock_for_order called for order_id: %', order_id;
  
  -- Validate input
  IF order_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order ID is required'
    );
  END IF;
  
  -- Check if order exists
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = order_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;
  
  -- Loop through all order items and restore stock
  FOR order_item IN 
    SELECT oi.product_id, oi.quantity, p.name as product_name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_id
  LOOP
    -- Restore stock
    UPDATE products 
    SET 
      stock_quantity = stock_quantity + order_item.quantity,
      updated_at = now()
    WHERE id = order_item.product_id;
    
    -- Check if update was successful
    IF FOUND THEN
      updated_count := updated_count + 1;
      RAISE LOG 'Stock restored for product % (ID: %). Quantity restored: %', 
        order_item.product_name, 
        order_item.product_id, 
        order_item.quantity;
    ELSE
      error_count := error_count + 1;
      RAISE LOG 'Failed to restore stock for product % (ID: %)', 
        order_item.product_name, order_item.product_id;
    END IF;
  END LOOP;
  
  -- Build result
  result := json_build_object(
    'success', error_count = 0,
    'updated_products', updated_count,
    'errors', error_count,
    'order_id', order_id
  );
  
  RAISE LOG 'Stock restoration completed. Result: %', result;
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in restore_stock_for_order: %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', 'System error: ' || SQLERRM
  );
END;
$$;

-- 4. Create function to validate cart stock before checkout
CREATE OR REPLACE FUNCTION validate_cart_stock(cart_items JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cart_item JSON;
  product_record RECORD;
  validation_result JSON;
  all_valid BOOLEAN := true;
  errors JSON[] := '{}';
  valid_items JSON[] := '{}';
BEGIN
  -- Validate input
  IF cart_items IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Cart items are required'
    );
  END IF;
  
  -- Loop through cart items
  FOR cart_item IN SELECT * FROM json_array_elements(cart_items)
  LOOP
    -- Extract product_id and quantity from cart item
    DECLARE
      product_id UUID := (cart_item->>'product_id')::UUID;
      quantity INTEGER := (cart_item->>'quantity')::INTEGER;
    BEGIN
      -- Get product information
      SELECT id, name, stock_quantity, is_active
      INTO product_record
      FROM products
      WHERE id = product_id;
      
      -- Check if product exists and is active
      IF NOT FOUND THEN
        all_valid := false;
        errors := errors || json_build_object(
          'product_id', product_id,
          'error', 'Product not found'
        );
        CONTINUE;
      END IF;
      
      IF NOT product_record.is_active THEN
        all_valid := false;
        errors := errors || json_build_object(
          'product_id', product_id,
          'product_name', product_record.name,
          'error', 'Product is not active'
        );
        CONTINUE;
      END IF;
      
      -- Check stock availability
      IF product_record.stock_quantity < quantity THEN
        all_valid := false;
        errors := errors || json_build_object(
          'product_id', product_id,
          'product_name', product_record.name,
          'required_quantity', quantity,
          'available_stock', product_record.stock_quantity,
          'error', 'Insufficient stock'
        );
      ELSE
        valid_items := valid_items || json_build_object(
          'product_id', product_id,
          'product_name', product_record.name,
          'quantity', quantity,
          'available_stock', product_record.stock_quantity
        );
      END IF;
    END;
  END LOOP;
  
  -- Build validation result
  validation_result := json_build_object(
    'valid', all_valid,
    'valid_items', valid_items,
    'errors', errors,
    'total_items', json_array_length(cart_items),
    'valid_count', json_array_length(to_json(valid_items)),
    'error_count', json_array_length(to_json(errors))
  );
  
  RETURN validation_result;
END;
$$;

-- 5. Grant permissions
-- NOTE: core `decrement_stock_for_order` should NOT be granted to `authenticated` or `anon`.
-- It is intended to be called only by server-side code using the Supabase service role
-- or by an internal wrapper that validates JWT ownership. Keep other grants as needed.
GRANT EXECUTE ON FUNCTION check_stock_availability(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_stock_availability(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION restore_stock_for_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_stock_for_order(UUID) TO anon;
GRANT EXECUTE ON FUNCTION validate_cart_stock(JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_cart_stock(JSON) TO anon;

-- 6. Add comments
COMMENT ON FUNCTION decrement_stock_for_order(UUID) IS 
'Decrements product stock quantities for all items in an order. Returns success status and details.';

COMMENT ON FUNCTION check_stock_availability(UUID, INTEGER) IS 
'Checks if sufficient stock is available for a product and quantity. Returns availability status and details.';

COMMENT ON FUNCTION restore_stock_for_order(UUID) IS 
'Restores product stock quantities for all items in an order (used for order cancellation).';

COMMENT ON FUNCTION validate_cart_stock(JSON) IS 
'Validates stock availability for all items in a cart before checkout. Returns validation results.';

-- 7. Verify functions exist
SELECT 
  proname as function_name,
  proargnames as parameter_names,
  proargtypes::regtype[] as parameter_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('decrement_stock_for_order', 'check_stock_availability', 'restore_stock_for_order', 'validate_cart_stock')
ORDER BY proname;
