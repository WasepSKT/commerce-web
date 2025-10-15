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

  const res = await fetch(`/api/shipping/rates?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch shipping rates (${res.status})`);
  return (await res.json()) as ShippingRate[];
}

export async function createShipment(payload: { order_id: string; provider: string; service_code: string; address: unknown; parcels: unknown[]; }): Promise<{ shipment_id?: string; tracking_number?: string; raw?: unknown }> {
  const res = await fetch('/api/shipping/create-shipment', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create shipment (${res.status})`);
  return await res.json();
}

export default { getShippingRates, createShipment };
