import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReferral } from '@/hooks/useReferral';
import { Layout } from '@/components/Layout';
import SEOHead from '@/components/seo/SEOHead';
import ReferralCodeInput from '@/components/referral/ReferralCodeInput';
import ReferralStats from '@/components/referral/ReferralStats';
import ReferralHistory from '@/components/referral/ReferralHistory';
import ReferralShare from '@/components/referral/ReferralShare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ReferralStats as ReferralStatsType } from '@/types/referral';

export default function ReferralPage() {
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const {
    referralStats,
    referralHistory,
    loadReferralStats,
    loadReferralHistory,
    isProcessing
  } = useReferral();

  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (isAuthenticated && profile?.user_id) {
      loadReferralStats(profile.user_id);
      loadReferralHistory(profile.user_id);
    }
  }, [isAuthenticated, profile?.user_id, loadReferralStats, loadReferralHistory]);

  const handleReferralSuccess = () => {
    toast({
      title: 'Referral berhasil!',
      description: 'Poin telah ditambahkan ke akun Anda.'
    });

    // Refresh stats after successful referral
    if (profile?.user_id) {
      loadReferralStats(profile.user_id);
      loadReferralHistory(profile.user_id);
    }
  };

  const handleReferralError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'Referral gagal',
      description: error
    });
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <SEOHead title="Referral - Regal Paw" description="Program referral Regal Paw" />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Akses Terbatas</h2>
              <p className="text-muted-foreground">
                Silakan login terlebih dahulu untuk mengakses halaman referral.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Referral - Regal Paw" description="Program referral Regal Paw" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Program Referral</h1>
          <p className="text-muted-foreground">
            Undang teman dan dapatkan poin untuk setiap referral yang berhasil!
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Statistik</TabsTrigger>
            <TabsTrigger value="share">Bagikan</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="input">Gunakan Kode</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <ReferralStats stats={referralStats} />

            <Card>
              <CardHeader>
                <CardTitle>Cara Kerja Referral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-600">✅ Yang Mengundang (Anda)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Mendapat poin untuk setiap teman yang berhasil diundang</li>
                      <li>• Poin langsung ditambahkan ke akun</li>
                      <li>• Bisa digunakan untuk diskon atau reward</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 text-gray-600">❌ Yang Diundang (Teman)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Tidak mendapat poin referral</li>
                      <li>• Tetap mendapat benefit member biasa</li>
                      <li>• Bisa membuat referral sendiri</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share">
            {referralStats?.referral_code ? (
              <ReferralShare
                referralCode={referralStats.referral_code}
                className="max-w-2xl mx-auto"
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Kode referral Anda sedang dimuat...
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ReferralHistory
              history={referralHistory}
              className="max-w-4xl mx-auto"
            />
          </TabsContent>

          <TabsContent value="input">
            <div className="max-w-md mx-auto">
              <ReferralCodeInput
                onSuccess={handleReferralSuccess}
                onError={handleReferralError}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
