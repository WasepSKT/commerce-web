import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { loadKodepos, getProvincesFromCache, getCitiesFromCache, getDistrictsFromCache, getSubdistrictsFromCache, Subdistrict } from '@/lib/loadKodepos';

type Props = {
  province: string;
  setProvince: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  subdistrict: string;
  setSubdistrict: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
};

export default function AddressSelectors({ province, setProvince, city, setCity, district, setDistrict, subdistrict, setSubdistrict, postalCode, setPostalCode }: Props) {
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingLocations(true);
      try {
        await loadKodepos();
        if (!mounted) return;
        const provs = getProvincesFromCache();
        setProvinces(provs);

        // if the profile already has a province/city/district selected, try to keep
        // child lists and preserve selections when they match cache (trim + case-insensitive)
        if (province) {
          const citiesFromCache = getCitiesFromCache(province);
          setCities(citiesFromCache);
          if (city) {
            const districtsFromCache = getDistrictsFromCache(province, city);
            setDistricts(districtsFromCache);
          }
          if (province && city && district) {
            const subs = getSubdistrictsFromCache(province, city, district);
            setSubdistricts(subs);
          }
        }
      } catch (e) {
        console.debug('Failed to load kodepos', e);
      } finally {
        if (mounted) setLoadingLocations(false);
      }
    }
    void load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setProvinces, setCities, setDistricts, setSubdistricts]);

  useEffect(() => {
    const citiesFromCache = province ? getCitiesFromCache(province) : [];
    setCities(citiesFromCache);

    // if the current city still exists in the newly loaded cities, keep it,
    // otherwise clear downstream selections
    const keepCity = city && citiesFromCache.some(c => c.trim().toLowerCase() === city.trim().toLowerCase());
    if (!keepCity) {
      setCity('');
      setDistricts([]);
      setSubdistricts([]);
      setDistrict('');
      setPostalCode('');
    }
  }, [province, city, setCity, setDistrict, setSubdistricts, setDistricts, setPostalCode]);

  useEffect(() => {
    const districtsFromCache = (province && city) ? getDistrictsFromCache(province, city) : [];
    setDistricts(districtsFromCache);

    const keepDistrict = district && districtsFromCache.some(d => d.trim().toLowerCase() === district.trim().toLowerCase());
    if (!keepDistrict) {
      setDistrict('');
      setSubdistricts([]);
      setPostalCode('');
    }
  }, [city, province, district, setDistrict, setSubdistricts, setPostalCode]);

  useEffect(() => {
    const subs = (province && city && district) ? getSubdistrictsFromCache(province, city, district) : [];
    setSubdistricts(subs);
    setPostalCode('');
    if (subs.length === 1) {
      setPostalCode(subs[0].postal);
      setSubdistrict(subs[0].name);
    }
  }, [district, city, province, setPostalCode, setSubdistrict]);

  return (
    <>
      <div>
        <label className="text-sm font-medium">Provinsi</label>
        <Select disabled={loadingLocations} value={province} onValueChange={(v) => { console.debug('Province selected:', v); setProvince(v); }}>
          <SelectTrigger>
            <SelectValue placeholder={loadingLocations ? 'Memuat...' : 'Pilih Provinsi'} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Kabupaten / Kota</label>
        <Select disabled={!province || loadingLocations} value={city} onValueChange={(v) => { console.debug('City selected:', v); setCity(v); }}>
          <SelectTrigger>
            <SelectValue placeholder={province ? (cities.length ? 'Pilih Kota' : 'Tidak ada kota') : 'Pilih provinsi dulu'} />
          </SelectTrigger>
          <SelectContent>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Kecamatan</label>
        <Select disabled={!city || loadingLocations} value={district} onValueChange={(v) => { console.debug('District selected:', v); setDistrict(v); }}>
          <SelectTrigger>
            <SelectValue placeholder={city ? (districts.length ? 'Pilih Kecamatan' : 'Tidak ada kecamatan') : 'Pilih kota dulu'} />
          </SelectTrigger>
          <SelectContent>
            {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <div className="flex-[0.7]">
          <label className="text-sm font-medium">Desa / Kelurahan</label>
          <Select disabled={!district || loadingLocations} value={subdistrict} onValueChange={(val) => {
            console.debug('Subdistrict selected:', val);
            setSubdistrict(val);
            const found = subdistricts.find(s => s.name.trim() === val);
            if (found) setPostalCode(found.postal);
          }}>
            <SelectTrigger>
              <SelectValue placeholder={district ? (subdistricts.length ? 'Pilih Desa / Kelurahan' : 'Tidak ada desa') : 'Pilih kecamatan dulu'} />
            </SelectTrigger>
            <SelectContent>
              {subdistricts.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-[0.3]">
          <label className="text-sm font-medium">Kode Pos</label>
          <Input
            value={postalCode}
            readOnly={!!postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Otomatis terisi"
          />
        </div>
      </div>
    </>
  );
}
