-- Create reward_type enum and migrate referral_settings.reward_type to use it

-- 1) create enum type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_type_enum') THEN
    CREATE TYPE public.reward_type_enum AS ENUM ('points', 'coupon', 'credit');
  END IF;
END$$;

-- 2) normalize existing values to allowed set (map invalid/null to 'points')
UPDATE public.referral_settings
SET reward_type = 'points'
WHERE reward_type IS NULL OR reward_type NOT IN ('points', 'coupon', 'credit');

-- 3) drop default (if any) then alter column type to enum
-- Dropping the default prevents Postgres 42804 errors when casting the column type
ALTER TABLE public.referral_settings
  ALTER COLUMN reward_type DROP DEFAULT;

ALTER TABLE public.referral_settings
  ALTER COLUMN reward_type TYPE public.reward_type_enum
  USING reward_type::public.reward_type_enum;

-- 3b) set a proper enum-typed DEFAULT
ALTER TABLE public.referral_settings
  ALTER COLUMN reward_type SET DEFAULT 'points'::public.reward_type_enum;

-- 4) Recreate policy ensuring admin-only management with WITH CHECK
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage referral settings" ON public.referral_settings;

CREATE POLICY "Admins can manage referral settings" ON public.referral_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Optional: ensure select still allowed for all (keep read-only open)
DROP POLICY IF EXISTS "Select referral settings" ON public.referral_settings;
CREATE POLICY "Select referral settings" ON public.referral_settings
  FOR SELECT
  USING (true);
