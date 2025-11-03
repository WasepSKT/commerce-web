import { CHECKOUT_MESSAGES } from '@/constants/checkout';
import { formatPrice } from '@/utils/format';
import type { ShippingRate } from './ShippingRateList';

interface OrderItemLike {
  product_id?: string;
  product_name?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
}

interface OrderSummaryCardProps {
  items: OrderItemLike[];
  subtotal: number;
  selectedRate: ShippingRate | null;
  total: number;
  children?: React.ReactNode; // payment selector and captcha + pay button
}

export default function OrderSummaryCard({ items, subtotal, selectedRate, total, children }: OrderSummaryCardProps) {
  return (
    <div className="p-6 border rounded">
      <h3 className="font-semibold mb-2">{CHECKOUT_MESSAGES.ORDER_SUMMARY}</h3>
      {children}
      <div className="space-y-2 text-sm">
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between">
            <div>
              {it.product_name || it.product_id} x{it.quantity}
            </div>
            <div>{formatPrice(((it.unit_price ?? it.price) ?? 0) * (it.quantity ?? 1))}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-3">
        <div className="flex justify-between text-muted-foreground">
          {CHECKOUT_MESSAGES.SUBTOTAL}
          <div>{formatPrice(subtotal)}</div>
        </div>
        <div className="flex justify-between text-muted-foreground">
          {CHECKOUT_MESSAGES.SHIPPING_FEE}
          <div>{formatPrice(selectedRate?.cost ?? 0)}</div>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          {CHECKOUT_MESSAGES.TOTAL}
          <div>{formatPrice(total)}</div>
        </div>
      </div>
    </div>
  );
}


