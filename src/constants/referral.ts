// Referral System Constants
export const REFERRAL_CONFIG = {
  // Default reward points
  DEFAULT_SIGNUP_POINTS: 0, // Yang diundang TIDAK mendapat poin
  DEFAULT_REFERRER_POINTS: 100, // Yang mengundang mendapat poin
  
  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
  
  // Polling configuration
  POLLING_INTERVAL_MS: 1000,
  MAX_POLLING_ATTEMPTS: 30,
  
  // Validation
  MIN_REFERRAL_CODE_LENGTH: 3,
  MAX_REFERRAL_CODE_LENGTH: 20,
  
  // Storage keys
  STORAGE_KEYS: {
    PENDING_REFERRAL: 'pendingReferralCode',
    REFERRAL_HISTORY: 'referralHistory',
    REFERRAL_STATS: 'referralStats'
  },

  // Referral Levels (by total referred purchases amount)
  LEVELS: [
    { id: 'bronze', name: 'Bronze', min_amount: 0,      commission_pct: 0.03, priority: 1 },
    { id: 'silver', name: 'Silver', min_amount: 500000, commission_pct: 0.05, priority: 2 },
    { id: 'gold',   name: 'Gold',   min_amount: 2000000,commission_pct: 0.07, priority: 3 },
    { id: 'platinum', name: 'Platinum', min_amount: 5000000, commission_pct: 0.10, priority: 4 }
  ] as const
} as const;

export const REFERRAL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired'
} as const;

export const REFERRAL_REWARD_TYPES = {
  POINTS: 'points',
  COUPON: 'coupon',
  CREDIT: 'credit'
} as const;

export const REFERRAL_ERROR_MESSAGES = {
  INVALID_CODE: 'Kode referral tidak valid',
  ALREADY_USED: 'User sudah pernah menggunakan kode referral',
  SELF_REFERRAL: 'Tidak dapat mereferensikan diri sendiri',
  USER_NOT_FOUND: 'User profile tidak ditemukan',
  REFERRER_NOT_FOUND: 'Referrer tidak ditemukan',
  SYSTEM_ERROR: 'Terjadi kesalahan sistem',
  NETWORK_ERROR: 'Gagal memproses referral, coba lagi',
  MAX_LIMIT_REACHED: 'Batas maksimal referral telah tercapai'
} as const;

export const REFERRAL_SUCCESS_MESSAGES = {
  REFERRAL_SUCCESS: 'Referral berhasil!',
  POINTS_AWARDED: 'Poin berhasil ditambahkan',
  REFERRAL_PROCESSED: 'Referral berhasil diproses'
} as const;

// Referral level priorities
export const REFERRAL_LEVEL_PRIORITIES = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  DIAMOND: 5
} as const;

// Commission rates (as percentages)
export const DEFAULT_COMMISSION_RATES = {
  BRONZE: 2, // 2%
  SILVER: 3, // 3%
  GOLD: 5, // 5%
  PLATINUM: 7, // 7%
  DIAMOND: 10 // 10%
} as const;
