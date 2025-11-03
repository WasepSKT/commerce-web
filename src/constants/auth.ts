/**
 * Constants for authentication pages
 */

export const AUTH_MESSAGES = {
  EMAIL_REQUIRED: 'Mohon isi email',
  PASSWORD_REQUIRED: 'Mohon isi password',
  FULL_NAME_REQUIRED: 'Mohon isi nama lengkap',
  PASSWORD_MISMATCH: 'Password tidak cocok',
  PASSWORD_TOO_SHORT: 'Password terlalu pendek',
  PASSWORD_MIN_LENGTH: 'Password harus minimal 6 karakter',
  FORM_INCOMPLETE: 'Form tidak lengkap',
  FORM_INCOMPLETE_DESC: 'Mohon isi semua field yang diperlukan',
  LOGIN_SUCCESS: 'Anda berhasil masuk',
  LOGIN_FAILED: 'Login gagal',
  SIGNUP_SUCCESS: 'Pendaftaran berhasil!',
  SIGNUP_SUCCESS_DESC: 'Silakan cek email Anda untuk konfirmasi akun',
  SIGNUP_FAILED: 'Gagal mendaftar',
  GOOGLE_LOGIN_FAILED: 'Gagal masuk',
  ERROR_OCCURRED: 'Terjadi kesalahan',
  PLEASE_RETRY: 'Silakan coba lagi',
  CAPTCHA_REQUIRED: 'Verifikasi CAPTCHA diperlukan untuk keamanan',
  CAPTCHA_FAILED: 'Verifikasi CAPTCHA gagal. Silakan coba lagi.',
} as const;

export const AUTH_ROUTES = {
  SIGNUP: '/signup',
  HOME: '/',
  AUTH: '/auth',
} as const;

