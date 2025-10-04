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

// Weight is stored as integer percentage in database (int4)
// No conversion needed - weight is already in percentage format (5 = 5%)
export function weightToPercentage(weight: number): number {
  return weight; // Direct return since weight is already percentage
}

// Convert percentage input to weight for storage (both are same since weight is int4 percentage)
export function percentageToWeight(percentage: number): number {
  return percentage; // Direct return since both are percentage format
}