import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { printXPrinterReceipt } from '@/lib/receiptPrinter';
import { printInvoice } from '@/lib/invoiceGenerator';
import { printFaktur } from '@/lib/fakturGenerator';
import { RefreshCw, Search, Download, Printer, FileText } from 'lucide-react';
import { TableSkeleton, HeaderSkeleton, FiltersSkeleton } from '@/components/ui/AdminSkeleton';

interface OrderRow {
  id: string;
  user_id?: string;
  total_amount?: number;
  status?: string;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  order_items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [detail, setDetail] = useState<OrderRow | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // fetch all orders
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from as unknown as any)('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(500);
      const res = (await q) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (res && (res as any).data ? (res as any).data : (res as any)) as OrderRow[];
      setOrders(rows || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      toast({ title: 'Gagal', description: 'Gagal memuat pesanan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  // Filter orders based on current filter and search term
  const filtered = orders.filter(o => {
    // Status filter
    const statusMatch = filter === 'all' || o.status === filter;

    // Search filter (by name or order ID)
    const searchMatch = !searchTerm ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.user_id && o.user_id.toLowerCase().includes(searchTerm.toLowerCase()));

    return statusMatch && searchMatch;
  });

  const getStatusInIndonesian = (status?: string): string => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'paid': return 'Dibayar';
      case 'shipped': return 'Dikirim';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status ?? 'Tidak Diketahui';
    }
  };

  const fetchOrderWithProductNames = async (orderId: string): Promise<OrderRow | null> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from as unknown as any)('orders').select('*, order_items(*)').eq('id', orderId).single();
      const res = (await q) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = (res && (res as any).data ? (res as any).data : (res as any)) as OrderRow;

      // Fetch product names for order items if they have product_id
      const items = (row.order_items ?? []) as Array<Record<string, unknown>>;
      const productIds = items.map(it => it['product_id']).filter(Boolean).map(String);
      if (productIds.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pQ = (supabase.from as unknown as any)('products').select('id,name').in('id', productIds as string[]);
        const pRes = (await pQ) as unknown;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pRows = (pRes && (pRes as any).data ? (pRes as any).data : (pRes as any)) as Array<Record<string, unknown>>;
        const prodMap: Record<string, string> = {};
        pRows.forEach((p) => {
          if (!p || typeof p !== 'object') return;
          const pid = String(p['id'] ?? '');
          const pname = String(p['name'] ?? '');
          if (pid && pname) prodMap[pid] = pname;
        });

        // Enrich items with product names
        const enriched = items.map((it) => {
          const pid = String(it['product_id'] ?? '');
          const name = String(it['name'] ?? prodMap[pid] ?? it['title'] ?? '-');
          return { ...it, name } as Record<string, unknown>;
        });
        row.order_items = enriched as OrderRow['order_items'];
      }

      return row;
    } catch (e) {
      console.error('Failed to fetch order with product names', e);
      return null;
    }
  };

  const openDetail = async (orderId: string) => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from as unknown as any)('orders').select('*, order_items(*)').eq('id', orderId).single();
      const res = (await q) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = (res && (res as any).data ? (res as any).data : (res as any)) as OrderRow;

      // Fetch product names for order items if they have product_id
      try {
        const items = (row.order_items ?? []) as Array<Record<string, unknown>>;
        const productIds = items.map(it => it['product_id']).filter(Boolean).map(String);
        if (productIds.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pQ = (supabase.from as unknown as any)('products').select('id,name').in('id', productIds as string[]);
          const pRes = (await pQ) as unknown;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pRows = (pRes && (pRes as any).data ? (pRes as any).data : (pRes as any)) as Array<Record<string, unknown>>;
          const prodMap: Record<string, string> = {};
          pRows.forEach((p) => {
            if (!p || typeof p !== 'object') return;
            const pid = String(p['id'] ?? '');
            const pname = String(p['name'] ?? '');
            if (pid && pname) prodMap[pid] = pname;
          });

          // Enrich items with product names
          const enriched = items.map((it) => {
            const pid = String(it['product_id'] ?? '');
            const name = String(it['name'] ?? prodMap[pid] ?? it['title'] ?? '-');
            return { ...it, name } as Record<string, unknown>;
          });
          row.order_items = enriched as OrderRow['order_items'];
        }
      } catch (e) {
        console.warn('Failed to resolve product names for order items', e);
      }

      setDetail(row);
    } catch (err) {
      console.error('Failed to fetch order detail', err);
      toast({ title: 'Gagal', description: 'Gagal memuat detail pesanan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (order: OrderRow) => {
    try {
      // Fetch full order details with enriched product names
      const enrichedOrder = await fetchOrderWithProductNames(order.id);
      if (enrichedOrder) {
        printInvoice(enrichedOrder);
        toast({ title: 'Sukses', description: 'Invoice berhasil dibuat' });
      } else {
        throw new Error('Gagal memuat detail pesanan');
      }
    } catch (error) {
      console.error('Invoice generation failed:', error);
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal membuat invoice',
        variant: 'destructive'
      });
    }
  };

  const downloadFaktur = async (order: OrderRow) => {
    try {
      // Fetch full order details with enriched product names
      const enrichedOrder = await fetchOrderWithProductNames(order.id);
      if (enrichedOrder) {
        printFaktur(enrichedOrder);
        toast({ title: 'Sukses', description: 'Faktur berhasil dibuat' });
      } else {
        throw new Error('Gagal memuat detail pesanan');
      }
    } catch (error) {
      console.error('Faktur generation failed:', error);
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal membuat faktur',
        variant: 'destructive'
      });
    }
  };

  const printResi = async (order: OrderRow) => {
    try {
      // Fetch full order details with enriched product names
      const enrichedOrder = await fetchOrderWithProductNames(order.id);
      if (enrichedOrder) {
        printXPrinterReceipt(enrichedOrder);
      } else {
        throw new Error('Gagal memuat detail pesanan');
      }
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Tidak dapat mencetak resi',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-primary">Kelola Pesanan</h2>
            <p className="text-sm text-muted-foreground">Menampilkan semua pesanan — gunakan filter untuk melihat berdasarkan status.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => void fetchOrders()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-2 border rounded-md min-w-[140px]">
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Dibayar</option>
            <option value="shipped">Dikirim</option>
            <option value="completed">Selesai</option>
            <option value="selesai">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : (
          <div className="mt-4 overflow-auto rounded border">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-muted/10">
                <tr>
                  <th className="px-4 py-2 text-left">Order ID</th>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y">
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono">{o.id}</td>
                    <td className="px-4 py-3">{o.customer_name ?? o.user_id ?? '-'}</td>
                    <td className="px-4 py-3">Rp {Number(o.total_amount ?? 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">{getStatusInIndonesian(o.status)}</td>
                    <td className="px-4 py-3">{o.created_at ? new Date(o.created_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => void openDetail(String(o.id))}>Detail</Button>
                        {(o.status === 'dikirim' || o.status === 'shipped') && <Button size="sm" variant="default" onClick={() => void downloadInvoice(o)}><Download className="mr-1 h-4 w-4" />Invoice</Button>}
                        {(o.status === 'completed' || o.status === 'selesai') && <Button size="sm" variant="default" onClick={() => void downloadFaktur(o)}><FileText className="mr-1 h-4 w-4" />Faktur</Button>}
                        {o.status === 'paid' && <Button size="sm" variant="default" onClick={() => void printResi(o)}><Printer className="mr-1 h-4 w-4" />Resi</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Pesanan</DialogTitle>
              <DialogDescription>Periksa detail pesanan dan kelola pengiriman di sini.</DialogDescription>
            </DialogHeader>
            {detail ? (
              <div className="space-y-3">
                <div className="border p-3 rounded">
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{detail.id}</p>
                </div>
                <div className="border p-3 rounded">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{detail.customer_name ?? detail.user_id}</p>
                  <p className="text-sm">{detail.customer_phone}</p>
                  <p className="text-sm">{detail.customer_address}</p>
                </div>
                <div className="border p-3 rounded">
                  <p className="text-sm text-muted-foreground">Item</p>
                  {detail.order_items && detail.order_items.length > 0 ? (
                    <ul className="text-sm">
                      {detail.order_items.map((it, i) => (
                        <li key={i} className="py-1">{String(it['name'] ?? it['product_name'] ?? it['title'] ?? '-')} — {String(it['quantity'] ?? it['qty'] ?? 1)}</li>
                      ))}
                    </ul>
                  ) : <div className="text-sm text-muted-foreground">Tidak ada item.</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button>
                  {(detail.status === 'dikirim' || detail.status === 'shipped') && (
                    <Button onClick={() => downloadInvoice(detail)}><Download className="mr-2 h-4 w-4" />Download Invoice</Button>
                  )}
                  {(detail.status === 'completed' || detail.status === 'selesai') && (
                    <Button onClick={() => downloadFaktur(detail)}><FileText className="mr-2 h-4 w-4" />Download Faktur</Button>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
