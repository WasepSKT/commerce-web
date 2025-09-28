export type Subdistrict = { name: string; postal: string };
export type NormLocations = Record<string, Record<string, Record<string, Subdistrict[]>>>;

const CACHE_KEY = 'kodepos_v1';

function fromCache(): NormLocations | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NormLocations;
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
    const province = (item.province || item.provinsi || 'Unknown') as string;
    const city = (item.city || item.kabupaten || item.kota || 'Unknown City') as string;
    const district = (item.district || item.kecamatan || 'Unknown District') as string;
    const sub = (item.subdistrict || item.desa || item.kelurahan || '') as string;
    const postal = (item.postal_code || item.kodepos || '') as string;

    if (!norm[province]) norm[province] = {};
    if (!norm[province][city]) norm[province][city] = {};
    if (!norm[province][city][district]) norm[province][city][district] = [];
    norm[province][city][district].push({ name: sub, postal });
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
  return m ? Object.keys(m) : [];
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
  return Object.keys(m[provKey]);
}

export function getDistrictsFromCache(province: string, city: string): string[] {
  const m = fromCache();
  if (!m) return [];
  const provKey = findKeyInsensitive(m, province);
  if (!provKey) return [];
  const cities = m[provKey] as Record<string, Record<string, Subdistrict[]>>;
  const cityKey = findKeyInsensitive(cities, city);
  if (!cityKey) return [];
  return Object.keys(cities[cityKey]);
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
  return districts[distKey];
}
