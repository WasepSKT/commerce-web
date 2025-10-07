// Types for Referral Settings
export type Settings = {
  id?: string;
  name: string;
  active: boolean;
  reward_type: 'points' | 'coupon' | 'credit';
  reward_value?: number | null;
  max_per_referrer?: number | null;
  expiration_days?: number | null;
};

// Fix: Use 'weight' instead of 'percentage' to match database schema
export type LevelRow = {
  id: string;
  name: string;
  min_amount: string;
  max_amount?: string | null;
  // legacy 'weight' kept for backwards compatibility; prefer 'commission_pct'
  weight?: number;
  commission_pct?: number | null; // percentage value (e.g. 5 = 5%)
  priority: number;
  active: boolean;
};

export type FormData = Partial<LevelRow>;