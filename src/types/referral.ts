// Enhanced Types for Referral System
export interface ReferralResponse {
  success: boolean;
  error?: string;
  message?: string;
  reward_points?: number;
  referrer_id?: string;
  referrer_name?: string;
  referral_id?: string;
  signup_points?: number;
  referrer_points?: number;
}

export interface ReferralSettings {
  id?: string;
  name: string;
  active: boolean;
  reward_type: 'points' | 'coupon' | 'credit';
  reward_value?: number | null;
  max_per_referrer?: number | null;
  expiration_days?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReferralLevel {
  id: string;
  name: string;
  min_amount: number;
  max_amount?: number | null;
  commission_pct: number; // stored as decimal (0.05 = 5%)
  priority: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  reward_points: number;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at?: string;
}

export interface ReferralStats {
  total_referrals: number;
  total_points_earned: number;
  active_referrals: number;
  referral_code: string;
  level?: string;
  commission_rate?: number;
}

export interface ReferralFormData {
  name: string;
  min_amount?: number;
  max_amount?: number | null;
  commission_pct?: number;
  priority?: number;
  active?: boolean;
}

// Legacy types for backward compatibility
export type Settings = ReferralSettings;
export type LevelRow = ReferralLevel;
export type FormData = ReferralFormData;

// Referral validation types
export interface ReferralValidation {
  isValid: boolean;
  error?: string;
  referrerId?: string;
  referrerName?: string;
}

// Referral processing result
export interface ReferralProcessResult {
  success: boolean;
  referralId?: string;
  pointsAwarded?: number;
  error?: string;
  message?: string;
}