import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReferralRecord } from '@/types/referral';
import { History, Calendar, User, Gift } from 'lucide-react';

interface ReferralHistoryProps {
  history: ReferralRecord[];
  className?: string;
}

export default function ReferralHistory({ history, className = '' }: ReferralHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Tidak Aktif</Badge>;
      case 'expired':
        return <Badge variant="destructive">Kedaluwarsa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!history || history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Referral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada riwayat referral</p>
            <p className="text-sm">Mulai undang teman untuk melihat riwayat di sini</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Riwayat Referral ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>

                <div>
                  <div className="font-medium">
                    {(record as any).referred_profile?.full_name || 'User'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(record as any).referred_profile?.email || 'Email tidak tersedia'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(record.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Gift className="h-3 w-3" />
                    {record.reward_points} poin
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Kode: {record.referral_code}
                  </div>
                </div>

                {getStatusBadge(record.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
