/**
 * Authentication form validation utilities
 */

import { AUTH_MESSAGES } from '@/constants/auth';

export interface AuthValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email and password for login
 */
export function validateLoginForm(email: string, password: string): AuthValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: AUTH_MESSAGES.EMAIL_REQUIRED };
  }
  if (!password || password.trim() === '') {
    return { isValid: false, error: AUTH_MESSAGES.PASSWORD_REQUIRED };
  }
  return { isValid: true };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

