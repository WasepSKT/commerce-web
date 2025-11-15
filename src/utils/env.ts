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
export const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'https://api-payment.regalpaw.id';
export const SERVICE_API_KEY = import.meta.env.VITE_SERVICE_API_KEY || '';

// Validate required env vars
if (!SERVICE_API_KEY) {
  console.error('❌ VITE_SERVICE_API_KEY is not set');
}


