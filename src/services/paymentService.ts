import { PAYMENT_API_URL, SERVICE_API_KEY } from '@/utils/env';

export interface CreateSessionResult {
  provider: string;
  session_id?: string;
  checkout_url?: string;
  url?: string;
}

export type CreatePaymentPayload =
  | { order_id: string; return_url?: string; payment_method?: string; test?: boolean }
  | { order?: unknown; return_url?: string; payment_method?: string; test: true };

export const createPaymentSession = async (orderData: {
  order_id: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  return_url?: string;
}) => {
  try {
    const response = await fetch(`${PAYMENT_API_URL}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SERVICE_API_KEY,
      },
      body: JSON.stringify({
        ...orderData,
        return_url: orderData.return_url || `${window.location.origin}/payment/success`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Payment session failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('createPaymentSession error', error);
    throw error;
  }
};

export default { createPaymentSession };
