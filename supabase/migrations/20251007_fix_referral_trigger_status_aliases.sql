-- Migration: make referral trigger accept multiple status aliases
-- This helps when the app uses localized status values like 'selesai' or 'complete'
BEGIN;

-- Replace trigger function: compare status as text and accept a small set of synonyms
CREATE OR REPLACE FUNCTION public.trigger_handle_referral_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only act on updates where status changed to a 'completed' synonym
  IF TG_OP = 'UPDATE' AND (NEW.status)::text IN ('completed','selesai','complete') AND ((OLD.status)::text IS DISTINCT FROM (NEW.status)::text) THEN
    BEGIN
      PERFORM public.handle_referral_purchase(NEW.id::text, NEW.user_id::uuid, NEW.total_amount::numeric);
    EXCEPTION WHEN OTHERS THEN
      -- Do not abort the order transaction if referral processing fails; log a notice
      RAISE NOTICE 'trigger_handle_referral_purchase: handle_referral_purchase failed for order %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on orders (create if missing)
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
    EXECUTE FUNCTION public.trigger_handle_referral_purchase();
  END IF;
END
$$;

COMMIT;
