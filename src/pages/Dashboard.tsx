import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PopupCampaignDisplay } from '@/components/PopupCampaignDisplay';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';
import StatsGrid from '@/components/dashboard/StatsGrid';
import QuickActions from '@/components/dashboard/QuickActions';
import ReferralSection from '@/components/dashboard/ReferralSection';
import RecentOrders from '@/components/dashboard/RecentOrders';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Dashboard() {
  const { isAuthenticated, profile, loading } = useAuth();
  const { toast } = useToast();
  const { orders, referrals, stats, loading: dashboardLoading } = useDashboardData();

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      const referralUrl = `${window.location.origin}/signup?ref=${profile.referral_code}`;
      navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Link referral disalin!",
        description: "Bagikan link ini untuk mengajak teman bergabung.",
      });
    }
  };

  // App-level loader already handles full-screen auth hydration.
  // Render a compact inline placeholder here while loading to avoid overlay duplication.
  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">{/* inline placeholder */}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Dashboard', url: 'https://regalpaw.id/dashboard' }
  ]);

  return (
    <Layout>
      <SEOHead
        title="Dashboard - Regal Paw"
        description="Dashboard pribadi Regal Paw. Kelola pesanan, lihat statistik referral, dan pantau komisi Anda. Akses semua fitur akun dalam satu tempat."
        keywords="dashboard, akun pribadi, pesanan, referral, komisi, Regal Paw"
        canonical="/dashboard"
        ogType="website"
        structuredData={breadcrumbData}
        noindex={true}
      />

      {/* Popup Campaign Display */}
      <PopupCampaignDisplay onDashboardLogin={true} />

      <div className="w-full max-w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-brand text-center md:text-left">Dashboard</h1>
          <p className="text-muted-foreground text-center md:text-left">
            Selamat datang, {profile?.full_name || profile?.email}!
          </p>
        </div>

        {/* Stats Cards */}
        <StatsGrid
          loading={dashboardLoading}
          totalOrders={stats.totalOrders}
          totalSpent={stats.totalSpent}
          totalReferrals={stats.totalReferrals}
          rewardPoints={stats.rewardPoints}
          referralCommission={stats.referralCommission}
        />

        {/* Quick Actions */}
        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referral Section */}
          <ReferralSection
            loading={dashboardLoading}
            referrals={referrals}
            totalReferrals={stats.totalReferrals}
            referralCode={profile?.referral_code}
            onCopy={copyReferralCode}
          />

          {/* Recent Orders */}
          <RecentOrders loading={dashboardLoading} orders={orders} />
        </div>
      </div>
    </Layout>
  );
}