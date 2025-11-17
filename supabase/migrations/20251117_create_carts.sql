-- Migration: create carts table for storing user carts
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_carts_user_id on carts(user_id);

-- Optional: RLS/policies can be added depending on project needs
-- Enable Row Level Security and policies so only the owning user with role 'customer' can access/modify their cart
-- Note: service role key bypasses RLS; server-side functions using the service key can still read/write.
alter table if exists public.carts enable row level security;

-- Allow authenticated users with role = 'customer' to SELECT their own cart
drop policy if exists select_own_cart on public.carts;
create policy select_own_cart on public.carts
  for select
  using (
    user_id = auth.uid()
    and (select role from public.profiles where user_id = auth.uid()) = 'customer'
  );

-- Allow authenticated customers to INSERT carts (user_id must match auth.uid())
drop policy if exists insert_own_cart on public.carts;
create policy insert_own_cart on public.carts
  for insert
  with check (
    user_id = auth.uid()
    and (select role from public.profiles where user_id = auth.uid()) = 'customer'
  );

-- Allow authenticated customers to UPDATE their own cart
drop policy if exists update_own_cart on public.carts;
create policy update_own_cart on public.carts
  for update
  using (
    user_id = auth.uid()
    and (select role from public.profiles where user_id = auth.uid()) = 'customer'
  )
  with check (
    user_id = auth.uid()
    and (select role from public.profiles where user_id = auth.uid()) = 'customer'
  );

-- Allow authenticated customers to DELETE their own cart
drop policy if exists delete_own_cart on public.carts;
create policy delete_own_cart on public.carts
  for delete
  using (
    user_id = auth.uid()
    and (select role from public.profiles where user_id = auth.uid()) = 'customer'
  );
