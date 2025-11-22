import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function PaymentInfo({
  payment_method,
  payment_channel,
  total_amount,
  shipping_cost,
}: {
  payment_method?: string | null;
  payment_channel?: string | null;
  total_amount?: number;
  shipping_cost?: number | null;
}) {
  const formatPrice = (price?: number) => {
    if (price == null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CreditCard className="h-5 w-5 text-primary" />
          Informasi Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Metode Pembayaran</span>
          <span className="font-medium">{payment_method ?? 'Belum tersedia'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Channel</span>
          <span className="font-medium">{payment_channel ?? 'Belum tersedia'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Biaya Pengiriman</span>
          <span className="font-medium">{shipping_cost != null ? (shipping_cost === 0 ? 'Gratis' : formatPrice(shipping_cost)) : 'Belum tersedia'}</span>
        </div>
        <div className="flex justify-between pt-3 border-t">
          <span className="font-semibold">Total Pembayaran</span>
          <span className="text-lg font-bold text-primary">{formatPrice(total_amount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
