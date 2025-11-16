import { useEffect, useMemo, useRef } from 'react';
import type { TurnstileAPI, TurnstileWidgetSize } from '@/types/turnstile';
import { resolveTurnstileSitekey, isLocalHost } from '@/utils/env';

export const useTurnstile = () => {
  // Read from environment variable with fallback
  const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || 
                            import.meta.env.VITE_TURNSTILE_SITEKEY_DEV || 
                            null;

  const hostname = window.location.hostname;
  const sitekey = useMemo(() => resolveTurnstileSitekey(hostname), [hostname]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | string | null>(null);

  // Load script and render widget
  useEffect(() => {
    if (!sitekey) return;
    let cancelled = false;

    const ensureScript = (() => {
      let promise: Promise<void> | null = null;
      return () => {
        if (promise) return promise;
        promise = new Promise<void>((resolve, reject) => {
          if ((window as Window & { turnstile?: TurnstileAPI }).turnstile) return resolve();
          const existing = document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
          if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Gagal memuat Turnstile script')));
            return;
          }
          const s = document.createElement('script');
          s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
          s.async = true;
          s.defer = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Gagal memuat Turnstile script'));
          document.head.appendChild(s);
        });
        return promise;
      };
    })();

    const render = async () => {
      try {
        await ensureScript();
        if (cancelled) return;
        const win = window as Window & { turnstile?: TurnstileAPI };
        const tryRender = () => {
          if (cancelled) return;
          if (!win.turnstile) return;
          const el = containerRef.current;
          if (!el) {
            // wait for the container to mount
            requestAnimationFrame(tryRender);
            return;
          }
          const id = win.turnstile.render(el, { 
            sitekey, 
            size: 'flexible', 
            theme: 'light',
            callback: (token: string) => {
              // Call the global callback if it exists
              const globalCallback = (window as Window & { onTurnstileSuccess?: (token: string) => void }).onTurnstileSuccess;
              if (typeof globalCallback === 'function') {
                globalCallback(token);
              }
            }
          });
          widgetIdRef.current = typeof id === 'number' || typeof id === 'string' ? id : null;
        };
        tryRender();
      } catch (_e) {
        // ignore
      }
    };

    void render();
    return () => { cancelled = true; };
  }, [sitekey]);

  const execute = async (timeoutMs = 8000): Promise<string | null> => {
    if (!sitekey) return null;
    const win = window as Window & { turnstile?: TurnstileAPI };
    const wid = widgetIdRef.current;
    if (!win.turnstile || wid == null) return null;
    return await new Promise<string | null>((resolve) => {
      let finished = false;
      const finish = (val: string | null) => { if (!finished) { finished = true; resolve(val); } };
      const timer = window.setTimeout(() => { 
        try { 
          win.turnstile?.reset(wid); 
        } catch {
          // Ignore reset errors
        } 
        finish(null); 
      }, timeoutMs);
      const tryExec = () => {
        try { win.turnstile!.execute(wid); }
        catch { 
          try { 
            win.turnstile!.reset(wid); 
          } catch {
            // Ignore reset errors
          } 
          setTimeout(() => { 
            try { 
              win.turnstile!.execute(wid); 
            } catch { 
              finish(null); 
            } 
          }, 300); 
        }
      };
      tryExec();
      const poll = () => {
        try {
          const resp = win.turnstile?.getResponse ? win.turnstile.getResponse(wid) : null;
          if (resp) { window.clearTimeout(timer); finish(String(resp)); return; }
        } catch {
          // Ignore getResponse errors
        }
        if (!finished) requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });
  };

  return { sitekey, containerRef, execute };
}


