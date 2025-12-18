/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRateLimited, getRequestIp } from './_lib/rateLimit.js';

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

  // Expect refresh_token in request body (client-only flow)
  const { refresh_token: refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh_token in body' });

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

    return res.status(200).json(j);
  } catch (err) {
    console.error('Supabase refresh proxy failed', err);
    return res.status(502).json({ message: 'Refresh proxy failed' });
  }
}
