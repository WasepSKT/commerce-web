# Regal Paw – Payment + Shipment Service

A consolidated backend for Payments (Xendit) and Shipping (Jubelio). Built with Express + TypeScript.

## What this service does
- Payment session creation to Xendit Invoice (/api/payments/create-session)
- Xendit invoice create/get (protected by x-api-key)
- Xendit webhook handler to persist payment events and update orders
- Shipping quotes and shipment creation via Jubelio
- Jubelio webhook handler to persist shipment events and update orders
- Health checks, region proxy helpers for area_id lookup

## Endpoints (prefix: /api)
- GET /health
- GET /health/db
- POST /payments/create-session
- POST /invoices (x-api-key)
- GET /invoices/:id (x-api-key)
- POST /webhooks/xendit
- POST /webhooks/jubelio
- POST /shipping/rates
- POST /shipping/create (x-api-key)
- GET /shipping/rates (legacy shape)
- POST /shipping/create-shipment (legacy shape)
- Region proxy: /regions, /region/provinces, /region/cities/:province_id, /region/districts/:city_id, /region/areas/:district_id

## Configure
1) Copy .env.example → .env and fill values.
2) Ensure Supabase has the migration in supabase/migrations/20251020_add_payments_and_shipments.sql applied.

Required env highlights:
- SERVICE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- XENDIT_SECRET_KEY, XENDIT_WEBHOOK_TOKEN
- JUBELIO_API_BASE_URL and one of: JUBELIO_API_TOKEN or (JUBELIO_CLIENT_ID + JUBELIO_CLIENT_SECRET) or (JUBELIO_USERNAME + JUBELIO_PASSWORD)
- ORIGIN_* values for default warehouse

## Run locally
- Install deps: npm install
- Dev mode: npm run dev
- Build: npm run build
- Start: npm start

Health check URLs:
- http://localhost:3001/api/health
- http://localhost:3001/api/health/db

## FE integration
Set in the frontend .env:
- VITE_PAYMENT_API_URL=https://your-domain/api
- VITE_SHIPMENT_API_URL=https://your-domain/api

The FE calls:
- POST {VITE_PAYMENT_API_URL}/payments/create-session { order_id, return_url, payment_method?, payment_channel? }
- GET {VITE_SHIPMENT_API_URL}/shipping/rates?to_postal=...&weight=...
- POST {VITE_SHIPMENT_API_URL}/shipping/create-shipment { order_id, provider, service_code, address, parcels }

## Notes
- CORS allowlist: localhost in dev, *.regalpaw.id in prod, or override via ALLOWED_ORIGINS
- Rate limit: 60 req/min/IP
- Trust proxy: enabled only in production
- Webhook auth: via x-callback-token headers
