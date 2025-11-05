import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { validateSignupForm } from '@/utils/signupValidation';
import { storePendingReferralCode } from '@/utils/referralStorage';
import { AUTH_MESSAGES, AUTH_ROUTES } from '@/constants/auth';

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

export const useSignupHandlers = (
  formData: SignupFormData,
  executeTurnstile: () => Promise<string | null>,
  turnstileSitekey: string | null
) => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmailSignup, setLoadingEmailSignup] = useState(false);

  const getTurnstileToken = async (): Promise<string | null> => {
    if (!turnstileSitekey?.trim()) {
      console.log('ℹ️ Turnstile not configured, skipping captcha verification');
      return null;
    }

    console.log('🔒 Turnstile configured, attempting verification...');
    const token = await executeTurnstile();
    
    if (!token) {
      console.warn('⚠️ Turnstile verification failed');
    }
    
    return token;
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      // Store referral code
      if (formData.referralCode?.trim()) {
        storePendingReferralCode(formData.referralCode);
        console.log('🔗 Referral code stored for Google signup:', formData.referralCode);
      }

      // Verify CAPTCHA
      const token = await getTurnstileToken();
      if (turnstileSitekey?.trim() && !token) {
        toast({
          variant: 'destructive',
          title: AUTH_MESSAGES.CAPTCHA_FAILED,
          description: AUTH_MESSAGES.CAPTCHA_REQUIRED,
        });
        return;
      }

      // Google OAuth
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: 'destructive',
          title: AUTH_MESSAGES.GOOGLE_LOGIN_FAILED,
          description: error.message,
        });
      } else {
        console.log('✅ Google signup successful');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        variant: 'destructive',
        title: AUTH_MESSAGES.ERROR_OCCURRED,
        description: AUTH_MESSAGES.PLEASE_RETRY,
      });
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailSignup = async () => {
    // Validate form
    const validation = validateSignupForm(
      formData.fullName,
      formData.email,
      formData.password,
      formData.confirmPassword
    );

    if (!validation.isValid) {
      toast({
        variant: 'destructive',
        title: AUTH_MESSAGES.FORM_INCOMPLETE,
        description: validation.error,
      });
      return;
    }

    setLoadingEmailSignup(true);
    try {
      // Store referral code
      if (formData.referralCode?.trim()) {
        storePendingReferralCode(formData.referralCode);
        console.log('🔗 Processing referral after manual signup:', formData.referralCode);
      }

      // Get CAPTCHA token
      const turnstileToken = await getTurnstileToken();

      // Prepare signup options
      const signupOptions: { data: { full_name: string; turnstile_token?: string } } = {
        data: { full_name: formData.fullName },
      };

      if (turnstileToken?.trim()) {
        signupOptions.data.turnstile_token = turnstileToken;
      }

      // Sign up with Supabase
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: signupOptions,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: AUTH_MESSAGES.SIGNUP_FAILED,
          description: error.message,
        });
      } else {
        toast({
          title: AUTH_MESSAGES.SIGNUP_SUCCESS,
          description: AUTH_MESSAGES.SIGNUP_SUCCESS_DESC,
        });
        navigate(AUTH_ROUTES.AUTH, { replace: true });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: AUTH_MESSAGES.ERROR_OCCURRED,
        description: AUTH_MESSAGES.PLEASE_RETRY,
      });
    } finally {
      setLoadingEmailSignup(false);
    }
  };

  return {
    handleGoogleSignIn,
    handleEmailSignup,
    loadingGoogle,
    loadingEmailSignup,
  };
};
