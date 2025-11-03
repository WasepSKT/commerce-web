import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';
import AdminRevenueChart from '@/components/admin/AdminRevenueChart';
import AdminOrdersCard from '@/components/admin/AdminOrdersCard';
import { useAuth } from '@/hooks/useAuth';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEOHead from '@/components/seo/SEOHead';
import { REVENUE_RANGES, type RevenueRange } from '@/constants/adminDashboard';
import { buildRevenueSeries } from '@/utils/adminRevenueUtils';
import { formatPrice, getStatusBadge } from '@/utils/adminUtils';

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const { orders, stats, loading: dataLoading } = useAdminDashboard(
    isAuthenticated,
    isAdmin
  );
  const [range, setRange] = useState<RevenueRange>(REVENUE_RANGES.WEEKLY);

  // Build revenue data based on selected range
  const revenueSeries = buildRevenueSeries(orders, range);

  // App-level loader covers the hydration phase. Render a small inline placeholder
  // if components mount while still in a loading state to avoid a double fullscreen overlay.
  if (authLoading) {
    return <div className="w-full px-4 py-8">{/* inline placeholder while auth loads */}</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <SEOHead
        title="Admin Dashboard - Regal Paw"
        description="Dashboard admin Regal Paw untuk mengelola produk, pesanan, pengguna, dan statistik penjualan. Panel kontrol lengkap untuk administrator."
        keywords="admin dashboard, panel admin, manajemen produk, statistik penjualan, Regal Paw"
        canonical="/admin"
        ogType="website"
        noindex={true}
      />
      <div className="w-full max-w-full px-4 md:px-6 py-6 md:py-8">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 text-brand">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola produk, pesanan, dan pengguna</p>
        </div>

        {dataLoading ? (
          <>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts and Orders Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              {/* Revenue Chart Skeleton */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>

              {/* Orders Card Skeleton */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Stats */}
            <AdminStatsGrid
              totalProducts={stats.totalProducts}
              totalOrders={stats.totalOrders}
              totalRevenue={stats.totalRevenue}
              totalUsers={stats.totalUsers}
              formatPrice={formatPrice}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              <AdminRevenueChart
                data={revenueSeries}
                range={range}
                onRangeChange={(r) => setRange(r)}
              />
              <AdminOrdersCard
                orders={orders}
                formatPrice={formatPrice}
                getStatusBadge={getStatusBadge}
              />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}