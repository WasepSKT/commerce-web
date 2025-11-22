import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import StatusHeader from '@/components/payment/StatusHeader';
import CustomerInfo from '@/components/payment/CustomerInfo';
import OrderItemsList from '@/components/payment/OrderItemsList';
import TransactionDetails from '@/components/payment/TransactionDetails';
import ActionButtons from '@/components/payment/ActionButtons';
import { Skeleton } from '@/components/ui/skeleton';

type PaymentStatusType = 'success' | 'pending' | 'failed';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  shipping_courier?: string;
  payment_method?: string;
  payment_channel?: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface PaymentStatusProps {
  status: PaymentStatusType;
  orderId?: string;
  amount?: number;
  transactionId?: string;
  message?: string;
}

export function PaymentStatus({
  status,
  orderId,
  amount,
  transactionId,
  message
}: PaymentStatusProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch order details with items
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_id,
              quantity,
              price,
              products (
                name,
                image_url
              )
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;

        if (data) {
          setOrder(data as unknown as Order);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      title: 'Pembayaran Berhasil!',
      description: message || 'Terima kasih atas pembelian Anda. Pesanan Anda sedang diproses.',
    },
    pending: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      title: 'Menunggu Pembayaran',
      description: message || 'Pembayaran Anda sedang diproses. Mohon tunggu beberapa saat.',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      title: 'Pembayaran Gagal',
      description: message || 'Maaf, pembayaran Anda gagal. Silakan coba lagi.',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const displayAmount = order?.total_amount || amount || 0;
  const paymentMethod = order?.payment_method || order?.payment_channel || 'Xendit Invoice';
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardContent className="p-6 sm:p-8">
            {/* Header skeleton */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="rounded-full p-6 mb-4">
                <Skeleton className="w-16 h-16 rounded-full" />
              </div>
              <div className="space-y-2 w-full">
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            </div>

            {/* two column skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
              <div>
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            </div>

            {/* transaction skeleton */}
            <div className="mt-6">
              <Skeleton className="h-36 w-full rounded-md" />
            </div>

            {/* actions skeleton */}
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="p-6 sm:p-8">
          <StatusHeader Icon={Icon} bgColor={config.bgColor} color={config.color} title={config.title} description={config.description} />

          {/* Customer info and order items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CustomerInfo order={order} />
            </div>
            <div>
              <OrderItemsList items={order?.order_items} />
            </div>
          </div>

          {/* Transaction details */}
          <TransactionDetails
            orderId={orderId}
            transactionId={transactionId}
            shippingCourier={order?.shipping_courier}
            paymentMethod={paymentMethod}
            displayAmount={displayAmount}
          />

          {/* Actions */}
          <ActionButtons status={status} orderId={orderId} />

          {/* Support Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Butuh bantuan?{' '}
              <a href="/contact" className="text-primary hover:underline font-medium">
                Hubungi Customer Service
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
