import { PAYMENT_API_URL } from '@/utils/env';

export interface ShippingRate {
  provider: string;
  service_code: string;
  service_name: string;
  cost: number;
  etd: string;
  currency: string;
}

// Mock shipping rates untuk development
const MOCK_SHIPPING_RATES: ShippingRate[] = [
  {
    provider: 'JNE',
    service_code: 'REG',
    service_name: 'Regular',
    cost: 15000,
    etd: '2-3 hari',
    currency: 'IDR',
  },
  {
    provider: 'JNT',
    service_code: 'EZ',
    service_name: 'Economy',
    cost: 12000,
    etd: '3-4 hari',
    currency: 'IDR',
  },
  {
    provider: 'SICEPAT',
    service_code: 'REG',
    service_name: 'Regular',
    cost: 11000,
    etd: '2-3 hari',
    currency: 'IDR',
  },
  {
    provider: 'JNE',
    service_code: 'YES',
    service_name: 'Yakin Esok Sampai',
    cost: 25000,
    etd: '1 hari',
    currency: 'IDR',
  },
];

// Get shipping rates - dengan fallback ke mock data
export const getShippingRates = async (
  toPostal: string,
  weight: number,
  originPostal?: string
): Promise<ShippingRate[]> => {
  // Validate inputs
  if (!toPostal || !weight || weight <= 0) {
    console.warn('Invalid shipping parameters, using mock data');
    return MOCK_SHIPPING_RATES;
  }

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
      console.warn('Shipping API error, using mock data');
      return MOCK_SHIPPING_RATES;
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data : MOCK_SHIPPING_RATES;
  } catch (error) {
    console.error('getShippingRates error, using mock data:', error);
    // Return mock data sebagai fallback
    return MOCK_SHIPPING_RATES;
  }
};

// Get mock shipping rates (untuk testing)
export const getMockShippingRates = (): ShippingRate[] => {
  return MOCK_SHIPPING_RATES;
};

export default { getShippingRates, getMockShippingRates };
