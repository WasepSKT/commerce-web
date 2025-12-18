/* eslint-disable @typescript-eslint/no-explicit-any */
// Serverless endpoint to decrement stock for an order using Supabase service role.
// Expects: POST { order_id: string } with Authorization: Bearer <access_token>

import { getRequestIp, isRateLimited } from '../_lib/rateLimit.js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getUserFromToken(accessToken: string) {
  const url = `${SUPABASE_URL}/auth/v1/user`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return null;
  return r.json();
}

async function fetchOrderById(orderId: string) {
  const url = `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,user_id`;
  const r = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE as string,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      Accept: 'application/json',
    },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return Array.isArray(data) && data.length ? data[0] : null;
}

export default async function handler(req: any, res: any) {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Supabase server config missing');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  try {
    const ip = getRequestIp(req);
    const key = `decrement-stock:${ip}`;
    if (isRateLimited(key, 10, 1000 * 60)) return res.status(429).json({ message: 'Too many requests' });
  } catch (e) {
    // ignore rate limiter failures
  }

  const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing access token' });
  const accessToken = authHeader.split(' ')[1];

  const user = await getUserFromToken(accessToken).catch(() => null);
  if (!user || !user.id) return res.status(401).json({ message: 'Invalid token' });

  const orderId = req.body?.order_id || req.query?.order_id;
  if (!orderId) return res.status(400).json({ message: 'Missing order_id' });

  try {
    // Verify order belongs to user
    const order = await fetchOrderById(orderId as string);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.user_id) !== String(user.id)) return res.status(403).json({ message: 'Forbidden' });

    // Call RPC to decrement stock
    const rpcUrl = `${SUPABASE_URL}/rpc/decrement_stock_for_order`;
    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE as string,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId }),
    });

    if (!rpcRes.ok) {
      const text = await rpcRes.text().catch(() => 'RPC error');
      console.error('decrement_stock_for_order failed', rpcRes.status, text);
      return res.status(500).json({ message: 'Failed to decrement stock', detail: text });
    }

    const data = await rpcRes.json().catch(() => null);
    return res.status(200).json(data ?? { ok: true });
  } catch (err) {
    console.error('api/orders/decrement-stock error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
