// Level Display Component
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Info } from 'lucide-react';
import { LevelRow } from '@/types/referral';
import { formatRupiah, getDisplayPercentage, getDecimalForCalculation } from '@/lib/referralUtils';

interface LevelDisplayProps {
  levels: LevelRow[];
  onEditLevel: (level: LevelRow) => void;
  onDeleteLevel: (levelId: string, levelName: string) => void;
}

export function LevelDisplay({ levels, onEditLevel, onDeleteLevel }: LevelDisplayProps) {
  if (levels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Belum ada level referral. Klik "Tambah Level" untuk memulai.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {levels.map(l => (
        <div key={l.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h5 className="font-semibold text-lg text-primary">{l.name}</h5>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {l.active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Range:</span>
                  <div className="font-medium">
                    {formatRupiah(Number(l.min_amount))} - {l.max_amount ? formatRupiah(Number(l.max_amount)) : '∞'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Percentage:</span>
                  <div className="font-medium text-primary">
                    {getDisplayPercentage(l)}% bonus
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority:</span>
                  <div className="font-medium">Urutan #{l.priority || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Contoh:</span>
                  <div className="text-xs text-primary/80">
                    Beli {formatRupiah(Number(l.min_amount) || 0)} → bonus {formatRupiah((Number(l.min_amount) || 0) * getDecimalForCalculation(l))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditLevel(l)}
                className="flex items-center gap-2 h-9 min-w-[80px] border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteLevel(l.id, l.name)}
                className="flex items-center gap-2 h-9 min-w-[85px] bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}