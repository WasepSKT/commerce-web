// Frontend shipping client for both legacy and new endpoints
// Reads envs: VITE_SHIPMENT_API_URL (default '/api'), VITE_SERVICE_API_KEY (for protected endpoints)

export type Address = {
  name?: string;
  phone?: string;
  email?: string;
  address1: string;
  city: string;
  postal_code: string;
  area_id?: string;
};

export type Parcel = {
  weight_gram: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  value_idr?: number;
};

type EnvVars = { VITE_SHIPMENT_API_URL?: string; VITE_SERVICE_API_KEY?: string };
const env = (import.meta as unknown as { env: EnvVars }).env || {};
const BASE = env.VITE_SHIPMENT_API_URL || '/api';
const API_KEY = env.VITE_SERVICE_API_KEY || '';

export async function getRatesLegacy(params: { to_postal: string; weight: number; origin_postal?: string }) {
  const url = new URL(`${BASE}/shipping/rates`, window.location.origin);
  url.searchParams.set('to_postal', params.to_postal);
  url.searchParams.set('weight', String(params.weight));
  if (params.origin_postal) url.searchParams.set('origin_postal', params.origin_postal);
  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error(`Rates failed: ${res.status}`);
  return res.json();
}

export async function createShipmentLegacy(body: {
  order_id: string;
  provider: string;
  service_code: string;
  address: Address;
  parcels: Parcel[];
}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['x-api-key'] = API_KEY;
  const res = await fetch(`${BASE}/shipping/create-shipment`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Create shipment failed: ${res.status}`);
  return data;
}

export async function getRatesNew(body: {
  origin: Address;
  destination: Address;
  parcel: Parcel;
}) {
  const res = await fetch(`${BASE}/shipping/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Rates failed: ${res.status}`);
  return data;
}

export async function createShipmentNew(body: {
  order_id: string;
  carrier: string;
  service: string;
  origin: Address;
  destination: Address;
  parcel: Parcel;
}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['x-api-key'] = API_KEY;
  const res = await fetch(`${BASE}/shipping/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Create shipment failed: ${res.status}`);
  return data;
}
