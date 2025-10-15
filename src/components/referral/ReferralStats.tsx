import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReferralStats as ReferralStatsType } from '@/types/referral';
import { Users, Gift, TrendingUp, Award } from 'lucide-react';

interface ReferralStatsProps {
  stats: ReferralStatsType | null;
  className?: string;
}

export default function ReferralStats({ stats, className = '' }: ReferralStatsProps) {
  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada data referral</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Referral</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_referrals}</div>
          <p className="text-xs text-muted-foreground">
            Orang yang berhasil diundang
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Poin Diperoleh</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_points_earned}</div>
          <p className="text-xs text-muted-foreground">
            Poin dari referral
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kode Referral</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-mono font-bold">{stats.referral_code}</div>
          <p className="text-xs text-muted-foreground">
            Bagikan kode ini
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Level</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {stats.level || 'Bronze'}
            </Badge>
          </div>
          {stats.commission_rate && (
            <p className="text-xs text-muted-foreground mt-1">
              Komisi: {(stats.commission_rate * 100).toFixed(1)}%
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
