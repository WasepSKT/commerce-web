import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Package, Truck, CheckCircle, XCircle, Clock, AlertTriangle, Download, FileText, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingModal } from '@/components/ui/RatingModal';
import { downloadInvoice, downloadReceipt } from '@/lib/documentGenerator';
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

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  name?: string;
  product_name?: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export default function MyOrders() {
  const { isAuthenticated, profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const { toast } = useToast();

  const fetchMyOrders = useCallback(async () => {
    if (!profile?.user_id) return;

    setOrdersLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich order items with product names
      if (ordersData) {
        const enrichedOrders = await Promise.all(
          ordersData.map(async (order) => {
            if (order.order_items && order.order_items.length > 0) {
              const productIds = order.order_items
                .map((item: OrderItem) => item.product_id)
                .filter(Boolean);

              if (productIds.length > 0) {
                const { data: products } = await supabase
                  .from('products')
                  .select('id, name')
                  .in('id', productIds);

                const productMap = products?.reduce((acc, product) => {
                  acc[product.id] = product.name;
                  return acc;
                }, {} as Record<string, string>) || {};

                order.order_items = order.order_items.map((item: OrderItem) => ({
                  ...item,
                  name: productMap[item.product_id] || item.product_name || item.name || 'Produk'
                } as OrderItem));
              }
            }
            return order;
          })
        );
        setOrders(enrichedOrders as Order[]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Gagal memuat pesanan',
        description: 'Terjadi kesalahan saat memuat riwayat pesanan Anda.',
        variant: 'destructive'
      });
    } finally {
      setOrdersLoading(false);
    }
  }, [profile?.user_id, toast]);

  useEffect(() => {
    if (isAuthenticated && profile?.user_id) {
      void fetchMyOrders();
    }
  }, [isAuthenticated, profile?.user_id, fetchMyOrders]);

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: {
        label: 'Menunggu Pembayaran',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
        description: 'Pesanan menunggu konfirmasi pembayaran'
      },
      paid: {
        label: 'Dibayar',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        description: 'Pembayaran telah dikonfirmasi'
      },
      shipped: {
        label: 'Dikirim',
        variant: 'outline' as const,
        icon: Truck,
        color: 'text-blue-600',
        description: 'Pesanan sedang dalam pengiriman'
      },
      dikirim: {
        label: 'Dikirim',
        variant: 'outline' as const,
        icon: Truck,
        color: 'text-blue-600',
        description: 'Pesanan sedang dalam pengiriman'
      },
      completed: {
        label: 'Selesai',
        variant: 'secondary' as const,
        icon: Package,
        color: 'text-green-700',
        description: 'Pesanan telah selesai'
      },
      selesai: {
        label: 'Selesai',
        variant: 'secondary' as const,
        icon: Package,
        color: 'text-green-700',
        description: 'Pesanan telah selesai'
      },
      cancelled: {
        label: 'Dibatalkan',
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600',
        description: 'Pesanan telah dibatalkan'
      }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const canCancelOrder = (order: Order) => {
    // Hanya order dengan status 'pending' yang bisa dibatalkan
    const allowedStatuses = ['pending'];
    const orderAge = new Date().getTime() - new Date(order.created_at).getTime();
    const hours24 = 24 * 60 * 60 * 1000;

    return allowedStatuses.includes(order.status) && orderAge < hours24;
  };

  const isOrderExpired = (order: Order) => {
    if (order.status !== 'pending') return false;
    const orderAge = new Date().getTime() - new Date(order.created_at).getTime();
    const hours24 = 24 * 60 * 60 * 1000;
    return orderAge >= hours24;
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Pesanan dibatalkan',
        description: 'Pesanan Anda telah berhasil dibatalkan.'
      });

      // Refresh orders
      await fetchMyOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Gagal membatalkan pesanan',
        description: 'Terjadi kesalahan saat membatalkan pesanan.',
        variant: 'destructive'
      });
    } finally {
      setCancellingOrder(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (orderDate: string) => {
    const orderTime = new Date(orderDate).getTime();
    const now = new Date().getTime();
    const expiry = orderTime + (24 * 60 * 60 * 1000); // 24 hours
    const remaining = expiry - now;

    if (remaining <= 0) return 'Kedaluwarsa';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}j ${minutes}m tersisa`;
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-brand text-center md:text-left">Pesanan Saya</h1>
          <p className="text-muted-foreground text-center md:text-left">
            Kelola dan lacak pesanan Anda
          </p>
        </div>

        {ordersLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Belum ada pesanan</h3>
              <p className="text-muted-foreground mb-6">
                Anda belum memiliki riwayat pesanan. Mulai berbelanja sekarang!
              </p>
              <Button onClick={() => window.location.href = '/products'}>
                Mulai Belanja
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const expired = isOrderExpired(order);

              return (
                <Card key={order.id} className={expired ? 'border-red-200 bg-red-50/50' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-primary">
                          Pesanan #{order.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {formatDate(order.created_at)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        {order.status === 'pending' && !expired && (
                          <div className="text-sm text-orange-600 font-medium">
                            {getTimeRemaining(order.created_at)}
                          </div>
                        )}
                        {expired && (
                          <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Kedaluwarsa
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {statusInfo.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-medium mb-2 text-primary">Item Pesanan:</h4>
                        <div className="space-y-2">
                          {order.order_items?.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.name} × {item.quantity}
                              </span>
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

                      {/* Total and Actions */}
                      <div className="pt-2 border-t flex justify-between items-center">
                        <div>
                          <p className="text-lg font-bold">
                            Total: {formatPrice(order.total_amount)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {/* Download Invoice - untuk status paid dan shipped */}
                          {(order.status === 'paid' || order.status === 'shipped' || order.status === 'dikirim') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadInvoice(order)}
                              className="border-primary text-primary hover:bg-primary hover:text-white"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )}

                          {/* Download Receipt - untuk status completed */}
                          {(order.status === 'completed' || order.status === 'selesai') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReceipt(order)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Faktur
                            </Button>
                          )}

                          {/* Rating Button - untuk status completed */}
                          {(order.status === 'completed' || order.status === 'selesai') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrderForRating(order)}
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Rating
                            </Button>
                          )}

                          {/* Cancel Order - untuk status pending */}
                          {canCancelOrder(order) && !expired && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={cancellingOrder === order.id}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Batalkan
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Batalkan Pesanan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin membatalkan pesanan #{order.id.slice(0, 8)}?
                                    Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Ya, Batalkan
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}