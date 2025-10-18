/* eslint-disable @typescript-eslint/no-explicit-any */
// Simple in-memory rate limiter for small deployments/dev.
// Keyed by string (usually IP + route). Not suitable for multi-instance production.

type Entry = { count: number; firstSeen: number };
const store = new Map<string, Entry>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const e = store.get(key);
  if (!e) {
    store.set(key, { count: 1, firstSeen: now });
    return false;
  }

  if (now - e.firstSeen > windowMs) {
    // window expired, reset
    store.set(key, { count: 1, firstSeen: now });
    return false;
  }

  if (e.count >= limit) return true;
  e.count += 1;
  return false;
}

export function getRequestIp(req: any): string {
  const xf = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

// periodic cleanup to avoid memory leak for very long running processes
setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60; // 1 hour
  for (const [k, v] of store) if (v.firstSeen < cutoff) store.delete(k);
}, 1000 * 60 * 30);
