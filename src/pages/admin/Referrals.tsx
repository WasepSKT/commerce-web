import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/ui/EmptyState';
import useDebouncedEffect from '@/hooks/useDebouncedEffect';
import { RefreshCw } from 'lucide-react';
import { TableSkeleton, FiltersSkeleton } from '@/components/ui/AdminSkeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  const [loading, setLoading] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);
  const requestIdRef = useRef(0);
  const initialLoadRef = useRef(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const fetchReferrals = useCallback(async (reset = false) => {
    const req = ++requestIdRef.current;
    setLoading(true);
    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from('referrals')
        .select(`
          *,
          referrer:profiles!referrer_id(full_name, email),
          referred:profiles!referred_id(full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (search) query = query.ilike('referral_code', `%${search}%`);
      if (fromDate) query = query.gte('created_at', new Date(fromDate).toISOString());
      if (toDate) query = query.lte('created_at', new Date(toDate + 'T23:59:59').toISOString());

      const { data, error, count } = await query;

      // ignore stale responses
      if (req !== requestIdRef.current) return;

      if (error) {
        console.error('Error fetching referrals:', error);
        setReferrals([]);
        return;
      }

      console.log('Referrals data:', data);
      setReferrals(data || []);
      setTotal(count || 0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, fromDate, toDate]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      void fetchReferrals(true);
    }
  }, [fetchReferrals]);

  useEffect(() => {
    // Reset to page 1 when search or filters change
    if (!initialLoadRef.current) {
      setPage(1);
      void fetchReferrals(true);
    }
  }, [search, fromDate, toDate, fetchReferrals]);

  // Manual search and filter handling to avoid double reload
  const handleSearch = () => {
    if (!initialLoadRef.current) {
      void fetchReferrals(true);
    }
  };

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

          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : referrals.length === 0 ? (
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
                            <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Active
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{r.reward_points ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {Math.min(pageSize, referrals.length)} dari {total} referral
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                      const p = Math.max(1, Math.min(totalPages, page - 2 + idx));
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => setPage(p)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
