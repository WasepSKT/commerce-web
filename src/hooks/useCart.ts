import { useMemo, useSyncExternalStore, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type CartItem = {
  id: string;
  quantity: number;
};

type CartMap = Record<string, number>;

// Module-level singleton store so all hook instances share state and can subscribe
let mapState: CartMap = {};
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
    try { l(); } catch (e) { /* ignore listener errors */ }
  }
}

function setMap(next: CartMap) {
  mapState = next;
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

// Converters between array shape stored in DB and internal CartMap
const itemsArrayToMap = (items: unknown[] = []) => {
  const out: CartMap = {};
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const obj = it as Record<string, unknown>;
    const pid = obj['product_id'];
    const qty = obj['quantity'];
    if (!pid) continue;
    const qtyNum = typeof qty === 'number' ? qty : (typeof qty === 'string' ? Number(qty) : 0);
    out[String(pid)] = (out[String(pid)] || 0) + (Number(qtyNum) || 0);
  }
  return out;
};

const mapToItemsArray = (m: CartMap) => Object.entries(m).map(([product_id, quantity]) => ({ product_id, quantity }));

// Cache to avoid repeating server SELECT for same logged-in user
let serverSyncedForUserId: string | null = null;

export default function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const map = snapshot as CartMap;

  const items: CartItem[] = useMemo(() => Object.entries(map).map(([id, quantity]) => ({ id, quantity })), [map]);
  const totalItems = useMemo(() => Object.values(map).reduce((s, q) => s + q, 0), [map]);

  const { isAuthenticated, session } = useAuth();

  // Debounced background sync: when authenticated, schedule an upsert to server
  let syncTimer: number | null = null;
  const SYNC_DEBOUNCE_MS = 800;

  const scheduleSync = () => {
    if (!isAuthenticated) return;
    if (typeof window === 'undefined') return;
    if (syncTimer) clearTimeout(syncTimer);
    // schedule background upsert
    syncTimer = window.setTimeout(async () => {
      try {
        const userId = session?.user?.id;
        if (!userId) return;
        const current = getSnapshot();
        const payload = { user_id: userId, items: mapToItemsArray(current), updated_at: new Date().toISOString() };
        const { error } = await supabase.from('carts').upsert(payload, { onConflict: 'user_id' });
        if (error) console.debug('[useCart] background sync error', error);
        else console.debug('[useCart] background sync ok');
      } catch (e) {
        console.debug('[useCart] background sync failed', e);
      } finally {
        syncTimer = null;
      }
    }, SYNC_DEBOUNCE_MS);
  };

  // One-time sync on login: prefer server as source-of-truth to avoid duplicate increments on refresh.
  const syncLocalToServer = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const userId = session?.user?.id;
      if (!userId) return;

      if (serverSyncedForUserId === userId) return; // already synced for this session/user

      const { data: serverCart, error: fetchError } = await supabase
        .from('carts')
        .select('items')
        .eq('user_id', userId)
        .maybeSingle();
      if (fetchError) {
        console.debug('[useCart] fetch server cart error', fetchError);
        serverSyncedForUserId = userId; // avoid tight retry loops
        return;
      }

      let serverItems: unknown[] = [];
      if (serverCart && typeof serverCart === 'object' && 'items' in (serverCart as Record<string, unknown>)) {
        const val = (serverCart as Record<string, unknown>)['items'];
        if (Array.isArray(val)) serverItems = val as unknown[];
      }
      const local = getSnapshot();
      const localHasItems = Object.keys(local).length > 0;
      const serverHasItems = Array.isArray(serverItems) && serverItems.length > 0;

      if (serverHasItems) {
        const serverMap = itemsArrayToMap(serverItems);
        setMap(serverMap);
        serverSyncedForUserId = userId;
        console.debug('[useCart] loaded cart from server');
      } else if (localHasItems) {
        const payload = { user_id: userId, items: mapToItemsArray(local), updated_at: new Date().toISOString() };
        const { error: upsertError } = await supabase.from('carts').upsert(payload, { onConflict: 'user_id' });
        if (upsertError) {
          console.debug('[useCart] upsert cart error', upsertError);
          serverSyncedForUserId = userId;
          return;
        }
        serverSyncedForUserId = userId;
        console.debug('[useCart] uploaded local cart to server');
      } else {
        serverSyncedForUserId = userId; // nothing to sync but mark as done
      }
    } catch (e) {
      console.debug('[useCart] syncLocalToServer failed', e);
      serverSyncedForUserId = session?.user?.id ?? null;
    }
  }, [isAuthenticated, session?.user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      void syncLocalToServer();
    } else {
      // reset sync cache when user logs out
      serverSyncedForUserId = null;
      setMap({});
    }
  }, [isAuthenticated, session?.user?.id, syncLocalToServer]);

  return {
    items,
    map,
    totalItems,
    add: (id: string, amount = 1) => {
      addToMap(id, amount);
      if (isAuthenticated) scheduleSync();
    },
    update: (id: string, quantity: number) => {
      updateMap(id, quantity);
      if (isAuthenticated) scheduleSync();
    },
    removeItem: (id: string) => {
      removeFromMap(id);
      if (isAuthenticated) scheduleSync();
    },
    clear: () => {
      clearMap();
      if (isAuthenticated) scheduleSync();
    },
    clearImmediate: async () => {
      clearMap();
      if (!isAuthenticated) return;
      try {
        const userId = session?.user?.id;
        if (!userId) return;
        // Langsung sync ke server tanpa debounce untuk memastikan cart kosong di database
        const payload = { user_id: userId, items: [], updated_at: new Date().toISOString() };
        const { error } = await supabase.from('carts').upsert(payload, { onConflict: 'user_id' });
        if (error) {
          console.error('[useCart] clearImmediate sync error', error);
          // Fallback ke debounced sync jika immediate sync gagal
          scheduleSync();
        } else {
          console.debug('[useCart] cart cleared immediately on server');
          // Reset sync cache agar tidak reload dari server yang sudah kosong
          serverSyncedForUserId = userId;
        }
      } catch (e) {
        console.error('[useCart] clearImmediate failed', e);
        // Fallback ke debounced sync
        scheduleSync();
      }
    },
  } as const;
}

