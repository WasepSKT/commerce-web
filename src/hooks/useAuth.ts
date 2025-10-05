import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  province?: string | null;
  city?: string | null; // kabupaten/kota
  district?: string | null; // kecamatan/desa
  subdistrict?: string | null; // kelurahan/desa
  postal_code?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  role: 'admin' | 'customer' | 'marketing' | 'admin_sales';
  referral_code: string;
  referred_by: string | null;
  reward_points?: number;
  updated_at?: string | null;
}

export type UpdateProfileResult =
  | { data: UserProfile; skipped?: string[] }
  | { error: unknown };

// ----- Module-level singleton store -----
type Store = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
};

const store: Store = {
  user: null,
  session: null,
  profile: null,
  loading: true,
};

const subscribers = new Set<(s: Store) => void>();

let initialized = false;

function notify() {
  for (const s of subscribers) {
    try {
      s({ ...store });
    } catch (e) {
      // ignore subscriber errors
    }
  }
}

// Small helper to parse cached profile safely
function readCachedProfileForUser(userId?: string): UserProfile | null {
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!userId) return parsed;
    return parsed?.user_id === userId ? parsed : null;
  } catch (e) {
    localStorage.removeItem('userProfile');
    return null;
  }
}

// Helper to fetch profile with retry
const fetchProfileWithRetry = async (userId: string, attempts = 2): Promise<UserProfile | null> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data: profileData, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (error) {
        console.debug('[useAuth] profile fetch error', { error, attempt: i + 1 });
        if (i === attempts - 1) throw error;
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
      return (profileData as UserProfile) ?? null;
    } catch (err) {
      console.debug('[useAuth] profile fetch failed', { err, attempt: i + 1 });
      if (i === attempts - 1) return null;
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return null;
};

// Single initialization routine
async function initOnce() {
  if (initialized) return;
  initialized = true;
  store.loading = true;
  notify();

  try {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    store.session = currentSession ?? null;
    store.user = currentSession?.user ?? null;

    // Prefer cached profile from localStorage when it matches the current user.
    if (currentSession?.user) {
      const cached = readCachedProfileForUser(currentSession.user.id);
      if (cached) {
        store.profile = cached;
      } else {
        const profileData = await fetchProfileWithRetry(currentSession.user.id);
        store.profile = profileData ?? null;
        if (profileData) localStorage.setItem('userProfile', JSON.stringify(profileData));
        else localStorage.removeItem('userProfile');
      }
    } else {
      store.profile = null;
      localStorage.removeItem('userProfile');
    }

    store.loading = false;
    notify();
  } catch (err) {
    console.debug('[useAuth] init error', err);
    store.loading = false;
    notify();
  }

  // Subscribe to auth changes once
  try {
    const onAuthResult = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.debug('[useAuth] auth state change', { event, userId: newSession?.user?.id });

      store.loading = true;
      notify();

      store.session = newSession ?? null;
      store.user = newSession?.user ?? null;

      if (newSession?.user) {
        // Try cache first
        const cached = readCachedProfileForUser(newSession.user.id);
        if (cached) {
          store.profile = cached;
        } else {
          const profileData = await fetchProfileWithRetry(newSession.user.id);
          store.profile = profileData ?? null;
          if (profileData) localStorage.setItem('userProfile', JSON.stringify(profileData));
          else localStorage.removeItem('userProfile');
        }
      } else {
        store.profile = null;
        localStorage.removeItem('userProfile');
      }

      store.loading = false;
      notify();
    });

    // We don't need to hold onto the subscription object here for unmount because
    // initOnce only runs once per app lifecycle. If you want to allow explicit cleanup
    // on hot-reload or teardown, you can store and unsubscribe the subscription.
    // This keeps the implementation simple and ensures only one subscription is active.
  } catch (e) {
    console.debug('[useAuth] subscribe error', e);
  }
}

export function useAuth() {
  const [state, setState] = useState<Store>({ ...store });

  useEffect(() => {
    // Subscribe to store updates
    const cb = (s: Store) => setState(s);
    subscribers.add(cb);
    // Initialize the hook state with current store
    setState({ ...store });
    // Kick off single init
    void initOnce();

    return () => {
      subscribers.delete(cb);
    };
    // intentionally empty deps so each hook instance just subscribes/unsubscribes
  }, []);

  const signInWithGoogle = async () => {
  // Use runtime origin for redirect; production origin should be configured
  // in Supabase allowed redirect URLs. No build-time VITE_APP_URL is required.
  const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UpdateProfileResult> => {
    if (!store.profile) return { error: 'not-authenticated' };
    try {
      // Whitelist allowed columns to avoid sending unknown fields to PostgREST
      const allowed: Array<keyof UserProfile> = [
        'full_name', 'phone', 'province', 'city', 'district', 'subdistrict', 'postal_code', 'address', 'latitude', 'longitude'
      ];
      const payload: Record<string, unknown> = {};
      for (const k of allowed) {
        if (k in updates) {
          // assign using string index and cast to unknown to satisfy TS
          payload[k as string] = updates[k] as unknown;
        }
      }

      if (Object.keys(payload).length === 0) return { error: 'no-valid-fields' };

      // Try to update. If PostgREST returns a PGRST204 about a missing column
      // in the schema cache, remove that column from the payload and retry.
  let attempt = 0;
      const maxAttempts = 3;
      let lastError: unknown = null;
      let resultData: unknown = null;
  const skippedCols: string[] = [];

      const hasMessage = (v: unknown): v is { message: string } => {
        if (typeof v !== 'object' || v === null) return false;
        const r = v as Record<string, unknown>;
        return typeof r.message === 'string';
      };

  while (attempt < maxAttempts) {
        attempt++;
        const { data, error } = await supabase.from('profiles').update(payload).eq('id', store.profile.id).select('*').single();
        if (!error) {
          resultData = data;
          break;
        }
        lastError = error;

        // Defensive: detect PostgREST schema-cache missing column error message and strip the column
        // safe narrowing: support objects with a message property or fallback to string
        let msg: string;
        if (hasMessage(error)) msg = error.message;
        else msg = String(error);
        const missingColMatch = String(msg).match(/Could not find the '([^']+)' column of 'profiles'/i);
        if (missingColMatch && missingColMatch[1]) {
          const colName = missingColMatch[1];
          if (colName in payload) {
            // remove the offending key, record it and retry
            delete payload[colName];
            skippedCols.push(colName);
            // continue loop to retry
            continue;
          }
        }

        // Not a recoverable missing-column error we can handle; break and return the error
        break;
      }

  if (resultData == null) return { error: lastError ?? 'update-failed' };

  store.profile = resultData as UserProfile;
  localStorage.setItem('userProfile', JSON.stringify(store.profile));
  notify();
  return { data: store.profile, skipped: skippedCols.length ? skippedCols : undefined };
    } catch (err) {
      return { error: err };
    }
  };


  return {
    user: state.user,
    session: state.session,
    profile: state.profile,
    loading: state.loading,
    signInWithGoogle,
    signOut,
    isAdmin: state.profile?.role === 'admin',
    isAuthenticated: !!state.user,
    updateProfile,
  };
}