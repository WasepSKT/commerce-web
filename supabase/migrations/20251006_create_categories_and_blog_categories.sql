-- Migration: Create categories and blog_categories
-- Run with Supabase migration tooling or psql

-- Create categories table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- Create join table for many-to-many relationship
create table if not exists blog_categories (
  blog_id uuid references blogs(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (blog_id, category_id)
);

-- Optional index for faster queries
create index if not exists idx_blog_categories_blog_id on blog_categories (blog_id);
create index if not exists idx_blog_categories_category_id on blog_categories (category_id);
