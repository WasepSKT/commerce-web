/* eslint-disable @typescript-eslint/no-explicit-any */
// Vercel types package may not be installed in local dev environment.
// Use `any` for request/response to keep this function portable.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { token } = req.body ?? {};
  if (!token) return res.status(400).json({ success: false, message: 'Missing token' });

  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.error('TURNSTILE_SECRET not set');
    return res.status(500).json({ success: false, message: 'Server misconfiguration: TURNSTILE_SECRET missing' });
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
    });
    const json = await resp.json();

    // Return the verification result directly to the client. The client looks for `success`.
    return res.status(200).json(json);
  } catch (err) {
    console.error('Turnstile verify failed', err);
    return res.status(502).json({ success: false, message: 'Verification request failed' });
  }
}
