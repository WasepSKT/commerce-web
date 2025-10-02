import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';

interface Purchase {
  id: string;
  order_id: string;
  referrer_id: string;
  referred_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function ReferralPurchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase.from as unknown as any)('referral_purchases').select('*').order('created_at', { ascending: false }).limit(200);
      const result = (await query) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (result && (result as any).data ? (result as any).data : (result as any)) as Purchase[];
      setPurchases(rows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPurchases();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

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
      await fetchPurchases();
      alert('Updated: ' + JSON.stringify(data));
    } catch (err) {
      console.error(err);
      alert('Failed to update: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedOrderIds = Object.keys(selected).filter((k) => selected[k]);

  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium text-primary">Referral Purchases</h2>
        <p className="text-sm text-muted-foreground">Riwayat pembelian referral yang sudah tercatat (biasanya status <em>completed</em>). Untuk memverifikasi pembayaran masuk, gunakan menu <strong>Verifications</strong>.</p>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <button className="rounded border px-3 py-2" onClick={() => void markCompleted(selectedOrderIds)} disabled={loading || selectedOrderIds.length === 0}>Mark selected completed</button>
            <div className="ml-auto">
              <button
                aria-label="Refresh purchases"
                title="Refresh purchases"
                className="rounded bg-primary p-2 text-white disabled:opacity-60"
                onClick={() => void fetchPurchases()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {purchases.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="Tidak ada pembelian tercatat"
                description="Belum ada pembelian referral tercatat saat ini. Jika Anda ingin memverifikasi pembayaran masuk, buka menu Verifications untuk melakukan validasi dan menandai pesanan sebagai completed."
                lottieSrc="https://lottie.host/6ebe5320-be98-4e5d-90b5-a9f5d2f186fd/ez07wuijAR.lottie"
                cta={{ label: 'Buka Payments', onClick: () => void navigate('/admin/payments') }}
              />
            </div>
          ) : (
            <div className="overflow-auto rounded border">
              <table className="min-w-full divide-y">
                <thead className="bg-muted/10">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Select</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Referrer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3"><input type="checkbox" checked={!!selected[p.order_id]} onChange={() => toggleSelect(p.order_id)} /></td>
                      <td className="px-4 py-3 font-mono">{p.order_id}</td>
                      <td className="px-4 py-3">{p.referrer_id}</td>
                      <td className="px-4 py-3">{p.amount}</td>
                      <td className="px-4 py-3">{p.status}</td>
                      <td className="px-4 py-3">{new Date(p.created_at).toLocaleString()}</td>
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
