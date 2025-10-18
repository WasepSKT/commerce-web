/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRateLimited, getRequestIp } from './_lib/rateLimit';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('Supabase config missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  // Rate limit: 20 requests per IP per minute for refresh
  try {
    const ip = getRequestIp(req);
    const key = `refresh:${ip}`;
    if (isRateLimited(key, 20, 60 * 1000)) return res.status(429).json({ message: 'Too many requests' });
  } catch (e) {
    console.warn('Rate limiter failed', e);
  }

  // read refresh token from cookie
  const cookieHeader = req.headers?.cookie ?? '';
  const match = cookieHeader.match(/sb_refresh_token=([^;]+)/);
  const refreshToken = match ? match[1] : null;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        apiKey: SUPABASE_SERVICE_ROLE,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json(j);

    // rotate refresh token cookie if present
    if (j.refresh_token) {
      const maxAge = 60 * 60 * 24 * 30;
      const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
      res.setHeader('Set-Cookie', `sb_refresh_token=${j.refresh_token}; HttpOnly; Path=/; Max-Age=${maxAge}; ${secureFlag} SameSite=Lax`);
    }

    return res.status(200).json({ access_token: j.access_token, expires_in: j.expires_in, token_type: j.token_type });
  } catch (err) {
    console.error('Supabase refresh proxy failed', err);
    return res.status(502).json({ message: 'Refresh proxy failed' });
  }
}
