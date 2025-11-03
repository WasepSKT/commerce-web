/**
 * Turnstile debug utilities (for development/debugging only)
 */

/**
 * Log Turnstile configuration for debugging
 */
export function logTurnstileDebug(sitekey: string | undefined) {
  if (import.meta.env.DEV) {
    const env = import.meta.env as Record<string, string | boolean | undefined>;
    console.log('🔧 Turnstile Debug Info:', {
      sitekey,
      hasSitekey: !!sitekey,
      sitekeyLength: sitekey?.length || 0,
      env_available: {
        direct: typeof env.VITE_TURNSTILE_SITEKEY === 'string' ? '✅' : '❌',
        dev: typeof env.VITE_TURNSTILE_SITEKEY_DEV === 'string' ? '✅' : '❌',
        stg: typeof env.VITE_TURNSTILE_SITEKEY_STG === 'string' ? '✅' : '❌',
        prod: typeof env.VITE_TURNSTILE_SITEKEY_PROD === 'string' ? '✅' : '❌',
      },
    });
  }
}

