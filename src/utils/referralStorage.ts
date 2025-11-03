/**
 * Referral code storage utilities
 */

const PENDING_REFERRAL_CODE_KEY = 'pendingReferralCode';

/**
 * Store referral code in localStorage for later processing
 */
export function storePendingReferralCode(code: string): void {
  if (code && code.trim() !== '') {
    localStorage.setItem(PENDING_REFERRAL_CODE_KEY, code.trim());
    console.log('🔗 Referral code stored:', code.trim());
  }
}

/**
 * Get and remove pending referral code from localStorage
 */
export function getAndClearPendingReferralCode(): string | null {
  const code = localStorage.getItem(PENDING_REFERRAL_CODE_KEY);
  if (code) {
    localStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
    console.log('🔗 Pending referral code retrieved and cleared:', code);
  }
  return code;
}

/**
 * Check if there's a pending referral code without removing it
 */
export function hasPendingReferralCode(): boolean {
  return localStorage.getItem(PENDING_REFERRAL_CODE_KEY) !== null;
}

