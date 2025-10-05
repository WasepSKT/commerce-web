import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { TableSkeleton, HeaderSkeleton } from '@/components/ui/AdminSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

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
  order_items?: OrderItem[];
}

export default function Shipings() {
  const { toast } = useToast();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [shippingInputs, setShippingInputs] = useState<Record<string, { courier?: string; tracking?: string }>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const fetchPaid = async () => {
    setLoading(true);
    try {
      // fetch paid orders and their items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from as unknown as any)('orders').select('*, order_items(*)').eq('status', 'paid').order('created_at', { ascending: false }).limit(200);
      const res = (await q) as unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders = (res && (res as any).data ? (res as any).data : (res as any)) as OrderRow[];
      setRows(orders);
      // seed shippingInputs for convenience
      const seed: Record<string, { courier?: string; tracking?: string }> = {};
      orders.forEach((o) => {
        seed[o.id] = { courier: o.shipping_courier ?? '', tracking: o.tracking_number ?? '' };
      });
      setShippingInputs(seed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchPaid(); }, []);

  const setShipped = async (orderId: string) => {
    try {
      setLoading(true);
      const input = shippingInputs[orderId] ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as unknown as any)('orders').update({ status: 'shipped', shipping_courier: input.courier ?? null, tracking_number: input.tracking ?? null }).eq('id', orderId);
      if (error) throw error;
      await fetchPaid();
      toast({ title: 'Sukses', description: 'Pesanan diperbarui menjadi Dikirim' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Gagal', description: 'Gagal memperbarui pesanan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };



  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium text-primary">Kelola Pengiriman</h2>
        <p className="text-sm text-muted-foreground">Daftar pesanan yang telah dibayar. Tandai resi dan pilih jasa kirim di sini.</p>

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
                    <div className="flex gap-2 items-center">
                      <div className="w-40">
                        <Select value={shippingInputs[r.id]?.courier ?? ''} onValueChange={(val) => setShippingInputs((prev) => ({ ...prev, [r.id]: { ...(prev[r.id] ?? {}), courier: val } }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jasa kirim" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="JNE">JNE</SelectItem>
                            <SelectItem value="J&T Express">J&T Express</SelectItem>
                            <SelectItem value="TIKI">TIKI</SelectItem>
                            <SelectItem value="POS Indonesia">POS Indonesia</SelectItem>
                            <SelectItem value="SiCepat">SiCepat</SelectItem>
                            <SelectItem value="Ninja Express">Ninja Express</SelectItem>
                            <SelectItem value="AnterAja">AnterAja</SelectItem>
                            <SelectItem value="Shopee Express">Shopee Express</SelectItem>
                            <SelectItem value="Grab Express">Grab Express</SelectItem>
                            <SelectItem value="GoSend">GoSend</SelectItem>
                            <SelectItem value="Lion Parcel">Lion Parcel</SelectItem>
                            <SelectItem value="Dakota Cargo">Dakota Cargo</SelectItem>
                            <SelectItem value="SAP Express">SAP Express</SelectItem>
                            <SelectItem value="RPX">RPX</SelectItem>
                            <SelectItem value="Wahana">Wahana</SelectItem>
                            <SelectItem value="JX Express">JX Express</SelectItem>
                            <SelectItem value="Paxel">Paxel</SelectItem>
                            <SelectItem value="IDE Express">IDE Express</SelectItem>
                            <SelectItem value="Kurir Lokal">Kurir Lokal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-44">
                        <Input placeholder="No. Resi" value={shippingInputs[r.id]?.tracking ?? ''} onChange={(e) => setShippingInputs((prev) => ({ ...prev, [r.id]: { ...(prev[r.id] ?? {}), tracking: (e.target as HTMLInputElement).value } }))} />
                      </div>

                      <Button onClick={() => { setConfirmOrderId(r.id); setConfirmOpen(true); }} disabled={!shippingInputs[r.id]?.courier || !shippingInputs[r.id]?.tracking}>Tandai Dikirim</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (!o) setConfirmOrderId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengiriman</DialogTitle>
            <DialogDescription>Periksa informasi kurir dan nomor resi sebelum menandai pesanan sebagai dikirim.</DialogDescription>
          </DialogHeader>
          {confirmOrderId ? (
            <div className="space-y-3">
              <p>Order: <span className="font-mono">{confirmOrderId}</span></p>
              <p>Kurir: <strong>{shippingInputs[confirmOrderId]?.courier ?? '-'}</strong></p>
              <p>No. Resi: <strong>{shippingInputs[confirmOrderId]?.tracking ?? '-'}</strong></p>
              <div>
                <p className="text-sm text-muted-foreground">Ketik <code className="px-1 py-0.5 bg-muted rounded">KIRIM</code> untuk mengonfirmasi</p>
                <Input value={confirmPhrase} onChange={(e) => setConfirmPhrase((e.target as HTMLInputElement).value)} placeholder="Ketik KIRIM untuk konfirmasi" />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setConfirmOpen(false); setConfirmOrderId(null); setConfirmPhrase(''); }}>Batal</Button>
                <Button disabled={String(confirmPhrase).trim().toUpperCase() !== 'KIRIM'} onClick={async () => { if (confirmOrderId) { await setShipped(confirmOrderId); setConfirmOpen(false); setConfirmOrderId(null); setConfirmPhrase(''); } }}>Konfirmasi & Tandai Dikirim</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
