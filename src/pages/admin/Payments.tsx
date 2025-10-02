import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';

interface OrderRow {
  id: string;
  user_id?: string;
  total_amount?: number;
  status?: string;
  created_at: string;
  referral?: { order_id: string; referrer_id: string; amount: number; status: string } | null;
}

export default function Payments() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

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

      setRows(
        orders.map((o) => ({
          ...o,
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

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

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
      alert('Updated: ' + JSON.stringify(data));
    } catch (err) {
      console.error(err);
      alert('Failed: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedOrderIds = Object.keys(selected).filter((k) => selected[k]);

  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium text-primary">Payments (Verify Incoming Payments)</h2>
        <p className="text-sm text-muted-foreground">Daftar pesanan berstatus <em>pending</em>. Gunakan halaman ini untuk memverifikasi pembayaran — jika sebuah order adalah referral, data referral akan ditampilkan.</p>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <button className="rounded border px-3 py-2" onClick={() => void markCompleted(selectedOrderIds)} disabled={loading || selectedOrderIds.length === 0}>Mark selected completed</button>
            <div className="ml-auto">
              <button
                aria-label="Refresh payments"
                title="Refresh payments"
                className="rounded bg-primary p-2 text-white disabled:opacity-60"
                onClick={() => void fetchPending()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Select</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Referral</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3"><input type="checkbox" checked={!!selected[r.id]} onChange={() => toggle(String(r.id))} /></td>
                      <td className="px-4 py-3 font-mono">{r.id}</td>
                      <td className="px-4 py-3">{r.user_id ?? '-'}</td>
                      <td className="px-4 py-3">{r.total_amount ?? '-'}</td>
                      <td className="px-4 py-3">{r.referral ? `Yes — ${r.referral.referrer_id}` : 'No'}</td>
                      <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
