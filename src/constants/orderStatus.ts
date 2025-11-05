import { Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Menunggu Pembayaran',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-yellow-600',
    description: 'Pesanan menunggu konfirmasi pembayaran'
  },
  paid: {
    label: 'Dibayar',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
    description: 'Pembayaran telah dikonfirmasi'
  },
  shipped: {
    label: 'Dikirim',
    variant: 'outline' as const,
    icon: Truck,
    color: 'text-blue-600',
    description: 'Pesanan sedang dalam pengiriman'
  },
  completed: {
    label: 'Selesai',
    variant: 'secondary' as const,
    icon: Package,
    color: 'text-green-700',
    description: 'Pesanan telah selesai'
  },
  cancelled: {
    label: 'Dibatalkan',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
    description: 'Pesanan telah dibatalkan'
  }
} as const;

export const CANCEL_REASONS = [
  'Berubah pikiran',
  'Menemukan harga lebih murah',
  'Pesanan tidak sesuai kebutuhan',
  'Kesalahan dalam pemesanan',
  'Terlalu lama menunggu konfirmasi',
  'Alasan keuangan',
  'Lainnya'
] as const;

export const ORDER_EXPIRY_HOURS = 24;
