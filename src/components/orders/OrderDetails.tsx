import { formatPrice } from '@/utils/orderHelpers';
import type { Order } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Simple courier tracking URL templates. Add more mappings as needed.
const COURIER_TRACKING: Record<string, (resi: string) => string> = {
  JNE: (r) => `https://www.jne.co.id/id/tracking/trace` + `?awb=${encodeURIComponent(r)}`,
  JNT: (r) => `https://tracking.jntos.co.id/waybill/${encodeURIComponent(r)}`,
  SICEPAT: (r) => `https://tracking.sicepat.com/track/?awb=${encodeURIComponent(r)}`,
  SICEPAT_ID: (r) => `https://tracking.sicepat.com/track/?awb=${encodeURIComponent(r)}`,
  TIKI: (r) => `https://www.tiki.id/track?resi=${encodeURIComponent(r)}`,
  JANDT: (r) => `https://jeki.id/track/${encodeURIComponent(r)}`,
};

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails = ({ order }: OrderDetailsProps) => {
  return (
    <>
      {/* Order Items */}
      <div>
        <h4 className="font-medium mb-2 text-primary">Item Pesanan:</h4>
        <div className="space-y-2">
          {order.order_items?.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          )) || (
              <p className="text-sm text-muted-foreground">
                Detail item tidak tersedia
              </p>
            )}
        </div>
      </div>

      {/* Shipping Info */}
      {(order.shipping_courier || order.tracking_number) && (
        <div className="pt-2 border-t">
          <h4 className="font-medium mb-2 text-primary">Informasi Pengiriman:</h4>
          <div className="space-y-2 text-sm">
            {order.shipping_courier && (
              <p>
                <span className="font-medium">Kurir:</span> {order.shipping_courier}
              </p>
            )}
            {order.tracking_number && (
              <p>
                <span className="font-medium">No. Resi:</span>{' '}
                <code className="bg-muted px-1 rounded">
                  {order.tracking_number}
                </code>
              </p>
            )}

            <div className="mt-2 flex items-center gap-2">
              {/* Show internal track button when order is beyond pending (assumed paid/processing).
                  Place it to the right and style like the admin "Invoice" outline button. */}
              {order.status !== 'pending' && (
                <Link to={`/orders/${order.id}`} className="ml-auto">
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Lacak Pesanan
                  </Button>
                </Link>
              )}

              {/* External courier link if we can construct one */}
              {order.tracking_number && order.shipping_courier && (() => {
                const key = String(order.shipping_courier).toUpperCase().replace(/[^A-Z0-9]/g, '');
                const fn = COURIER_TRACKING[key];
                if (fn) {
                  return (
                    <a href={fn(order.tracking_number)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">Lihat di Kurir</Button>
                    </a>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Address */}
      <div className="pt-2 border-t">
        <h4 className="font-medium mb-2 text-primary">Alamat Pengiriman:</h4>
        <p className="text-sm text-muted-foreground">
          {order.customer_address}
        </p>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="pt-2 border-t">
          <h4 className="font-medium mb-2 text-primary">Catatan:</h4>
          <div className={`p-3 rounded-lg text-sm ${order.status === 'cancelled'
            ? 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
            }`}>
            {order.notes}
          </div>
        </div>
      )}
    </>
  );
};
