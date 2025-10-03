import { useEffect, useState } from 'react';
import { RefreshCw, Eye, XCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { printXPrinterReceipt } from '@/lib/receiptPrinter';
import { TableSkeleton, HeaderSkeleton } from '@/components/ui/AdminSkeleton';

interface OrderRow {
  id: string;
  user_id?: string;
  total_amount?: number;
  status?: string;
  created_at: string;
  referral?: { order_id: string; referrer_id: string; amount: number; status: string } | null;
  // lightweight shape for detail view (may be incomplete depending on typed client)
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  order_items?: Array<{ id?: string; order_id?: string; product_id?: string; name?: string; quantity?: number; price?: number; unit_price?: number }>;
}

export default function Payments() {
  const { toast } = useToast();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'pay' | 'cancel' | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      // fetch pending orders
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from as unknown as any)('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(200);
      const res = (await q) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders = (res && (res as any).data ? (res as any).data : (res as any)) as OrderRow[];

      const orderIds = orders.map((o) => String(o.id));
      const referralsMap: Record<string, { order_id: string; referrer_id: string; amount: number; status: string }> = {};
      if (orderIds.length) {
        // supabase typings may lag for dynamic selects - narrow the lint rule locally
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rfQ = (supabase.from as unknown as any)('referral_purchases').select('order_id, referrer_id, amount, status').in('order_id', orderIds as string[]);
        const rfRes = (await rfQ) as unknown;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rfRows = (rfRes && (rfRes as any).data ? (rfRes as any).data : (rfRes as any)) as Array<Record<string, unknown>>;
        rfRows.forEach((r) => {
          if (r.order_id) referralsMap[String(r.order_id)] = { order_id: String(r.order_id), referrer_id: String(r.referrer_id), amount: Number(r.amount), status: String(r.status) };
        });
      }

      // If orders don't have a customer_name, try to load profile display names
      const userIds = orders.map((o) => o.user_id).filter(Boolean).map(String) as string[];
      const profileMap: Record<string, string> = {};
      if (userIds.length) {
        try {
          // fetch profiles for those users (avoid selecting non-existing columns)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pQ = (supabase.from as unknown as any)('profiles').select('id, full_name').in('id', userIds as string[]);
          const pRes = (await pQ) as unknown;
          // Supabase may return { data, error } or an array; handle both safely
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const maybeError = pRes && (pRes as any).error ? (pRes as any).error : null;
          if (maybeError) {
            // only log unexpected errors; common missing-column errors are handled by adjusting selects
            console.warn('Profiles query error (non-fatal):', maybeError?.message ?? maybeError);
          } else {
            // extract rows safely
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = pRes && (pRes as any).data ? (pRes as any).data : pRes;
            let pRows: Array<Record<string, unknown>> = [];
            if (Array.isArray(data)) pRows = data as Array<Record<string, unknown>>;
            else if (data && typeof data === 'object') pRows = Object.values(data).filter(Boolean) as Array<Record<string, unknown>>;
            // populate map, ignore null/invalid entries
            pRows.filter(Boolean).forEach((p) => {
              if (!p || typeof p !== 'object') return;
              const rec = p as Record<string, unknown>;
              if (rec['id'] == null) return;
              const id = String(rec['id']);
              const name = String(rec['full_name'] ?? '');
              if (name) profileMap[id] = name;
            });
          }
        } catch (err) {
          // network or unexpected errors - don't block the page
          console.warn('Failed to fetch profiles', err);
        }
      }

      setRows(
        orders.map((o) => ({
          ...o,
          // prefer stored customer_name, otherwise use profile name if available
          customer_name: o.customer_name ?? (o.user_id ? profileMap[String(o.user_id)] ?? o.user_id : undefined),
          referral: referralsMap[String(o.id)] ?? null,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPending();
  }, []);

  // ...existing code...

  const openDetail = async (orderId: string) => {
    setLoading(true);
    try {
      // fetch single order with items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from as unknown as any)('orders').select('*, order_items(*)').eq('id', orderId).single();
      const res = (await q) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let order = (res && (res as any).data ? (res as any).data : (res as any)) as OrderRow;

      // Enrich order items with product names by fetching from products table
      if (order.order_items && order.order_items.length > 0) {
        const items = order.order_items as Array<Record<string, unknown>>;
        const productIds = items
          .map(item => item.product_id)
          .filter(Boolean)
          .map(String);

        if (productIds.length > 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const productQuery = (supabase.from as unknown as any)('products').select('id, name, price').in('id', productIds);
            const productRes = (await productQuery) as unknown;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const products = (productRes && (productRes as any).data ? (productRes as any).data : (productRes as any)) as Array<Record<string, unknown>>;

            // Create a map of product_id to product info
            const productMap: Record<string, { name: string; price: number }> = {};
            products.forEach(product => {
              if (product.id) {
                productMap[String(product.id)] = {
                  name: String(product.name || ''),
                  price: Number(product.price || 0)
                };
              }
            });

            // Enrich order items with product names
            const enrichedItems = items.map(item => ({
              ...item,
              name: item.name || productMap[String(item.product_id)]?.name || 'Produk tidak ditemukan',
              price: item.price || productMap[String(item.product_id)]?.price || 0
            }));

            order = { ...order, order_items: enrichedItems as OrderRow['order_items'] };
          } catch (productError) {
            console.warn('Failed to fetch product details for order items', productError);
          }
        }
      }

      setDetailOrder(order);
    } catch (e) {
      console.error('Failed to load order detail', e);
      toast({ title: 'Gagal', description: 'Gagal memuat detail pesanan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (orderId: string) => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as unknown as any)('orders').update({ status: 'paid' }).eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Sukses', description: 'Pesanan ditandai sebagai dibayar' });
      await fetchPending();
      setDetailOrder(null);
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal', description: 'Gagal memperbarui pesanan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const markCancelled = async (orderId: string) => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as unknown as any)('orders').update({ status: 'cancelled' }).eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Dibatalkan', description: 'Pesanan dibatalkan' });
      await fetchPending();
      setDetailOrder(null);
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal', description: 'Gagal membatalkan pesanan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (order: OrderRow) => {
    try {
      printXPrinterReceipt(order);
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Tidak dapat membuka jendela cetak',
        variant: 'destructive'
      });
    }
  };

  const printReceiptAndMarkPaid = async (order: OrderRow) => {
    try {
      setLoading(true);
      // ensure we have the latest order items; openDetail may not include them depending on query shape
      let orderWithItems = order;
      if (!orderWithItems.order_items || orderWithItems.order_items.length === 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q = (supabase.from as unknown as any)('order_items').select('*').eq('order_id', order.id);
          const res = (await q) as unknown;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items = (res && (res as any).data ? (res as any).data : (res as any)) as Array<Record<string, unknown>>;
          orderWithItems = { ...orderWithItems, order_items: items as OrderRow['order_items'] };
        } catch (err) {
          console.warn('Failed to fetch order_items for receipt; proceeding with existing items', err);
        }
      }
      await handlePrintReceipt(orderWithItems);
      // after printing, mark as paid
      await markPaid(order.id);
      setDetailOrder(null);
    } catch (e) {
      console.error('Failed to print and mark paid', e);
      toast({ title: 'Gagal', description: 'Gagal mencetak atau memperbarui pesanan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Invoice printing removed from Payments; invoice/download handled in Orders page.

  const markCompleted = async (orderIds: string[]) => {
    try {
      setLoading(true);
      type RpcResult = { data: unknown; error: unknown };
      const rpcFn = (supabase.rpc as unknown) as (
        name: string,
        params?: Record<string, unknown>
      ) => Promise<RpcResult>;
      const { data, error } = await rpcFn('rpc_mark_referral_orders_completed', { order_ids: orderIds });
      if (error) throw error;
      await fetchPending();
      toast({ title: 'Sukses', description: 'Referral orders updated' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // bulk selection removed; per-row actions are used instead

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setDetailOrder(null);
  };

  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium text-primary">Kelola Pembayaran</h2>
        <p className="text-sm text-muted-foreground">Daftar pesanan berstatus <em>pending</em>. Gunakan halaman ini untuk memverifikasi pembayaran — jika sebuah order adalah referral, data referral akan ditampilkan.</p>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={() => void fetchPending()} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Confirmation Dialog for actions */}
          <Dialog open={confirming} onOpenChange={(o) => { if (!o) setConfirming(false); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi</DialogTitle>
                <DialogDescription>
                  {confirmAction === 'pay' ? 'Anda akan menandai pesanan ini sebagai dibayar. Lanjutkan?' : 'Anda akan membatalkan pesanan ini. Lanjutkan?'}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={() => { setConfirming(false); setConfirmAction(null); setConfirmTargetId(null); }}>Batal</Button>
                <Button onClick={async () => {
                  if (!confirmTargetId || !confirmAction) return;
                  // For 'pay' action we open the detail dialog so admin can print the x-printer resi
                  // and then mark as paid. For 'cancel' we perform immediate cancellation.
                  const id = confirmTargetId;
                  const act = confirmAction;
                  setConfirming(false);
                  setConfirmAction(null);
                  setConfirmTargetId(null);
                  if (act === 'pay') {
                    // open detail dialog which contains the Cetak Resi & Tandai Dibayar flow
                    await openDetail(id);
                  }
                  if (act === 'cancel') await markCancelled(id);
                }}>
                  {confirmAction === 'pay' ? 'Tandai Dibayar' : 'Batalkan Pesanan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : rows.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="Tidak ada pembayaran pending"
                description="Tidak ada pembayaran yang menunggu verifikasi saat ini."
                lottieSrc="https://lottie.host/6ebe5320-be98-4e5d-90b5-a9f5d2f186fd/ez07wuijAR.lottie"
                cta={{ label: loading ? 'Loading…' : 'Refresh', onClick: () => void fetchPending() }}
              />
            </div>
          ) : (
            <div className="overflow-auto rounded border">
              <table className="min-w-full divide-y">
                <thead className="bg-muted/10">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Referral</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-mono">{r.id}</td>
                      <td className="px-4 py-3">{r.customer_name ?? r.user_id ?? '-'}</td>
                      <td className="px-4 py-3">Rp {Number(r.total_amount ?? 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">{r.referral ? `Ya — ${r.referral.referrer_id}` : 'Tidak'}</td>
                      <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {/* Actions per-row: always show detail (Eye). If pending, also show Tandai Dibayar / Batal */}
                        <div className="flex items-center gap-2">
                          <button aria-label="Lihat Detail Pesanan" title="Lihat Detail Pesanan" className="text-primary" onClick={() => void openDetail(String(r.id))}>
                            <Eye className="w-5 h-5" />
                          </button>
                          {r.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" className="bg-muted/10 hover:bg-muted/20 p-2 rounded" onClick={() => { setConfirmAction('pay'); setConfirmTargetId(String(r.id)); setConfirming(true); }} aria-label="Tandai Dibayar">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setConfirmAction('cancel'); setConfirmTargetId(String(r.id)); setConfirming(true); }} aria-label="Batalkan Pesanan">
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
            <DialogDescription>Periksa detail pesanan dan verifikasi pembayaran di sini.</DialogDescription>
          </DialogHeader>
          {detailOrder ? (
            <div className="space-y-3">
              <div className="border p-3 rounded">
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-medium">{detailOrder.id}</p>
              </div>
              <div className="border p-3 rounded">
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{detailOrder.customer_name ?? detailOrder.user_id}</p>
                <p className="text-sm">{detailOrder.customer_phone}</p>
                <p className="text-sm">{detailOrder.customer_address}</p>
              </div>
              <div className="border p-3 rounded">
                <p className="text-sm text-muted-foreground">Jumlah</p>
                <p className="font-medium">Rp {Number(detailOrder.total_amount ?? 0).toLocaleString('id-ID')}</p>
              </div>
              <div className="border p-3 rounded">
                <p className="text-sm text-muted-foreground">Item</p>
                {detailOrder.order_items && detailOrder.order_items.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">Produk</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Harga</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrder.order_items.map((it) => {
                        const name = String(it.name ?? it['product_name'] ?? it['title'] ?? '-');
                        const qty = Number(it.quantity ?? it['qty'] ?? 1);
                        const unit = Number(((it as unknown) as Record<string, unknown>)['unit_price'] ?? it['price'] ?? 0);
                        const total = unit * qty;
                        return (
                          <tr key={String(it.id ?? Math.random())}>
                            <td className="py-1">{name}{it['weight'] ? <div className="text-xs text-muted-foreground">Berat: {String(it['weight'])}</div> : null}</td>
                            <td className="py-1 text-center">{qty}</td>
                            <td className="py-1 text-right">Rp {unit.toLocaleString('id-ID')}</td>
                            <td className="py-1 text-right">Rp {total.toLocaleString('id-ID')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground">Tidak ada item pada pesanan ini.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDetailOrder(null)}>Tutup</Button>
                <Button onClick={() => void printReceiptAndMarkPaid(detailOrder)}>Cetak Resi & Tandai Dibayar</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
