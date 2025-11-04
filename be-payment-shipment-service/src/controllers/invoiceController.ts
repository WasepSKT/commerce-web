import type { Request, Response } from 'express';
import type { AxiosError } from 'axios';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import { createInvoiceService, getInvoiceService } from '../services/invoiceService';
import { supabase } from '../clients/supabaseClient';
import { config } from '../config';

const CreateInvoiceSchema = z.object({
  external_id: z.string().min(1),
  amount: z.number().int().positive(),
  description: z.string().optional(),
  payer_email: z.string().email().optional(),
  success_redirect_url: z.string().url().optional(),
  failure_redirect_url: z.string().url().optional(),
  invoice_duration: z.number().int().positive().optional(),
  currency: z.literal('IDR').optional(),
});

function extractHttpError(err: unknown): { status: number; body: unknown } {
  if (isAxiosError(err)) {
    const e = err as AxiosError;
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    return { status, body };
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  return { status: 500, body: { message } };
}

export async function createInvoice(req: Request, res: Response) {
  const parsed = CreateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const inv = await createInvoiceService(parsed.data);
    return res.status(201).json(inv);
  } catch (err: unknown) {
    const { status, body } = extractHttpError(err);
    return res.status(status).json({ error: body || 'Failed to create invoice' });
  }
}

export async function getInvoice(req: Request, res: Response) {
  try {
    const inv = await getInvoiceService(req.params.id);
    return res.json(inv);
  } catch (err: unknown) {
    const { status, body } = extractHttpError(err);
    return res.status(status).json({ error: body || 'Failed to fetch invoice' });
  }
}

export async function xenditWebhook(req: Request, res: Response) {
  const token = req.header('x-callback-token');
  if (token !== config.xendit.webhookToken) return res.status(401).json({ error: 'Invalid webhook token' });
  try {
    if (!supabase) return res.status(501).json({ error: 'DB not configured' });
    const payload = req.body as Record<string, unknown>;
    const headers = req.headers as Record<string, unknown>;
    const nowIso = new Date().toISOString();

    const extId = String(payload?.['id'] ?? payload?.['external_id'] ?? '');
    const status = String(payload?.['status'] ?? '').toUpperCase();
    const amount = Number(payload?.['amount'] ?? 0);
    const invoiceUrl = String(payload?.['invoice_url'] ?? '');
    const orderIdFromExternal = String(payload?.['external_id'] ?? '').replace(/^order-/, '');

    // Attempt to infer method/channel from payloads across products
    const paymentMethod = String(
      payload?.['payment_method'] ??
      payload?.['payment_method_type'] ??
      payload?.['payment_method_category'] ??
      payload?.['type'] ?? ''
    ).toUpperCase() || null;
    const paymentChannel = String(
      (payload as Record<string, unknown>)?.['payment_channel'] ??
      (payload as Record<string, unknown>)?.['bank_code'] ??
      (payload as Record<string, unknown>)?.['ewallet_type'] ??
      (payload as Record<string, unknown>)?.['retail_outlet_name'] ?? ''
    ).toUpperCase() || null;

    // Failure codes/messages if provided
    const failureCode = String((payload as Record<string, unknown>)?.['failure_code'] ?? '').toUpperCase() || null;
    const failureMessage = String((payload as Record<string, unknown>)?.['failure_message'] ?? '') || null;

    // Upsert payment by session_id (invoice id) or external_id
    let paymentId: string | null = null;
    if (extId) {
      // Try find existing payment by session_id or external external_id
      const { data: existing } = await supabase.from('payments').select('id, order_id').or(`session_id.eq.${extId},id.eq.${extId}`).limit(1).single();
      if (existing?.id) paymentId = String(existing.id);
    }

    if (!paymentId) {
      // Insert payment row (best-effort) using external clues
      const insertRes = await supabase.from('payments').insert([
        {
          order_id: orderIdFromExternal ? orderIdFromExternal : null,
          provider: 'xendit',
          session_id: extId || null,
          amount: isFinite(amount) ? amount : null,
          currency: 'IDR',
          status: status || null,
          invoice_url: invoiceUrl || null,
          payment_method: paymentMethod,
          payment_channel: paymentChannel,
          failure_code: failureCode,
          failure_message: failureMessage,
          webhook_received_at: nowIso,
          webhook_headers: headers || null,
          paid_at: (status === 'PAID' || status === 'SETTLED') ? nowIso : null,
          expired_at: (status === 'EXPIRED') ? nowIso : null,
          failed_at: (status === 'FAILED') ? nowIso : null,
        }
      ]).select('id').single();
      if (insertRes.data?.id) paymentId = String(insertRes.data.id);
    } else {
      // Update status/amount/url
      await supabase.from('payments').update({
        status,
        amount: isFinite(amount) ? amount : null,
        invoice_url: invoiceUrl || null,
        payment_method: paymentMethod,
        payment_channel: paymentChannel,
        failure_code: failureCode,
        failure_message: failureMessage,
        webhook_received_at: nowIso,
        webhook_headers: headers || null,
        paid_at: (status === 'PAID' || status === 'SETTLED') ? nowIso : null,
        expired_at: (status === 'EXPIRED') ? nowIso : null,
        failed_at: (status === 'FAILED') ? nowIso : null,
      }).eq('id', paymentId);
    }

    // Insert payment_event idempotently by external id if available
    if (paymentId) {
      try {
        await supabase.from('payment_events').insert([
          {
            payment_id: paymentId,
            event_type: status,
            external_id: extId || null,
            payload,
            received_at: nowIso,
            headers,
          }
        ]).select().single();
      } catch {
        // ignore duplicates on external_id
      }

      // Update order status when paid/settled
      if (status === 'PAID' || status === 'SETTLED') {
        if (orderIdFromExternal) {
          await supabase.from('orders').update({ status: 'paid' }).eq('id', orderIdFromExternal);
        }
      }
      if (status === 'EXPIRED' || status === 'FAILED') {
        if (orderIdFromExternal) {
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderIdFromExternal);
        }
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('xenditWebhook error', err);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
}
