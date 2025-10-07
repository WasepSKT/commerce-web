import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FormSkeleton, HeaderSkeleton } from '@/components/ui/AdminSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { useCallback } from 'react';
import { format } from 'date-fns';

// Modular imports
import { Settings, LevelRow, FormData } from '@/types/referral';
import { formatRupiah, validateRangeAgainstExisting, parseAmount, rangesOverlap } from '@/lib/referralUtils';
import { ReferralLevelService } from '@/services/referralService';
import { LevelFormModal } from '@/components/admin/LevelFormModal';
import { LevelDisplay } from '@/components/admin/LevelDisplay';

export default function ReferralSettings() {
  const [settings, setSettings] = useState<Settings>({
    name: 'default',
    active: true,
    reward_type: 'points',
    reward_value: 100,
    max_per_referrer: null,
    expiration_days: null,
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const { toast } = useToast();

  // Referral levels management (using modular types)
  const [levels, setLevels] = useState<LevelRow[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelRow | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    min_amount: '0',
    commission_pct: 5, // 5% default (display)
    priority: 0,
    active: true
  });
  const [formError, setFormError] = useState<string | null>(null);
  const fetchLevels = useCallback(async () => {
    try {
      const { data, error } = await ReferralLevelService.fetchLevels();
      if (error) {
        toast({ variant: 'destructive', title: 'Gagal memuat levels', description: String(error.message || error) });
      } else if (data) {
        setLevels(data);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  }, [toast]);

  // Helpers for validation: parse numeric amounts and check overlap




  const validateRangeAgainstExisting = (min: number, max: number | null, excludeId?: string | null) => {
    if (min < 0) return 'Min amount harus bernilai 0 atau lebih.';
    if (max !== null && min >= max) return 'Min harus lebih kecil dari Max.';

    for (const lv of levels) {
      if (excludeId && lv.id === excludeId) {
        continue;
      }
      const lvMin = Number(lv.min_amount ?? 0);
      const lvMax = lv.max_amount ? Number(lv.max_amount) : null;
      if (rangesOverlap(min, max, lvMin, lvMax)) {
        return `Rentang berbenturan dengan level “${lv.name}” (Min: ${formatRupiah(lvMin)}${lvMax ? ` - Max: ${formatRupiah(lvMax)}` : ' - ∞'}).`;
      }
    }

    return null;
  };

  // Modal helper functions
  const openAddModal = () => {
    setFormData({ name: '', min_amount: '0', commission_pct: 5, weight: 5, priority: 0, active: true }); // 5% as integer
    setEditingLevel(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (level: LevelRow) => {
    setFormData({
      ...level,
      // level.commission_pct in DB is decimal (0.05) -> convert to display percent
      commission_pct: level.commission_pct !== null && level.commission_pct !== undefined ? Math.round(Number(level.commission_pct) * 100) : 5,
      priority: level.priority || 0
    });
    setEditingLevel(level);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', min_amount: '0', commission_pct: 5, weight: 5, priority: 0, active: true });
    setEditingLevel(null);
    setFormError(null);
  };

  const handleSaveLevel = async () => {
    setFormError(null);

    if (!formData.name) {
      setFormError('Nama level diperlukan');
      return;
    }

    const displayPct = formData.commission_pct ?? formData.weight ?? 0;
    if (!displayPct || displayPct <= 0) {
      setFormError('Percentage bonus harus lebih dari 0%');
      return;
    }

    const min = parseAmount(formData.min_amount ?? '0') ?? 0;
    const max = parseAmount(formData.max_amount ?? null);
    const validationMsg = validateRangeAgainstExisting(min, max, editingLevel?.id);

    if (validationMsg) {
      setFormError(validationMsg);
      return;
    }

    try {
      const { error } = await ReferralLevelService.saveLevel(formData, editingLevel);
      if (error) {
        toast({
          variant: 'destructive',
          title: editingLevel ? 'Gagal menyimpan perubahan' : 'Gagal menambahkan level',
          description: String(error.message || error)
        });
        return;
      }

      toast({ title: editingLevel ? 'Level berhasil diperbarui' : 'Level berhasil ditambahkan' });
      closeModal();
      await fetchLevels();
    } catch (error) {
      console.error('Error saving level:', error);
      toast({ variant: 'destructive', title: 'Terjadi kesalahan', description: 'Silakan coba lagi' });
    }
  };

  const handleDeleteLevel = async (levelId: string, levelName: string) => {
    if (!confirm(`Hapus level "${levelName}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const { error } = await ReferralLevelService.deleteLevel(levelId);
      if (error) {
        toast({ variant: 'destructive', title: 'Gagal menghapus level', description: String(error.message || error) });
      } else {
        toast({ title: 'Level berhasil dihapus' });
        await fetchLevels();
      }
    } catch (error) {
      console.error('Error deleting level:', error);
      toast({ variant: 'destructive', title: 'Terjadi kesalahan', description: 'Silakan coba lagi' });
    }
  };

  // show/hide guidance card (session-only; will reappear on page refresh)
  const [showGuidance, setShowGuidance] = useState(true);
  const closeGuidance = () => setShowGuidance(false);
  const openGuidance = () => setShowGuidance(true);
  // show/hide the short settings info card
  const [showSettingsInfo, setShowSettingsInfo] = useState(true);
  const closeSettingsInfo = () => setShowSettingsInfo(false);
  const openSettingsInfo = () => setShowSettingsInfo(true);

  useEffect(() => {
    const fetchSettingsAndLevels = async () => {
      setDataLoading(true);

      try {
        // Fetch settings
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
          });

          setExpirationDate(expDate);
        }

        // Fetch levels using existing fetchLevels function
        await fetchLevels();

      } catch (error) {
        console.error('Error fetching settings and levels:', error);
      } finally {
        setDataLoading(false);
      }
    };

    void fetchSettingsAndLevels();
  }, [toast, fetchLevels]);

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

      const payload: Partial<Settings> & { id?: string } = {
        name: settings.name,
        active: settings.active,
        reward_type: settings.reward_type,
        reward_value: settings.reward_value,
        max_per_referrer: settings.max_per_referrer,
        expiration_days,
      };

      let error;

      if (settings.id) {
        // Update existing record
        const updateResult = await supabase
          .from('referral_settings')
          .update(payload)
          .eq('id', settings.id);
        error = updateResult.error;
      } else {
        // Insert new record
        const insertResult = await supabase
          .from('referral_settings')
          .insert(payload);
        error = insertResult.error;
      }

      if (error) {
        console.error('Save error details:', error);
        console.error('Save payload:', payload);
        toast({
          variant: 'destructive',
          title: 'Gagal menyimpan',
          description: `Error: ${error.message || error}${error.details ? ` - ${error.details}` : ''}`
        });
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

        {dataLoading ? (
          <div className="mt-4 space-y-6">
            <FormSkeleton fields={6} />
            <div className="mt-6 p-4 border border-gray-200 rounded bg-background space-y-4">
              <HeaderSkeleton />
              <FormSkeleton fields={4} />
            </div>
          </div>
        ) : (
          <>
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
                <Select
                  value={settings.reward_type}
                  onValueChange={(value) => setSettings(s => ({ ...s, reward_type: value as Settings['reward_type'] }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih tipe reward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="coupon">Coupon</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Input className="mt-1" type="number" value={settings.max_per_referrer ?? ''} onChange={(e) => setSettings(s => ({ ...s, max_per_referrer: e.target.value ? Number(e.target.value) : null }))} />
                  <p className="text-xs text-muted-foreground mt-1">Kosongkan untuk tak terbatas.</p>
                </div>

                <div>
                  <Label>Expiration date</Label>
                  <Input className="mt-1" type="date" value={expirationDate ?? ''} onChange={(e) => setExpirationDate(e.target.value || null)} />
                  <p className="text-xs text-muted-foreground mt-1">Pilih tanggal kadaluarsa reward (kosong = tidak kadaluarsa).</p>
                </div>
              </div>

              {/* Minimum purchase amount removed — not used as program threshold */}

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
                      <div className="text-sm text-muted-foreground mt-1">Definisikan rentang pembelian dan persentase bonus untuk setiap level referral. Masukkan angka dalam Rupiah tanpa "Rp". Contoh: ketik <strong>100000</strong> untuk Rp 100.000.</div>
                      <ul className="text-xs text-muted-foreground mt-2 list-disc ml-5 space-y-1">
                        <li><strong>Rentang (Min/Max):</strong> Tentukan batas minimal dan maksimal pembelian untuk level ini.</li>
                        <li><strong>Percentage:</strong> Berapa persen bonus yang didapat dari nilai pembelian (contoh: 5% dari Rp 100.000 = Rp 5.000).</li>
                        <li><strong>Priority:</strong> Urutan pengecekan level (angka lebih besar = dicek dulu).</li>
                        <li>Min harus lebih kecil dari Max. Jika Max kosong = tak terbatas.</li>
                        <li>Rentang antar level tidak boleh tumpang tindih.</li>
                        <li>Level bisa dinonaktifkan tanpa menghapus data.</li>
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
                        <div className="text-xs text-muted-foreground">Max: {formatRupiah(499999)}</div>
                        <div className="text-xs text-muted-foreground">Percentage: 2% · Priority: 1</div>
                        <div className="text-xs text-primary/70">Bonus: {formatRupiah(499999 * 0.02)}</div>
                      </div>
                      <div className="p-2 border border-gray-200 rounded bg-white">
                        <div className="font-medium">Silver</div>
                        <div className="text-xs text-muted-foreground">Min: {formatRupiah(500000)}</div>
                        <div className="text-xs text-muted-foreground">Max: {formatRupiah(1999999)}</div>
                        <div className="text-xs text-muted-foreground">Percentage: 5% · Priority: 2</div>
                        <div className="text-xs text-primary/70">Bonus: {formatRupiah(1999999 * 0.05)}</div>
                      </div>
                      <div className="p-2 border border-gray-200 rounded bg-white">
                        <div className="font-medium">Gold</div>
                        <div className="text-xs text-muted-foreground">Min: {formatRupiah(2000000)}</div>
                        <div className="text-xs text-muted-foreground">Max: — (tak terbatas)</div>
                        <div className="text-xs text-muted-foreground">Percentage: 10% · Priority: 3</div>
                        <div className="text-xs text-primary/70">Bonus: {formatRupiah(5000000 * 0.10)}</div>
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

              <div className="mt-4 flex justify-between items-center">
                <div>
                  <h4 className="text-2xl font-medium text-primary">Daftar Levels</h4>
                  <p className="text-sm text-muted-foreground">Kelola level referral dan reward yang diberikan</p>
                </div>
                <Button
                  onClick={openAddModal}
                  className="flex items-center gap-2 h-11 bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Level
                </Button>
              </div>

              <LevelDisplay
                levels={levels}
                onEditLevel={openEditModal}
                onDeleteLevel={handleDeleteLevel}
              />

              {/* Modal untuk Add/Edit Level */}
              <LevelFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSaveLevel}
                editingLevel={editingLevel}
                formData={formData}
                setFormData={setFormData}
                formError={formError}
              />
              {/* Modal content is now in LevelFormModal component */}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
