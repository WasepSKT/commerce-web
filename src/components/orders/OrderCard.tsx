import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { OrderDetails } from './OrderDetails';
import { OrderActions } from './OrderActions';
import { getStatusInfo, isOrderExpired, getTimeRemaining, formatDate, formatPrice } from '@/utils/orderHelpers';
import type { Order } from '@/hooks/useOrders';

interface OrderCardProps {
  order: Order;
  onRefresh: () => void;
  cancellingOrder: string | null;
  confirmingDelivery: string | null;
  onCancelOrder: (orderId: string, reason: string) => void;
  onConfirmDelivery: (orderId: string) => void;
}

export const OrderCard = ({
  order,
  onRefresh,
  cancellingOrder,
  confirmingDelivery,
  onCancelOrder,
  onConfirmDelivery
}: OrderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const expired = isOrderExpired(order);

  return (
    <Card className={`${expired ? 'border-red-200 bg-red-50/50' : ''} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-3 md:py-4 md:px-4">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base md:text-lg text-primary truncate">
                    Pesanan #{order.id.slice(0, 8)}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  {formatDate(order.created_at)} • Total: {formatPrice(order.total_amount)}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                  <Badge variant={statusInfo.variant}>
                    {statusInfo.label}
                  </Badge>
                </div>

                {order.status === 'pending' && !expired && (
                  <div className="text-sm text-orange-600 font-medium">
                    {getTimeRemaining(order.created_at)}
                  </div>
                )}
                {expired && (
                  <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Kedaluwarsa
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 py-3 md:px-4 md:py-4">
            <div className="space-y-3 md:space-y-4">
              <OrderDetails order={order} />
              <OrderActions
                order={order}
                onRefresh={onRefresh}
                cancellingOrder={cancellingOrder}
                confirmingDelivery={confirmingDelivery}
                onCancelOrder={onCancelOrder}
                onConfirmDelivery={onConfirmDelivery}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
