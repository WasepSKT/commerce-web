import { PAYMENT_API_URL, SERVICE_API_KEY } from '@/utils/env';

export interface CreateSessionResult {
  provider: string;
  session_id?: string;
  checkout_url?: string;
  url?: string;
}

// Production-ready payment session
export const createPaymentSession = async (
  orderId: string,
  options?: {
    return_url?: string;
    payment_method?: 'EWALLET' | 'BANK_TRANSFER' | 'QRIS' | 'CARD' | 'RETAIL_OUTLET';
    payment_channel?: string;
  }
): Promise<CreateSessionResult> => {
  try {
    const requestBody = {
      order_id: orderId,
      return_url: options?.return_url || `${window.location.origin}/payment/success`,
      payment_method: options?.payment_method,
      payment_channel: options?.payment_channel,
    };

    // Debug: log request body
    console.log('📤 Payment request:', requestBody);

    const response = await fetch(`${PAYMENT_API_URL}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SERVICE_API_KEY && { 'x-api-key': SERVICE_API_KEY }),
      },
      body: JSON.stringify(requestBody),
    });

    // Debug: log response status
    console.log('📥 Payment response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Payment session failed' }));
      // Debug: log error response
      console.error('❌ Payment error response:', errorData);
      throw new Error(errorData.error || JSON.stringify(errorData) || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Payment success:', data);
    return data;
  } catch (error) {
    console.error('createPaymentSession error', error);
    throw error;
  }
};

export default { createPaymentSession };
