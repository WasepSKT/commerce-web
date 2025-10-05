-- Create blogs table
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists set_blogs_updated_at on public.blogs;
create trigger set_blogs_updated_at
before update on public.blogs
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.blogs enable row level security;

-- Policies: allow read for all, write for admins only
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blogs' and policyname = 'Allow read blogs'
  ) then
    create policy "Allow read blogs" on public.blogs for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blogs' and policyname = 'Allow admin write blogs'
  ) then
    create policy "Allow admin write blogs" on public.blogs for all using (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.role = 'admin'::user_role
      )
    ) with check (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.role = 'admin'::user_role
      )
    );
  end if;
end$$;

insert into storage.buckets (id, name, public)
select 'blog-images', 'blog-images', true
where not exists (select 1 from storage.buckets where id = 'blog-images');

-- Storage policies for blog-images (drop-then-create to avoid IF NOT EXISTS)
drop policy if exists "Public read blog images" on storage.objects;
create policy "Public read blog images" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "Admin write blog images" on storage.objects;
create policy "Admin write blog images" on storage.objects
  for all using (
    bucket_id = 'blog-images' and exists (
      select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'::user_role
    )
  ) with check (
    bucket_id = 'blog-images' and exists (
      select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'::user_role
    )
  );


