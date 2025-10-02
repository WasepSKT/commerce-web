-- Migration: enable RLS and add policies for referral_purchases

-- Enable Row Level Security
alter table if exists referral_purchases enable row level security;

-- NOTE: This migration assumes `profiles.user_id` exists and that admin users have profiles.role = 'admin'.
-- If your schema differs, adjust the policies accordingly.

-- 1) SELECT: allow referrer to read their referral_purchases and allow admin to read all
drop policy if exists "referrer_or_admin_select" on referral_purchases;
create policy "referrer_or_admin_select" on referral_purchases
  for select
  using (
    (
      exists (
        select 1 from profiles p where p.id = referral_purchases.referrer_id and p.user_id = auth.uid()
      )
    )
    or
    (
      exists (
        select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'
      )
    )
  );

-- 2) INSERT: prevent direct client inserts (no policy giving insert rights)
-- Create an explicit policy that disallows inserts from non-service roles (check false)
drop policy if exists "no_client_insert" on referral_purchases;
create policy "no_client_insert" on referral_purchases
  for insert
  with check (false);

-- 3) UPDATE: prevent client updates (only service role should update)
drop policy if exists "no_client_update" on referral_purchases;
create policy "no_client_update" on referral_purchases
  for update
  using (false)
  with check (false);

-- 4) DELETE: prevent client deletes
drop policy if exists "no_client_delete" on referral_purchases;
create policy "no_client_delete" on referral_purchases
  for delete
  using (false);

-- 5) Allow admins to select via explicit role check (already covered in select policy)

-- 6) If you need server-side RPC to insert, create a stored procedure that performs the insert using SECURITY DEFINER
-- Example (optional):
-- create function insert_referral_purchase_secure(referrer uuid, referred uuid, order_id text, amount numeric, status text) returns uuid as $$
-- declare new_id uuid := gen_random_uuid();
-- begin
--   insert into referral_purchases(id, referrer_id, referred_id, order_id, amount, status)
--   values (new_id, referrer, referred, order_id, amount, status);
--   return new_id;
-- end;
-- $$ language plpgsql security definer;

-- Important: service-role and backend code bypass RLS; keep service key secret.

-- End policy migration
