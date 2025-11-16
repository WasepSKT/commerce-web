import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, ArrowRight, Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
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

        // Type assertion with proper structure
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="p-8">
          {/* Icon with Animation */}
          <div className="flex justify-center mb-6">
            <div className={`${config.bgColor} rounded-full p-6 animate-bounce-slow`}>
              <Icon className={`h-16 w-16 ${config.color}`} strokeWidth={2} />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>

          {/* Customer Info */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Informasi Pelanggan
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium text-gray-900">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telepon:</span>
                  <span className="font-medium text-gray-900">{order.customer_phone}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-600">Alamat Lengkap:</span>
                  <span className="font-medium text-gray-900">{order.customer_address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          {order?.order_items && order.order_items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detail Pesanan</h3>
              <div className="space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 pb-2 border-b">
                  <div className="col-span-5">Produk</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Harga Satuan</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items */}
                {order.order_items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 text-sm items-center">
                    <div className="col-span-5 font-medium text-gray-900">
                      {item.products?.name || `Product ${item.product_id.slice(0, 8)}`}
                    </div>
                    <div className="col-span-2 text-center text-gray-700">
                      {item.quantity}
                    </div>
                    <div className="col-span-3 text-right text-gray-700">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                    <div className="col-span-2 text-right font-semibold text-gray-900">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
            {orderId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="text-sm font-semibold text-gray-900">{orderId}</span>
              </div>
            )}
            {transactionId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transaction ID</span>
                <span className="text-sm font-semibold text-gray-900">{transactionId}</span>
              </div>
            )}
            {order?.shipping_courier && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Kurir</span>
                <span className="text-sm font-semibold text-gray-900">{order.shipping_courier}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Metode Pembayaran</span>
              <span className="text-sm font-semibold text-gray-900">{paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Total Pembayaran</span>
              <span className="text-lg font-bold text-primary">
                Rp {displayAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <>
                <Button
                  onClick={() => navigate(`/orders/${orderId}`)}
                  className="w-full"
                  size="lg"
                >
                  Lihat Detail Pesanan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </>
            )}

            {status === 'pending' && (
              <>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                  size="lg"
                >
                  Refresh Status
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </>
            )}

            {status === 'failed' && (
              <>
                <Button
                  onClick={() => navigate(`/checkout/${orderId}`)}
                  className="w-full"
                  size="lg"
                >
                  Coba Lagi
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </>
            )}
          </div>

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
