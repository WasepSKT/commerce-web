-- Migration: add phone and address to public.profiles
-- Created: 2025-09-28

BEGIN;

-- Add columns if they do not already exist to make the migration idempotent
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text;

COMMIT;

-- Notes:
-- Run this migration using psql or the Supabase CLI.