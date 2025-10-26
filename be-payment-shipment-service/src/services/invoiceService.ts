import { xenditClient } from '../clients/xenditClient';
import type { CreateInvoicePayload, XenditInvoice } from '../types';

export async function createInvoiceService(payload: CreateInvoicePayload): Promise<XenditInvoice> {
  const { data } = await xenditClient.post('/v2/invoices', payload);
  return data as XenditInvoice;
}

export async function getInvoiceService(id: string): Promise<XenditInvoice> {
  const { data } = await xenditClient.get(`/v2/invoices/${id}`);
  return data as XenditInvoice;
}
