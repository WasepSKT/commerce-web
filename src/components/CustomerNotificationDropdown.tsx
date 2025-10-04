import { Bell, CreditCard, Package, Truck, Star, Clock, AlertCircle } from 'lucide-react';
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
import { useCustomerNotifications } from '@/hooks/useCustomerNotifications';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerNotificationDropdown() {
  const { notifications, loading, unreadCount, markAsRead, formatTimeAgo } = useCustomerNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notificationType: string, orderId: string) => {
    markAsRead();
    navigate('/my-orders'); // Semua notifikasi diarahkan ke my-orders
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_pending':
        return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'payment_verified':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'shipping_arranged':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'rating_needed':
        return <Star className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
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
              className="text-center justify-center text-sm text-primary cursor-pointer"
              onClick={() => {
                markAsRead();
                navigate('/my-orders');
              }}
            >
              Lihat Semua Pesanan
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}