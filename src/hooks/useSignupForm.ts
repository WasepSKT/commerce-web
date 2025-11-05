import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storePendingReferralCode } from '@/utils/referralStorage';

export const useSignupForm = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  // Get referral code from URL params
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
      storePendingReferralCode(ref);
    }
  }, [searchParams]);

  // Store referral code when it changes
  useEffect(() => {
    if (formData.referralCode?.trim()) {
      storePendingReferralCode(formData.referralCode);
    }
  }, [formData.referralCode]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: formData.referralCode, // Keep referral code
    });
  };

  return {
    formData,
    updateField,
    resetForm,
  };
};
