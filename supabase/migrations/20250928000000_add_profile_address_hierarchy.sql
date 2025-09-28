-- Add hierarchical address columns to profiles table if they don't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS subdistrict TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- No RLS changes here; ensure existing policies still allow users to view/update their own profile.
