import { PAYMENT_API_URL } from '@/utils/env';

export interface ShippingRate {
  provider: string;
  service_code: string;
  service_name: string;
  cost: number;
  etd: string;
  currency: string;
}

// Sesuai API Doc - GET /shipping/rates
export const getShippingRates = async (
  toPostal: string,
  weight: number,
  originPostal?: string
): Promise<ShippingRate[]> => {
  try {
    const params = new URLSearchParams({
      to_postal: toPostal,
      weight: weight.toString(),
      ...(originPostal && { origin_postal: originPostal }),
    });

    const response = await fetch(
      `${PAYMENT_API_URL}/api/shipping/rates?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch rates' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data; // Already array
  } catch (error) {
    console.error('getShippingRates error', error);
    throw error;
  }
};

export default { getShippingRates };
