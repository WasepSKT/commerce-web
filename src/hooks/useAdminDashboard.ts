/**
 * Custom hook for Admin Dashboard data fetching and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OrderStatus } from '@/constants/adminDashboard';

export interface DashboardOrder {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
}

export interface UseAdminDashboardReturn {
  orders: DashboardOrder[];
  stats: DashboardStats;
  loading: boolean;
  refreshData: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

/**
 * Hook for managing admin dashboard data
 */
export function useAdminDashboard(isAuthenticated: boolean, isAdmin: boolean): UseAdminDashboardReturn {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const { toast } = useToast();

  const fetchAdminData = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch products count
      const { count: productCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Calculate stats
      const totalProducts = productCount || 0;
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
      const totalUsers = usersCount || 0;

      setOrders(ordersData || []);
      setStats({ totalProducts, totalOrders, totalRevenue, totalUsers });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat data',
        description: 'Terjadi kesalahan saat memuat data dashboard',
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, toast]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId);

        if (error) throw error;

        toast({ title: 'Status pesanan berhasil diupdate!' });
        await fetchAdminData();
      } catch (error: unknown) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: string }).message)
            : 'Terjadi kesalahan';
        
        toast({
          variant: 'destructive',
          title: 'Gagal update status',
          description: message,
        });
      }
    },
    [fetchAdminData, toast]
  );

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return {
    orders,
    stats,
    loading,
    refreshData: fetchAdminData,
    updateOrderStatus,
  };
}

