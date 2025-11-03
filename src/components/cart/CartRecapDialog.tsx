/**
 * Cart recap dialog component
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/format';
import type { LineItem } from '@/hooks/useCartLineItems';

interface CartRecapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineItems: LineItem[];
  subtotal: number;
  pendingOrderId: string | null;
  creatingOrder: boolean;
  onProceed: () => void;
}

export default function CartRecapDialog({
  open,
  onOpenChange,
  lineItems,
  subtotal,
  pendingOrderId,
  creatingOrder,
  onProceed,
}: CartRecapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ringkasan Pesanan</DialogTitle>
          <DialogDescription>
            Periksa rekap pesanan. Tekan konfirmasi untuk menyimpan pesanan dan melanjutkan ke halaman Checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 text-sm text-muted-foreground">
          {lineItems.map((li) => (
            <div key={li.id} className="flex justify-between">
              <div>
                {li.name} x{li.quantity}
              </div>
              <div>{formatPrice((li.unit_price ?? li.price) * li.quantity)}</div>
            </div>
          ))}

          <div className="mt-2 flex justify-between font-medium">
            <div>Total</div>
            <div>{formatPrice(subtotal)}</div>
          </div>

          {!pendingOrderId && (
            <div className="mt-2 text-xs text-muted-foreground">
              Order akan dibuat setelah Anda menekan "Lanjut ke Checkout".
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={creatingOrder} onClick={onProceed}>
            {creatingOrder ? 'Membuat...' : 'Lanjut ke Checkout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

