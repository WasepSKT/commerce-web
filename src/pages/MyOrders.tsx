import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useOrderActions } from '@/hooks/useOrderActions';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';
import { OrderCard } from '@/components/orders/OrderCard';
import { EmptyOrders } from '@/components/orders/EmptyOrders';

export default function MyOrders() {
  const { isAuthenticated, profile, loading } = useAuth();
  const { orders, loading: ordersLoading, fetchOrders } = useOrders(profile?.user_id);
  const { handleCancelOrder, handleConfirmDelivery, cancellingOrder, confirmingDelivery } = useOrderActions(fetchOrders);

  useEffect(() => {
    if (isAuthenticated && profile?.user_id) {
      void fetchOrders();
    }
  }, [isAuthenticated, profile?.user_id, fetchOrders]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Pesanan Saya', url: 'https://regalpaw.id/my-orders' }
  ]);

  return (
    <Layout>
      <SEOHead
        title="Pesanan Saya - Regal Paw"
        description="Kelola dan lacak pesanan makanan kucing premium Anda di Regal Paw. Lihat status pengiriman, konfirmasi penerimaan, dan unduh invoice."
        keywords="pesanan, order, tracking, pengiriman, invoice, Regal Paw, makanan kucing"
        canonical="/my-orders"
        ogType="website"
        structuredData={breadcrumbData}
        noindex={true}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-brand text-center md:text-left">
            Pesanan Saya
          </h1>
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
          <EmptyOrders />
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onRefresh={fetchOrders}
                cancellingOrder={cancellingOrder}
                confirmingDelivery={confirmingDelivery}
                onCancelOrder={handleCancelOrder}
                onConfirmDelivery={handleConfirmDelivery}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}