export interface ShippingRate {
  provider: string;
  service_code: string;
  service_name?: string;
  cost: number;
  etd?: string;
  currency?: string;
}

export async function getShippingRates(params: { to_postal: string; weight: number; origin_postal?: string; }): Promise<ShippingRate[]> {
  const query = new URLSearchParams({ to_postal: params.to_postal, weight: String(params.weight) });
  if (params.origin_postal) query.set('origin_postal', params.origin_postal);

  const SHIP_BASE = (import.meta.env && (import.meta.env as Record<string, string>)["VITE_SHIPMENT_API_URL"]) as string | undefined;
  const PAY_BASE = (import.meta.env && (import.meta.env as Record<string, string>)["VITE_PAYMENT_API_URL"]) as string | undefined;
  const base = (SHIP_BASE || PAY_BASE || '').replace(/\/$/, '');
  const endpoint = base ? `${base}/api/shipping/rates?${query.toString()}` : `/api/shipping/rates?${query.toString()}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Failed to fetch shipping rates (${res.status})`);
  const json = await res.json();
  // Backend legacy returns an array directly; pass-through
  return json as ShippingRate[];
}

export async function createShipment(payload: { order_id: string; provider: string; service_code: string; address: unknown; parcels: unknown[]; }): Promise<{ shipment_id?: string; tracking_number?: string; raw?: unknown }> {
  const SHIP_BASE = (import.meta.env && (import.meta.env as Record<string, string>)["VITE_SHIPMENT_API_URL"]) as string | undefined;
  const PAY_BASE = (import.meta.env && (import.meta.env as Record<string, string>)["VITE_PAYMENT_API_URL"]) as string | undefined;
  const base = (SHIP_BASE || PAY_BASE || '').replace(/\/$/, '');
  const endpoint = base ? `${base}/api/shipping/create-shipment` : '/api/shipping/create-shipment';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create shipment (${res.status})`);
  return await res.json();
}

export default { getShippingRates, createShipment };
