import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrderActions = (onSuccess?: () => void) => {
  const { toast } = useToast();
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string, reason: string) => {
    setCancellingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          notes: `Dibatalkan: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Pesanan dibatalkan',
        description: 'Pesanan Anda telah berhasil dibatalkan.'
      });

      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error cancelling order:', error);
      let errorMessage = 'Terjadi kesalahan saat membatalkan pesanan.';

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code?: string }).code;
        const errorMsg = (error as { message?: string }).message;

        if (errorCode === '42501' || errorMsg?.includes('policy')) {
          errorMessage = 'Tidak dapat membatalkan pesanan. Pastikan pesanan masih dalam status pending dan dibuat dalam 24 jam terakhir.';
        } else if (errorCode === 'PGRST301') {
          errorMessage = 'Pesanan tidak ditemukan atau Anda tidak memiliki akses untuk membatalkannya.';
        }
      }

      toast({
        title: 'Gagal membatalkan pesanan',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingDelivery(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Best-effort: record referral purchase
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('id, user_id, total_amount')
          .eq('id', orderId)
          .single();

        if (order?.id && order.user_id) {
          await supabase.rpc('handle_referral_purchase', {
            order_id_input: String(order.id),
            buyer_user_id: String(order.user_id),
            purchase_amount: Number(order.total_amount || 0),
          });
        }
      } catch (rpcErr) {
        console.warn('Failed to call handle_referral_purchase RPC (non-fatal):', rpcErr);
      }

      toast({
        title: 'Pesanan dikonfirmasi',
        description: 'Terima kasih! Pesanan Anda telah dikonfirmasi sebagai diterima.'
      });

      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error confirming delivery:', error);
      let errorMessage = 'Terjadi kesalahan saat mengkonfirmasi penerimaan pesanan.';

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code?: string }).code;
        const errorMsg = (error as { message?: string }).message;

        if (errorCode === '42501' || errorMsg?.includes('policy')) {
          errorMessage = 'Tidak dapat mengkonfirmasi pesanan. Pastikan pesanan dalam status pengiriman.';
        } else if (errorCode === 'PGRST301') {
          errorMessage = 'Pesanan tidak ditemukan atau Anda tidak memiliki akses untuk mengkonfirmasinya.';
        }
      }

      toast({
        title: 'Gagal mengkonfirmasi pesanan',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setConfirmingDelivery(null);
    }
  };

  return {
    handleCancelOrder,
    handleConfirmDelivery,
    cancellingOrder,
    confirmingDelivery
  };
};
