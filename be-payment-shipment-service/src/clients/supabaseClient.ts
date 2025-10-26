import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Ensure envs are loaded even when running from payment-service folder
// 1) Load local .env (payment-service/.env) if present
dotenv.config();
// 2) Also try to load monorepo root .env: dist => ../../.env at runtime
try {
  const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');
  if (fs.existsSync(rootEnvPath)) {
    // Allow backend .env values to override root .env for service-specific config
    dotenv.config({ path: rootEnvPath, override: true });
  }
} catch {
  // ignore if root .env not found
}

// Prefer server-side SUPABASE_URL, but fall back to VITE_SUPABASE_URL if running locally with a shared .env
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  const hasUrl = Boolean(SUPABASE_URL);
  const hasKey = Boolean(SUPABASE_SERVICE_ROLE_KEY);
  console.warn(`[supabase][server] Missing envs. hasUrl=${hasUrl} hasKey=${hasKey}`);
}

export const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
