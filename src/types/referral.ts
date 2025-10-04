// Types for Referral Settings
export type Settings = {
  id?: string;
  name: string;
  active: boolean;
  reward_type: 'points' | 'coupon' | 'credit';
  reward_value?: number | null;
  max_per_referrer?: number | null;
  expiration_days?: number | null;
  min_purchase_amount?: number | null;
};

// Fix: Use 'weight' instead of 'percentage' to match database schema
export type LevelRow = {
  id: string;
  name: string;
  min_amount: string;
  max_amount?: string | null;
  weight: number; // Changed from 'percentage' to 'weight'
  priority: number;
  active: boolean;
};

export type FormData = Partial<LevelRow>;