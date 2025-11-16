import { PAYMENT_API_URL, SERVICE_API_KEY } from '@/utils/env';

export interface CreateSessionResult {
  provider: string;
  session_id?: string;
  checkout_url?: string;
  url?: string;
}

export type CreatePaymentPayload =
  | { order_id: string; return_url?: string; payment_method?: string; payment_channel?: string; test?: boolean }
  | { order?: unknown; return_url?: string; payment_method?: string; test: true };

// Sesuai API Doc - Simple version dengan order_id
export const createPaymentSession = async (
  orderId: string,
  options?: {
    return_url?: string;
    payment_method?: 'EWALLET' | 'BANK_TRANSFER' | 'QRIS' | 'CARD' | 'RETAIL_OUTLET';
    payment_channel?: string;
  }
): Promise<CreateSessionResult> => {
  try {
    const response = await fetch(`${PAYMENT_API_URL}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SERVICE_API_KEY && { 'x-api-key': SERVICE_API_KEY }),
      },
      body: JSON.stringify({
        order_id: orderId,
        return_url: options?.return_url || `${window.location.origin}/payment/success`,
        payment_method: options?.payment_method,
        payment_channel: options?.payment_channel,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Payment session failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('createPaymentSession error', error);
    throw error;
  }
};

// Test mode version - tanpa order di database
export const createPaymentSessionTest = async (
  amount: number,
  options?: {
    return_url?: string;
    payment_method?: 'EWALLET' | 'BANK_TRANSFER' | 'QRIS' | 'CARD' | 'RETAIL_OUTLET';
  }
): Promise<CreateSessionResult> => {
  try {
    const response = await fetch(`${PAYMENT_API_URL}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        order: {
          total: amount,
          total_amount: amount,
        },
        return_url: options?.return_url || `${window.location.origin}/payment/success`,
        payment_method: options?.payment_method || 'QRIS',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Payment session failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('createPaymentSessionTest error', error);
    throw error;
  }
};

export default { createPaymentSession, createPaymentSessionTest };
