/**
 * Profile validation utilities
 */

import type { UserProfile } from '@/hooks/useAuth';

export interface ProfileValidationResult {
  isValid: boolean;
  missingFields: string[];
}

/**
 * Validate profile for checkout (requires all essential shipping information)
 */
export function validateProfileForCheckout(profile: UserProfile | null): ProfileValidationResult {
  const missingFields: string[] = [];

  if (!profile?.full_name) missingFields.push('Nama penerima');
  if (!profile?.phone) missingFields.push('Nomor HP/WA');
  if (!profile?.address) missingFields.push('Alamat lengkap');
  if (!profile?.province) missingFields.push('Provinsi');
  if (!profile?.city) missingFields.push('Kabupaten/Kota');
  if (!profile?.district) missingFields.push('Kecamatan');
  if (!profile?.subdistrict) missingFields.push('Desa/Kelurahan');
  if (!profile?.postal_code) missingFields.push('Kode Pos');

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Build full address string from profile
 */
export function buildFullAddress(profile: UserProfile | null): string {
  if (!profile) return '';

  let fullAddress = profile.address || '';
  if (profile.subdistrict) fullAddress += `\n${profile.subdistrict}`;
  if (profile.district) fullAddress += `, ${profile.district}`;
  if (profile.city) fullAddress += `\n${profile.city}`;
  if (profile.province) fullAddress += `, ${profile.province}`;
  if (profile.postal_code) fullAddress += `\nKode Pos: ${profile.postal_code}`;

  return fullAddress;
}

