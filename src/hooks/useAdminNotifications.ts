import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  user_id?: string;
  total_amount?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

interface NotificationData {
  id: string;
  type: 'payment_verification' | 'shipping_pending' | 'order_cancelled';
  title: string;
  message: string;
  order_id: string;
  created_at: string;
  customer_name?: string;
  total_amount?: number;
  notes?: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Fetch orders that need attention
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'paid', 'cancelled'])
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const orders = ordersData as Order[] | null;
      const notificationList: NotificationData[] = [];

      orders?.forEach(order => {
        if (order.status === 'pending') {
          // Orders that need payment confirmation
          notificationList.push({
            id: `payment-${order.id}`,
            type: 'payment_verification',
            title: 'Pembayaran Belum Dikonfirmasi',
            message: `Pesanan #${order.id.slice(0, 8)} dari ${order.customer_name} menunggu konfirmasi`,
            order_id: order.id,
            created_at: order.updated_at || order.created_at,
            customer_name: order.customer_name,
            total_amount: order.total_amount
          });
        }

        if (order.status === 'paid') {
          // Check if shipping info is incomplete
          const orderWithShipping = order as Order;
          const isShippingIncomplete = !orderWithShipping.shipping_courier || !orderWithShipping.tracking_number;
          if (isShippingIncomplete) {
            notificationList.push({
              id: `shipping-${order.id}`,
              type: 'shipping_pending',
              title: 'Pengiriman Belum Diatur',
              message: `Pesanan #${order.id.slice(0, 8)} perlu diatur informasi pengiriman`,
              order_id: order.id,
              created_at: order.created_at,
              customer_name: order.customer_name,
              total_amount: order.total_amount
            });
          }
        }

        if (order.status === 'cancelled') {
          // Orders cancelled by customer
          const cancelReason = order.notes?.replace('Dibatalkan: ', '') || 'Tidak ada alasan';
          notificationList.push({
            id: `cancelled-${order.id}`,
            type: 'order_cancelled',
            title: 'Pesanan Dibatalkan',
            message: `Pesanan #${order.id.slice(0, 8)} dari ${order.customer_name} telah dibatalkan`,
            order_id: order.id,
            created_at: order.updated_at || order.created_at,
            customer_name: order.customer_name,
            total_amount: order.total_amount,
            notes: cancelReason
          });
        }
      });

      // Sort by created_at desc
      notificationList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(notificationList);
      setUnreadCount(notificationList.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for orders
    const subscription = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status.in.(pending,paid,cancelled)'
        },
        () => {
          // Refetch notifications when orders change
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    formatTimeAgo,
    refresh: fetchNotifications
  };
}