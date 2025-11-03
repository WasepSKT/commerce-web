/**
 * Constants for Admin Dashboard
 */

export const REVENUE_RANGES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type RevenueRange = typeof REVENUE_RANGES[keyof typeof REVENUE_RANGES];

export const DATE_RANGES = {
  WEEKLY_DAYS: 7,
  MONTHLY_MONTHS: 12,
  YEARLY_YEARS: 5,
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const STATUS_CONFIG = {
  pending: { label: 'Menunggu', variant: 'secondary' as const },
  paid: { label: 'Dibayar', variant: 'default' as const },
  shipped: { label: 'Dikirim', variant: 'outline' as const },
  completed: { label: 'Selesai', variant: 'secondary' as const },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
} as const;

