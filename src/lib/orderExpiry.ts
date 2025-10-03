import { supabase } from '@/integrations/supabase/client';

/**
 * Check and mark expired orders as cancelled
 * Orders with 'pending' status that are older than 24 hours will be marked as 'cancelled'
 */
export async function markExpiredOrders(): Promise<void> {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError);
      return;
    }

    if (expiredOrders && expiredOrders.length > 0) {
      const orderIds = expiredOrders.map(order => order.id);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds);

      if (updateError) {
        console.error('Error marking orders as expired:', updateError);
      } else {
        console.log(`Marked ${orderIds.length} orders as expired`);
      }
    }
  } catch (error) {
    console.error('Error in markExpiredOrders:', error);
  }
}

/**
 * Start automatic expiry checker that runs every hour
 */
export function startOrderExpiryChecker(): void {
  // Run immediately
  markExpiredOrders();
  
  // Then run every hour (3600000 ms)
  setInterval(markExpiredOrders, 3600000);
}

/**
 * Check if an order should be marked as expired
 */
export function isOrderExpired(orderDate: string): boolean {
  const orderTime = new Date(orderDate).getTime();
  const now = new Date().getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (now - orderTime) >= twentyFourHours;
}

/**
 * Get the time remaining until an order expires
 */
export function getOrderTimeRemaining(orderDate: string): {
  expired: boolean;
  hours: number;
  minutes: number;
  totalMs: number;
} {
  const orderTime = new Date(orderDate).getTime();
  const now = new Date().getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const expiry = orderTime + twentyFourHours;
  const remaining = expiry - now;

  if (remaining <= 0) {
    return {
      expired: true,
      hours: 0,
      minutes: 0,
      totalMs: 0
    };
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return {
    expired: false,
    hours,
    minutes,
    totalMs: remaining
  };
}