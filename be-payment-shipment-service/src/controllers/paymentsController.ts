import type { Request, Response } from 'express';
import { z } from 'zod';
import { createInvoiceService } from '../services/invoiceService';
import { supabase } from '../clients/supabaseClient';

const CreateSessionSchema = z.union([
  z.object({
    order_id: z.string().min(1),
    return_url: z.string().url().optional(),
    payment_method: z.string().optional(),
    payment_channel: z.string().optional(),
    test: z.boolean().optional(),
  }),
  z.object({
    order: z.record(z.any()).optional(),
    return_url: z.string().url().optional(),
    payment_method: z.string().optional(),
    payment_channel: z.string().optional(),
    test: z.literal(true),
  })
]);

export async function createPaymentSession(req: Request, res: Response) {
  const parsed = CreateSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let external_id = '';
  let amount = 0;
  let payer_email: string | undefined;
  let description: string | undefined;
  // Map FE-selected method/channel to Xendit invoice narrowing
  const methodInput: string | undefined = req.body?.payment_method;
  const channelInput: string | undefined = req.body?.payment_channel;
  // Xendit valid invoice payment_methods enums (subset commonly used)
  const ALLOWED_METHODS = new Set([
    'CARD',
    'BANK_TRANSFER',
    'RETAIL_OUTLET',
    'EWALLET',
    'QRIS',
    'DIRECT_DEBIT',
    'PAYLATER',
  ]);
  // Accept some friendly aliases
  const aliasMap: Record<string, string> = {
    'e-wallet': 'EWALLET',
    'ewallet': 'EWALLET',
    'wallet': 'EWALLET',
    'qris': 'QRIS',
    'bank_transfer': 'BANK_TRANSFER',
    'bank-transfer': 'BANK_TRANSFER',
  };
  let payment_methods: string[] | undefined = undefined;
  if (methodInput) {
    const upper = String(methodInput).toUpperCase();
    const mapped = aliasMap[methodInput.toLowerCase()] || upper;
    if (ALLOWED_METHODS.has(mapped)) {
      payment_methods = [mapped];
    }
    // else: ignore unrecognized values (e.g., "xendit") to allow default methods
  }
  const metadata: Record<string, unknown> = {};
  if (channelInput) metadata['channel'] = String(channelInput).toUpperCase();
  const success_redirect_url: string | undefined = req.body?.return_url;

  try {
    if ('order_id' in parsed.data && parsed.data.order_id) {
      if (!supabase) return res.status(500).json({ error: 'Server DB not configured' });
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, customer_name')
        .eq('id', parsed.data.order_id)
        .single();
      if (error || !data) return res.status(404).json({ error: 'Order not found' });
      external_id = `order-${data.id}`;
      amount = Math.max(0, Number(data.total_amount || 0));
      description = `Payment for Order ${data.id}`;
    } else {
      // test mode or dry-run from FE
      // Accept both order.total_amount and order.total as alias
      const rawTotal = (req.body?.order?.total_amount ?? req.body?.order?.total) as number | string | undefined;
      const total = rawTotal != null ? Number(rawTotal) : 0;
      external_id = `test-${Date.now()}`;
      amount = Math.max(0, Number(total));
      description = 'Test payment';
    }

    const inv = await createInvoiceService({
      external_id,
      amount,
      payer_email,
      description,
      success_redirect_url,
      currency: 'IDR',
      payment_methods,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    });

    return res.status(201).json({
      provider: 'xendit',
      session_id: inv.id,
      checkout_url: inv.invoice_url,
      url: inv.invoice_url,
    });
  } catch (err) {
    // Log richer Axios error if present for easier debugging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ax: any = err as any;
    if (ax?.response) {
      console.error('createPaymentSession failed', ax.response.status, ax.response.data);
    } else {
      console.error('createPaymentSession failed', err);
    }
    return res.status(500).json({ error: 'Failed to create payment session' });
  }
}
