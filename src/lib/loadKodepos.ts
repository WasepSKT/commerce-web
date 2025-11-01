import { safeJsonParse } from '@/utils/storage';

export type Subdistrict = { name: string; postal: string };
export type NormLocations = Record<string, Record<string, Record<string, Subdistrict[]>>>;

const CACHE_KEY = 'kodepos_v1';

function fromCache(): NormLocations | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return safeJsonParse(raw, null as NormLocations | null);
  } catch (e) {
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export async function loadKodepos(): Promise<NormLocations> {
  const cached = fromCache();
  if (cached) return cached;

  const res = await fetch('/data/kodepos.json');
  if (!res.ok) throw new Error('Failed to fetch kodepos.json');
  const list = await res.json();

  type KodeposRow = {
    province?: string;
    provinsi?: string;
    city?: string;
    kabupaten?: string;
    kota?: string;
    district?: string;
    kecamatan?: string;
    subdistrict?: string;
    desa?: string;
    kelurahan?: string;
    postal_code?: string;
    kodepos?: string;
    [k: string]: unknown;
  };

  const norm: NormLocations = {};
  for (const item of list as Array<KodeposRow>) {
    // normalize keys by trimming whitespace; skip rows missing essential fields
    const provinceRaw = (item.province || item.provinsi || '') as string;
    const cityRaw = (item.city || item.kabupaten || item.kota || '') as string;
    const districtRaw = (item.district || item.kecamatan || '') as string;
    const subRaw = (item.subdistrict || item.desa || item.kelurahan || '') as string;
    const postal = (item.postal_code || item.kodepos || '') as string;

    const province = provinceRaw.trim();
    const city = cityRaw.trim();
    const district = districtRaw.trim();
    const sub = subRaw.trim();

    // ignore rows that don't have at least province, city and district
    if (!province || !city || !district) continue;
    // ignore empty subdistrict names (we don't want blank entries)
    if (!sub) continue;

    if (!norm[province]) norm[province] = {};
    if (!norm[province][city]) norm[province][city] = {};
    if (!norm[province][city][district]) norm[province][city][district] = [];

    // avoid duplicates
    const existing = norm[province][city][district];
    if (!existing.some(s => s.name === sub && s.postal === postal)) {
      existing.push({ name: sub, postal });
    }
  }

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(norm));
  } catch (e) {
    // ignore quota issues
  }

  return norm;
}

export function getProvincesFromCache(): string[] {
  const m = fromCache();
  if (!m) return [];
  return Object.keys(m).sort((a, b) => a.localeCompare(b, 'id'));
}

function findKeyInsensitive(obj: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!obj) return undefined;
  const norm = key.trim().toLowerCase();
  return Object.keys(obj).find(k => k.trim().toLowerCase() === norm);
}

export function getCitiesFromCache(province: string): string[] {
  const m = fromCache();
  if (!m) return [];
  const provKey = findKeyInsensitive(m, province);
  if (!provKey) return [];
  return Object.keys(m[provKey]).sort((a, b) => a.localeCompare(b, 'id'));
}

export function getDistrictsFromCache(province: string, city: string): string[] {
  const m = fromCache();
  if (!m) return [];
  const provKey = findKeyInsensitive(m, province);
  if (!provKey) return [];
  const cities = m[provKey] as Record<string, Record<string, Subdistrict[]>>;
  const cityKey = findKeyInsensitive(cities, city);
  if (!cityKey) return [];
  return Object.keys(cities[cityKey]).sort((a, b) => a.localeCompare(b, 'id'));
}

export function getSubdistrictsFromCache(province: string, city: string, district: string): Subdistrict[] {
  const m = fromCache();
  if (!m) return [];
  const provKey = findKeyInsensitive(m, province);
  if (!provKey) return [];
  const cities = m[provKey] as Record<string, Record<string, Subdistrict[]>>;
  const cityKey = findKeyInsensitive(cities, city);
  if (!cityKey) return [];
  const districts = cities[cityKey] as Record<string, Subdistrict[]>;
  const distKey = findKeyInsensitive(districts, district);
  if (!distKey) return [];
  // return subdistricts sorted by name and deduped
  const subs = districts[distKey] || [];
  const unique = Array.from(new Map(subs.map(s => [s.name, s])).values());
  return unique.sort((a, b) => a.name.localeCompare(b.name, 'id'));
}
