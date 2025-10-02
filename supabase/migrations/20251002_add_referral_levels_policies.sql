-- Migration: enable RLS and policies for referral_levels

-- Enable Row Level Security
alter table if exists referral_levels enable row level security;

-- NOTE: This migration assumes `profiles.user_id` exists and `profiles.role` contains 'admin' for admins.
-- Adjust conditions if your schema differs.

-- 1) SELECT: allow anyone to read active levels
drop policy if exists "public_select_active_levels" on referral_levels;
create policy "public_select_active_levels" on referral_levels
  for select
  using (active = true);

-- 2) INSERT: allow only admin to insert
drop policy if exists "admin_insert_levels" on referral_levels;
create policy "admin_insert_levels" on referral_levels
  for insert
  with check (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- 3) UPDATE: allow only admin to update
drop policy if exists "admin_update_levels" on referral_levels;
create policy "admin_update_levels" on referral_levels
  for update
  using (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- 4) DELETE: allow only admin to delete
drop policy if exists "admin_delete_levels" on referral_levels;
create policy "admin_delete_levels" on referral_levels
  for delete
  using (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- End migration
