/**
 * Utility functions for Admin Dashboard UI helpers
 */

import { STATUS_CONFIG } from '@/constants/adminDashboard';

/**
 * Format price to Indonesian Rupiah
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Get status badge component with proper styling
 */
export function getStatusBadge(status: string): JSX.Element {
  const statusInfo = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const isDestructive = statusInfo.variant === 'destructive';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${isDestructive
          ? 'text-destructive border-destructive'
          : 'text-foreground border-border'
        }`}
    >
      {statusInfo.label}
    </span>
  );
}

