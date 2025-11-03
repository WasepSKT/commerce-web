import { Card, CardContent } from '@/components/ui/card';
import { Gift, ShoppingBag, Users, Copy } from 'lucide-react';
import { abbreviate } from '@/utils/number';
import { formatPrice } from '@/utils/format';

interface StatsGridProps {
  totalOrders: number;
  totalSpent: number;
  totalReferrals: number;
  rewardPoints: number;
  referralCommission: number;
  loading: boolean;
}

export default function StatsGrid({ totalOrders, totalSpent, totalReferrals, rewardPoints, referralCommission, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="h-10" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8 w-full max-w-full">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pesanan</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
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
              <p className="text-2xl font-bold" title={formatPrice(totalSpent)}>{abbreviate(totalSpent)}</p>
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
              <p className="text-2xl font-bold">{totalReferrals}</p>
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
              <p className="text-2xl font-bold">{rewardPoints}</p>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Komisi Referral</p>
              <p className="text-2xl font-bold" title={formatPrice(referralCommission)}>{abbreviate(referralCommission)}</p>
            </div>
            <Copy className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


