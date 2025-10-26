import { Request, Response } from 'express';
import { getJubelioClient } from '../clients/jubelioClient';
import { config } from '../config';

export async function searchRegions(req: Request, res: Response) {
  try {
    if (!config.shipping.jubelio.apiBaseUrl) return res.status(501).json({ error: 'Shipping not configured' });
    // Disabled to prevent huge provider responses causing OOM.
    // Use hierarchical endpoints instead.
    return res.status(400).json({
      error: 'Region search is disabled. Use hierarchical endpoints: /api/region/provinces -> /api/region/cities/:province_id -> /api/region/districts/:city_id -> /api/region/areas/:district_id'
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[searchRegions] error:', e?.message || err);
    return res.status(400).json({ error: e?.message || 'Invalid request' });
  }
}

export async function getProvinces(_req: Request, res: Response) {
  try {
    if (!config.shipping.jubelio.apiBaseUrl) return res.status(501).json({ error: 'Shipping not configured' });
    const client = getJubelioClient();
    const { data } = await client.get('/region/provinces');
    return res.json(Array.isArray(data) ? data : []);
  } catch (_err) {
    return res.status(400).json({ error: 'Invalid request' });
  }
}

export async function getCities(req: Request, res: Response) {
  try {
    if (!config.shipping.jubelio.apiBaseUrl) return res.status(501).json({ error: 'Shipping not configured' });
    const { province_id } = req.params;
    const client = getJubelioClient();
    const { data } = await client.get(`/region/cities/${encodeURIComponent(province_id)}`);
    return res.json(Array.isArray(data) ? data : []);
  } catch (_err) {
    return res.status(400).json({ error: 'Invalid request' });
  }
}

export async function getDistricts(req: Request, res: Response) {
  try {
    if (!config.shipping.jubelio.apiBaseUrl) return res.status(501).json({ error: 'Shipping not configured' });
    const { city_id } = req.params;
    const client = getJubelioClient();
    const { data } = await client.get(`/region/districts/${encodeURIComponent(city_id)}`);
    return res.json(Array.isArray(data) ? data : []);
  } catch (_err) {
    return res.status(400).json({ error: 'Invalid request' });
  }
}

export async function getAreas(req: Request, res: Response) {
  try {
    if (!config.shipping.jubelio.apiBaseUrl) return res.status(501).json({ error: 'Shipping not configured' });
    const { district_id } = req.params;
    const client = getJubelioClient();
    const { data } = await client.get(`/region/areas/${encodeURIComponent(district_id)}`);
    return res.json(Array.isArray(data) ? data : []);
  } catch (_err) {
    return res.status(400).json({ error: 'Invalid request' });
  }
}
