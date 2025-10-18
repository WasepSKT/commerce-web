/* eslint-disable @typescript-eslint/no-explicit-any */
// Vercel serverless function to verify Turnstile token and proxy login to Supabase
import { isRateLimited, getRequestIp } from './_lib/rateLimit';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { email, password, token } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

  // Rate limit: 5 requests per IP per minute for login
  try {
    const ip = getRequestIp(req);
    const key = `login:${ip}`;
    if (isRateLimited(key, 5, 60 * 1000)) return res.status(429).json({ message: 'Too many requests' });
  } catch (e) {
    // if rate limiter fails, log and continue (don't block legit users)
    console.warn('Rate limiter failed', e);
  }

  // Verify Turnstile
  if (!process.env.TURNSTILE_SECRET) {
    console.error('TURNSTILE_SECRET not set');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  if (token) {
    try {
      const params = new URLSearchParams();
      params.append('secret', process.env.TURNSTILE_SECRET);
      params.append('response', token);
      const vres = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: params });
      const vjson = await vres.json();
      if (!vjson.success) return res.status(403).json({ message: 'Turnstile verification failed', details: vjson });
    } catch (err) {
      console.error('Turnstile verify error', err);
      return res.status(502).json({ message: 'Turnstile verification error' });
    }
  } else {
    return res.status(400).json({ message: 'Missing Turnstile token' });
  }

  // Proxy login to Supabase using service role key
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('Supabase config missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        apiKey: SUPABASE_SERVICE_ROLE,
      },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json(j);

    // Set refresh token as HttpOnly cookie
    const refreshToken = j.refresh_token;
    if (refreshToken) {
      const maxAge = 60 * 60 * 24 * 30; // 30 days
      const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
      res.setHeader('Set-Cookie', `sb_refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=${maxAge}; ${secureFlag} SameSite=Lax`);
    }

    // Return minimal session info
    return res.status(200).json({ access_token: j.access_token, expires_in: j.expires_in, token_type: j.token_type });
  } catch (err) {
    console.error('Supabase login proxy failed', err);
    return res.status(502).json({ message: 'Auth proxy failed' });
  }
}
