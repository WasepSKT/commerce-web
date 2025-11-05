import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export const EmptyOrders = () => {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2 text-primary">Belum ada pesanan</h3>
        <p className="text-muted-foreground mb-6">
          Anda belum memiliki riwayat pesanan. Mulai berbelanja sekarang!
        </p>
        <Button onClick={() => window.location.href = '/products'}>
          Mulai Belanja
        </Button>
      </CardContent>
    </Card>
  );
};
