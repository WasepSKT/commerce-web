import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfirmDeliveryDialogProps {
  orderId: string;
  isConfirming: boolean;
  onConfirm: () => void;
}

export const ConfirmDeliveryDialog = ({
  orderId,
  isConfirming,
  onConfirm
}: ConfirmDeliveryDialogProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isConfirming}
          className="border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4 mr-1" />
          Pesanan Diterima
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Penerimaan Pesanan</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda sudah menerima pesanan #{orderId.slice(0, 8)}?
            Dengan mengkonfirmasi, pesanan akan ditandai sebagai selesai.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Belum Diterima</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/90"
          >
            {isConfirming ? 'Memproses...' : 'Ya, Sudah Diterima'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
