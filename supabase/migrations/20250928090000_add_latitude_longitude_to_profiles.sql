-- Migration: add latitude and longitude to public.profiles
-- Created: 2025-09-28

BEGIN;

-- Add columns if they do not already exist to make the migration idempotent
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

COMMIT;

-- Notes:
-- Run this migration using psql or the Supabase CLI (see README for environment-specific steps).