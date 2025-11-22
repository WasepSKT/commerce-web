import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package } from 'lucide-react';
import { ORDER_STATUS_CONFIG } from '@/constants/orderStatus';
import OrderHeader from '@/components/orders/OrderHeader';
import ShippingInfo from '@/components/orders/ShippingInfo';
import OrderItems from '@/components/orders/OrderItems';
import OrderProgress from '@/components/orders/OrderProgress';
import PaymentInfo from '@/components/orders/PaymentInfo';
import SEOHead from '@/components/seo/SEOHead';
import { useToast } from '@/hooks/use-toast';
import { imageUrlWithCacheBust } from '@/utils/imageHelpers';

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
  shipping_cost?: number | null;
  tracking_number?: string;
  payment_method?: string;
  payment_channel?: string;
  notes?: string;
  created_at: string;
  user_id: string;
  order_items?: OrderItem[];
  session_id?: string | null;
}

interface Payment {
  id: string;
  order_id?: string | null;
  session_id?: string | null;
  payment_method?: string | null;
  payment_channel?: string | null;
  created_at?: string | null;
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, profile, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId || !profile?.user_id) {
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
          .eq('user_id', profile.user_id)
          .single();

        if (error) throw error;

        if (data) {
          console.debug('[OrderDetail] fetched order:', data);
          // Try to load related payment record (some systems store payment info
          // in a separate `payments` table). Prefer the latest payment for this order.
          try {
            // Try primary lookup: payments by order_id
            const payByOrderRes = await supabase
              .from('payments')
              .select('id, order_id, session_id, payment_method, payment_channel, created_at')
              .eq('order_id', orderId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Narrow the response shape to a typed object to avoid `any`.
            const payByOrderData = (payByOrderRes as { data?: Payment | null } | null)?.data ?? null;
            let payment: Payment | null = payByOrderData;

            // Fallback: if no payment found and order has session_id, lookup by session_id
            if (!payment && (data as Order).session_id) {
              console.debug('[OrderDetail] no payment by order_id, falling back to session_id', (data as Order).session_id);
              const payBySessionRes = await supabase
                .from('payments')
                .select('id, order_id, session_id, payment_method, payment_channel, created_at')
                .eq('session_id', (data as Order).session_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              const payBySessionData = (payBySessionRes as { data?: Payment | null } | null)?.data ?? null;
              payment = payBySessionData;
            }

            if (payment) {
              const merged: Order = {
                ...(data as Order),
                payment_method: payment.payment_method ?? (data as Order).payment_method,
                payment_channel: payment.payment_channel ?? (data as Order).payment_channel,
              };
              setOrder(merged);
            } else {
              setOrder(data as Order);
            }
          } catch (err) {
            console.debug('[OrderDetail] failed to fetch payments for order (both lookups):', err);
            setOrder(data as Order);
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast({
          title: 'Gagal',
          description: 'Tidak dapat memuat detail pesanan',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && profile?.user_id) {
      void fetchOrderDetail();
    }
  }, [orderId, profile?.user_id, isAuthenticated, toast]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />

          {/* Header skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex-1">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </div>
                <div className="w-32">
                  <Skeleton className="h-8 w-24 ml-auto" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-36 w-full rounded-md" />
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2 mt-2" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Pesanan Tidak Ditemukan</h3>
              <p className="text-muted-foreground mb-6">
                Pesanan yang Anda cari tidak ditemukan atau tidak memiliki akses.
              </p>
              <Button onClick={() => navigate('/my-orders')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Pesanan Saya
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Layout>
      <SEOHead
        title={`Detail Pesanan #${orderId?.slice(0, 8)} - Regal Paw`}
        description="Detail pesanan makanan kucing premium dari Regal Paw"
        canonical={`/orders/${orderId}`}
        noindex={true}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate('/my-orders')}
          className="mb-6 border-primary text-primary hover:bg-primary hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Pesanan Saya
        </Button>

        <div className="space-y-6">
          <OrderHeader orderId={order.id} createdAt={order.created_at} status={order.status} />

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <OrderProgress status={order.status} payment_method={order.payment_method} payment_channel={order.payment_channel} shipping_cost={order.shipping_cost} tracking_number={order.tracking_number} shipping_courier={order.shipping_courier} created_at={order.created_at} />
              <OrderItems items={order.order_items} />
              <ShippingInfo order={order} />
              <PaymentInfo payment_method={order.payment_method} payment_channel={order.payment_channel} total_amount={order.total_amount} shipping_cost={order.shipping_cost} />

              {order.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Catatan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
