-- Trigger: call handle_referral_purchase when an order becomes completed

-- Create or replace trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.trigger_handle_referral_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act on updates where status changed to 'completed'
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
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

-- Create trigger (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_handle_referral_purchase'
  ) THEN
    CREATE TRIGGER trg_handle_referral_purchase
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed'))
    EXECUTE FUNCTION public.trigger_handle_referral_purchase();
  ELSE
    -- Ensure trigger exists with the correct definition by dropping and re-creating it
    PERFORM (
      'DROP TRIGGER IF EXISTS trg_handle_referral_purchase ON public.orders; CREATE TRIGGER trg_handle_referral_purchase AFTER UPDATE ON public.orders FOR EACH ROW WHEN (NEW.status = ''completed'' AND (OLD.status IS DISTINCT FROM ''completed'')) EXECUTE FUNCTION public.trigger_handle_referral_purchase();'
    );
  END IF;
END;
$$;

-- Note: The underlying function `public.handle_referral_purchase` is responsible for idempotency and business rules.
