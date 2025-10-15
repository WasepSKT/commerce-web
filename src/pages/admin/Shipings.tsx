import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { TableSkeleton, HeaderSkeleton } from '@/components/ui/AdminSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';

interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
}

interface OrderRow {
  id: string;
  user_id?: string;
  total_amount?: number;
  status?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  shipping_status?: string | null;
  order_items?: OrderItem[];
}

export default function Shipings() {
  const { toast } = useToast();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPaid = async () => {
    setLoading(true);
    try {
      // fetch paid orders and their items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from as unknown as any)('orders').select('*, order_items(*)').in('status', ['paid', 'shipped', 'completed']).order('created_at', { ascending: false }).limit(200);
      const res = (await q) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders = (res && (res as any).data ? (res as any).data : (res as any)) as OrderRow[];
      setRows(orders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchPaid(); }, []);
  return (
    <AdminLayout>
      <SEOHead
        title="Kelola Pengiriman - Admin Regal Paw"
        description="Panel admin untuk mengelola pengiriman pesanan. Tandai resi, pilih jasa kirim, dan update status pengiriman untuk pesanan yang telah dibayar."
        keywords="admin pengiriman, manajemen pengiriman, resi, jasa kirim, Regal Paw, admin panel"
        canonical="/admin/shipings"
        ogType="website"
        noindex={true}
      />
      <div>
        <h2 className="text-lg font-medium text-primary">Kelola Pengiriman</h2>
        <p className="text-sm text-muted-foreground">Daftar pesanan yang statusnya otomatis diperbarui oleh webhook Payment/Shipping. Informasi kurir dan nomor resi bersifat read-only.</p>

        {loading ? (
          <div className="mt-6 space-y-4">
            <HeaderSkeleton />
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="flex gap-2 items-center">
                        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-44 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Tidak ada pesanan untuk dikirim"
              description="Tidak ada pesanan yang sudah dibayar dan siap untuk dikirim saat ini."
              lottieSrc="https://lottie.host/6ebe5320-be98-4e5d-90b5-a9f5d2f186fd/ez07wuijAR.lottie"
              cta={{ label: 'Refresh', onClick: () => void fetchPaid() }}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {rows.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Order #{r.id}</p>
                    <p className="text-sm">{r.customer_name ?? r.user_id} — {r.customer_phone}</p>
                    <p className="text-sm">{r.customer_address}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">Total: Rp {Number(r.total_amount ?? 0).toLocaleString('id-ID')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Kurir</p>
                        <p className="font-medium">{r.shipping_courier ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">No. Resi</p>
                        <p className="font-mono">{r.tracking_number ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Shipping Status</p>
                        <div>
                          {(() => {
                            const status = (r.shipping_status ?? r.status ?? 'pending') as string;
                            const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
                              pending: { label: 'Menunggu', variant: 'secondary' },
                              paid: { label: 'Dibayar', variant: 'default' },
                              shipped: { label: 'Dikirim', variant: 'outline' },
                              completed: { label: 'Selesai', variant: 'secondary' },
                              delivered: { label: 'Terkirim', variant: 'default' },
                              cancelled: { label: 'Dibatalkan', variant: 'destructive' },
                            };
                            const info = map[status] || map['pending'];
                            return <Badge variant={info.variant}>{info.label}</Badge>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
