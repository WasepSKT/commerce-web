import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  onUpdateStatus: (id: string, status: Order['status']) => void;
}

export default function AdminOrdersCard({ orders, formatPrice, getStatusBadge, onUpdateStatus }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Pesanan</CardTitle>
        <CardDescription>Update status pesanan pelanggan</CardDescription>
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
              <div className="flex space-x-2">
                <Select value={order.status} onValueChange={(status) => onUpdateStatus(order.id, status as Order['status'])}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="paid">Dibayar</SelectItem>
                    <SelectItem value="shipped">Dikirim</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


