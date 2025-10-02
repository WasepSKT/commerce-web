import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/ui/EmptyState';
import useDebouncedEffect from '@/hooks/useDebouncedEffect';
import { RefreshCw } from 'lucide-react';

interface Referral {
  id: string;
  referral_code: string;
  referrer_id: string;
  referred_id: string;
  reward_points?: number;
  created_at: string;
  referrer?: { full_name?: string | null; email: string };
  referred?: { full_name?: string | null; email: string };
}

export default function Referrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);
  const requestIdRef = useRef(0);

  const fetchReferrals = async (reset = false) => {
    const req = ++requestIdRef.current;
    setLoading(true);
    try {
      let query = supabase
        .from('referrals')
        .select(
          `*, referrer:profiles!referrals_referrer_id_fkey(full_name, email), referred:profiles!referrals_referred_id_fkey(full_name, email)`
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (search) query = query.ilike('referral_code', `%${search}%`);
      if (fromDate) query = query.gte('created_at', new Date(fromDate).toISOString());
      if (toDate) query = query.lte('created_at', new Date(toDate + 'T23:59:59').toISOString());

      const { data } = await query;
      // ignore stale responses
      if (req !== requestIdRef.current) return;
      if (reset) setReferrals(data || []);
      else setReferrals(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReferrals(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // Debounce auto-apply for search and date filters
  // Calls fetchReferrals(true) after a short pause and shows a brief "Auto-applied" indicator
  useDebouncedEffect(() => {
    const run = async () => {
      setAutoApplied(true);
      try {
        await fetchReferrals(true);
      } finally {
        // brief visual feedback
        window.setTimeout(() => setAutoApplied(false), 1200);
      }
    };
    void run();
  }, [search, fromDate, toDate], 350);

  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium text-primary">Referral Management</h2>
        <p className="text-sm text-muted-foreground">Daftar referral yang tercatat.</p>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-3">
            <input
              placeholder="Search code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border px-3 py-2 bg-background"
            />
            <input type="date" className="rounded-md border px-3 py-2 bg-background" value={fromDate ?? ''} onChange={(e) => setFromDate(e.target.value || null)} />
            <input type="date" className="rounded-md border px-3 py-2 bg-background" value={toDate ?? ''} onChange={(e) => setToDate(e.target.value || null)} />
            <div className="ml-auto flex items-center gap-2">
              <button
                aria-label="Refresh"
                title="Refresh"
                className="rounded bg-primary p-2 text-white disabled:opacity-60"
                onClick={() => void fetchReferrals(true)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {autoApplied && <span className="text-xs text-muted-foreground">Auto-applied</span>}
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="Belum ada referral"
                description="Belum ada referral yang tercatat. Ajak pengguna untuk berbagi kode referral mereka."
                lottieSrc="https://lottie.host/6ebe5320-be98-4e5d-90b5-a9f5d2f186fd/ez07wuijAR.lottie"
                cta={{ label: loading ? 'Loading…' : 'Refresh', onClick: () => void fetchReferrals(true) }}
              />
            </div>
          ) : (
            <>
              <div className="overflow-auto rounded border">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Referrer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Referred</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Reward</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y">
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 text-sm">{r.referrer?.full_name || r.referrer?.email || r.referrer_id}</td>
                        <td className="px-4 py-3 text-sm">{r.referred?.full_name || r.referred?.email || r.referred_id}</td>
                        <td className="px-4 py-3 text-sm font-mono">{r.referral_code}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              className="rounded border px-2 py-1 text-sm"
                              disabled={!!rowLoading[r.id]}
                              onClick={async () => {
                                if (!confirm('Mark this referral order as completed?')) return;
                                try {
                                  setRowLoading((s) => ({ ...s, [r.id]: true }));
                                  type RpcResult = { data: unknown; error: unknown };
                                  const rpcFn = (supabase.rpc as unknown) as (
                                    name: string,
                                    params?: Record<string, unknown>
                                  ) => Promise<RpcResult>;
                                  const { data, error } = await rpcFn('rpc_mark_referral_orders_completed', { order_ids: [r.referral_code] });
                                  if (error) throw error;
                                  // optional: refresh list or optimistic update
                                  void fetchReferrals(true);
                                  alert('Marked completed — updated count: ' + (data ?? 0));
                                } catch (err: unknown) {
                                  console.error(err);
                                  const msg = err instanceof Error ? err.message : String(err);
                                  alert('Failed to mark completed: ' + msg);
                                } finally {
                                  setRowLoading((s) => ({ ...s, [r.id]: false }));
                                }
                              }}
                            >
                              {rowLoading[r.id] ? 'Processing…' : 'Mark completed'}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{r.reward_points ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-center">
                <button
                  className="rounded border px-4 py-2"
                  onClick={() => setLimit((l) => l + 20)}
                >
                  Load more
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
