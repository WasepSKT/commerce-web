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
      const q = (supabase.from as unknown as { (table: string): { select: (fields: string) => { eq: (field: string, value: string) => { order: (field: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: OrderRow[]; error?: unknown }> } } } } })('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(200);
      const res = await q;
      const orders = (res && res.data ? res.data : []) as OrderRow[];

      const orderIds = orders.map((o) => String(o.id));
      const referralsMap: Record<string, { order_id: string; referrer_id: string; amount: number; status: string }> = {};
      const referrerIds: string[] = [];
      if (orderIds.length) {
        interface ReferralPurchaseRow { order_id: string; referrer_id: string; amount: number; status: string }
        const rfQ = (supabase.from as unknown as { (table: string): { select: (fields: string) => { in: (field: string, values: string[]) => Promise<{ data: ReferralPurchaseRow[]; error?: unknown }> } } })('referral_purchases').select('order_id, referrer_id, amount, status').in('order_id', orderIds as string[]);
        const rfRes = await rfQ;
        const rfRows = (rfRes && rfRes.data ? rfRes.data : []) as ReferralPurchaseRow[];
        rfRows.forEach((r) => {
          if (r.order_id) {
            referralsMap[String(r.order_id)] = { order_id: String(r.order_id), referrer_id: String(r.referrer_id), amount: Number(r.amount), status: String(r.status) };
            if (r.referrer_id) referrerIds.push(String(r.referrer_id));
          }
        });
      }

      // If orders don't have a customer_name, try to load profile display names
      const userIds = orders.map((o) => o.user_id).filter(Boolean).map(String) as string[];
      const profileMap: Record<string, string> = {};
      const referrerProfileMap: Record<string, { name?: string; email?: string; code?: string }> = {};
      if (userIds.length) {
        try {
          // fetch profiles for those users (avoid selecting non-existing columns)
          interface ProfileRow { id: string; full_name?: string }
          const pQ = (supabase.from as unknown as { <T>(table: string): { select: (fields: string) => { in: (field: string, values: string[]) => Promise<{ data: ProfileRow[]; error?: unknown }> } } })('profiles').select('id, full_name').in('id', userIds as string[]);
          const pRes = (await pQ) as unknown;
          // Supabase may return { data, error } or an array; handle both safely
          // Type-safe error checking with proper type guards
          const isErrorResponse = (obj: unknown): obj is { error: { message?: string } } => {
            return obj !== null && typeof obj === 'object' && 'error' in obj;
          };

          const isDataResponse = (obj: unknown): obj is { data: unknown } => {
            return obj !== null && typeof obj === 'object' && 'data' in obj;
          };

          const maybeError = isErrorResponse(pRes) ? pRes.error : null;
          if (maybeError) {
            // only log unexpected errors; common missing-column errors are handled by adjusting selects
            console.warn('Profiles query error (non-fatal):', maybeError?.message ?? maybeError);
          } else {
            // extract rows safely
            const data = isDataResponse(pRes) ? pRes.data : pRes;
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

      // Ambil data profile referrer untuk keterangan referral
      if (referrerIds.length) {
        try {
          interface ReferrerProfileRow { id: string; full_name?: string; email?: string; referral_code?: string }
          const refPq = (supabase.from as unknown as { (table: string): { select: (fields: string) => { in: (field: string, values: string[]) => Promise<{ data: ReferrerProfileRow[]; error?: unknown }> } } })('profiles').select('id, full_name, email, referral_code').in('id', referrerIds);
          const refPres = await refPq;
          const isErrorResponse = (obj: unknown): obj is { error: { message?: string } } => {
            return obj !== null && typeof obj === 'object' && 'error' in obj;
          };
          const isDataResponse = (obj: unknown): obj is { data: unknown } => {
            return obj !== null && typeof obj === 'object' && 'data' in obj;
          };
          const maybeError = isErrorResponse(refPres) ? refPres.error : null;
          if (!maybeError) {
            const data = isDataResponse(refPres) ? refPres.data : refPres;
            let pRows: ReferrerProfileRow[] = [];
            if (Array.isArray(data)) pRows = data as ReferrerProfileRow[];
            else if (data && typeof data === 'object') pRows = Object.values(data).filter(Boolean) as ReferrerProfileRow[];
            pRows.filter(Boolean).forEach((rec) => {
              if (!rec || typeof rec !== 'object' || !('id' in rec)) return;
              const id = String(rec.id);
              referrerProfileMap[id] = {
                name: String(rec.full_name ?? ''),
                email: String(rec.email ?? ''),
                code: String(rec.referral_code ?? '')
              };
            });
          }
        } catch (err) {
          console.warn('Failed to fetch referrer profiles', err);
        }
      }

      setRows(
        orders.map((o) => {
          const referral = referralsMap[String(o.id)] ?? null;
          let referralInfo: string | null = null;
          if (referral && referral.referrer_id) {
            const refProfile = referrerProfileMap[referral.referrer_id];
            if (refProfile) {
              referralInfo = `Referral dari ${refProfile.name || refProfile.email || refProfile.code}`;
            } else {
              referralInfo = `Referral dari ${referral.referrer_id}`;
            }
          }
          return {
            ...o,
            customer_name: o.customer_name ?? (o.user_id ? profileMap[String(o.user_id)] ?? o.user_id : undefined),
            referral,
            referralInfo,
          };
        })
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
      const q = (supabase.from as unknown as { (table: string): { select: (fields: string) => { eq: (field: string, value: string) => { single: () => Promise<{ data: OrderRow; error?: unknown }> } } } })('orders').select('*, order_items(*)').eq('id', orderId).single();
      const res = await q;
      let order = (res && res.data ? res.data : null) as OrderRow;

      // Enrich order items with product names by fetching from products table
      if (order.order_items && order.order_items.length > 0) {
        const items = order.order_items as Array<{ id?: string; product_id?: string; name?: string; quantity?: number; price?: number; unit_price?: number }>;
        const productIds = items
          .map(item => item.product_id)
          .filter(Boolean)
          .map(String);

        if (productIds.length > 0) {
          try {
            interface ProductRow { id: string; name?: string; price?: number }
            const productQuery = (supabase.from as unknown as { (table: string): { select: (fields: string) => { in: (field: string, values: string[]) => Promise<{ data: ProductRow[]; error?: unknown }> } } })('products').select('id, name, price').in('id', productIds);
            const productRes = await productQuery;
            const products = (productRes && productRes.data ? productRes.data : []) as ProductRow[];

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
      const { error } = await (supabase.from as unknown as { (table: string): { update: (fields: Record<string, unknown>) => { eq: (field: string, value: string) => Promise<{ error?: unknown }> } } })('orders').update({ status: 'paid' }).eq('id', orderId);
      if (error) throw error;

      // After marking as paid, attempt to record referral purchase via DB handler (idempotent)
      try {
        // fetch the order row to get user_id and total_amount
        type OrdRow = { id: string; user_id?: string | null; total_amount?: number | null };
        const ordRes = await (supabase.from('orders').select('id, user_id, total_amount').eq('id', orderId).single());
        const order = ordRes && 'data' in ordRes && ordRes.data ? (ordRes.data as OrdRow) : null;
        if (order && order.id && order.user_id) {
          const buyerUserId = String(order.user_id);
          const totalAmount = Number(order.total_amount || 0);
          const { data: rpcData, error: rpcError } = await supabase.rpc('handle_referral_purchase', { order_id_input: String(order.id), buyer_user_id: buyerUserId, purchase_amount: totalAmount });
          if (rpcError) {
            // non-fatal: log and notify admin
            console.warn('handle_referral_purchase failed', rpcError);
            toast({ title: 'Perhatian', description: 'Gagal mencatat referral secara otomatis (non-fatal).', variant: 'destructive' });
          } else {
            // On RPC success (no error) show informational toast — handler returns JSON but we don't rely on shape here
            toast({ title: 'Info', description: 'Referral tercatat sebagai pending.' });
          }
        }
      } catch (rpcErr) {
        console.warn('Failed to call handle_referral_purchase', rpcErr);
      }

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
      const { error } = await (supabase.from as unknown as { (table: string): { update: (fields: Record<string, unknown>) => { eq: (field: string, value: string) => Promise<{ error?: unknown }> } } })('orders').update({ status: 'cancelled' }).eq('id', orderId);
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
          const q = (supabase.from as unknown as { (table: string): { select: (fields: string) => { eq: (field: string, value: string) => Promise<{ data: OrderRow['order_items']; error?: unknown }> } } })('order_items').select('*').eq('order_id', order.id);
          const res = await q;
          const items = (res && res.data ? res.data : []) as OrderRow['order_items'];
          orderWithItems = { ...orderWithItems, order_items: items };
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
