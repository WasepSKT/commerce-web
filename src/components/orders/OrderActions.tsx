import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { initiatePayment } from '@/services/paymentService';
import { Download, FileText, Star, CheckCheck, XCircle } from 'lucide-react';
import { RatingModal } from '@/components/ui/RatingModal';
import { CancelOrderDialog } from './CancelOrderDialog';
import { ConfirmDeliveryDialog } from './ConfirmDeliveryDialog';
import { printInvoice } from '@/lib/invoiceGenerator';
import { printFaktur } from '@/lib/fakturGenerator';
import { canCancelOrder, canConfirmDelivery, isOrderExpired, formatPrice } from '@/utils/orderHelpers';
import type { Order } from '@/hooks/useOrders';

interface OrderActionsProps {
  order: Order;
  onRefresh: () => void;
  cancellingOrder: string | null;
  confirmingDelivery: string | null;
  onCancelOrder: (orderId: string, reason: string) => void;
  onConfirmDelivery: (orderId: string) => void;
}

export const OrderActions = ({
  order,
  onRefresh,
  cancellingOrder,
  confirmingDelivery,
  onCancelOrder,
  onConfirmDelivery
}: OrderActionsProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const { toast } = useToast();
  const expired = isOrderExpired(order);

  return (
    <div className="pt-2 border-t flex justify-between items-center">
      <div>
        <p className="text-lg font-bold">
          Total: {formatPrice(order.total_amount)}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {/* Download Invoice - untuk status paid dan shipped */}
        {(order.status === 'paid' || order.status === 'shipped') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => printInvoice(order as unknown as Parameters<typeof printInvoice>[0])}
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Download className="h-4 w-4 mr-1" />
            Invoice
          </Button>
        )}

        {/* Download Receipt - untuk status completed */}
        {order.status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => printFaktur(order as unknown as Parameters<typeof printFaktur>[0])}
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <FileText className="h-4 w-4 mr-1" />
            Faktur
          </Button>
        )}

        {/* Rating Button - untuk status completed */}
        {order.status === 'completed' && order.order_items?.length > 0 && (
          order.rating == null ? (
            <RatingModal
              key={`order-${order.id}`}
              orderId={order.id}
              productId={order.order_items[0].product_id}
              productName={`Pesanan #${order.id.slice(0, 8)}`}
              onSuccess={onRefresh}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-primary text-primary disabled:opacity-50"
            >
              <Star className="h-4 w-4 mr-1" />
              Sudah Dinilai
            </Button>
          )
        )}

        {/* Confirm Delivery - untuk status shipped */}
        {canConfirmDelivery(order) && (
          <ConfirmDeliveryDialog
            orderId={order.id}
            isConfirming={confirmingDelivery === order.id}
            onConfirm={() => onConfirmDelivery(order.id)}
          />
        )}

        {/* Pay Now - untuk status pending (tampilkan jika belum expired) */}
        {order.status === 'pending' && !expired && (
          <Button
            variant="default"
            size="sm"
            disabled={creatingSession}
            onClick={async () => {
              try {
                setCreatingSession(true);
                const session = await initiatePayment(order.id);
                const redirect = session?.url ?? session?.checkout_url;
                if (redirect) {
                  window.location.href = redirect;
                  return;
                }
                toast({ title: 'Sesi pembayaran dibuat', description: 'Lanjutkan ke penyedia pembayaran.' });
              } catch (err) {
                console.error('Gagal memulai sesi pembayaran', err);
                toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat memulai pembayaran.' });
              } finally {
                setCreatingSession(false);
              }
            }}
            className="bg-primary text-white hover:brightness-95"
          >
            Bayar Sekarang
          </Button>
        )}

        {/* Cancel Order - untuk status pending */}
        {canCancelOrder(order) && !expired && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={cancellingOrder === order.id}
              className="border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Batalkan
            </Button>
            <CancelOrderDialog
              orderId={order.id}
              open={showCancelDialog}
              onOpenChange={setShowCancelDialog}
              isCancelling={cancellingOrder === order.id}
              onConfirm={onCancelOrder}
            />
          </>
        )}
      </div>
    </div>
  );
};
