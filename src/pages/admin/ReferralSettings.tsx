import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

type Settings = {
  id?: string;
  name: string;
  active: boolean;
  reward_type: 'points' | 'coupon' | 'credit';
  reward_value?: number | null;
  max_per_referrer?: number | null;
  expiration_days?: number | null;
  min_purchase_amount?: number | null;
};

export default function ReferralSettings() {
  const [settings, setSettings] = useState<Settings>({
    name: 'default',
    active: true,
    reward_type: 'points',
    reward_value: 100,
    max_per_referrer: null,
    expiration_days: null,
    min_purchase_amount: null,
  });
  const [loading, setLoading] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('name', 'default')
        .maybeSingle();

      if (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat pengaturan', description: String(error.message || error) });
      } else if (data) {
        // compute expiration date from expiration_days if present
        let expDate: string | null = null;
        if (data.expiration_days !== null && data.expiration_days !== undefined) {
          const d = new Date();
          d.setDate(d.getDate() + Number(data.expiration_days));
          expDate = format(d, 'yyyy-MM-dd');
        }

        setSettings({
          id: data.id,
          name: data.name,
          active: data.active,
          reward_type: data.reward_type as Settings['reward_type'],
          reward_value: data.reward_value !== null ? Number(data.reward_value) : null,
          max_per_referrer: data.max_per_referrer,
          expiration_days: data.expiration_days,
          min_purchase_amount: data.min_purchase_amount,
        });

        setExpirationDate(expDate);
      }

      setLoading(false);
    };

    void fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    // basic validation
    if (settings.reward_type !== 'coupon' && (settings.reward_value === null || settings.reward_value === undefined)) {
      toast({ variant: 'destructive', title: 'Nilai reward diperlukan' });
      return;
    }
    setLoading(true);
    try {
      // convert expirationDate to expiration_days (number of days from now)
      let expiration_days: number | null = null;
      if (expirationDate) {
        const now = new Date();
        const exp = new Date(expirationDate + 'T23:59:59');
        const diffMs = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        expiration_days = diffDays > 0 ? diffDays : 0;
      }

      const upsertPayload: Partial<Settings> = {
        name: settings.name,
        active: settings.active,
        reward_type: settings.reward_type,
        reward_value: settings.reward_value,
        max_per_referrer: settings.max_per_referrer,
        expiration_days,
        min_purchase_amount: settings.min_purchase_amount,
      };

      const { error } = await supabase.from('referral_settings').upsert(upsertPayload, { onConflict: 'name' });

      if (error) {
        toast({ variant: 'destructive', title: 'Gagal menyimpan', description: String(error.message || error) });
      } else {
        toast({ title: 'Pengaturan referral disimpan' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: String((err as Error).message || err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h2 className="text-lg font-medium">Referral Settings</h2>
        <p className="text-sm text-muted-foreground">Atur poin, hadiah, dan aturan program referral di sini.</p>

        <div className="mt-4 p-4 border rounded bg-background space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Program aktif</Label>
              <p className="text-xs text-muted-foreground">Nonaktifkan jika ingin mematikan program referral sementara.</p>
            </div>
            <Switch checked={settings.active} onCheckedChange={(v) => setSettings(s => ({ ...s, active: Boolean(v) }))} />
          </div>

          <div>
            <Label>Reward type</Label>
            <select
              value={settings.reward_type}
              onChange={(e) => setSettings(s => ({ ...s, reward_type: e.target.value as Settings['reward_type'] }))}
              className="mt-1 block w-full rounded-md border px-3 py-2 bg-background"
            >
              <option value="points">Points</option>
              <option value="coupon">Coupon</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          <div>
            <Label>Reward value</Label>
            <Input type="number" value={settings.reward_value ?? ''} onChange={(e) => setSettings(s => ({ ...s, reward_value: e.target.value ? Number(e.target.value) : null }))} />
            <p className="text-xs text-muted-foreground mt-1">Jumlah poin atau nominal hadiah.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max per referrer</Label>
              <Input type="number" value={settings.max_per_referrer ?? ''} onChange={(e) => setSettings(s => ({ ...s, max_per_referrer: e.target.value ? Number(e.target.value) : null }))} />
              <p className="text-xs text-muted-foreground mt-1">Kosongkan untuk tak terbatas.</p>
            </div>

            <div>
              <Label>Expiration date</Label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border px-3 py-2 bg-background"
                value={expirationDate ?? ''}
                onChange={(e) => setExpirationDate(e.target.value || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">Pilih tanggal kadaluarsa reward (kosong = tidak kadaluarsa).</p>
            </div>
          </div>

          <div>
            <Label>Minimum purchase amount</Label>
            <Input type="number" value={settings.min_purchase_amount ?? ''} onChange={(e) => setSettings(s => ({ ...s, min_purchase_amount: e.target.value ? Number(e.target.value) : null }))} />
            <p className="text-xs text-muted-foreground mt-1">Jika ingin hanya memberi reward untuk pembelian minimum tertentu.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Pengaturan'}</Button>
            <Button variant="secondary" onClick={() => void (window.location.reload())}>Reset</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
