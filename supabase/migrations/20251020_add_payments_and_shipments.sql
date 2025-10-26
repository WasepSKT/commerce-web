-- Payments and Shipments schema for webhook-driven flows
-- Safe to run multiple times with IF NOT EXISTS guards

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  provider text NOT NULL,
  session_id text UNIQUE,
  amount numeric,
  currency text DEFAULT 'IDR',
  status text,
  invoice_url text,
  created_at timestamptz DEFAULT now()
);

-- payment_events
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  event_type text,
  external_id text UNIQUE,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  courier_name text,
  courier_id int,
  courier_service_name text,
  courier_service_id int,
  awb text UNIQUE,
  tracking_url text,
  price numeric,
  status text,
  created_at timestamptz DEFAULT now()
);

-- shipment_events
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE,
  status text,
  status_detail text,
  event_time timestamptz,
  external_id text UNIQUE,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON public.payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON public.shipment_events(shipment_id);

-- Grants (adjust roles as needed)
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT ON public.payment_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.shipments TO authenticated;
GRANT SELECT, INSERT ON public.shipment_events TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

-- Idempotent: drop policies if they exist before (re)creating
DROP POLICY IF EXISTS payments_select_owner ON public.payments;
DROP POLICY IF EXISTS payment_events_select_owner ON public.payment_events;
DROP POLICY IF EXISTS shipments_select_owner ON public.shipments;
DROP POLICY IF EXISTS shipment_events_select_owner ON public.shipment_events;

-- Allow users to SELECT only their own data (via orders.user_id = auth.uid())
CREATE POLICY payments_select_owner ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND o.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY payment_events_select_owner ON public.payment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.orders o ON o.id = p.order_id
      WHERE p.id = payment_events.payment_id
        AND o.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY shipments_select_owner ON public.shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
        AND o.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY shipment_events_select_owner ON public.shipment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.shipments s
      JOIN public.orders o ON o.id = s.order_id
      WHERE s.id = shipment_events.shipment_id
        AND o.user_id = auth.uid()::uuid
    )
  );
