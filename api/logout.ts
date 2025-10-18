/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // read refresh token from cookie
  const cookieHeader = req.headers?.cookie ?? '';
  const match = cookieHeader.match(/sb_refresh_token=([^;]+)/);
  const refreshToken = match ? match[1] : null;

  if (refreshToken && SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
    try {
      // Exchange refresh token for access token
      const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
          apiKey: SUPABASE_SERVICE_ROLE,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const tokenJson = await tokenRes.json();
      if (tokenRes.ok && tokenJson.access_token) {
        // Call Supabase logout endpoint to revoke the session
        try {
          await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenJson.access_token}`,
              apiKey: SUPABASE_SERVICE_ROLE,
            },
          });
        } catch (e) {
          console.warn('Failed to call supabase logout', e);
        }
        // If we can identify the user id, attempt admin revoke of user sessions (best-effort)
        try {
          const userId = tokenJson?.user?.id ?? null;
          if (userId) {
            // Supabase admin revoke endpoint (best-effort). Some Supabase setups expose admin routes under /auth/v1/admin.
            await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}/revoke`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
                apiKey: SUPABASE_SERVICE_ROLE,
                'Content-Type': 'application/json',
              },
            });
          }
        } catch (e) {
          // Non-fatal: log and continue. This endpoint may not exist on all Supabase infra versions.
          console.warn('Admin session revoke attempt failed (non-fatal)', e);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh token for logout', err);
    }
  }

  // Clear the refresh token cookie regardless
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  res.setHeader('Set-Cookie', `sb_refresh_token=; HttpOnly; Path=/; Max-Age=0; ${secureFlag} SameSite=Lax`);
  return res.status(200).json({ ok: true });
}
