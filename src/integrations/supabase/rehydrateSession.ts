import { supabase } from './client';

export async function rehydrateSupabaseSession(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    const authKey = Object.keys(localStorage).find(k => /sb-.*-auth-token/.test(k));
    if (!authKey) return false;
    const raw = localStorage.getItem(authKey);
    if (!raw) return false;
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch (e) { return false; }
    const cs = parsed.currentSession || parsed.current_session || parsed;
    const access = cs?.access_token ?? cs?.accessToken ?? null;
    const refresh = cs?.refresh_token ?? cs?.refreshToken ?? null;
    if (!access) return false;
    // @ts-ignore setSession exists on supabase client
    await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    return true;
  } catch (e) {
    // swallow errors — rehydration is a best-effort helper
    // eslint-disable-next-line no-console
    console.warn('[rehydrateSupabaseSession] failed', e);
    return false;
  }
}
