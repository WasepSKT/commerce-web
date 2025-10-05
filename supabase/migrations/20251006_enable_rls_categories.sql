-- Migration: Enable RLS and create policies for categories and blog_categories
-- Only admin users (profiles.role = 'admin') can insert/update/delete
-- Public (or client) can SELECT rows for reading the blog

-- Enable RLS on categories
alter table if exists categories enable row level security;

create policy "Public read categories" on categories
  for select
  using (true);

-- Allow admins and marketing to manage categories
create policy "Managers manage categories" on categories
  for all
  using (exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'marketing')
  ))
  with check (exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'marketing')
  ));

-- Enable RLS on blog_categories
alter table if exists blog_categories enable row level security;

create policy "Public read blog_categories" on blog_categories
  for select
  using (true);

create policy "Managers manage blog_categories" on blog_categories
  for all
  using (exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'marketing')
  ))
  with check (exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'marketing')
  ));
