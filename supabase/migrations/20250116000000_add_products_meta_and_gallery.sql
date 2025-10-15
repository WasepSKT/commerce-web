-- Migration: Add meta JSONB and image_gallery TEXT[] to products
-- Safe to run multiple times

alter table if exists public.products
  add column if not exists meta jsonb,
  add column if not exists image_gallery text[];

-- Optional: defaults
alter table if exists public.products
  alter column image_gallery set default '{}';

-- Optional indexes for JSONB queries
create index if not exists idx_products_meta_gin on public.products using gin (meta);


