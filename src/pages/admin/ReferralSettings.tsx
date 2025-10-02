import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { useCallback } from 'react';
import { format } from 'date-fns';

// Format number to Indonesian Rupiah string (Rp 10.000)
function formatRupiah(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Rp 0';
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  } catch (e) {
    return `Rp ${String(value)}`;
  }
}

type Settings = {
  id?: string;
  name: string;
  active: boolean;
  reward_type: 'points' | 'coupon' | 'credit';
  reward_value?: number | null;
  // referral program doesn't store levels here; levels are in separate table
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
  // levels are managed in the referral_levels table (separate admin page)
  const { toast } = useToast();

  // Referral levels management (embedded)
  type LevelRow = {
    id: string;
    name: string;
    min_amount: string;
    max_amount?: string | null;
    weight: number;
    priority: number;
    active: boolean;
  };

  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [newLevel, setNewLevel] = useState<Partial<LevelRow>>({ name: '', min_amount: '0', weight: 1, priority: 0, active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<Partial<LevelRow> | null>(null);
  const [newLevelError, setNewLevelError] = useState<string | null>(null);
  const [editLevelError, setEditLevelError] = useState<string | null>(null);
  const fetchLevels = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('referral_levels').select('*').order('priority', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Gagal memuat levels', description: String(error.message || error) });
    } else if (data) {
      setLevels(data as unknown as LevelRow[]);
    }
  }, [toast]);

  // Helpers for validation: parse numeric amounts and check overlap
  const parseAmount = (v: string | number | null | undefined) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return n;
  };

  const rangesOverlap = (aMin: number, aMax: number | null, bMin: number, bMax: number | null) => {
    const Amax = aMax === null ? Number.POSITIVE_INFINITY : aMax;
    const Bmax = bMax === null ? Number.POSITIVE_INFINITY : bMax;
    return aMin <= Bmax && bMin <= Amax;
  };

  const validateRangeAgainstExisting = (min: number, max: number | null, excludeId?: string | null) => {
    if (min < 0) return 'Min amount harus bernilai 0 atau lebih.';
    if (max !== null && min >= max) return 'Min harus lebih kecil dari Max.';

    for (const lv of levels) {
      if (excludeId && lv.id === excludeId) continue;
      const lvMin = Number(lv.min_amount ?? 0);
      const lvMax = lv.max_amount ? Number(lv.max_amount) : null;
      if (rangesOverlap(min, max, lvMin, lvMax)) {
        return `Rentang berbenturan dengan level “${lv.name}” (Min: ${formatRupiah(lvMin)}${lvMax ? ` - Max: ${formatRupiah(lvMax)}` : ' - ∞'}).`;
      }
    }

    return null;
  };

  useEffect(() => { void fetchLevels(); }, [fetchLevels]);

  // show/hide guidance card (session-only; will reappear on page refresh)
  const [showGuidance, setShowGuidance] = useState(true);
  const closeGuidance = () => setShowGuidance(false);
  const openGuidance = () => setShowGuidance(true);
  // show/hide the short settings info card
  const [showSettingsInfo, setShowSettingsInfo] = useState(true);
  const closeSettingsInfo = () => setShowSettingsInfo(false);
  const openSettingsInfo = () => setShowSettingsInfo(true);

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
        <h2 className="text-lg font-medium text-primary">Referral Settings</h2>
        <p className="text-sm text-muted-foreground">Atur poin, hadiah, dan aturan program referral di sini.</p>

        <div className="mt-4 p-4 border border-gray-200 rounded bg-background space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Program Referal (Undang Teman) Aktif</Label>
              <p className="text-xs text-muted-foreground">Nonaktifkan jika ingin mematikan program referral sementara.</p>
            </div>
            <Switch checked={settings.active} onCheckedChange={(v) => setSettings(s => ({ ...s, active: Boolean(v) }))} />
          </div>

          {/* Short program explanation about the settings form (dismissible) */}
          {showSettingsInfo ? (
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Program Referal (Undang Teman) — Panduan singkat</div>
                  <div className="text-sm text-muted-foreground mt-1">Petunjuk singkat untuk mengisi formulir pengaturan program referral. Letakkan di atas pilihan Reward type agar admin memahami pengaruh tiap bidang sebelum menyimpan.</div>
                  <ul className="text-xs text-muted-foreground mt-2 list-disc ml-5">
                    <li><strong>Reward type</strong>: pilih jenis hadiah (Points, Coupon, Credit).</li>
                    <li><strong>Reward value</strong>: masukkan jumlah poin atau nominal (angka saja, tanpa 'Rp').</li>
                    <li><strong>Max per referrer</strong>: batasi berapa kali seorang referrer bisa menerima reward; kosong = tak terbatas.</li>
                    <li><strong>Expiration date</strong>: tanggal kadaluarsa untuk reward (kosong = tidak kadaluarsa).</li>
                    <li><strong>Minimum purchase amount</strong>: hanya beri reward untuk pembelian di atas ambang ini.</li>
                  </ul>
                </div>
                <div className="ml-4">
                  <Button variant="ghost" onClick={closeSettingsInfo} aria-label="Tutup info" className="p-2">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Informasi singkat pengaturan disembunyikan.</div>
              <div>
                <Button variant="outline" size="sm" onClick={openSettingsInfo}>Tampilkan info</Button>
              </div>
            </div>
          )}

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

          {/* Referral levels section moved below settings card */}

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



        {/* Levels section - separate card */}
        <div className="mt-6 p-4 border border-gray-200 rounded bg-background space-y-4">
          <h3 className="text-3xl font-medium text-primary">Referral Levels</h3>
          <p className="text-sm text-muted-foreground">Definisikan rentang (min/max) dan bobot untuk tiap level referral.</p>
          {showGuidance ? (
            <div id="referral-guidance" className="p-3 bg-yellow-50 border border-gray-200 rounded">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Cara mengisi level (singkat)</div>
                  <div className="text-sm text-muted-foreground mt-1">Masukkan angka untuk jumlah pembelian dalam Rupiah. Contoh: ketik <strong>100000</strong> untuk Rp 100.000. Jangan tambahkan huruf "Rp". Jika kolom Max dibiarkan kosong berarti tak terbatas.</div>
                  <ul className="text-xs text-muted-foreground mt-2 list-disc ml-5 space-y-1">
                    <li>Min harus lebih kecil dari Max (kalau Max diisi).</li>
                    <li>Jangan buat rentang yang saling tumpang tindih antar level.</li>
                    <li>Weight = seberapa besar bobot/benefit (angka, 0 berarti kecil).</li>
                    <li>Priority = urutan pengecekan (angka lebih besar = dicek/diprioritaskan dulu).</li>
                    <li>Level juga bisa ditutup/ dinonaktifkan dari daftar jika tidak lagi digunakan — level tetap tersimpan tapi tidak akan diberikan kepada pengguna.</li>
                  </ul>
                </div>
                <div className="ml-4">
                  <Button variant="ghost" onClick={closeGuidance} aria-label="Tutup petunjuk" className="p-2">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <div className="font-semibold">Contoh pengaturan</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="font-medium">Bronze</div>
                    <div className="text-xs text-muted-foreground">Min: {formatRupiah(0)}</div>
                    <div className="text-xs text-muted-foreground">Max: {formatRupiah(49999)}</div>
                    <div className="text-xs text-muted-foreground">Weight: 1 · Priority: 0</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="font-medium">Silver</div>
                    <div className="text-xs text-muted-foreground">Min: {formatRupiah(50000)}</div>
                    <div className="text-xs text-muted-foreground">Max: {formatRupiah(199999)}</div>
                    <div className="text-xs text-muted-foreground">Weight: 2 · Priority: 1</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded bg-white">
                    <div className="font-medium">Gold</div>
                    <div className="text-xs text-muted-foreground">Min: {formatRupiah(200000)}</div>
                    <div className="text-xs text-muted-foreground">Max: — (tak terbatas)</div>
                    <div className="text-xs text-muted-foreground">Weight: 3 · Priority: 2</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Petunjuk singkat disembunyikan.</div>
              <div>
                <Button variant="outline" size="sm" onClick={openGuidance}>Tampilkan petunjuk</Button>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 border border-gray-200 rounded bg-background space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Nama</Label>
                <Input value={newLevel.name ?? ''} onChange={(e) => setNewLevel(n => ({ ...n, name: e.target.value }))} />
              </div>
              <div>
                <Label>Min amount</Label>
                <Input value={newLevel.min_amount ?? '0'} onChange={(e) => setNewLevel(n => ({ ...n, min_amount: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">Contoh: {formatRupiah(Number(newLevel.min_amount ?? 0))} — masukkan angka saja (mis. <code>100000</code> untuk Rp 100.000).</p>
              </div>
              <div>
                <Label>Max amount (opsional)</Label>
                <Input value={newLevel.max_amount ?? ''} onChange={(e) => setNewLevel(n => ({ ...n, max_amount: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">Contoh: {newLevel.max_amount ? formatRupiah(Number(newLevel.max_amount)) : '∞'} — kosongkan untuk tak berbatas.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Weight</Label>
                <Input value={String(newLevel.weight ?? 1)} onChange={(e) => setNewLevel(n => ({ ...n, weight: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Priority</Label>
                <Input value={String(newLevel.priority ?? 0)} onChange={(e) => setNewLevel(n => ({ ...n, priority: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end">
                <Button onClick={async () => {
                  setNewLevelError(null);
                  if (!newLevel.name) { setNewLevelError('Nama level diperlukan'); return; }
                  const min = parseAmount(newLevel.min_amount ?? '0') ?? 0;
                  const max = parseAmount(newLevel.max_amount ?? null);
                  const validationMsg = validateRangeAgainstExisting(min, max);
                  if (validationMsg) { setNewLevelError(validationMsg); return; }

                  const payload = {
                    name: newLevel.name,
                    min_amount: min,
                    max_amount: max,
                    weight: Number(newLevel.weight ?? 1),
                    priority: Number(newLevel.priority ?? 0),
                    active: Boolean(newLevel.active ?? true),
                  };
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { error } = await (supabase as any).from('referral_levels').insert(payload);
                  if (error) { toast({ variant: 'destructive', title: 'Gagal menambahkan level', description: String(error.message || error) }); }
                  else { toast({ title: 'Level ditambahkan' }); setNewLevel({ name: '', min_amount: '0', weight: 1, priority: 0, active: true }); await fetchLevels(); }
                }}>
                  Tambah Level
                </Button>
              </div>
            </div>
            {newLevelError && <div className="text-sm text-red-600 mt-1">{newLevelError}</div>}

            <div>
              <h4 className="text-2xl font-medium mb-2 text-primary">Daftar Levels</h4>
              <div className="space-y-2">
                {levels.map(l => (
                  <div key={l.id} className="p-2 border border-gray-200 rounded">
                    {editingId === l.id && editLevel ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label>Nama</Label>
                            <Input className="mt-1" value={editLevel.name ?? ''} onChange={(e) => setEditLevel(prev => ({ ...(prev ?? {}), name: e.target.value }))} />
                          </div>
                          <div className="w-32">
                            <Label>Min amount</Label>
                            <Input className="mt-1" value={String(editLevel.min_amount ?? '')} onChange={(e) => setEditLevel(prev => ({ ...(prev ?? {}), min_amount: e.target.value }))} />
                          </div>
                          <div className="w-32">
                            <Label>Max amount</Label>
                            <Input className="mt-1" value={String(editLevel.max_amount ?? '')} onChange={(e) => setEditLevel(prev => ({ ...(prev ?? {}), max_amount: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Label>Weight</Label>
                            <Input className="mt-1" value={String(editLevel.weight ?? 1)} onChange={(e) => setEditLevel(prev => ({ ...(prev ?? {}), weight: Number(e.target.value) }))} />
                          </div>
                          <div className="w-24">
                            <Label>Priority</Label>
                            <Input className="mt-1" value={String(editLevel.priority ?? 0)} onChange={(e) => setEditLevel(prev => ({ ...(prev ?? {}), priority: Number(e.target.value) }))} />
                          </div>
                          <div className="ml-auto flex gap-2">
                            <Button onClick={async () => {
                              if (!editLevel) return;
                              setEditLevelError(null);
                              const min = parseAmount(editLevel.min_amount ?? '0') ?? 0;
                              const max = parseAmount(editLevel.max_amount ?? null);
                              const validationMsg = validateRangeAgainstExisting(min, max, l.id);
                              if (validationMsg) { setEditLevelError(validationMsg); return; }

                              const payload = {
                                name: editLevel.name,
                                min_amount: min,
                                max_amount: max,
                                weight: Number(editLevel.weight ?? 1),
                                priority: Number(editLevel.priority ?? 0),
                                active: Boolean(editLevel.active ?? true),
                              };
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const { error } = await (supabase as any).from('referral_levels').update(payload).eq('id', l.id);
                              if (error) { toast({ variant: 'destructive', title: 'Gagal menyimpan perubahan', description: String(error.message || error) }); }
                              else { toast({ title: 'Perubahan disimpan' }); setEditingId(null); setEditLevel(null); await fetchLevels(); }
                            }}>Simpan</Button>
                            <Button variant="secondary" onClick={() => { setEditingId(null); setEditLevel(null); }}>Batal</Button>
                          </div>
                        </div>
                        {editLevelError && <div className="text-sm text-red-600">{editLevelError}</div>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{l.name}</div>
                          <div className="text-xs text-muted-foreground">Min: {formatRupiah(Number(l.min_amount))} — Max: {l.max_amount ? formatRupiah(Number(l.max_amount)) : '∞'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">Weight: {l.weight} · Priority: {l.priority} · {l.active ? 'Active' : 'Inactive'}</div>
                          <div className="ml-4 flex gap-2">
                            <Button onClick={() => { setEditingId(l.id); setEditLevel({ ...l }); }}>Edit</Button>
                            <Button variant="destructive" onClick={async () => {
                              if (!confirm('Hapus level ini? Tindakan ini tidak dapat dibatalkan.')) return;
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const { error } = await (supabase as any).from('referral_levels').delete().eq('id', l.id);
                              if (error) { toast({ variant: 'destructive', title: 'Gagal menghapus level', description: String(error.message || error) }); }
                              else { toast({ title: 'Level dihapus' }); await fetchLevels(); }
                            }}>Hapus</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {levels.length === 0 && <div className="text-xs text-muted-foreground">Belum ada level. Tambah level di atas.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
