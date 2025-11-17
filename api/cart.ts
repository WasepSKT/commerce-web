/* eslint-disable @typescript-eslint/no-explicit-any */
// Serverless endpoint to manage authenticated user's cart in Supabase
// Expects the client to send Authorization: Bearer <access_token>
import { isRateLimited, getRequestIp } from './_lib/rateLimit';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getUserFromToken(accessToken: string) {
  const url = `${SUPABASE_URL}/auth/v1/user`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return null;
  return r.json();
}

async function fetchServerCart(userId: string) {
  const url = `${SUPABASE_URL}/rest/v1/carts?user_id=eq.${userId}`;
  const r = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE as string,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      Accept: 'application/json',
    },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function fetchUserProfile(userId: string) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=id,user_id,role`;
  const r = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE as string,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      Accept: 'application/json',
    },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function upsertCart(userId: string, items: any[]) {
  const url = `${SUPABASE_URL}/rest/v1/carts`;
  const payload = [{ user_id: userId, items, updated_at: new Date().toISOString() }];
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE as string,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Upsert failed: ${r.status} ${text}`);
  }
  const json = await r.json();
  return Array.isArray(json) && json.length ? json[0] : null;
}

export default async function handler(req: any, res: any) {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Supabase server config missing');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  try {
    // simple rate limit per IP for cart endpoints
    const ip = getRequestIp(req);
    const key = `cart:${ip}`;
    if (isRateLimited(key, 60, 1000 * 60)) return res.status(429).json({ message: 'Too many requests' });
  } catch (e) {
    // continue if rate limiter fails
  }

  const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing access token' });
  const accessToken = authHeader.split(' ')[1];

  const user = await getUserFromToken(accessToken).catch(() => null);
  if (!user || !user.id) return res.status(401).json({ message: 'Invalid token' });
  const userId = user.id as string;

  // fetch user's profile (to check role)
  const profile = await fetchUserProfile(userId).catch(() => null);

  try {
    if (req.method === 'GET') {
      const cart = await fetchServerCart(userId);
      return res.status(200).json(cart ?? { items: [] });
    }

    if (req.method === 'POST') {
      // Only authenticated users with role 'customer' can add/replace cart
      if (!profile || profile.role !== 'customer') return res.status(403).json({ message: 'Forbidden: only customers may modify cart' });
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const saved = await upsertCart(userId, items);
      return res.status(200).json(saved ?? { items: [] });
    }

    if (req.method === 'PATCH') {
      // Only authenticated customers can patch cart
      if (!profile || profile.role !== 'customer') return res.status(403).json({ message: 'Forbidden: only customers may modify cart' });
      const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
      const serverCart = (await fetchServerCart(userId)) ?? { items: [] };
      const serverItems = Array.isArray(serverCart.items) ? serverCart.items : [];

      // merge by product_id: sum quantities
      const map: Record<string, number> = {};
      for (const it of serverItems) map[it.product_id] = (map[it.product_id] || 0) + (it.quantity || 0);
      for (const it of incoming) map[it.product_id] = (map[it.product_id] || 0) + (it.quantity || 0);

      const merged = Object.entries(map).map(([product_id, quantity]) => ({ product_id, quantity }));
      const saved = await upsertCart(userId, merged);
      return res.status(200).json(saved ?? { items: [] });
    }

    if (req.method === 'DELETE') {
      // Only authenticated customers can delete/modify cart
      if (!profile || profile.role !== 'customer') return res.status(403).json({ message: 'Forbidden: only customers may modify cart' });
      // If query param product_id is provided, remove that item; otherwise delete whole cart
      const productId = req.query?.product_id || req.body?.product_id;
      if (productId) {
        const serverCart = (await fetchServerCart(userId)) ?? { items: [] };
        const serverItems = Array.isArray(serverCart.items) ? serverCart.items : [];
        const filtered = serverItems.filter((it: any) => String(it.product_id) !== String(productId));
        const saved = await upsertCart(userId, filtered);
        return res.status(200).json(saved ?? { items: [] });
      }

      // delete entire cart
      const url = `${SUPABASE_URL}/rest/v1/carts?user_id=eq.${userId}`;
      const r = await fetch(url, { method: 'DELETE', headers: { apikey: SERVICE_ROLE as string, Authorization: `Bearer ${SERVICE_ROLE}` } });
      if (!r.ok) return res.status(r.status).json({ message: 'Delete failed' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (err) {
    console.error('api/cart error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
