// Utilities for Referral Settings
import { LevelRow } from '@/types/referral';

// Format number to Indonesian Rupiah string (Rp 10.000)
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'Rp 0';
  try {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(value);
  } catch (e) {
    return 'Rp 0';
  }
}

// Parse numeric amounts and check overlap
export function parseAmount(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

// Check if two ranges overlap
export function rangesOverlap(
  aMin: number, 
  aMax: number | null, 
  bMin: number, 
  bMax: number | null
): boolean {
  const Amax = aMax === null ? Number.POSITIVE_INFINITY : aMax;
  const Bmax = bMax === null ? Number.POSITIVE_INFINITY : bMax;
  return aMin <= Bmax && bMin <= Amax;
}

// Validate range against existing levels
export function validateRangeAgainstExisting(
  min: number,
  max: number | null,
  levels: LevelRow[],
  excludeId?: string | null
): string | null {
  if (min < 0) return 'Min amount harus bernilai 0 atau lebih.';
  if (max !== null && min >= max) return 'Min harus lebih kecil dari Max.';

  for (const lv of levels) {
    if (excludeId && lv.id === excludeId) {
      continue;
    }
    const lvMin = Number(lv.min_amount ?? 0);
    const lvMax = lv.max_amount ? Number(lv.max_amount) : null;
    if (rangesOverlap(min, max, lvMin, lvMax)) {
      return `Rentang berbenturan dengan level "${lv.name}" (Min: ${formatRupiah(lvMin)}${lvMax ? ` - Max: ${formatRupiah(lvMax)}` : ' - ∞'}).`;
    }
  }

  return null;
}

// Commission percent utilities
// commission_pct stored as numeric percentage (5 = 5%). Keep compatibility helpers for legacy 'weight'.
// Convert stored DB decimal (e.g. 0.05) to display percentage (5)
export function dbDecimalToDisplayPct(dbVal: number | undefined | null): number {
  if (dbVal === null || dbVal === undefined) return 0;
  return Number(dbVal) * 100;
}

// Convert display percentage (e.g. 5) to DB decimal (0.05)
export function displayPctToDbDecimal(displayPct: number | undefined | null): number {
  const pct = displayPct ?? 0;
  return Number(pct) / 100;
}

export function getDisplayPercentage(level: { commission_pct?: number | null; weight?: number | null } ): number {
  if (level.commission_pct !== null && level.commission_pct !== undefined) {
    return dbDecimalToDisplayPct(level.commission_pct);
  }
  return level.weight ?? 5;
}

// Get decimal fraction for calculation (e.g. 0.05)
export function getDecimalForCalculation(level: { commission_pct?: number | null; weight?: number | null } ): number {
  if (level.commission_pct !== null && level.commission_pct !== undefined) {
    return Number(level.commission_pct);
  }
  // legacy: weight stored as integer percent
  return (level.weight ?? 5) / 100;
}