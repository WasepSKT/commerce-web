import { PAYMENT_API_URL, SERVICE_API_KEY } from '@/utils/env';

export interface CreateSessionResult {
  provider: string;
  session_id?: string;
  checkout_url?: string;
  url?: string;
}

export interface QRPaymentResult {
  provider: string;
  qr_id: string;
  qr_string: string;
  amount: number;
  status: string;
}

// Production mode - dengan order_id string dari database
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

    console.log('📤 Payment request (production):', requestBody);

    const response = await fetch(`${PAYMENT_API_URL}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SERVICE_API_KEY && { 'x-api-key': SERVICE_API_KEY }),
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Payment response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Payment session failed' }));
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

// Test mode - FLAT object sesuai API Doc Option B
export const createPaymentSessionTest = async (
  amount: number,
  options?: {
    return_url?: string;
    payment_method?: 'EWALLET' | 'BANK_TRANSFER' | 'QRIS' | 'CARD' | 'RETAIL_OUTLET';
    payment_channel?: string;
  }
): Promise<CreateSessionResult> => {
  try {
    const requestBody = {
      test: true,
      order: {
        total: amount,
        total_amount: amount,
      },
      return_url: options?.return_url || `${window.location.origin}/payment/success`,
      payment_method: options?.payment_method || 'QRIS',
      payment_channel: options?.payment_channel,
    };

    console.log('📤 Payment request (test mode):', requestBody);

    const response = await fetch(`${PAYMENT_API_URL}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Payment response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Payment session failed' }));
      console.error('❌ Payment error response:', errorData);
      throw new Error(errorData.error || JSON.stringify(errorData) || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Payment test success:', data);
    return data;
  } catch (error) {
    console.error('createPaymentSessionTest error', error);
    throw error;
  }
};

// Create QR payment (QRIS) - returns QR string
export const createQRPayment = async (
  orderId: string,
  options?: {
    amount?: number;
    return_url?: string;
  }
): Promise<QRPaymentResult> => {
  try {
    const requestBody = {
      order_id: orderId,
      amount: options?.amount,
      return_url: options?.return_url || `${window.location.origin}/payment/success`,
    };

    console.log('📤 QR Payment request:', requestBody);

    const response = await fetch(`${PAYMENT_API_URL}/api/payments/qr/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 QR Payment response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'QR payment failed' }));
      console.error('❌ QR Payment error:', errorData);
      throw new Error(errorData.error || JSON.stringify(errorData) || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ QR Payment success:', data);
    return data;
  } catch (error) {
    console.error('createQRPayment error', error);
    throw error;
  }
};

export default { createPaymentSession, createPaymentSessionTest, createQRPayment };
