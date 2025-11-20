import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Subdistrict } from '@/lib/loadKodepos';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReferral } from '@/hooks/useReferral';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Crosshair } from 'lucide-react';
import AddressSelectors from '@/components/profile/AddressSelectors';
import MapPicker from '@/components/profile/MapPicker';
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
  const { profile, updateProfile, user } = useAuth();
  const _meta = (user as unknown as Record<string, unknown>)?.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl = typeof _meta?.avatar_url === 'string' ? (_meta.avatar_url as string) : typeof _meta?.picture === 'string' ? (_meta.picture as string) : undefined;
  const { referralLevel } = useReferral();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [full_name, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
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
    const trim = (v?: string) => (v ?? '').trim();
    setFullName(trim(profile?.full_name));
    setPhone(trim(profile?.phone));
    setProvince(trim(profile?.province));
    setCity(trim(profile?.city));
    setDistrict(trim(profile?.district));
    setSubdistrict(trim(profile?.subdistrict));
    setPostalCode(trim(profile?.postal_code));
    setAddress(trim(profile?.address));
    setLatitude(profile?.latitude?.toString() ?? '');
    setLongitude(profile?.longitude?.toString() ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!updateProfile) return;
    // final validation before save
    const normalized = normalizePhone(phone);
    if (phone && !isValidIndoPhone(normalized)) {
      setPhoneError('Nomor telepon tidak valid');
      return;
    }
    setPhoneError(null);
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
      // if backend stripped some fields due to schema mismatch, inform the user
      const hasSkipped = (v: unknown): v is { skipped: string[] } => {
        if (typeof v !== 'object' || v === null) return false;
        const r = v as Record<string, unknown>;
        return Array.isArray(r.skipped) && r.skipped.every((s) => typeof s === 'string');
      };
      if (hasSkipped(res) && res.skipped.length) {
        // Use default toast variant (component supports 'default' and 'destructive')
        toast({ title: 'Beberapa field tidak disimpan', description: `Field: ${res.skipped.join(', ')} tidak ditemukan di server dan diabaikan.` });
      } else {
        toast({ title: 'Profil diperbarui' });
        // If a `next` param exists and is a safe internal path, navigate to it
        const next = searchParams.get('next');
        if (next && typeof next === 'string' && next.startsWith('/')) {
          navigate(next);
        }
      }
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

  // phone validation helpers: normalize common separators and allow 0... or +62...
  const normalizePhone = (v: string) => v.replace(/[\s-().]/g, '');
  const isValidIndoPhone = (v: string) => {
    if (!v) return true; // empty allowed (optional)
    // allow leading +62 or leading 0, followed by 8-13 digits
    if (/^\+62[0-9]{8,13}$/.test(v)) return true;
    if (/^0[0-9]{8,13}$/.test(v)) return true;
    return false;
  };


  // Map picker modal state (component encapsulates map logic)
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Stable callbacks passed to AddressSelectors to avoid recreating functions each render
  const handleSetProvince = useCallback((v: string) => {
    setProvince(v);
    setCity('');
    setDistrict('');
    setSubdistrict('');
    setPostalCode('');
  }, []);

  const handleSetCity = useCallback((v: string) => {
    setCity(v);
    setDistrict('');
    setSubdistrict('');
    setPostalCode('');
  }, []);

  const handleSetDistrict = useCallback((v: string) => {
    setDistrict(v);
    setSubdistrict('');
    setPostalCode('');
  }, []);

  const confirmMapSelection = () => {
    setShowMapPicker(false);
    toast({ title: 'Lokasi diperbarui' });
  };
  /* duplicate centerToCurrentLocation removed; use the useCallback version above */

  // Address selectors and map picker handled by components

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
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4 text-center md:text-left">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-24 w-24 md:h-16 md:w-16 rounded-full object-cover shadow"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="h-24 w-24 md:h-16 md:w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center text-muted-foreground">
              {/* empty placeholder when no avatar */}
            </div>
          )}

          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-2xl font-bold text-primary">Profil Saya</h1>
            {referralLevel ? (
              <div className="mt-2">
                <Badge variant="secondary">{referralLevel.levelName}</Badge>
              </div>
            ) : null}
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referralLevel ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Referral</label>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="rounded-lg border p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Komisi</p>
                      <p className="text-lg font-semibold">{(referralLevel.commissionPct * 100).toFixed(0)}%</p>
                    </div>
                    <div className="rounded-lg border p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Pendapatan Referral</p>
                      <p className="text-lg font-semibold">Rp {referralLevel.totalAmount.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Level: <span className="font-medium">{referralLevel.levelName}</span></p>
                </div>
              ) : null}
              <div>
                <label className="text-sm font-medium">Nama Penerima</label>
                <Input value={full_name} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap sesuai pengiriman" />
              </div>

              <div>
                <label className="text-sm font-medium">Nomor HP / WhatsApp</label>
                <Input value={phone} onChange={(e) => {
                  setPhone(e.target.value);
                  const norm = normalizePhone(e.target.value);
                  setPhoneError(isValidIndoPhone(norm) ? null : 'Nomor telepon tidak valid');
                }} placeholder="contoh: 087890" />
                {phoneError ? <p className="mt-1 text-sm text-destructive">{phoneError}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Alamat Lengkap</label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jalan, RT/RW, nomor rumah, blok" />
              </div>

              <AddressSelectors
                province={province}
                setProvince={handleSetProvince}
                city={city}
                setCity={handleSetCity}
                district={district}
                setDistrict={handleSetDistrict}
                subdistrict={subdistrict}
                setSubdistrict={setSubdistrict}
                postalCode={postalCode}
                setPostalCode={setPostalCode}
              />

              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="opsional" />
              </div>

              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="opsional" />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-muted-foreground">Lengkapi data pengiriman untuk mempercepat proses checkout.</div>
                <div className="flex flex-col sm:flex-row md:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <Button className="w-full sm:w-auto" onClick={fillCurrentLocation} variant="outline"><MapPin className="mr-2 h-4 w-4" />Gunakan Lokasi</Button>
                  <Button className="w-full sm:w-auto" onClick={() => setShowMapPicker(true)} variant="outline"><MapPin className="mr-2 h-4 w-4" />Pilih Lokasi di Peta</Button>
                  <Button className="w-full sm:w-auto" onClick={handleSave} disabled={saving || Boolean(phoneError)}>
                    {saving ? 'Menyimpan...' : 'Simpan Profil'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Map picker dialog */}
        <Dialog open={showMapPicker} onOpenChange={(v) => setShowMapPicker(v)}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] p-4 sm:p-6">
            <DialogHeader className="pb-2 sm:pb-4">
              <DialogTitle className="text-primary text-base sm:text-lg">Pilih Lokasi pada Peta</DialogTitle>
            </DialogHeader>
            <div className="overflow-hidden -mx-4 sm:mx-0">
              <MapPicker open={showMapPicker} latitude={latitude} longitude={longitude} setLatitude={setLatitude} setLongitude={setLongitude} onClose={() => setShowMapPicker(false)} />
            </div>
            <DialogFooter className="mt-2 sm:mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setShowMapPicker(false)}>Batal</Button>
              <Button className="w-full sm:w-auto" onClick={confirmMapSelection}>Konfirmasi Lokasi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
