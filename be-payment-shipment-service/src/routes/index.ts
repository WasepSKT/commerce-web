import { Router } from 'express';
import { apiKeyAuth } from '../security';
import { createInvoice, getInvoice, xenditWebhook } from '../controllers/invoiceController';
import { createPaymentSession } from '../controllers/paymentsController';
import { config } from '../config';
import { createShipping, getShippingRates, getShippingRatesLegacy, createShippingLegacy, jubelioWebhook } from '../controllers/shippingController';
import { getAreas, getCities, getDistricts, getProvinces, searchRegions } from '../controllers/regionsController';
import { supabase } from '../clients/supabaseClient';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, env: config.env }));
router.get('/health/db', async (_req, res) => {
		try {
			if (!supabase) return res.status(503).json({ ok: false, error: 'DB client not configured. Check SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' });
		// Lightweight test: select 1 using RPC fallback if available, else query a table likely to exist
		const { error } = await supabase.from('orders').select('id').limit(1);
		if (error) {
			console.error('[health/db] supabase error:', error);
				return res.status(500).json({ ok: false, error: error.message });
		}
		return res.json({ ok: true });
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : 'unknown';
			return res.status(500).json({ ok: false, error: message });
		}
});

router.post('/invoices', apiKeyAuth, createInvoice);
router.get('/invoices/:id', apiKeyAuth, getInvoice);
router.post('/webhooks/xendit', xenditWebhook);
router.post('/webhooks/jubelio', jubelioWebhook);

// Public endpoint for FE to initiate payment session (no api key; rely on CORS/rate-limit)
router.post('/payments/create-session', createPaymentSession);

// Shipping endpoints (rates can be public, creation protected by api key)
router.post('/shipping/rates', getShippingRates); // new structured
router.post('/shipping/create', apiKeyAuth, createShipping); // new structured

// Legacy-compatible endpoints used by current FE
router.get('/shipping/rates', getShippingRatesLegacy);
// Harden legacy create endpoint with API key protection as requested
router.post('/shipping/create-shipment', apiKeyAuth, createShippingLegacy);

// Region proxy endpoints to assist area_id lookup
router.get('/regions', searchRegions);
router.get('/region/provinces', getProvinces);
router.get('/region/cities/:province_id', getCities);
router.get('/region/districts/:city_id', getDistricts);
router.get('/region/areas/:district_id', getAreas);

export default router;
