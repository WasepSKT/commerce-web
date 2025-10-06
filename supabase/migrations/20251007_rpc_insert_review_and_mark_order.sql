-- RPC to insert a product review and mark the order as rated in one transaction
CREATE OR REPLACE FUNCTION public.insert_review_and_mark_order(
  p_user_id uuid,
  p_order_id uuid,
  p_product_id uuid,
  p_rating integer,
  p_comment text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- ensure caller is the same user (prevent abuse despite SECURITY DEFINER)
  IF auth.uid() IS NULL OR auth.uid()::uuid <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  -- insert into product_reviews
  INSERT INTO public.product_reviews(user_id, order_id, product_id, rating, comment, created_at, updated_at)
  VALUES (p_user_id, p_order_id, p_product_id, p_rating, p_comment, now(), now());

  -- update orders to mark as rated
  UPDATE public.orders
  SET rating = p_rating, rated_at = now(), updated_at = now()
  WHERE id = p_order_id;
END;
$$;
