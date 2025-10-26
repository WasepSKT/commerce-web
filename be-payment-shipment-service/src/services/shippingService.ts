import { config } from '../config';
import { getJubelioClient } from '../clients/jubelioClient';
import { CreateShipmentRequest, RateQuote, RateQuoteRequest, Shipment } from '../types';
import axios from 'axios';

type HttpError = Error & { status?: number };

function httpError(message: string, status: number): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
}

function isConfigured() {
  return Boolean(config.shipping.jubelio.apiBaseUrl);
}

export async function getRates(req: RateQuoteRequest): Promise<RateQuote[]> {
  if (!isConfigured()) throw httpError('Shipping not configured', 501);
  // Mock mode for local testing without real Jubelio creds
  if (String(config.shipping.jubelio.apiBaseUrl).toLowerCase() === 'mock') {
    return [
      { carrier: 'jne', service: 'REG', price_idr: 12000, currency: 'IDR', etd_days: 2 },
      { carrier: 'jnt', service: 'EZ', price_idr: 13000, currency: 'IDR', etd_days: 2 },
      { carrier: 'sicepat', service: 'REG', price_idr: 11000, currency: 'IDR', etd_days: 3 },
    ];
  }
  const client = getJubelioClient();
  const body = {
    origin: {
      area_id: config.shipping.jubelio.originAreaId || undefined,
      zipcode: config.shipping.jubelio.originZipcode || undefined,
      coordinate: undefined,
    },
    destination: {
      // In real-world, map postal/district to area_id via Regions API. Here we pass zipcode with unknown area_id.
      area_id: (req.destination as unknown as { area_id?: string })?.area_id || undefined,
      zipcode: req.destination.postal_code,
      coordinate: undefined,
    },
    package_detail: {
      width: req.parcel.width_cm ?? 10,
      height: req.parcel.height_cm ?? 10,
      length: req.parcel.length_cm ?? 10,
      weight: Math.max(1, req.parcel.weight_gram),
    },
    items: [
      {
        quantity: 1,
        weight: Math.max(1, req.parcel.weight_gram),
        length: req.parcel.length_cm ?? 10,
        width: req.parcel.width_cm ?? 10,
        height: req.parcel.height_cm ?? 10,
      },
    ],
    weight: Math.max(1, req.parcel.weight_gram),
    service_category_id: config.shipping.jubelio.defaultServiceCategoryId,
    total_value: Math.max(0, req.parcel.value_idr ?? 0),
  };
  type JubelioRate = {
    courier_name?: string;
    courier_service_name?: string;
    courier_service_code?: string;
    rates?: number;
    final_rates?: number;
  };
  try {
    const { data } = await client.post<JubelioRate[]>('/rates', body);
    const list: JubelioRate[] = Array.isArray(data) ? data : [];
  const mapped: RateQuote[] = list.map((r) => ({
    carrier: String(r.courier_name || ''),
    service: String(r.courier_service_name || r.courier_service_code || ''),
    etd_days: undefined,
    price_idr: Number(r.rates || r.final_rates || 0),
    currency: 'IDR',
  }));
  return mapped;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status || 400;
      const msg = typeof err.response?.data === 'string' ? err.response?.data : (err.response?.data?.message || err.message || 'Failed to fetch rates');
      throw httpError(`Jubelio rates error: ${msg}`, status);
    }
    throw err as Error;
  }
}

export async function createShipment(payload: CreateShipmentRequest): Promise<Shipment> {
  if (!isConfigured()) throw httpError('Shipping not configured', 501);
  // Mock mode for local testing without real Jubelio creds
  if (String(config.shipping.jubelio.apiBaseUrl).toLowerCase() === 'mock') {
    return {
      id: `SHP-${Date.now()}`,
      tracking_number: `TRK-${Math.floor(Math.random() * 1e8)}`,
      label_url: '',
      carrier: payload.carrier,
      service: payload.service,
      status: 'CREATED',
    };
  }
  const client = getJubelioClient();
  // Build a rates body to help resolve courier_id/service_id for creation
  const ratesBody = {
    origin: {
      area_id: config.shipping.jubelio.originAreaId || undefined,
      zipcode: config.shipping.jubelio.originZipcode || undefined,
      coordinate: undefined,
    },
    destination: {
      area_id: (payload.destination as unknown as { area_id?: string })?.area_id || undefined,
      zipcode: payload.destination.postal_code,
      coordinate: undefined,
    },
    package_detail: {
      width: payload.parcel.width_cm ?? 10,
      height: payload.parcel.height_cm ?? 10,
      length: payload.parcel.length_cm ?? 10,
      weight: Math.max(1, payload.parcel.weight_gram),
    },
    items: [
      {
        quantity: 1,
        weight: Math.max(1, payload.parcel.weight_gram),
        length: payload.parcel.length_cm ?? 10,
        width: payload.parcel.width_cm ?? 10,
        height: payload.parcel.height_cm ?? 10,
      },
    ],
    weight: Math.max(1, payload.parcel.weight_gram),
    service_category_id: config.shipping.jubelio.defaultServiceCategoryId,
    total_value: Math.max(0, payload.parcel.value_idr ?? 0),
  };
  let courier_id: string | undefined;
  let courier_service_id: string | undefined;
  try {
    type RawRate = {
      courier_id?: string | number;
      courier_name?: string;
      courier_service_id?: string | number;
      courier_service_name?: string;
      courier_service_code?: string;
    };
    const { data: rawRates } = await client.post<RawRate[]>('/rates', ratesBody);
    const list: RawRate[] = Array.isArray(rawRates) ? rawRates : [];
    const wantedCarrier = String(payload.carrier || '').toLowerCase();
    const wantedService = String(payload.service || '').toLowerCase();
    let match = list.find((r) => {
      const name = String(r?.courier_name || '').toLowerCase();
      const svcName = String(r?.courier_service_name || '').toLowerCase();
      const svcCode = String(r?.courier_service_code || '').toLowerCase();
      return name === wantedCarrier && (svcCode === wantedService || svcName === wantedService);
    });
    // Fallback: pick first service under the requested carrier if exact service not found
    if (!match) {
      match = list.find((r) => String(r?.courier_name || '').toLowerCase() === wantedCarrier);
    }
    if (match) {
      courier_id = match?.courier_id ? String(match.courier_id) : undefined;
      courier_service_id = match?.courier_service_id ? String(match.courier_service_id) : undefined;
    }
  } catch {
    // ignore; creation may still succeed without explicit ids if API allows
  }
  const body = {
    ref_no: payload.order_id,
    courier_id, // resolved from /rates if available
    courier_service_id,
    shipping_insurance: payload.parcel.value_idr ?? 0,
    is_cod: false,
    wallet_id: config.shipping.jubelio.walletId || undefined,
    origin: {
      name: config.shipping.jubelio.originName || 'Warehouse',
      email: config.shipping.jubelio.originEmail || '',
      phone: config.shipping.jubelio.originPhone || '',
      address: config.shipping.jubelio.originAddress || '',
      area_id: config.shipping.jubelio.originAreaId || '',
      coordinate: null,
      zipcode: config.shipping.jubelio.originZipcode || '',
    },
    destination: {
      name: payload.destination.name || 'Customer',
      email: payload.destination.email || '',
      phone: payload.destination.phone || '',
      address: payload.destination.address1,
      // If caller provided destination.area_id (from Regions API), pass it through
      area_id: (payload.destination as unknown as { area_id?: string })?.area_id || undefined,
      coordinate: null,
      zipcode: payload.destination.postal_code,
    },
    package_detail: {
      width: payload.parcel.width_cm ?? 10,
      height: payload.parcel.height_cm ?? 10,
      length: payload.parcel.length_cm ?? 10,
      weight: Math.max(1, payload.parcel.weight_gram),
    },
    items: [
      {
        item_code: 'SKU',
        item_name: 'Items',
        category: '-',
        quantity: 1,
        value: payload.parcel.value_idr ?? 0,
        weight: Math.max(1, payload.parcel.weight_gram),
        length: payload.parcel.length_cm ?? 10,
        width: payload.parcel.width_cm ?? 10,
        height: payload.parcel.height_cm ?? 10,
      },
    ],
  };
  try {
    const { data } = await client.post('/shipments/create', body);
    return {
      id: String(data?.shipment_id ?? ''),
      tracking_number: String(data?.awb ?? ''),
      label_url: String(data?.tracking_url ?? ''),
      carrier: payload.carrier,
      service: payload.service,
      status: 'CREATED',
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status || 400;
      // Include provider error details if available to aid debugging
      let msg: string;
      if (typeof err.response?.data === 'string') {
        msg = err.response.data;
      } else if (err.response?.data) {
        try {
          msg = JSON.stringify(err.response.data);
        } catch {
          msg = err.message || 'Failed to create shipment';
        }
      } else {
        msg = err.message || 'Failed to create shipment';
      }
      throw httpError(`Jubelio create error: ${msg}`, status);
    }
    throw err as Error;
  }
}
