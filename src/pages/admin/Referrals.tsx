import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/ui/EmptyState';

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

  useEffect(() => {
    const fetchReferrals = async () => {
      const { data } = await supabase
        .from('referrals')
        .select(
          `*, referrer:profiles!referrals_referrer_id_fkey(full_name, email), referred:profiles!referrals_referred_id_fkey(full_name, email)`
        )
        .order('created_at', { ascending: false });

      setReferrals(data || []);
    };

    void fetchReferrals();
  }, []);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  const fetchReferrals = async (reset = false) => {
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

  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium">Referral Management</h2>
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
            <button className="ml-auto rounded bg-primary px-3 py-2 text-white" onClick={() => void fetchReferrals(true)} disabled={loading}>{loading ? 'Loading…' : 'Apply'}</button>
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
