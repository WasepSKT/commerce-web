export function resolveTurnstileSitekey(hostname: string): string {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const skipLocal = String(env.VITE_TURNSTILE_SKIP_LOCAL ?? '').toLowerCase() === 'true';

  // Try direct key first
  const direct = (env.VITE_TURNSTILE_SITEKEY as string) || '';
  if (direct && direct.trim() !== '') return direct;

  // Localhost behavior is configurable: skip when flag is true; otherwise try dev/stg keys
  if (isLocalhost) {
    if (skipLocal) {
      console.log('ℹ️ Skipping Turnstile on localhost');
      return '';
    }
    const devLocal = env.VITE_TURNSTILE_SITEKEY_DEV as string | undefined;
    if (devLocal && devLocal.trim() !== '') return devLocal;
    const stgLocal = env.VITE_TURNSTILE_SITEKEY_STG as string | undefined;
    if (stgLocal && stgLocal.trim() !== '') return stgLocal;
    return '';
  }

  const isProdDomain = hostname === 'regalpaw.id' || hostname === 'www.regalpaw.id';
  const isDevDomain = hostname.includes('dev.') || hostname.includes('staging');

  if (isProdDomain) {
    const prod = env.VITE_TURNSTILE_SITEKEY_PROD as string | undefined;
    if (prod && prod.trim() !== '') return prod;
  }

  if (isDevDomain) {
    const dev = env.VITE_TURNSTILE_SITEKEY_DEV as string | undefined;
    if (dev && dev.trim() !== '') return dev;
    const stg = env.VITE_TURNSTILE_SITEKEY_STG as string | undefined;
    if (stg && stg.trim() !== '') return stg;
  }

  return '';
}

export function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const currentEnv = import.meta.env.MODE; // 'development' atau 'production'

// Payment API Configuration
const _env = import.meta.env as Record<string, string | boolean | undefined>;

// Resolve service base URL preference order:
// 1. VITE_SERVICE_API_URL (explicit)
// 2. VITE_SERVICE_API_URL_PROD / _STG / _DEV (per-env secrets)
// 3. fallback to known production host
const rawServiceUrl = (_env.VITE_SERVICE_API_URL as string)
  || (_env.VITE_SERVICE_API_URL_PROD as string)
  || (_env.VITE_SERVICE_API_URL_STG as string)
  || (_env.VITE_SERVICE_API_URL_DEV as string)
  || '';

export const SERVICE_BASE_URL = (rawServiceUrl || 'https://api.regalpaw.id').replace(/\/+$/, '');

// For backward compatibility, keep PAYMENT_API_URL but point it at the unified service base
export const PAYMENT_API_URL = SERVICE_BASE_URL;
export const SERVICE_API_KEY = import.meta.env.VITE_SERVICE_API_KEY || '';

// Supabase + API config (shared antara client-side services)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const PUBLIC_API_BASE_URL = (import.meta.env.VITE_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

// Validate required env vars
if (!SERVICE_API_KEY && import.meta.env.PROD) {
  console.warn('⚠️ VITE_SERVICE_API_KEY is not set in production');
}


