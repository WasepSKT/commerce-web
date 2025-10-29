export function resolveTurnstileSitekey(hostname: string): string {
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Skip Turnstile on localhost to avoid errors
  if (isLocalhost) {
    console.log('ℹ️ Skipping Turnstile on localhost');
    return '';
  }

  const env = import.meta.env as Record<string, string | boolean | undefined>;

  // Try direct key first
  const direct = (env.VITE_TURNSTILE_SITEKEY as string) || '';
  if (direct && direct.trim() !== '') return direct;

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


