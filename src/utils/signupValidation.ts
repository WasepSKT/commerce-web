/**
 * Signup form validation utilities
 */

import { AUTH_MESSAGES } from '@/constants/auth';

export interface SignupValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate signup form (full name, email, password, confirm password)
 */
export function validateSignupForm(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
): SignupValidationResult {
  if (!fullName || fullName.trim() === '') {
    return { isValid: false, error: AUTH_MESSAGES.FULL_NAME_REQUIRED };
  }
  if (!email || email.trim() === '') {
    return { isValid: false, error: AUTH_MESSAGES.EMAIL_REQUIRED };
  }
  if (!password || password.trim() === '') {
    return { isValid: false, error: AUTH_MESSAGES.PASSWORD_REQUIRED };
  }
  if (password.length < 6) {
    return { isValid: false, error: AUTH_MESSAGES.PASSWORD_MIN_LENGTH };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: AUTH_MESSAGES.PASSWORD_MISMATCH };
  }
  return { isValid: true };
}

