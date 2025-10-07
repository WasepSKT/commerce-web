-- Migration: create trigger function and trigger to call handle_referral_purchase
-- Idempotent: drops if exists and recreates
BEGIN;

-- Create or replace the trigger function that will call the idempotent handler
CREATE OR REPLACE FUNCTION public.trigger_handle_referral_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- Create the trigger if not exists. Postgres doesn't have CREATE TRIGGER IF NOT EXISTS, so we check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'trg_handle_referral_purchase' AND c.relname = 'orders'
  ) THEN
    CREATE TRIGGER trg_handle_referral_purchase
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM 'completed')
    EXECUTE FUNCTION public.trigger_handle_referral_purchase();
  END IF;
END
$$;

COMMIT;
