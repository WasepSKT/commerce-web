-- Migration: update trigger function to handle orders marked 'paid' or 'completed'
-- This replaces the trigger function so it will call the idempotent handler when
-- order status becomes 'paid' or 'completed'.

CREATE OR REPLACE FUNCTION public.trigger_handle_referral_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act on updates where status changed to 'paid' or 'completed'
  IF TG_OP = 'UPDATE' AND NEW.status IN ('paid','completed') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    BEGIN
      -- Call existing handler. It is idempotent (checks referral_purchases existence).
      PERFORM public.handle_referral_purchase(NEW.id::text, NEW.user_id::uuid, NEW.total_amount::numeric);
    EXCEPTION WHEN OTHERS THEN
      -- Don't abort the order transaction if referral processing fails; log a notice instead.
      RAISE NOTICE 'trigger_handle_referral_purchase: handle_referral_purchase failed for order %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists and is created with the correct WHEN clause
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_handle_referral_purchase'
  ) THEN
    CREATE TRIGGER trg_handle_referral_purchase
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (NEW.status IN ('paid','completed') AND (OLD.status IS DISTINCT FROM NEW.status))
    EXECUTE FUNCTION public.trigger_handle_referral_purchase();
  ELSE
    -- Recreate trigger to ensure correct WHEN condition
    PERFORM (
      'DROP TRIGGER IF EXISTS trg_handle_referral_purchase ON public.orders; CREATE TRIGGER trg_handle_referral_purchase AFTER UPDATE ON public.orders FOR EACH ROW WHEN (NEW.status IN (''paid'',''completed'') AND (OLD.status IS DISTINCT FROM NEW.status)) EXECUTE FUNCTION public.trigger_handle_referral_purchase();'
    );
  END IF;
END;
$$;

-- Note: This function is intentionally idempotent and non-blocking. The underlying
-- handler `public.handle_referral_purchase` performs existence checks so calling it
-- multiple times or for both 'paid' and 'completed' transitions is safe.
