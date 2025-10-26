export interface CreateSessionResult {
  provider: string;
  session_id?: string;
  checkout_url?: string;
  // Some payment providers (or our server) may return `url` instead of `checkout_url`.
  // Accept both to be flexible at the call sites.
  url?: string;
}

// The payment endpoint accepts either an `order_id` (existing server order) or
// a full `order` payload when running in dry-run/test mode so the frontend
// can create a payment session without persisting database rows.
export type CreatePaymentPayload =
  | { order_id: string; return_url?: string; payment_method?: string; test?: boolean }
  | { order?: unknown; return_url?: string; payment_method?: string; test: true };

export async function createPaymentSession(payload: CreatePaymentPayload): Promise<CreateSessionResult> {
  try {
  const base = (import.meta.env && (import.meta.env as Record<string, string>)["VITE_PAYMENT_API_URL"]) as string | undefined;
    const endpoint = (base ? `${base.replace(/\/$/, '')}` : '') + `/api/payments/create-session`;
    const res = await fetch(endpoint || '/api/payments/create-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Failed to create payment session (${res.status})`);
    }

    const json = await res.json();
    return json as CreateSessionResult;
  } catch (err) {
    console.error('createPaymentSession error', err);
    throw err;
  }
}

export default { createPaymentSession };
