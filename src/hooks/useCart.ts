import { useMemo, useSyncExternalStore } from 'react';
import { safeJsonParse } from '@/utils/storage';

export type CartItem = {
  id: string;
  quantity: number;
};

const STORAGE_KEY = 'rp_cart_v1';

type CartMap = Record<string, number>;

function readStorage(): CartMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return safeJsonParse(raw, {} as CartMap);
  } catch (e) {
    console.error('Failed to read cart from localStorage', e);
    return {};
  }
}

function writeStorage(data: CartMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to write cart to localStorage', e);
  }
}

// Module-level singleton store so all hook instances share state and can subscribe
type Store = {
  map: CartMap;
  listeners: Set<() => void>;
  getSnapshot(): CartMap;
  subscribe(listener: () => void): () => void;
  emit(): void;
  setMap(next: CartMap): void;
  add(id: string, amount?: number): void;
  update(id: string, quantity: number): void;
  removeItem(id: string): void;
  clear(): void;
};

let mapState: CartMap = readStorage();
const listeners = new Set<() => void>();

function getSnapshot(): CartMap {
  return mapState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const l of Array.from(listeners)) {
    try { l(); } catch (e) { console.error('cart listener error', e); }
  }
}

function setMap(next: CartMap) {
  mapState = next;
  try { writeStorage(next); } catch (e) { /* already logged in writeStorage */ }
  emit();
}

function addToMap(id: string, amount = 1) {
  const prev = mapState;
  const next = { ...prev, [id]: (prev[id] || 0) + amount };
  setMap(next);
}

function updateMap(id: string, quantity: number) {
  const prev = mapState;
  if (quantity <= 0) {
    const { [id]: _removed, ...rest } = prev;
    setMap(rest);
    return;
  }
  setMap({ ...prev, [id]: quantity });
}

function removeFromMap(id: string) {
  const prev = mapState;
  const { [id]: _removed, ...rest } = prev;
  setMap(rest);
}

function clearMap() {
  setMap({});
}

// Keep store in sync with other tabs/windows
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      mapState = safeJsonParse(e.newValue, {} as CartMap);
      emit();
    }
  });
}

export default function useCart() {
  const snapshot = useSyncExternalStore(
    (listener) => subscribe(listener),
    () => getSnapshot(),
    () => getSnapshot(),
  );

  const map = snapshot as CartMap;

  const items: CartItem[] = useMemo(() => Object.entries(map).map(([id, quantity]) => ({ id, quantity })), [map]);

  const totalItems = useMemo(() => Object.values(map).reduce((s, q) => s + q, 0), [map]);

  return {
    items,
    map,
    totalItems,
    add: (id: string, amount = 1) => addToMap(id, amount),
    update: (id: string, quantity: number) => updateMap(id, quantity),
    removeItem: (id: string) => removeFromMap(id),
    clear: () => clearMap(),
  } as const;
}
