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
  role: 'admin' | 'customer';
  referral_code: string;
  referred_by: string | null;
  reward_points?: number;
  updated_at?: string | null;
}

export type UpdateProfileResult =
  | { data: UserProfile }
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
    // Prefer an explicit Vite env var (set this in Vercel) so deployed apps
    // won't accidentally use a local origin. Fallback to runtime origin.
    const redirectUrl = (import.meta.env.VITE_APP_URL as string | undefined) ?? `${window.location.origin}/`;
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
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', store.profile.id).select('*').single();
      if (error) return { error };
      store.profile = data as UserProfile;
      localStorage.setItem('userProfile', JSON.stringify(store.profile));
      notify();
      return { data: store.profile };
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