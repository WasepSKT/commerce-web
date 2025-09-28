import React, { useEffect, useState } from 'react';
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
        if (province) setCities(getCitiesFromCache(province));
        if (province && city) setDistricts(getDistrictsFromCache(province, city));
        if (province && city && district) setSubdistricts(getSubdistrictsFromCache(province, city, district));
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
    setCities(province ? getCitiesFromCache(province) : []);
    setDistricts([]);
    setSubdistricts([]);
    setCity('');
    setDistrict('');
    setPostalCode('');
  }, [province, setCity, setDistrict, setSubdistricts, setDistricts, setPostalCode]);

  useEffect(() => {
    setDistricts((province && city) ? getDistrictsFromCache(province, city) : []);
    setSubdistricts([]);
    setDistrict('');
    setPostalCode('');
  }, [city, province, setDistrict, setSubdistricts, setPostalCode]);

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
        <select className="input w-full" disabled={loadingLocations} value={province} onChange={(e) => { const v = e.target.value.trim(); console.debug('Province selected:', v); setProvince(v); }}>
          <option value="">{loadingLocations ? 'Memuat...' : 'Pilih Provinsi'}</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Kabupaten / Kota</label>
        <select className="input w-full" disabled={!province || loadingLocations} value={city} onChange={(e) => { const v = e.target.value.trim(); console.debug('City selected:', v); setCity(v); }}>
          <option value="">{province ? (cities.length ? 'Pilih Kota' : 'Tidak ada kota') : 'Pilih provinsi dulu'}</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Kecamatan</label>
        <select className="input w-full" disabled={!city || loadingLocations} value={district} onChange={(e) => { const v = e.target.value.trim(); console.debug('District selected:', v); setDistrict(v); }}>
          <option value="">{city ? (districts.length ? 'Pilih Kecamatan' : 'Tidak ada kecamatan') : 'Pilih kota dulu'}</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Desa / Kelurahan</label>
        <select className="input w-full" disabled={!district || loadingLocations} value={subdistrict} onChange={(e) => {
          const val = e.target.value.trim();
          console.debug('Subdistrict selected:', val);
          setSubdistrict(val);
          const found = subdistricts.find(s => s.name.trim() === val);
          if (found) setPostalCode(found.postal);
        }}>
          <option value="">{district ? (subdistricts.length ? 'Pilih Desa / Kelurahan' : 'Tidak ada desa') : 'Pilih kecamatan dulu'}</option>
          {subdistricts.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Kode Pos</label>
        <input className="input w-full" value={postalCode} readOnly={!!postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Otomatis akan terisi setelah pilih desa" />
      </div>
    </>
  );
}
