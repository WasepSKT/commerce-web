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
      <h3 className="font-semibold mb-4 text-primary text-lg">{CHECKOUT_MESSAGES.ORDER_SUMMARY}</h3>

      {/* Order Items */}
      <div className="space-y-2 text-sm mb-4">
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium">{it.product_name || it.product_id}</p>
              <p className="text-xs text-muted-foreground">Qty: {it.quantity}</p>
            </div>
            <div className="font-medium">{formatPrice(((it.unit_price ?? it.price) ?? 0) * (it.quantity ?? 1))}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{CHECKOUT_MESSAGES.SUBTOTAL}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{CHECKOUT_MESSAGES.SHIPPING_FEE}</span>
          <span>{formatPrice(selectedRate?.cost ?? 0)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>{CHECKOUT_MESSAGES.TOTAL}</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Payment Controls (Captcha + Button) */}
      {children && (
        <div className="mt-6 pt-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
}


