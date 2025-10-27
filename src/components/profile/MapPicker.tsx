import React, { useEffect, useCallback, useRef } from 'react';

type Props = {
  latitude: string;
  longitude: string;
  setLatitude: (v: string) => void;
  setLongitude: (v: string) => void;
  open: boolean;
  onClose: () => void;
};

type MapLike = {
  setView: (center: [number, number], zoom?: number) => void;
  getZoom?: () => number;
  remove?: () => void;
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  addControl?: (ctrl: unknown) => void;
  invalidateSize?: () => void;
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
    create: (tag: string, className?: string, container?: HTMLElement) => HTMLElement;
  };
  DomEvent: {
    disableClickPropagation: (el: HTMLElement | Element) => void;
    on: (el: HTMLElement | Element, event: string, handler: (e: Event) => void) => void;
    stop: (e: Event) => void;
  };
};

const getWin = () => window as unknown as (Window & { _profile_map_ref?: ProfileMapRef; L?: LeafletStatic });

export default function MapPicker({ latitude, longitude, setLatitude, setLongitude, open, onClose }: Props) {
  // Use refs to store stable callback references
  const callbacksRef = useRef({ setLatitude, setLongitude });
  callbacksRef.current = { setLatitude, setLongitude };

  // Store initial coordinates when dialog opens to avoid recreating map
  const initialCoordsRef = useRef({ latitude, longitude });
  if (open && !getWin()._profile_map_ref?.map) {
    initialCoordsRef.current = { latitude, longitude };
  }

  const ensureLeafletLoaded = useCallback(async () => {
    if (getWin().L) return;
    const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }
    await new Promise<void>((resolve, reject) => {
      if (getWin().L) return resolve();
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.async = true;
      s.onload = () => {
        // Fix Leaflet icon path for production
        const L = getWin().L;
        if (L) {
          const Leaflet = L as unknown as {
            Icon?: {
              Default?: {
                prototype: { _getIconUrl?: unknown; };
                mergeOptions: (options: Record<string, unknown>) => void;
              };
            };
          };
          if (Leaflet.Icon?.Default) {
            delete Leaflet.Icon.Default.prototype._getIconUrl;
            Leaflet.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });
          }
        }
        resolve();
      };
      s.onerror = (e) => reject(e);
      document.body.appendChild(s);
    });
  }, []);

  const centerToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      callbacksRef.current.setLatitude(String(lat));
      callbacksRef.current.setLongitude(String(lng));
      const ref = getWin()._profile_map_ref;
      try {
        if (ref?.map) {
          const m = ref.map;
          if (ref.marker) ref.marker.setLatLng([lat, lng]);
          else {
            const L = getWin().L;
            ref.marker = L.marker([lat, lng], { draggable: true }).addTo(m);
            ref.marker.on('dragend', function () {
              const p = ref.marker!.getLatLng();
              callbacksRef.current.setLatitude(String(p.lat));
              callbacksRef.current.setLongitude(String(p.lng));
            });
          }
          m.setView([lat, lng], 15);
        }
      } catch (e) {
        // ignore
      }
    });
  }, []);

  // Effect to handle map initialization/destruction based on open state
  useEffect(() => {
    if (!open) {
      // Cleanup when dialog closes
      try {
        const ref = getWin()._profile_map_ref;
        if (ref?.map) {
          ref.map.remove?.();
          getWin()._profile_map_ref = {};
        }
      } catch (e) {
        // ignore
      }
      return;
    }

    let mounted = true;
    const containerId = 'profile-map-picker';
    const ref = getWin()._profile_map_ref as ProfileMapRef | undefined;

    // If map already exists, don't recreate it
    if (ref?.map) {
      return;
    }

    // Create the map if it doesn't exist
    (async () => {
      try {
        await ensureLeafletLoaded();
        if (!mounted) return;

        // Wait for container to be ready
        const containerEl = document.getElementById(containerId);
        if (!containerEl) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (!mounted) return;
        }

        const L = getWin().L;
        const initLat = initialCoordsRef.current.latitude ? Number(initialCoordsRef.current.latitude) : -6.2;
        const initLng = initialCoordsRef.current.longitude ? Number(initialCoordsRef.current.longitude) : 106.816666;
        const map = L.map(containerId);

        // Add tile layer first
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Set view after container and tiles are ready
        map.setView([initLat, initLng], 13);

        let marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);
        marker.on('dragend', function () {
          const p = marker.getLatLng();
          callbacksRef.current.setLatitude(String(p.lat));
          callbacksRef.current.setLongitude(String(p.lng));
        });
        try {
          const LocateControl = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function () {
              const container = L.DomUtil.create('div', 'leaflet-bar');
              const btn = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
              btn.href = '#';
              btn.title = 'Gunakan lokasi saat ini';
              btn.style.display = 'flex';
              btn.style.alignItems = 'center';
              btn.style.justifyContent = 'center';
              btn.style.width = '32px';
              btn.style.height = '32px';
              btn.style.background = 'white';
              btn.style.borderRadius = '6px';
              btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
              btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4 12h4"/><path d="M16 12h4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>';
              L.DomEvent.disableClickPropagation(container);
              L.DomEvent.on(btn, 'click', (e: Event) => {
                L.DomEvent.stop(e);
                centerToCurrentLocation();
              });
              return container;
            }
          });
          const LocateCtor = LocateControl as { new(): unknown };
          if (map.addControl) map.addControl(new LocateCtor());
        } catch (e) {
          // ignore
        }

        try {
          const CoordControl = L.Control.extend({
            options: { position: 'bottomleft' },
            onAdd: function () {
              const container = L.DomUtil.create('div', 'leaflet-bar bg-white p-2 text-xs');
              container.style.borderRadius = '6px';
              container.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
              container.id = 'profile-coords-overlay';
              container.innerHTML = `<div>Lat: <span id="profile-lat">${initLat.toFixed(6)}</span></div><div>Lng: <span id="profile-lng">${initLng.toFixed(6)}</span></div>`;
              return container;
            }
          });
          const CoordCtor = CoordControl as { new(): unknown };
          if (map.addControl) map.addControl(new CoordCtor());
        } catch (e) {
          // ignore
        }

        map.on('click', function (e: { latlng: { lat: number; lng: number } }) {
          const { lat, lng } = e.latlng;
          if (!marker) marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          else marker.setLatLng([lat, lng]);
          callbacksRef.current.setLatitude(String(lat));
          callbacksRef.current.setLongitude(String(lng));
          const latEl = document.getElementById('profile-lat');
          const lngEl = document.getElementById('profile-lng');
          if (latEl) latEl.textContent = lat.toFixed(6);
          if (lngEl) lngEl.textContent = lng.toFixed(6);
        });

        // Force map to recalculate size after all controls are added
        setTimeout(() => {
          if (mounted && map) {
            if (typeof map.invalidateSize === 'function') {
              map.invalidateSize();
            }
          }
        }, 300);

        getWin()._profile_map_ref = { map, marker };
      } catch (e) {
        console.debug('Leaflet load failed', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, centerToCurrentLocation, ensureLeafletLoaded]);

  // Separate effect to update map position when coordinates change
  useEffect(() => {
    if (!open) return;
    const ref = getWin()._profile_map_ref;
    if (ref?.map && ref?.marker && latitude && longitude) {
      try {
        const latNum = Number(latitude);
        const lngNum = Number(longitude);
        ref.marker.setLatLng([latNum, lngNum]);
        ref.map.setView([latNum, lngNum], ref.map.getZoom?.() ?? 13);
        // Ensure map size is correct after update
        if (typeof ref.map.invalidateSize === 'function') {
          setTimeout(() => {
            ref.map?.invalidateSize?.();
          }, 100);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [open, latitude, longitude]);

  useEffect(() => {
    const latEl = document.getElementById('profile-lat');
    const lngEl = document.getElementById('profile-lng');
    const latNum = latitude ? Number(latitude) : null;
    const lngNum = longitude ? Number(longitude) : null;
    if (latEl && latNum !== null) latEl.textContent = latNum.toFixed(6);
    if (lngEl && lngNum !== null) lngEl.textContent = lngNum.toFixed(6);
  }, [latitude, longitude]);

  // Effect to trigger map resize when dialog opens
  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      const ref = getWin()._profile_map_ref;
      if (ref?.map && typeof ref.map.invalidateSize === 'function') {
        ref.map.invalidateSize();
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [open]);

  // This component renders only the map container; the parent should wrap it inside its dialog/footer.
  return <div id="profile-map-picker" className="w-full h-[60vh] rounded overflow-hidden" />;
}
