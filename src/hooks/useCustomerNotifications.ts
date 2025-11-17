
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/contexts/notificationsContext';
import { useAuth } from './useAuth';

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
  rating?: number | null;
  review?: string | null;
  [key: string]: unknown;
}

interface CustomerNotificationData {
  id: string;
  type: 'payment_pending' | 'payment_verified' | 'shipping_arranged' | 'rating_needed';
  title: string;
  message: string;
  order_id: string;
  created_at: string;
  total_amount?: number;
}

export function useCustomerNotifications(isActive: boolean = true) {
  const [notifications, setNotifications] = useState<CustomerNotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  // provider instance (call at top-level to satisfy hooks rules)
  const notificationsProvider = useNotifications();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch customer orders that need attention
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'paid', 'shipped', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const orders = ordersData as Order[] | null;
      const notificationList: CustomerNotificationData[] = [];

      orders?.forEach(order => {
        // 1. Orders that need payment (pending)
        if (order.status === 'pending') {
          notificationList.push({
            id: `payment-pending-${order.id}`,
            type: 'payment_pending',
            title: 'Pesanan Menunggu Pembayaran',
            message: `Pesanan #${order.id.slice(0, 8)} menunggu pembayaran`,
            order_id: order.id,
            created_at: order.created_at || new Date().toISOString(),
            total_amount: order.total_amount
          });
        }

        // 2. Orders that are paid and verified (ready for shipping)
        if (order.status === 'paid') {
          notificationList.push({
            id: `payment-verified-${order.id}`,
            type: 'payment_verified',
            title: 'Pembayaran Diverifikasi',
            message: `Pesanan #${order.id.slice(0, 8)} telah diverifikasi dan sedang diproses`,
            order_id: order.id,
            created_at: order.updated_at || order.created_at || new Date().toISOString(),
            total_amount: order.total_amount
          });
        }

        // 3. Orders that have shipping arranged
        if (order.status === 'shipped') {
          const orderWithShipping = order as Order;
          if (orderWithShipping.shipping_courier && orderWithShipping.tracking_number) {
            notificationList.push({
              id: `shipping-arranged-${order.id}`,
              type: 'shipping_arranged',
              title: 'Pesanan Dalam Pengiriman',
              message: `Pesanan #${order.id.slice(0, 8)} sedang dikirim via ${orderWithShipping.shipping_courier}`,
              order_id: order.id,
              created_at: order.updated_at || order.created_at || new Date().toISOString(),
              total_amount: order.total_amount
            });
          }
        }

        // 4. Completed orders that need rating
        if (order.status === 'completed') {
          if (!order.rating || order.rating === 0) {
            notificationList.push({
              id: `rating-needed-${order.id}`,
              type: 'rating_needed',
              title: 'Berikan Rating & Ulasan',
              message: `Pesanan #${order.id.slice(0, 8)} menunggu rating dan ulasan Anda`,
              order_id: order.id,
              created_at: order.updated_at || order.created_at || new Date().toISOString(),
              total_amount: order.total_amount
            });
          }
        }
      });

      // Sort by created_at descending
      notificationList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(notificationList);
      setUnreadCount(notificationList.length);
    } catch (error) {
      console.error('Error fetching customer notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();

    if (!isActive) return;

    if (notificationsProvider) {
      const listener = (payload: unknown) => {
        try {
          // Supabase realtime payload may contain `new`, `old`, or `record` fields depending on configuration.
          const p = payload as Record<string, unknown> | null;
          const maybeRecord = p?.new ?? p?.record ?? p?.payload ?? null;
          let changedUserId: string | null = null;
          if (maybeRecord && typeof maybeRecord === 'object') {
            const rec = maybeRecord as Record<string, unknown>;
            const uid = rec['user_id'] ?? rec['userId'];
            if (typeof uid === 'string') changedUserId = uid;
          }
          if (changedUserId && changedUserId === user.id) {
            void fetchNotifications();
          }
        } catch (e) {
          // fallback: if parsing fails, still attempt a refetch (safe)
          void fetchNotifications();
        }
      };
      notificationsProvider.onOrderChange(listener, user.id);
      return () => {
        notificationsProvider.offOrderChange(listener, user.id);
      };
    }

    // Fallback to local subscription if provider not available
    let refetchTimer: number | null = null;
    const scheduleRefetch = () => {
      if (refetchTimer) window.clearTimeout(refetchTimer);
      refetchTimer = window.setTimeout(() => {
        void fetchNotifications();
        refetchTimer = null;
      }, 500) as unknown as number;
    };

    const subscription = supabase
      .channel('customer-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          scheduleRefetch();
        }
      )
      .subscribe();

    return () => {
      if (refetchTimer) window.clearTimeout(refetchTimer);
      subscription.unsubscribe();
    };
  }, [user, fetchNotifications, isActive, notificationsProvider]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Baru saja';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    formatTimeAgo,
    refetch: fetchNotifications
  };
}