import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';

function ensureConfigured() {
  const { apiBaseUrl } = config.shipping.jubelio;
  if (!apiBaseUrl) {
    throw new Error('Jubelio is not configured (JUBELIO_API_BASE_URL missing)');
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;
type TokenResponse = { token: string; expires_in: number };

// Use a dedicated axios instance for auth to avoid interceptor recursion
function getAuthAxios(baseURL: string) {
  return axios.create({ baseURL, timeout: 10000 });
}

async function getAuthToken(baseURL: string): Promise<string | null> {
  const { apiToken, clientId, clientSecret } = config.shipping.jubelio;
  if (apiToken) return apiToken;
  if (clientId && clientSecret) {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now + 10_000) return cachedToken.token;
    const auth = getAuthAxios(baseURL);
    const { data } = await auth.post<TokenResponse>('/auth/generate-token', {
      client_id: clientId,
      client_secret: clientSecret,
    });
    const token = String(data?.token || '');
    const expiresInSec = Number(data?.expires_in || 0);
    if (!token) throw new Error('Failed to obtain Jubelio token');
    cachedToken = { token, expiresAt: now + Math.max(30_000, expiresInSec * 1000) };
    return token;
  }
  return null;
}

export function getJubelioClient() {
  ensureConfigured();
  const { apiBaseUrl, apiToken, username, password } = config.shipping.jubelio;

  const instance = axios.create({
    baseURL: apiBaseUrl,
    timeout: 10000,
  });

  instance.interceptors.request.use(async (req: InternalAxiosRequestConfig) => {
    // Skip auth header injection for auth endpoint itself
    const url = (req.url || '').toString();
    if (url.includes('/auth/generate-token')) {
      return req;
    }
    // Prefer API Token if available, otherwise obtain OAuth token via client credentials
    const token = await getAuthToken(apiBaseUrl);
    if (token) {
      const headers = req.headers instanceof AxiosHeaders
        ? req.headers
        : new AxiosHeaders(req.headers);
      headers.set('Authorization', `Bearer ${token}`);
      req.headers = headers;
      return req;
    }
    if (username && password) {
      const token = Buffer.from(`${username}:${password}`).toString('base64');
      const headers = req.headers instanceof AxiosHeaders
        ? req.headers
        : new AxiosHeaders(req.headers);
      headers.set('Authorization', `Basic ${token}`);
      req.headers = headers;
      return req;
    }
    // TODO: Support OAuth2 client credentials if needed
    return req;
  });

  return instance;
}
