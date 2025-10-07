-- Migration: fix internal roles and record audit for role changes
-- This migration safely updates specific internal emails to their correct roles
-- and records the change to an audit table for traceability.

BEGIN;

-- 1) Ensure audit table exists
CREATE TABLE IF NOT EXISTS public.admin_role_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  user_id uuid NULL,
  email text NULL,
  changed_by uuid NULL,
  old_role public.user_role NULL,
  new_role public.user_role NULL,
  reason text NULL,
  created_at timestamptz DEFAULT now()
);

-- 2) Correct role for nur.aripin@skt-global.co.id -> admin_sales (only if different)
WITH changed AS (
  SELECT id, user_id, email, role AS old_role
  FROM public.profiles
  WHERE email = 'nur.aripin@skt-global.co.id' AND role <> 'admin_sales'
), updated AS (
  UPDATE public.profiles p
  SET role = 'admin_sales', updated_at = now()
  FROM changed c
  WHERE p.id = c.id
  RETURNING p.id, p.user_id, p.email, c.old_role, p.role AS new_role
)
INSERT INTO public.admin_role_changes (profile_id, user_id, email, changed_by, old_role, new_role, reason)
SELECT id, user_id, email, NULL, old_role, new_role, 'Correct internal role: set to admin_sales' FROM updated;

-- 3) (Optional) Add additional fixes here following the same pattern.

COMMIT;

-- Important: run this migration in staging first, verify results, then apply to production.
