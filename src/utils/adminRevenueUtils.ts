/**
 * Utility functions for Admin Dashboard revenue calculations
 */

import { REVENUE_RANGES, DATE_RANGES, type RevenueRange } from '@/constants/adminDashboard';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface Order {
  created_at: string;
  total_amount: number | null;
}

/**
 * Build revenue series data based on selected time range
 */
export function buildRevenueSeries(
  orders: Order[],
  range: RevenueRange
): RevenueDataPoint[] {
  switch (range) {
    case REVENUE_RANGES.WEEKLY:
      return buildWeeklyRevenue(orders);
    case REVENUE_RANGES.MONTHLY:
      return buildMonthlyRevenue(orders);
    case REVENUE_RANGES.YEARLY:
      return buildYearlyRevenue(orders);
    default:
      return buildWeeklyRevenue(orders);
  }
}

/**
 * Build weekly revenue data (last 7 days)
 */
function buildWeeklyRevenue(orders: Order[]): RevenueDataPoint[] {
  const days = DATE_RANGES.WEEKLY_DAYS;
  const now = new Date();
  const buckets: Record<string, number> = {};

  // Initialize buckets for last 7 days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }

  // Aggregate orders by date
  for (const order of orders) {
    const key = new Date(order.created_at).toISOString().slice(0, 10);
    if (key in buckets) {
      buckets[key] += Number(order.total_amount || 0);
    }
  }

  return Object.entries(buckets).map(([key, value]) => ({
    date: new Date(key).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
    revenue: value,
  }));
}

/**
 * Build monthly revenue data (last 12 months)
 */
function buildMonthlyRevenue(orders: Order[]): RevenueDataPoint[] {
  const months = DATE_RANGES.MONTHLY_MONTHS;
  const now = new Date();
  const buckets: Record<string, number> = {};

  // Initialize buckets for last 12 months
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = 0;
  }

  // Aggregate orders by month
  for (const order of orders) {
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in buckets) {
      buckets[key] += Number(order.total_amount || 0);
    }
  }

  return Object.entries(buckets).map(([key, value]) => ({
    date: new Date(key + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
    revenue: value,
  }));
}

/**
 * Build yearly revenue data (last 5 years)
 */
function buildYearlyRevenue(orders: Order[]): RevenueDataPoint[] {
  const years = DATE_RANGES.YEARLY_YEARS;
  const now = new Date();
  const buckets: Record<string, number> = {};

  // Initialize buckets for last 5 years
  for (let i = years - 1; i >= 0; i--) {
    const y = now.getFullYear() - i;
    const key = String(y);
    buckets[key] = 0;
  }

  // Aggregate orders by year
  for (const order of orders) {
    const d = new Date(order.created_at);
    const key = String(d.getFullYear());
    if (key in buckets) {
      buckets[key] += Number(order.total_amount || 0);
    }
  }

  return Object.entries(buckets).map(([key, value]) => ({
    date: key,
    revenue: value,
  }));
}

