/**
 * scripts/backfill-image-paths.ts
 *
 * Backfill `image_path` and `image_gallery_paths` from existing `image_url` and `image_gallery`.
 * Usage:
 *  - Dry run (default):
 *      node ./dist/scripts/backfill-image-paths.js
 *  - Apply changes:
 *      SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." node ./dist/scripts/backfill-image-paths.js --apply
 *
 * This script requires a Supabase service_role key. It is intentionally conservative (dry-run by default).
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const APPLY = process.argv.includes('--apply');
const LIMIT_ARG_INDEX = process.argv.findIndex((a) => a === '--limit');
const LIMIT = LIMIT_ARG_INDEX >= 0 && process.argv[LIMIT_ARG_INDEX + 1] ? parseInt(process.argv[LIMIT_ARG_INDEX + 1], 10) : undefined;

function extractStoragePath(url: string | null | undefined) {
  if (!url) return null;
  // Remove scheme + host + /storage/v1/object/public/product-images/
  return url.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/product-images\//, '');
}

async function fetchProducts() {
  const q = supabase.from('products').select('id, image_url, image_gallery, image_path, image_gallery_paths').order('id', { ascending: true });
  if (LIMIT) q.limit(LIMIT);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

function normalizeGallery(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch (err) {
      // not JSON, return as single-item array
      return [raw];
    }
  }
  // fallback: unknown type
  return [];
}

async function main() {
  console.log(`Backfill script started. APPLY=${APPLY ? 'yes' : 'no'}, LIMIT=${LIMIT ?? 'none'}`);
  const products = await fetchProducts();
  console.log(`Fetched ${products.length} products`);

  const updates: Array<{ id: string; image_path?: string | null; image_gallery_paths?: string[] | null }> = [];

  for (const p of products) {
    const id = (p as any).id;
    const image_url: string | null = (p as any).image_url ?? null;
    const image_gallery_raw = (p as any).image_gallery;
    const existing_image_path: string | null = (p as any).image_path ?? null;
    const existing_gallery_paths: any = (p as any).image_gallery_paths ?? null;

    const candidate_image_path = extractStoragePath(image_url);
    const galleryUrls = normalizeGallery(image_gallery_raw);
    const candidate_gallery_paths = galleryUrls.map(extractStoragePath).filter(Boolean) as string[];

    const needImagePath = candidate_image_path && candidate_image_path !== existing_image_path;
    const needGallery = candidate_gallery_paths.length > 0 && JSON.stringify(candidate_gallery_paths) !== JSON.stringify(existing_gallery_paths);

    if (needImagePath || needGallery) {
      updates.push({ id, image_path: needImagePath ? candidate_image_path : existing_image_path, image_gallery_paths: needGallery ? candidate_gallery_paths : existing_gallery_paths });
    }
  }

  console.log(`Prepared ${updates.length} updates`);

  if (!APPLY) {
    console.log('Dry-run mode; no updates will be applied. Sample changes:');
    for (let i = 0; i < Math.min(50, updates.length); i++) {
      console.log(JSON.stringify(updates[i], null, 2));
    }
    console.log('To apply changes, re-run with `--apply` and provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
    return;
  }

  console.log('Applying updates...');
  for (const u of updates) {
    const payload: any = {};
    if (u.image_path !== undefined) payload.image_path = u.image_path;
    if (u.image_gallery_paths !== undefined) payload.image_gallery_paths = u.image_gallery_paths;

    const { data, error } = await supabase.from('products').update(payload).eq('id', u.id).select('id, image_path, image_gallery_paths').single();
    if (error) {
      console.error(`Failed to update product ${u.id}:`, error.message ?? error);
    } else {
      console.log(`Updated ${u.id}`);
    }
  }

  console.log('Apply complete.');
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
