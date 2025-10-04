import { Bell, Package, Truck, Clock, AlertCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationDropdown() {
  const { notifications, loading, unreadCount, markAsRead, formatTimeAgo } = useAdminNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notificationType: string, orderId: string) => {
    markAsRead();
    if (notificationType === 'payment_verification') {
      navigate('/admin/payments');
    } else if (notificationType === 'shipping_pending') {
      navigate('/admin/shipings');
    } else {
      navigate('/admin/orders');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_verification':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'shipping_pending':
        return <Truck className="h-4 w-4 text-orange-600" />;
      case 'order_cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
          onClick={markAsRead}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} baru
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            // Loading skeleton
            <>
              {[...Array(3)].map((_, i) => (
                <DropdownMenuItem key={i} className="flex items-start space-x-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          ) : notifications.length === 0 ? (
            // Empty state
            <DropdownMenuItem disabled className="flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
              <p className="text-xs text-muted-foreground">Semua pesanan sudah diproses</p>
            </DropdownMenuItem>
          ) : (
            // Notifications list
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start space-x-3 p-3 cursor-pointer hover:bg-muted/50"
                onClick={() => handleNotificationClick(notification.type, notification.order_id)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {notification.message}
                  </p>
                  {notification.type === 'order_cancelled' && notification.notes && (
                    <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded mb-1">
                      Alasan: {notification.notes}
                    </p>
                  )}
                  {notification.total_amount && (
                    <p className="text-xs font-medium text-primary">
                      Total: Rp {notification.total_amount.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-sm text-primary cursor-pointer justify-center"
              onClick={() => navigate('/admin/orders')}
            >
              Lihat Semua Pesanan
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}