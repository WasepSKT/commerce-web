import { Request, Response } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { supabase } from '../clients/supabaseClient';
import { createShipment, getRates } from '../services/shippingService';

const addressSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address1: z.string(),
  address2: z.string().optional(),
  city: z.string(),
  province: z.string().optional(),
  postal_code: z.string(),
  country: z.string().optional(),
});

const parcelSchema = z.object({
  weight_gram: z.number().int().positive(),
  length_cm: z.number().positive().optional(),
  width_cm: z.number().positive().optional(),
  height_cm: z.number().positive().optional(),
  value_idr: z.number().positive().optional(),
});

const ratesSchema = z.object({
  origin: addressSchema,
  destination: addressSchema,
  parcel: parcelSchema,
  carriers: z.array(z.string()).optional(),
});

export async function getShippingRates(req: Request, res: Response) {
  try {
    const payload = ratesSchema.parse(req.body);
    const rates = await getRates(payload);
    return res.json({ rates });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    const status = e?.status || 400;
    console.error('[getShippingRates] error:', e?.message || err);
    return res.status(status).json({ error: e?.message || 'Invalid request' });
  }
}

const createShipmentSchema = z.object({
  order_id: z.string(),
  origin: addressSchema,
  destination: addressSchema,
  parcel: parcelSchema,
  carrier: z.string(),
  service: z.string(),
  notes: z.string().optional(),
});

export async function createShipping(req: Request, res: Response) {
  try {
    const payload = createShipmentSchema.parse(req.body);
    const shipment = await createShipment(payload);
    return res.json({ shipment });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    const status = e?.status || 400;
    console.error('[createShipping] error:', e?.message || err);
    return res.status(status).json({ error: e?.message || 'Invalid request' });
  }
}

export async function jubelioWebhook(req: Request, res: Response) {
  try {
    const token = req.header('x-webhook-token') || req.header('x-callback-token');
    if (!config.shipping.jubelio.webhookToken) return res.status(501).json({ error: 'Shipping not configured' });
    if (!token || token !== config.shipping.jubelio.webhookToken) {
      return res.status(401).json({ error: 'Invalid webhook token' });
    }
    // Persist event and update orders table
    if (!supabase) return res.status(501).json({ error: 'DB not configured' });
    const body = req.body as Record<string, unknown>;
    const externalId = String(body?.['shipment_id'] ?? body?.['awb'] ?? '');
    const awb = String(body?.['awb'] ?? '');
    const courier = String(body?.['carrier'] ?? body?.['courier'] ?? '');
    const status = String(body?.['status'] ?? '').toUpperCase();
    const orderId = String(body?.['order_id'] ?? '').trim();

    // Find or create shipment row
    let shipmentId: string | null = null;
    if (awb) {
      const { data: existing } = await supabase.from('shipments').select('id, order_id').or(`awb.eq.${awb},id.eq.${externalId}`).limit(1).single();
      if (existing?.id) shipmentId = String(existing.id);
    }
    if (!shipmentId) {
      const insertRes = await supabase.from('shipments').insert([
        {
          order_id: orderId || null,
          courier_name: courier || null,
          awb: awb || null,
          status: status || null,
        }
      ]).select('id').single();
      if (insertRes.data?.id) shipmentId = String(insertRes.data.id);
    } else {
      await supabase.from('shipments').update({ courier_name: courier || null, awb: awb || null, status: status || null }).eq('id', shipmentId);
    }

    if (shipmentId) {
      try {
        await supabase.from('shipment_events').insert([
          {
            shipment_id: shipmentId,
            status,
            status_detail: String(body?.['status_detail'] ?? ''),
            external_id: externalId || null,
            payload: body,
          }
        ]).select().single();
      } catch {
        // ignore duplicate external_id or other idempotency errors
      }

      // Update order shipping fields
      if (orderId) {
        const nextStatus = status === 'DELIVERED' ? 'completed' : status === 'CANCELLED' ? 'cancelled' : 'shipped';
        await supabase.from('orders').update({ status: nextStatus, shipping_courier: courier || null, tracking_number: awb || null }).eq('id', orderId);
      }
    }

    return res.json({ ok: true });
  } catch (_err: unknown) {
    return res.status(400).json({ error: 'Invalid request' });
  }
}

// Frontend-compat handlers
// GET /api/shipping/rates?to_postal=...&weight=...&origin_postal=...
export async function getShippingRatesLegacy(req: Request, res: Response) {
  try {
    if (!config.shipping.jubelio.apiBaseUrl) return res.status(501).json({ error: 'Shipping not configured' });
    const to_postal = String(req.query.to_postal || '');
    const weight = Number(req.query.weight || 0) || 1;
    const origin_postal = String(req.query.origin_postal || config.shipping.jubelio.originZipcode || '');
    const rates = await getRates({
      origin: {
        address1: config.shipping.jubelio.originAddress,
        postal_code: origin_postal,
        city: '',
        email: config.shipping.jubelio.originEmail,
        name: config.shipping.jubelio.originName,
        phone: config.shipping.jubelio.originPhone,
      },
      destination: {
        address1: '',
        postal_code: to_postal,
        city: '',
      },
      parcel: { weight_gram: weight },
    });
    // Return array directly as FE expects
    const arr = rates.map(r => ({
      provider: r.carrier,
      service_code: r.service,
      service_name: r.service,
      cost: r.price_idr,
      etd: r.etd_days ? `${r.etd_days} hari` : undefined,
      currency: r.currency || 'IDR',
    }));
    return res.status(200).json(arr);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    const status = e?.status || 400;
    console.error('[getShippingRatesLegacy] error:', e?.message || err);
    return res.status(status).json({ error: e?.message || 'Invalid request' });
  }
}

// POST /api/shipping/create-shipment { order_id, provider, service_code, address, parcels }
export async function createShippingLegacy(req: Request, res: Response) {
  try {
    if (!config.shipping.jubelio.apiBaseUrl) return res.status(501).json({ error: 'Shipping not configured' });
    type LegacyParcel = { weight_gram?: number; length_cm?: number; width_cm?: number; height_cm?: number; value_idr?: number };
  type LegacyAddress = { address1?: string; postal_code?: string; city?: string; name?: string; phone?: string; email?: string; area_id?: string };
    type LegacyBody = { order_id: string; provider: string; service_code: string; address?: LegacyAddress; parcels?: LegacyParcel[] };
    const body = req.body as LegacyBody;
    type DestWithArea = {
      address1: string;
      postal_code: string;
      city: string;
      name?: string;
      phone?: string;
      email?: string;
      area_id?: string;
    };
    const dest: DestWithArea = {
      address1: String(body.address?.address1 || ''),
      postal_code: String(body.address?.postal_code || ''),
      city: String(body.address?.city || ''),
      name: String(body.address?.name || ''),
      phone: String(body.address?.phone || ''),
      email: String(body.address?.email || ''),
    };
    if (body.address?.area_id) dest.area_id = String(body.address.area_id);

    // Guard: common mistake is passing origin area_id as destination area_id
    {
      const originArea = String(config.shipping.jubelio.originAreaId || '');
      if (dest.area_id && originArea && dest.area_id === originArea) {
        return res.status(400).json({
          error: 'Invalid destination area_id: same as origin. Please provide the destination area_id from /api/region/areas/{district_id}.',
        });
      }
    }

    const shipment = await createShipment({
      order_id: body.order_id,
      carrier: body.provider,
      service: body.service_code,
      origin: {
        address1: config.shipping.jubelio.originAddress,
        postal_code: config.shipping.jubelio.originZipcode,
        city: '',
        email: config.shipping.jubelio.originEmail,
        name: config.shipping.jubelio.originName,
        phone: config.shipping.jubelio.originPhone,
      },
      destination: dest,
      parcel: {
        weight_gram: Number(body.parcels?.[0]?.weight_gram || 1000),
        length_cm: Number(body.parcels?.[0]?.length_cm || 10),
        width_cm: Number(body.parcels?.[0]?.width_cm || 10),
        height_cm: Number(body.parcels?.[0]?.height_cm || 10),
        value_idr: Number(body.parcels?.[0]?.value_idr || 0),
      },
    });
    return res.status(200).json({ shipment_id: shipment.id, tracking_number: shipment.tracking_number, raw: shipment });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    const status = e?.status || 400;
    console.error('[createShippingLegacy] error:', e?.message || err);
    return res.status(status).json({ error: e?.message || 'Invalid request' });
  }
}
