import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';
import AdminRevenueChart from '@/components/admin/AdminRevenueChart';
import AdminOrdersCard from '@/components/admin/AdminOrdersCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Loading from '@/components/ui/Loading';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';


interface Order {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  const [dataLoading, setDataLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [range, setRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAdminData();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchAdminData = async () => {
    setDataLoading(true);
    try {
      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      const totalProducts = productCount || 0;
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalUsers = usersCount || 0;

      setOrders(ordersData || []);
      setStats({ totalProducts, totalOrders, totalRevenue, totalUsers });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast({ title: "Status pesanan berhasil diupdate!" });
      fetchAdminData();
    } catch (error: unknown) {
      let message = 'Terjadi kesalahan';
      if (typeof error === 'object' && error && 'message' in error) {
        message = String((error as { message?: string }).message);
      }
      toast({
        variant: "destructive",
        title: "Gagal update status",
        description: message,
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      paid: { label: 'Dibayar', variant: 'default' as const },
      shipped: { label: 'Dikirim', variant: 'outline' as const },
      completed: { label: 'Selesai', variant: 'secondary' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${statusInfo.variant === 'destructive' ? 'text-destructive border-destructive' : 'text-foreground border-border'
      }`}>{statusInfo.label}</span>;
  };

  // Build revenue data depending on selected range
  const buildRevenueSeries = () => {
    if (range === 'weekly') {
      const days = 7;
      const now = new Date();
      const buckets: { [k: string]: number } = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      for (const o of orders) {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        if (key in buckets) buckets[key] += Number(o.total_amount || 0);
      }
      return Object.entries(buckets).map(([key, value]) => ({
        date: new Date(key).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        revenue: value,
      }));
    }

    if (range === 'monthly') {
      // last 12 months, aggregate by month
      const months = 12;
      const now = new Date();
      const buckets: { [k: string]: number } = {};
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        buckets[key] = 0;
      }
      for (const o of orders) {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key in buckets) buckets[key] += Number(o.total_amount || 0);
      }
      return Object.entries(buckets).map(([key, value]) => ({
        date: new Date(key + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        revenue: value,
      }));
    }

    // yearly
    {
      const years = 5;
      const now = new Date();
      const buckets: { [k: string]: number } = {};
      for (let i = years - 1; i >= 0; i--) {
        const y = now.getFullYear() - i;
        const key = String(y);
        buckets[key] = 0;
      }
      for (const o of orders) {
        const d = new Date(o.created_at);
        const key = String(d.getFullYear());
        if (key in buckets) buckets[key] += Number(o.total_amount || 0);
      }
      return Object.entries(buckets).map(([key, value]) => ({
        date: key,
        revenue: value,
      }));
    }
  };

  // App-level loader covers the hydration phase. Render a small inline placeholder
  // if components mount while still in a loading state to avoid a double fullscreen overlay.
  if (loading) {
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
              <AdminRevenueChart data={buildRevenueSeries()} range={range} onRangeChange={(r) => setRange(r)} />
              <AdminOrdersCard orders={orders} formatPrice={formatPrice} getStatusBadge={getStatusBadge} onUpdateStatus={handleUpdateOrderStatus} />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}