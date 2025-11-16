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
    // Pastikan orderId adalah string, bukan object!
    if (typeof orderId !== 'string') {
      console.error('❌ Invalid orderId type:', typeof orderId, orderId);
      throw new Error('order_id must be a string');
    }

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

// Test mode - untuk dry run tanpa order_id
export const createPaymentSessionTest = async (
  order: {
    total_amount: number;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
  },
  options?: {
    return_url?: string;
    payment_method?: 'EWALLET' | 'BANK_TRANSFER' | 'QRIS' | 'CARD' | 'RETAIL_OUTLET';
    payment_channel?: string;
    turnstile_token?: string;
  }
): Promise<CreateSessionResult> => {
  try {
    const requestBody = {
      test: true,
      order: {
        total: order.total_amount,
        total_amount: order.total_amount,
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

// Create QR payment
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

// Smart wrapper - auto-detect test mode vs production mode
export const initiatePayment = async (
  orderDataOrId: string | {
    order: {
      total_amount: number;
      customer_name?: string;
      customer_phone?: string;
      customer_address?: string;
    };
    payment_method?: 'EWALLET' | 'BANK_TRANSFER' | 'QRIS' | 'CARD' | 'RETAIL_OUTLET';
    payment_channel?: string;
    return_url?: string;
    test?: boolean;
  }
): Promise<CreateSessionResult> => {
  // Check if it's test mode (object dengan property test)
  if (typeof orderDataOrId === 'object' && orderDataOrId.test) {
    console.log('🧪 Using test mode payment');
    return createPaymentSessionTest(
      orderDataOrId.order,
      {
        payment_method: orderDataOrId.payment_method,
        payment_channel: orderDataOrId.payment_channel,
        return_url: orderDataOrId.return_url,
      }
    );
  }

  // Check if it's production mode (string order_id)
  if (typeof orderDataOrId === 'string') {
    console.log('💳 Using production mode payment');
    return createPaymentSession(orderDataOrId);
  }

  // Invalid input
  throw new Error('Invalid payment data: expected string order_id or test mode object');
};

export default { 
  createPaymentSession, 
  createPaymentSessionTest, 
  createQRPayment,
  initiatePayment // Export wrapper function
};
