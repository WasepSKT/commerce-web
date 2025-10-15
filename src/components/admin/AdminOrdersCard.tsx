import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


interface Order {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  created_at: string;
}

interface Props {
  orders: Order[];
  formatPrice: (n: number) => string;
  getStatusBadge: (s: string) => JSX.Element;
}

export default function AdminOrdersCard({ orders, formatPrice, getStatusBadge }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: 'hsl(var(--primary))' }}>Pesanan Terbaru</CardTitle>
        <CardDescription>Daftar pesanan terbaru</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[28rem] overflow-y-auto">
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">#{order.id.slice(0, 8)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name} • {formatPrice(order.total_amount)}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              {/* controls dihapus; status dikelola otomatis oleh webhook */}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


