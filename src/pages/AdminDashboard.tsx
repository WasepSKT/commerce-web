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


  const [orders, setOrders] = useState<Order[]>([]);
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

  // Build revenue data for the last 7 days
  const buildRevenueSeries = () => {
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
      <div className="w-full max-w-full px-4 md:px-6 py-6 md:py-8">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 text-brand">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola produk, pesanan, dan pengguna</p>
        </div>

        {/* Stats */}
        <AdminStatsGrid
          totalProducts={stats.totalProducts}
          totalOrders={stats.totalOrders}
          totalRevenue={stats.totalRevenue}
          totalUsers={stats.totalUsers}
          formatPrice={formatPrice}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <AdminRevenueChart data={buildRevenueSeries()} />
          <AdminOrdersCard orders={orders} formatPrice={formatPrice} getStatusBadge={getStatusBadge} onUpdateStatus={handleUpdateOrderStatus} />
        </div>
      </div>
    </AdminLayout>
  );
}