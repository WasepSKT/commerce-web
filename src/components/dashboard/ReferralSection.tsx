import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy } from 'lucide-react';

interface ReferralRow {
  id?: string;
  referral_id?: string;
  reward_points: number;
  created_at: string;
  referred?: { full_name: string };
  referred_full_name?: string;
}

interface ReferralSectionProps {
  loading: boolean;
  referrals: ReferralRow[];
  totalReferrals: number;
  referralCode?: string | null;
  onCopy: () => void;
}

export default function ReferralSection({ loading, referrals, totalReferrals, referralCode, onCopy }: ReferralSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: 'hsl(var(--primary))' }}>Program Referral</CardTitle>
        <CardDescription>Ajak teman dan dapatkan reward untuk setiap referral yang berhasil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
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
                <code className="text-lg font-mono font-bold">{referralCode}</code>
                <Button size="sm" onClick={onCopy}><Copy className="h-4 w-4 mr-2" />Salin Link</Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-primary">Referral Anda ({totalReferrals})</h4>
              {referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada referral. Mulai ajak teman sekarang!</p>
              ) : (
                <div className="space-y-2">
                  {referrals.slice(0, 3).map((referral, index) => (
                    <div key={referral.id || referral.referral_id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">{referral.referred_full_name || referral.referred?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(referral.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                      <Badge variant="secondary">+{referral.reward_points || 0} poin</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


