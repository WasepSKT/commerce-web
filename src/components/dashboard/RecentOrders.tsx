import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/format';

interface OrderRow {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

function getStatusBadge(status: string) {
  const statusMap = {
    pending: { label: 'Menunggu', variant: 'secondary' as const },
    paid: { label: 'Dibayar', variant: 'default' as const },
    shipped: { label: 'Dikirim', variant: 'outline' as const },
    completed: { label: 'Selesai', variant: 'secondary' as const },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
  };
  const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
}

interface RecentOrdersProps {
  loading: boolean;
  orders: OrderRow[];
}

export default function RecentOrders({ loading, orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: 'hsl(var(--primary))' }}>Pesanan Terbaru</CardTitle>
        <CardDescription>5 pesanan terakhir Anda</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
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
          <div className="text-center py-8">
            <Package className="h-14 w-14 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">Belum ada pesanan. Mulai berbelanja sekarang!</p>
            <Button asChild>
              <a href="/products">Belanja</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Pesanan #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                  <p className="text-sm font-medium text-primary">{formatPrice(order.total_amount)}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


