export type Order = { id: string; total_amount?: number; user_id?: string };

export type OrderItem = {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
};

export interface Order {
  id: string;
  total_amount?: number;
  user_id?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
}

export interface AddressForm {
  full_name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
}

export interface PaymentIcon {
  [key: string]: string;
}

export interface CheckoutState {
  order: Order | null;
  items: OrderItem[];
  rates: any[]; // ShippingRate type from shippingService
  selectedRate: any | null;
  selectedPaymentMethod: string;
  selectedEwallet: string;
  selectedBank: string;
  loadingRates: boolean;
  creatingSession: boolean;
  initializing: boolean;
  isEditingAddress: boolean;
  savingAddress: boolean;
  addressForm: AddressForm;
}

export interface CheckoutQueryParams {
  order_id: string | null;
  product_id: string | null;
  from_cart: string | null;
  quantity: number;
  dry_run: string | null;
}
