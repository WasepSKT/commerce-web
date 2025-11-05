import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CANCEL_REASONS } from '@/constants/orderStatus';
import { useToast } from '@/hooks/use-toast';

interface CancelOrderDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCancelling: boolean;
  onConfirm: (orderId: string, reason: string) => void;
}

export const CancelOrderDialog = ({
  orderId,
  open,
  onOpenChange,
  isCancelling,
  onConfirm
}: CancelOrderDialogProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (!reason) {
      toast({
        title: 'Alasan diperlukan',
        description: 'Silakan pilih alasan pembatalan pesanan.',
        variant: 'destructive'
      });
      return;
    }

    onConfirm(orderId, reason);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Pesanan</AlertDialogTitle>
          <AlertDialogDescription>
            Silakan pilih alasan pembatalan pesanan #{orderId.slice(0, 8)}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cancelReason">Alasan Pembatalan</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih alasan pembatalan..." />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={!reason || isCancelling}
          >
            {isCancelling ? 'Memproses...' : 'Ya, Batalkan'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
