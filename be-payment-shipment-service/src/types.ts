export type CreateInvoicePayload = {
  external_id: string;
  description?: string;
  amount: number;
  payer_email?: string;
  success_redirect_url?: string;
  failure_redirect_url?: string;
  invoice_duration?: number;
  currency?: 'IDR';
  // Xendit Invoice supports narrowing available payment methods
  // e.g., ['QRIS', 'EWALLET', 'BANK_TRANSFER', 'CARD']
  payment_methods?: string[];
  // Free-form metadata (stored by provider)
  metadata?: Record<string, unknown>;
};

export type XenditInvoice = {
  id: string;
  external_id: string;
  status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'FAILED';
  amount: number;
  invoice_url: string;
  paid_at?: string;
  created?: string;
};

// Shipping (Jubelio) - preliminary types
export type Address = {
  name?: string;
  phone?: string;
  address1: string;
  email?: string;
  address2?: string;
  city: string;
  province?: string;
  postal_code: string;
  country?: string; // default ID
};

export type Parcel = {
  weight_gram: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  value_idr?: number;
};

export type RateQuoteRequest = {
  origin: Address;
  destination: Address;
  parcel: Parcel;
  carriers?: string[]; // filter preferred carriers
};

export type RateQuote = {
  carrier: string;
  service: string;
  etd_days?: number;
  price_idr: number;
  currency?: 'IDR';
};

export type CreateShipmentRequest = {
  order_id: string;
  origin: Address;
  destination: Address;
  parcel: Parcel;
  carrier: string;
  service: string;
  notes?: string;
};

export type Shipment = {
  id: string;
  tracking_number: string;
  label_url?: string;
  carrier: string;
  service: string;
  status: 'CREATED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'ERROR';
};
