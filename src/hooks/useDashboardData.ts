import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OrderRow {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  created_at: string;
}

export interface ReferralRow {
  id?: string;
  referral_id?: string;
  referral_code: string;
  reward_points: number;
  created_at: string;
  referred?: { full_name: string; email: string };
  referred_full_name?: string;
  referred_email?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  totalReferrals: number;
  rewardPoints: number;
  referralCommission: number;
}

export function useDashboardData() {
  const { isAuthenticated, profile } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalOrders: 0, totalSpent: 0, totalReferrals: 0, rewardPoints: 0, referralCommission: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.user_id) return;
    setLoading(true);
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`*, referred:profiles!referrals_referred_id_fkey(full_name, email)`) 
        .eq('referrer_id', profile.id) as unknown as { data?: ReferralRow[] };

      const { data: referredData } = await supabase
        .from('referrals')
        .select('reward_points')
        .eq('referred_id', profile.id);

      const totalOrders = ordersData?.length || 0;
      const totalSpent = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalReferrals = (referralsData as unknown as ReferralRow[])?.length || 0;
      const pointsFromReferring = (referralsData as unknown as ReferralRow[])?.reduce((s, r) => s + (r.reward_points || 0), 0) || 0;
      const pointsFromBeingReferred = (referredData as { reward_points?: number }[] | null | undefined)?.reduce((s, r) => s + (r?.reward_points || 0), 0) || 0;
      const rewardPoints = pointsFromReferring + pointsFromBeingReferred;

      let referralCommission = 0;
      try {
        const { data: commissionDataRaw, error: commissionError } = await supabase
          .from('referral_purchases')
          .select('commission_amount, amount')
          .match({ referrer_id: profile.id, status: 'completed' });
        if (commissionError) throw commissionError;
        if (Array.isArray(commissionDataRaw)) {
          referralCommission = commissionDataRaw.reduce((sum, r) => {
            if (!r || typeof r !== 'object') return sum;
            const obj = r as { commission_amount?: number | string; amount?: number | string };
            const commissionVal = obj.commission_amount ?? obj.amount ?? 0;
            return sum + Number(commissionVal || 0);
          }, 0);
        }
      } catch (e) {
        // non-fatal
      }

      setOrders(ordersData || []);
      setReferrals((referralsData as unknown as ReferralRow[]) || []);
      setStats({ totalOrders, totalSpent, totalReferrals, rewardPoints, referralCommission });
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, profile?.id]);

  useEffect(() => {
    if (isAuthenticated && profile) void fetchData();
  }, [isAuthenticated, profile, fetchData]);

  return { orders, referrals, stats, loading, refresh: fetchData } as const;
}


