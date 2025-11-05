import { formatPrice } from '@/utils/orderHelpers';
import type { Order } from '@/hooks/useOrders';

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
          <div className="space-y-1 text-sm">
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
