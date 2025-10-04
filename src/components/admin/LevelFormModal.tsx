// Level Form Modal Component
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, Target, DollarSign, Settings, Calculator, CheckCircle, Save, FileText, Plus } from 'lucide-react';
import { LevelRow, FormData } from '@/types/referral';
import { formatRupiah } from '@/lib/referralUtils';

interface LevelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingLevel: LevelRow | null;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formError: string | null;
}

export function LevelFormModal({
  isOpen,
  onClose,
  onSave,
  editingLevel,
  formData,
  setFormData,
  formError
}: LevelFormModalProps) {
  // Weight is already in percentage format (integer), use directly
  const displayPercentage = formData.weight ?? 5;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold text-primary">
            {editingLevel ? 'Edit Level Referral' : 'Tambah Level Referral Baru'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingLevel
              ? 'Edit pengaturan level referral yang sudah ada untuk menyesuaikan persentase reward dan prioritas.'
              : 'Buat level referral baru dengan menentukan nama, persentase reward, dan prioritas untuk sistem rujukan.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Penjelasan Interaktif */}
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                  Cara Kerja Level Referral
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Percentage
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Berapa persen bonus dari nilai pembelian.<br />
                        <span className="text-primary font-medium">Contoh:</span> 5% dari Rp 100.000 = Rp 5.000 bonus
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Priority
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Urutan pengecekan (angka besar = dicek dulu).<br />
                        <span className="text-primary font-medium">Contoh:</span> VIP (10) dicek sebelum Bronze (1)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informasi Dasar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nama Level *</Label>
                  <Input
                    id="name"
                    value={formData.name ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="contoh: Bronze, Silver, Gold"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Berikan nama yang mudah diingat untuk level ini
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentage" className="text-sm font-medium">Percentage Bonus (%) *</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={String(displayPercentage)}
                    onChange={(e) => {
                      const percentage = Number(e.target.value);
                      setFormData(prev => ({ ...prev, weight: percentage })); // Direct assignment since weight is percentage
                    }}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Bonus dalam persen dari nilai pembelian (minimum 0.5% - maximum 100%)
                  </p>
                </div>
              </div>
            </div>

            {/* Range Setting */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Range Pembelian
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="min_amount" className="text-sm font-medium">Minimum Amount *</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    min="0"
                    value={formData.min_amount ?? '0'}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_amount: e.target.value }))}
                    placeholder="100000"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Preview: <span className="font-medium text-primary">{formatRupiah(Number(formData.min_amount ?? 0))}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_amount" className="text-sm font-medium">Maximum Amount (opsional)</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    min="0"
                    value={formData.max_amount ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_amount: e.target.value }))}
                    placeholder="kosongkan untuk unlimited"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Preview: <span className="font-medium text-primary">{formData.max_amount ? formatRupiah(Number(formData.max_amount)) : '∞ (tanpa batas)'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Priority & Preview */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pengaturan Lanjutan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority Level</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={String(formData.priority ?? 0)}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Urutan pengecekan. Angka besar = prioritas tinggi
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-full p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 text-center">
                    <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Preview Bonus
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatRupiah((Number(formData.min_amount) || 100000) * (displayPercentage / 100))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      dari pembelian {formatRupiah(Number(formData.min_amount) || 100000)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive text-sm">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="min-w-[100px] h-11"
            >
              Batal
            </Button>
            <Button
              onClick={onSave}
              className="min-w-[140px] h-11 bg-primary hover:bg-primary/90"
            >
              {editingLevel ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Level
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}