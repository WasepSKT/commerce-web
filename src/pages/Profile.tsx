import { useState, useEffect, useCallback } from 'react';
import { loadKodepos, getProvincesFromCache, getCitiesFromCache, getDistrictsFromCache, getSubdistrictsFromCache, Subdistrict } from '@/lib/loadKodepos';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Crosshair } from 'lucide-react';
import { useAuth, UpdateProfileResult, UserProfile } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Lightweight internal types to avoid using `any` when interacting with the
// Leaflet global loaded from CDN. We only type the small surface used here.
type MapLike = {
  setView: (center: [number, number], zoom?: number) => void;
  getZoom?: () => number;
  remove?: () => void;
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  addControl?: (ctrl: unknown) => void;
};

type MarkerLike = {
  setLatLng: (coords: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, handler: () => void) => void;
  addTo: (m: MapLike) => MarkerLike;
};

type ProfileMapRef = { map?: MapLike; marker?: MarkerLike };

type LeafletStatic = {
  map: (containerId: string | HTMLElement) => MapLike;
  tileLayer: (url: string, opts?: { attribution?: string }) => { addTo: (m: MapLike) => void };
  marker: (coords: [number, number], opts?: { draggable?: boolean }) => MarkerLike;
  Control: { extend: (obj: unknown) => unknown };
  DomUtil: {
    // allow passing an optional container (third argument) like Leaflet's API
    create: (tag: string, className?: string, container?: HTMLElement) => HTMLElement;
  };
  DomEvent: {
    disableClickPropagation: (el: HTMLElement) => void;
    on: (el: HTMLElement | Element, event: string, handler: (e: Event) => void) => void;
    stop: (e: Event) => void;
  };
};

const getWin = () => window as unknown as (Window & { _profile_map_ref?: ProfileMapRef; L?: LeafletStatic });

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [full_name, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [province, setProvince] = useState(profile?.province ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [district, setDistrict] = useState(profile?.district ?? '');
  const [subdistrict, setSubdistrict] = useState(profile?.subdistrict ?? '');
  const [postalCode, setPostalCode] = useState(profile?.postal_code ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [latitude, setLatitude] = useState<string | ''>(profile?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState<string | ''>(profile?.longitude?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    setProvince(profile?.province ?? '');
    setCity(profile?.city ?? '');
    setDistrict(profile?.district ?? '');
    setPostalCode(profile?.postal_code ?? '');
    setAddress(profile?.address ?? '');
    setLatitude(profile?.latitude?.toString() ?? '');
    setLongitude(profile?.longitude?.toString() ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!updateProfile) return;
    setSaving(true);
    const updates = {
      full_name: full_name || null,
      phone: phone || null,
      province: province || null,
      city: city || null,
      district: district || null,
      subdistrict: subdistrict || null,
      postal_code: postalCode || null,
      address: address || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    } as Partial<UserProfile>;
    const res: UpdateProfileResult = await updateProfile(updates);
    setSaving(false);
    if ('error' in res && res.error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: String(res.error) });
    } else {
      toast({ title: 'Profil diperbarui' });
    }
  };
  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Geolocation tidak tersedia' });
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(String(pos.coords.latitude));
      setLongitude(String(pos.coords.longitude));
      toast({ title: 'Lokasi berhasil diisi' });
    }, (err) => {
      toast({ variant: 'destructive', title: 'Gagal mendapatkan lokasi', description: err.message });
    });
  };

  
  // Map picker modal state
  const [showMapPicker, setShowMapPicker] = useState(false);
  // ensure a place to keep map refs
  if (!getWin()._profile_map_ref) getWin()._profile_map_ref = {};

  // Dynamically load Leaflet CSS and JS from CDN when opening map picker
  async function ensureLeafletLoaded() {
    if (getWin().L) return;
    // load CSS
    const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }
    // load script
    await new Promise<void>((resolve, reject) => {
      if (getWin().L) return resolve();
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.body.appendChild(s);
    });
  }

  // center map to current geolocation (used inside modal)
  const centerToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Geolocation tidak tersedia' });
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(String(lat));
      setLongitude(String(lng));
      // interact with the global map ref (may not exist in SSR)
      const ref = getWin()._profile_map_ref;
      try {
        if (ref?.map) {
          const m = ref.map;
          if (ref.marker) {
            ref.marker.setLatLng([lat, lng]);
          } else {
            // create marker using Leaflet static typings
            const L = getWin().L!;
            ref.marker = L.marker([lat, lng], { draggable: true }).addTo(m);
            ref.marker.on('dragend', function () {
              const p = ref.marker!.getLatLng();
              setLatitude(String(p.lat));
              setLongitude(String(p.lng));
            });
          }
          m.setView([lat, lng], 15);
        }
      } catch (e) {
        // ignore map errors
      }
      toast({ title: 'Berpindah ke lokasi saat ini' });
    }, (err) => {
      toast({ variant: 'destructive', title: 'Gagal mendapatkan lokasi', description: err.message });
    });
  }, [toast]);

  useEffect(() => {
    let mounted = true;
  const containerId = 'profile-map-picker';
  const ref = getWin()._profile_map_ref as ProfileMapRef | undefined;

    // If map already initialized and coordinates changed, update marker/view
    if (showMapPicker && ref?.map) {
      try {
        const m = ref.map;
        const mk = ref.marker;
        if (mk && latitude && longitude) {
          const latNum = Number(latitude);
          const lngNum = Number(longitude);
          mk.setLatLng([latNum, lngNum]);
          m.setView([latNum, lngNum], m.getZoom());
        }
      } catch (e) {
        // ignore update errors
      }
      return;
    }

    if (!showMapPicker) return;
    let map: MapLike | undefined;
    let marker: MarkerLike | undefined;
    (async () => {
      try {
        await ensureLeafletLoaded();
        if (!mounted) return;
        const L = getWin().L!;
        // initialize map
        const lat = latitude ? Number(latitude) : -6.200000;
        const lng = longitude ? Number(longitude) : 106.816666;
        map = L.map(containerId) as unknown as MapLike;
        map.setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map as MapLike);
  marker = L.marker([lat, lng], { draggable: true }).addTo(map as MapLike);
        marker.on('dragend', function () {
          const p = marker!.getLatLng();
          setLatitude(String(p.lat));
          setLongitude(String(p.lng));
        });
        // add custom control for 'center to current location' near zoom controls
        try {
          const LocateControl = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function () {
              const container = L.DomUtil.create('div', 'leaflet-bar');
              const btn = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
              btn.href = '#';
              btn.title = 'Gunakan lokasi saat ini';
              btn.style.marginTop = '40px';
              btn.style.display = 'flex';
              btn.style.alignItems = 'center';
              btn.style.justifyContent = 'center';
              btn.style.width = '36px';
              btn.style.height = '36px';
              btn.style.background = 'white';
              btn.style.borderRadius = '6px';
              btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
              btn.setAttribute('aria-label', 'Gunakan lokasi saat ini');
              btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4 12h4"/><path d="M16 12h4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>';
              L.DomEvent.disableClickPropagation(container as HTMLElement);
              L.DomEvent.on(btn, 'click', (e: Event) => {
                L.DomEvent.stop(e);
                centerToCurrentLocation();
              });
              return container;
            }
          });
          // `L.Control.extend` returns a plain object shape; cast to a
          // constructor so we can instantiate it in TypeScript.
          const LocateCtor = (LocateControl as unknown) as { new(): unknown };
          if (map.addControl) map.addControl(new LocateCtor());
        } catch (e) {
          // ignore if L not available or extend fails
        }
        // add lat/lng overlay control at bottomleft
        try {
          const CoordControl = L.Control.extend({
            options: { position: 'bottomleft' },
            onAdd: function () {
              const container = L.DomUtil.create('div', 'leaflet-bar bg-white p-2 text-xs');
              container.style.borderRadius = '6px';
              container.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
              container.id = 'profile-coords-overlay';
              container.innerHTML = `<div>Lat: <span id="profile-lat">${lat.toFixed(6)}</span></div><div>Lng: <span id="profile-lng">${lng.toFixed(6)}</span></div>`;
              return container;
            }
          });
          const CoordCtor = (CoordControl as unknown) as { new(): unknown };
          if (map.addControl) map.addControl(new CoordCtor());
        } catch (e) {
          // ignore if fails
        }
        map.on('click', function (e: { latlng: { lat: number; lng: number } }) {
          const { lat, lng } = e.latlng;
          if (!marker) marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          else marker.setLatLng([lat, lng]);
          setLatitude(String(lat));
          setLongitude(String(lng));
          // update overlay
          const latEl = document.getElementById('profile-lat');
          const lngEl = document.getElementById('profile-lng');
          if (latEl) latEl.textContent = lat.toFixed(6);
          if (lngEl) lngEl.textContent = lng.toFixed(6);
        });
        // store refs for cleanup if needed
        getWin()._profile_map_ref = { map, marker };
      } catch (e) {
        console.debug('Leaflet load failed', e);
      }
    })();

    return () => {
      mounted = false;
      try {
        const ref = getWin()._profile_map_ref;
        if (ref?.map) {
          ref.map.remove?.();
          getWin()._profile_map_ref = {};
        }
      } catch (e) {
        // ignore
      }
    };
    // include coords so the effect can update marker when they change
  }, [showMapPicker, latitude, longitude, centerToCurrentLocation]);

  const confirmMapSelection = () => {
    // map interactions already update latitude/longitude; just close modal
    setShowMapPicker(false);
    toast({ title: 'Lokasi diperbarui' });
  };
  /* duplicate centerToCurrentLocation removed; use the useCallback version above */

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
        // load and cache if not present
        await loadKodepos();
        if (!mounted) return;
        const provs = getProvincesFromCache();
        setProvinces(provs);
        if (province) setCities(getCitiesFromCache(province));
        if (province && city) setDistricts(getDistrictsFromCache(province, city));
        if (province && city && district) setSubdistricts(getSubdistrictsFromCache(province, city, district));
      } catch (e) {
        // ignore — keep selects empty
        console.debug('Failed to load kodepos', e);
      } finally {
        if (mounted) setLoadingLocations(false);
      }
    }
    void load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCities(province ? getCitiesFromCache(province) : []);
    setDistricts([]);
    setSubdistricts([]);
    setCity('');
    setDistrict('');
    setPostalCode('');
  }, [province]);

  useEffect(() => {
    setDistricts((province && city) ? getDistrictsFromCache(province, city) : []);
    setSubdistricts([]);
    setDistrict('');
    setPostalCode('');
  }, [city, province]);

  useEffect(() => {
    const subs = (province && city && district) ? getSubdistrictsFromCache(province, city, district) : [];
    setSubdistricts(subs);
    setPostalCode('');
    // auto-fill postal code if exactly one subdistrict
    if (subs.length === 1) {
      setPostalCode(subs[0].postal);
      setSubdistrict(subs[0].name);
    }
  }, [district, city, province]);

  // keep coord overlay in sync when lat/lng state changes
  useEffect(() => {
    const latEl = document.getElementById('profile-lat');
    const lngEl = document.getElementById('profile-lng');
    const latNum = latitude ? Number(latitude) : null;
    const lngNum = longitude ? Number(longitude) : null;
    if (latEl && latNum !== null) latEl.textContent = latNum.toFixed(6);
    if (lngEl && lngNum !== null) lngEl.textContent = lngNum.toFixed(6);
  }, [latitude, longitude]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Profil Saya</h1>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Penerima</label>
                <Input value={full_name} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap sesuai pengiriman" />
              </div>

              <div>
                <label className="text-sm font-medium">Nomor HP / WhatsApp</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="contoh: 081234567890" />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Alamat Lengkap</label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jalan, RT/RW, nomor rumah, blok" />
              </div>

              <div>
                <label className="text-sm font-medium">Provinsi</label>
                <select className="input w-full" disabled={loadingLocations} value={province} onChange={(e) => { setProvince(e.target.value); setCity(''); setDistrict(''); setSubdistrict(''); setPostalCode(''); }}>
                  <option value="">{loadingLocations ? 'Memuat...' : 'Pilih Provinsi'}</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Kabupaten / Kota</label>
                <select className="input w-full" disabled={!province || loadingLocations} value={city} onChange={(e) => { setCity(e.target.value); setDistrict(''); setSubdistrict(''); setPostalCode(''); }}>
                  <option value="">{province ? (cities.length ? 'Pilih Kota' : 'Tidak ada kota') : 'Pilih provinsi dulu'}</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Kecamatan</label>
                <select className="input w-full" disabled={!city || loadingLocations} value={district} onChange={(e) => { setDistrict(e.target.value); setSubdistrict(''); setPostalCode(''); }}>
                  <option value="">{city ? (districts.length ? 'Pilih Kecamatan' : 'Tidak ada kecamatan') : 'Pilih kota dulu'}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Desa / Kelurahan</label>
                <select className="input w-full" disabled={!district || loadingLocations} value={subdistrict} onChange={(e) => {
                  const val = e.target.value;
                  setSubdistrict(val);
                  const found = subdistricts.find(s => s.name === val);
                  if (found) setPostalCode(found.postal);
                }}>
                  <option value="">{district ? (subdistricts.length ? 'Pilih Desa / Kelurahan' : 'Tidak ada desa') : 'Pilih kecamatan dulu'}</option>
                  {subdistricts.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Kode Pos</label>
                <Input value={postalCode} readOnly={!!postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Otomatis akan terisi setelah pilih desa" />
              </div>

              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="opsional" />
              </div>

              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="opsional" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Lengkapi data pengiriman untuk mempercepat proses checkout.</div>
              <div className="flex items-center gap-2">
                <Button onClick={fillCurrentLocation} variant="outline"><MapPin className="mr-2 h-4 w-4" />Gunakan Lokasi</Button>
                <Button onClick={() => setShowMapPicker(true)} variant="outline"><MapPin className="mr-2 h-4 w-4" />Pilih Lokasi di Peta</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Map picker dialog */}
        <Dialog open={showMapPicker} onOpenChange={(v) => setShowMapPicker(v)}>
          <DialogContent className="max-w-3xl w-[90vw]">
            <DialogHeader>
              <DialogTitle>Pilih Lokasi pada Peta</DialogTitle>
            </DialogHeader>
            <div className="h-[60vh] rounded overflow-hidden">
              <div id="profile-map-picker" className="w-full h-full" />
            </div>
            <DialogFooter className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMapPicker(false)}>Batal</Button>
              <Button onClick={confirmMapSelection}>Konfirmasi Lokasi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
