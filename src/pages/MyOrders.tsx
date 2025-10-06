import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Package, Truck, CheckCircle, XCircle, Clock, AlertTriangle, Download, FileText, Star, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingModal } from '@/components/ui/RatingModal';
import { printInvoice } from '@/lib/invoiceGenerator';
import { printFaktur } from '@/lib/fakturGenerator';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  notes?: string | null;
  created_at: string;
  updated_at: string;
  rating?: number | null;
  rated_at?: string | null;
  order_items: OrderItem[];
}

export default function MyOrders() {
  const { isAuthenticated, profile, loading } = useAuth();
  const { toast } = useToast();

  // Pilihan alasan pembatalan
  const cancelReasons = [
    'Berubah pikiran',
    'Menemukan harga lebih murah',
    'Pesanan tidak sesuai kebutuhan',
    'Kesalahan dalam pemesanan',
    'Terlalu lama menunggu konfirmasi',
    'Alasan keuangan',
    'Lainnya'
  ];

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

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
      completed: {
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

  const canConfirmDelivery = (order: Order) => {
    // Order bisa dikonfirmasi jika statusnya 'shipped'
    return order.status === 'shipped';
  };

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

      // Refresh orders
      await fetchMyOrders();

      // Reset states
      setSelectedOrderToCancel(null);
      setCancelReason('');
    } catch (error: unknown) {
      console.error('Error cancelling order:', error);
      let errorMessage = 'Terjadi kesalahan saat membatalkan pesanan.';

      // Check for RLS policy errors
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

  const handleConfirmCancel = () => {
    if (!cancelReason) {
      toast({
        title: 'Alasan diperlukan',
        description: 'Silakan pilih alasan pembatalan pesanan.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedOrderToCancel) {
      void handleCancelOrder(selectedOrderToCancel, cancelReason);
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

      toast({
        title: 'Pesanan dikonfirmasi',
        description: 'Terima kasih! Pesanan Anda telah dikonfirmasi sebagai diterima.'
      });

      // Refresh orders
      await fetchMyOrders();
    } catch (error: unknown) {
      console.error('Error confirming delivery:', error);
      let errorMessage = 'Terjadi kesalahan saat mengkonfirmasi penerimaan pesanan.';

      // Check for RLS policy errors
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

              const isExpanded = expandedOrders.has(order.id);

              return (
                <Card key={order.id} className={expired ? 'border-red-200 bg-red-50/50' : ''}>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg text-primary">
                                Pesanan #{order.id.slice(0, 8)}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOrderExpansion(order.id);
                                }}
                                className="h-6 w-6 p-0 shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <CardDescription>
                              {formatDate(order.created_at)} • Total: {formatPrice(order.total_amount)}
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
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
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

                          {/* Notes */}
                          {order.notes && (
                            <div className="pt-2 border-t">
                              <h4 className="font-medium mb-2 text-primary">Catatan:</h4>
                              <div className={`p-3 rounded-lg text-sm ${order.status === 'cancelled'
                                ? 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                                : 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
                                }`}>
                                {order.notes}
                              </div>
                            </div>
                          )}

                          {/* Total and Actions */}
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
                              {(order.status === 'completed') && (
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
                              {(order.status === 'completed') && order.order_items && order.order_items.length > 0 && (
                                order.rating == null ? (
                                  <RatingModal
                                    key={`order-${order.id}`}
                                    orderId={order.id}
                                    productId={order.order_items[0].product_id}
                                    productName={`Pesanan #${order.id.slice(0, 8)}`}
                                    onSuccess={() => {
                                      void fetchMyOrders();
                                    }}
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
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={confirmingDelivery === order.id}
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
                                        Apakah Anda sudah menerima pesanan #{order.id.slice(0, 8)}?
                                        Dengan mengkonfirmasi, pesanan akan ditandai sebagai selesai.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Belum Diterima</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleConfirmDelivery(order.id)}
                                        className="bg-primary hover:bg-primary/90"
                                      >
                                        {confirmingDelivery === order.id ? 'Memproses...' : 'Ya, Sudah Diterima'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {/* Cancel Order - untuk status pending */}
                              {canCancelOrder(order) && !expired && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={cancellingOrder === order.id}
                                      className="border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                                      onClick={() => {
                                        setSelectedOrderToCancel(order.id);
                                        setCancelReason('');
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Batalkan
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Batalkan Pesanan</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Silakan pilih alasan pembatalan pesanan #{order.id.slice(0, 8)}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="cancelReason">Alasan Pembatalan</Label>
                                        <Select value={cancelReason} onValueChange={setCancelReason}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Pilih alasan pembatalan..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {cancelReasons.map((reason) => (
                                              <SelectItem key={reason} value={reason}>
                                                {reason}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        onClick={() => {
                                          setSelectedOrderToCancel(null);
                                          setCancelReason('');
                                        }}
                                      >
                                        Batal
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={handleConfirmCancel}
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={!cancelReason || cancellingOrder === order.id}
                                      >
                                        {cancellingOrder === order.id ? 'Memproses...' : 'Ya, Batalkan'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}