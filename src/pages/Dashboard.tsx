import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Gift, ShoppingBag, ShoppingCart, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  created_at: string;
}

interface Referral {
  id: string;
  referral_code: string;
  reward_points: number;
  created_at: string;
  referrer: {
    full_name: string;
    email: string;
  };
}

export default function Dashboard() {
  const { isAuthenticated, profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    totalReferrals: 0,
    rewardPoints: 0
  });
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    try {
      // Fetch user orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch referrals made by this user
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:profiles!referrals_referrer_id_fkey(full_name, email)
        `)
        .eq('referrer_id', profile?.id);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const totalSpent = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalReferrals = referralsData?.length || 0;
      const rewardPoints = referralsData?.reduce((sum, ref) => sum + (ref.reward_points || 0), 0) || 0;

      setOrders(ordersData || []);
      setReferrals(referralsData || []);
      setStats({ totalOrders, totalSpent, totalReferrals, rewardPoints });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isAuthenticated && profile) {
      void fetchDashboardData();
    }
  }, [isAuthenticated, profile, fetchDashboardData]);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      const referralUrl = `${window.location.origin}/auth?ref=${profile.referral_code}`;
      navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Link referral disalin!",
        description: "Bagikan link ini untuk mengajak teman bergabung.",
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
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // App-level loader already handles full-screen auth hydration.
  // Render a compact inline placeholder here while loading to avoid overlay duplication.
  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">{/* inline placeholder */}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-brand">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {profile?.full_name || profile?.email}!
          </p>
        </div>

        {/* Stats Cards */}
        {dashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pesanan</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Belanja</p>
                    <p className="text-2xl font-bold">{formatPrice(stats.totalSpent)}</p>
                  </div>
                  <Gift className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Referral Berhasil</p>
                    <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Poin Reward</p>
                    <p className="text-2xl font-bold">{stats.rewardPoints}</p>
                  </div>
                  <Gift className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--primary))' }}>Aksi Cepat</CardTitle>
            <CardDescription>
              Akses fitur utama dengan mudah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
                <a href="/products" className="flex flex-col items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  <span className="text-sm">Belanja</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
                <a href="/my-orders" className="flex flex-col items-center gap-2">
                  <Gift className="h-6 w-6" />
                  <span className="text-sm">Pesanan Saya</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
                <a href="/profile" className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Profil</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
                <a href="/cart" className="flex flex-col items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-sm">Keranjang</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referral Section */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--primary))' }}>Program Referral</CardTitle>
              <CardDescription>
                Ajak teman dan dapatkan reward untuk setiap referral yang berhasil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardLoading ? (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-5 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Kode Referral Anda:</p>
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-mono font-bold">{profile?.referral_code}</code>
                      <Button size="sm" onClick={copyReferralCode}>
                        <Copy className="h-4 w-4 mr-2" />
                        Salin Link
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-primary">Referral Anda ({stats.totalReferrals})</h4>
                    {referrals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Belum ada referral. Mulai ajak teman sekarang!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {referrals.slice(0, 3).map((referral) => (
                          <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                            <div>
                              <p className="text-sm font-medium">{referral.referrer.full_name || referral.referrer.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(referral.created_at).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <Badge variant="secondary">+{referral.reward_points} poin</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--primary))' }}>Pesanan Terbaru</CardTitle>
              <CardDescription>
                5 pesanan terakhir Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada pesanan. Mulai berbelanja sekarang!
                </p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Pesanan #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}