import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_CONFIG } from '@/constants/orderStatus';

type Props = {
  orderId?: string;
  createdAt?: string;
  status?: string;
};

export default function OrderHeader({ orderId, createdAt, status }: Props) {
  const statusConfig = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <CardHeader>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="text-2xl text-primary">Pesanan #{orderId?.slice(0, 8)}</CardTitle>
          {createdAt && (
            <p className="text-sm text-muted-foreground mt-1">Dibuat pada {new Date(createdAt).toLocaleString('id-ID')}</p>
          )}
        </div>
        <Badge variant={statusConfig.variant} className="w-fit">
          <StatusIcon className={`mr-2 h-4 w-4 ${statusConfig.color}`} />
          {statusConfig.label}
        </Badge>
      </div>
    </CardHeader>
  );
}
