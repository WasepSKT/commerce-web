import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaymentStatus } from '@/components/payment/PaymentStatus';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<{ orderId?: string; amount?: number }>({});

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        // Log all params for debugging
        const params = Object.fromEntries(searchParams.entries());
        console.log('Payment callback params:', params);

        // Try to get order_id from URL params first
        let orderId = searchParams.get('order_id') ||
          searchParams.get('external_id') ||
          searchParams.get('id') ||
          undefined;

        let amount = searchParams.get('amount') ? Number(searchParams.get('amount')) : undefined;

        // If no order_id in URL, fetch the latest pending order for current user
        if (!orderId) {
          console.log('No order_id in URL params, fetching latest order...');

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: orders } = await supabase
              .from('orders')
              .select('id, total_amount')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (orders && orders.length > 0) {
              orderId = orders[0].id;
              amount = amount || orders[0].total_amount;
              console.log('Found latest order:', orderId, 'amount:', amount);
            }
          }
        }

        setOrderData({ orderId, amount });
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, [searchParams]);

  const status = searchParams.get('status') as 'success' | 'pending' | 'failed' || 'success';
  const transactionId = searchParams.get('transaction_id') || searchParams.get('invoice_id') || undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Memverifikasi pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <PaymentStatus
      status={status}
      orderId={orderData.orderId}
      amount={orderData.amount}
      transactionId={transactionId}
    />
  );
}
