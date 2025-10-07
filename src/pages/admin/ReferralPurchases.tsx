import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase';

type PurchaseRow = Database['public']['Tables']['referral_purchases']['Row'] & {
  referrer_name?: string | null;
};

type JoinedRow = PurchaseRow & {
  profiles?: { full_name?: string | null } | null;
};

export default function ReferralPurchases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<PurchaseRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | 'refund' | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      // Join with profiles to get referrer name for display
      const res = await supabase
        .from('referral_purchases')
        // specify the exact relationship to profiles (referrer_id) because there are two fks to profiles
        .select('*, profiles!referral_purchases_referrer_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(200);

      const data = res.data as (JoinedRow[] | null);
      const error = res.error;

      if (error) {
        console.error(error);
        setPurchases([]);
        return;
      }

      // Map rows to PurchaseRow shape
      const rows: PurchaseRow[] = (data || []).map((r: JoinedRow) => ({
        ...r,
        referrer_name: r.profiles?.full_name ?? r.referrer_id,
      }));
      setPurchases(rows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPurchases();
  }, []);

  const markCompleted = async (orderIds: string[]) => {
    try {
      setLoading(true);
      const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_mark_referral_orders_completed', { order_ids: orderIds });
      if (rpcError) throw rpcError;
      await fetchPurchases();
      toast({ title: 'Berhasil', description: 'Pesanan ditandai selesai.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal', description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const markStatus = async (orderId: string, status: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('referral_purchases').update({ status }).eq('order_id', orderId);
      if (error) throw error;
      await fetchPurchases();
      toast({ title: 'Berhasil', description: `Status diperbarui: ${status}` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Gagal', description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const markSingleWithConfirm = (p: PurchaseRow, action: 'complete' | 'cancel' | 'refund') => {
    setConfirmTarget(p);
    setConfirmAction(action);
    setConfirming(true);
  };

  const confirmMarkSingle = async () => {
    if (!confirmTarget || !confirmAction) return;
    const orderId = String(confirmTarget.order_id);
    if (confirmAction === 'complete') {
      await markCompleted([orderId]);
    } else if (confirmAction === 'cancel') {
      await markStatus(orderId, 'cancelled');
    } else if (confirmAction === 'refund') {
      await markStatus(orderId, 'refunded');
    }
    setConfirming(false);
    setConfirmTarget(null);
    setConfirmAction(null);
  };

  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium text-primary">Pembelian Referral</h2>
        <p className="text-sm text-muted-foreground">Riwayat pembelian referral yang tercatat. Gunakan menu <strong>Verifications</strong> untuk memvalidasi bukti pembayaran.</p>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Referrer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Commission</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y">
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-mono">{p.order_id}</td>
                      <td className="px-4 py-3">{p.referrer_name ?? p.referrer_id}</td>
                      <td className="px-4 py-3">Rp {Number(p.commission_amount ?? p.amount ?? 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">{p.status}</td>
                      <td className="px-4 py-3">{new Date(p.created_at ?? '').toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="p-2 rounded" aria-label="Tampilkan aksi">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => markSingleWithConfirm(p, 'complete')}>
                              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <span>Tandai Selesai</span></div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => markSingleWithConfirm(p, 'cancel')}>
                              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" /> <span>Batalkan</span></div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => markSingleWithConfirm(p, 'refund')}>
                              <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-yellow-600" /> <span>Tandai Refund</span></div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Confirmation dialog for marking single purchase as completed */}
      <Dialog open={confirming} onOpenChange={(o) => { setConfirming(o); if (!o) setConfirmTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction === 'cancel' ? 'Batalkan pembelian ini?' : confirmAction === 'refund' ? 'Tandai pembelian ini sebagai refund?' : 'Yakin menandai pembelian ini selesai?'}</DialogTitle>
            <DialogDescription>
              {confirmAction === 'cancel' ? (
                <>Anda akan membatalkan entri referral untuk order <span className="font-mono">{confirmTarget?.order_id}</span>. Tindakan ini tidak akan menghapus data, hanya mengubah status.</>
              ) : confirmAction === 'refund' ? (
                <>Anda akan menandai entri referral <span className="font-mono">{confirmTarget?.order_id}</span> sebagai refund. Pastikan refund sudah diproses di sistem pembayaran.</>
              ) : (
                <>Anda akan menandai pesanan referral <span className="font-mono">{confirmTarget?.order_id}</span> sebagai completed. Tindakan ini akan menjalankan proses verifikasi dan menutup entri ini.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-2 justify-end">
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setConfirming(false); setConfirmTarget(null); setConfirmAction(null); }}>Batal</Button>
              <Button onClick={() => void confirmMarkSingle()} disabled={loading}>{loading ? 'Memproses...' : confirmAction === 'cancel' ? 'Ya, Batalkan' : confirmAction === 'refund' ? 'Ya, Tandai Refund' : 'Ya, Tandai Selesai'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}
