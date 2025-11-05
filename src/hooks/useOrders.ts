import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  name?: string;
  product_name?: string;
}

export interface Order {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  rating?: number | null;
  rated_at?: string | null;
  order_items: OrderItem[];
}

export const useOrders = (userId: string | undefined) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const enrichOrderItems = async (ordersData: Order[]) => {
    return Promise.all(
      ordersData.map(async (order) => {
        if (order.order_items?.length > 0) {
          const productIds = order.order_items
            .map((item) => item.product_id)
            .filter(Boolean);

          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, name')
              .in('id', productIds);

            const productMap = products?.reduce((acc, product) => {
              acc[product.id] = product.name;
              return acc;
            }, {} as Record<string, string>) || {};

            order.order_items = order.order_items.map((item) => ({
              ...item,
              name: productMap[item.product_id] || item.product_name || item.name || 'Produk'
            }));
          }
        }
        return order;
      })
    );
  };

  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`*, order_items(*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ordersData) {
        const enrichedOrders = await enrichOrderItems(ordersData as Order[]);
        setOrders(enrichedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Gagal memuat pesanan',
        description: 'Terjadi kesalahan saat memuat riwayat pesanan Anda.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  return {
    orders,
    loading,
    fetchOrders,
    refetch: fetchOrders
  };
};
