-- Payments schema enhancements for richer reconciliation and audit
-- - Add timestamps: paid_at, expired_at, failed_at
-- - Add channel info: payment_method, payment_channel
-- - Add failure info: failure_code, failure_message
-- - Add webhook metadata: webhook_received_at, webhook_headers
-- - Add/ensure useful indexes and idempotency constraint on payment_events.external_id

BEGIN;

-- payments table additions
ALTER TABLE IF EXISTS public.payments
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_channel text,
  ADD COLUMN IF NOT EXISTS failure_code text,
  ADD COLUMN IF NOT EXISTS failure_message text,
  ADD COLUMN IF NOT EXISTS webhook_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_headers jsonb;

-- payment_events table additions
ALTER TABLE IF EXISTS public.payment_events
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS headers jsonb;

-- indexes for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_payments_order_id'
  ) THEN
    CREATE INDEX idx_payments_order_id ON public.payments (order_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_payments_session_id'
  ) THEN
    CREATE INDEX idx_payments_session_id ON public.payments (session_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_payment_events_payment_id'
  ) THEN
    CREATE INDEX idx_payment_events_payment_id ON public.payment_events (payment_id);
  END IF;
END$$;

-- idempotency: unique external_id on payment_events when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_payment_events_external_id_not_null'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uq_payment_events_external_id_not_null ON public.payment_events (external_id) WHERE external_id IS NOT NULL';
  END IF;
END$$;

COMMIT;


