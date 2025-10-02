import { supabase } from '@/integrations/supabase/client';
import { buildWhatsAppUrl } from './utils';

/** Create a pending referral purchase and redirect the buyer to WhatsApp with order details.
 * adminPhone should be in international format without + (eg '6281xxxx')
 */
export async function createPendingOrderAndRedirect(opts: {
  referrerId: string;
  referredId: string;
  amount: number;
  adminPhone: string;
  orderId?: string;
}) {
  const orderId = opts.orderId ?? `ORD_${Date.now()}`;
  const payload = {
    referrer_id: opts.referrerId,
    referred_id: opts.referredId,
    order_id: orderId,
    amount: opts.amount,
    status: 'pending',
  };

  // supabase client generated types may not include the new `referral_purchases` table yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as unknown as any)('referral_purchases').insert([payload]);
  if (error) throw error;

  const message = `Order ID: ${orderId}\nAmount: ${opts.amount}\nReferrer: ${opts.referrerId}\nPlease reply with payment confirmation and proof.`;
  const url = buildWhatsAppUrl(opts.adminPhone, message);
  // redirect the browser
  window.location.href = url;
}
