-- Migration: update referral trigger to also fire when orders are marked 'paid'
-- This makes the DB call the idempotent handler when status transitions to 'paid' or 'completed'.
-- Apply via `supabase db push` or run this SQL in your Supabase DB.

-- Drop any existing trigger and recreate with a broader WHEN clause.
DROP TRIGGER IF EXISTS trg_handle_referral_purchase ON public.orders;

CREATE TRIGGER trg_handle_referral_purchase
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (NEW.status IN ('paid','completed') AND (OLD.status IS DISTINCT FROM NEW.status))
EXECUTE FUNCTION public.trigger_handle_referral_purchase();

-- Note: the underlying function `public.trigger_handle_referral_purchase` calls
-- the idempotent `public.handle_referral_purchase` function which inserts a
-- `referral_purchases` row if one does not already exist for the order.
