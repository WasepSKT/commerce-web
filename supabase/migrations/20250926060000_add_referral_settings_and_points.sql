-- Add referral_settings table and reward_points column to profiles

-- Create referral_settings table
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'default',
  active boolean NOT NULL DEFAULT true,
  reward_type text NOT NULL DEFAULT 'points', -- 'points' | 'coupon' | 'credit'
  reward_value numeric,                        -- jumlah poin atau nominal
  max_per_referrer integer,                    -- max rewards per referrer (NULL = unlimited)
  expiration_days integer,                     -- reward expiry in days (NULL = no expiry)
  min_purchase_amount numeric,                 -- optional: min order to qualify
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Policy: allow anyone to select, only admins manage
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select referral settings" ON public.referral_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage referral settings" ON public.referral_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Add reward_points column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='reward_points'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN reward_points integer NOT NULL DEFAULT 0;
  END IF;
END$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_referral_settings_updated_at ON public.referral_settings;
CREATE TRIGGER update_referral_settings_updated_at
  BEFORE UPDATE ON public.referral_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Insert default settings if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.referral_settings WHERE name = 'default') THEN
    INSERT INTO public.referral_settings (name, active, reward_type, reward_value, max_per_referrer, expiration_days)
    VALUES ('default', true, 'points', 100, NULL, NULL);
  END IF;
END;
$$;
