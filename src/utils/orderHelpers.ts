import { ORDER_STATUS_CONFIG, ORDER_EXPIRY_HOURS } from '@/constants/orderStatus';
import type { Order } from '@/hooks/useOrders';

export const getStatusInfo = (status: string) => {
  return ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.pending;
};

export const canCancelOrder = (order: Order) => {
  const allowedStatuses = ['pending'];
  const orderAge = new Date().getTime() - new Date(order.created_at).getTime();
  const expiryTime = ORDER_EXPIRY_HOURS * 60 * 60 * 1000;

  return allowedStatuses.includes(order.status) && orderAge < expiryTime;
};

export const isOrderExpired = (order: Order) => {
  if (order.status !== 'pending') return false;
  const orderAge = new Date().getTime() - new Date(order.created_at).getTime();
  const expiryTime = ORDER_EXPIRY_HOURS * 60 * 60 * 1000;
  return orderAge >= expiryTime;
};

export const canConfirmDelivery = (order: Order) => {
  return order.status === 'shipped';
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeRemaining = (orderDate: string) => {
  const orderTime = new Date(orderDate).getTime();
  const now = new Date().getTime();
  const expiry = orderTime + (ORDER_EXPIRY_HOURS * 60 * 60 * 1000);
  const remaining = expiry - now;

  if (remaining <= 0) return 'Kedaluwarsa';

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}j ${minutes}m tersisa`;
};
