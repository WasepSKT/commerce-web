import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

type Order = {
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_courier?: string;
  tracking_number?: string;
};

export default function ShippingInfo({ order }: { order?: Order | null }) {
  if (!order) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <MapPin className="h-5 w-5 text-primary" />
          Informasi Pengiriman
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">Nama Penerima</p>
          <p className="font-medium">{order.customer_name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Nomor Telepon</p>
          <p className="font-medium">{order.customer_phone}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Alamat Lengkap</p>
          <p className="font-medium break-words">{order.customer_address}</p>
        </div>
        {order.shipping_courier && (
          <div>
            <p className="text-sm text-muted-foreground">Kurir</p>
            <p className="font-medium">{order.shipping_courier}</p>
          </div>
        )}
        {order.tracking_number && (
          <div>
            <p className="text-sm text-muted-foreground">Nomor Resi</p>
            <p className="font-medium font-mono">{order.tracking_number}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
