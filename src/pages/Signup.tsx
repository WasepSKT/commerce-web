import { useEffect, useState } from 'react';
import { Navigate, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedRedirect, UserRole } from '@/utils/rolePermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateSignupForm } from '@/utils/signupValidation';
import { logTurnstileDebug } from '@/utils/turnstileDebug';
import { storePendingReferralCode } from '@/utils/referralStorage';
import { AUTH_MESSAGES, AUTH_ROUTES } from '@/constants/auth';
import bgLogin from '@/assets/bg/bg-login.webp';
import googleLogo from '@/assets/img/Google__G__logo.svg.png';
import logoImg from '/regalpaw.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import PasswordInput from '@/components/auth/PasswordInput';

export default function Signup() {
  const { isAuthenticated, signInWithGoogle, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmailSignup, setLoadingEmailSignup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  // Turnstile via hook (handles sitekey, script, render, execute)
  const { sitekey: TURNSTILE_SITEKEY, containerRef: widgetContainerRef, execute: executeTurnstile } = useTurnstile();

  // Debug Turnstile configuration (development only)
  useEffect(() => {
    logTurnstileDebug(TURNSTILE_SITEKEY);
  }, [TURNSTILE_SITEKEY]);

  // Get referral code from URL params
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      storePendingReferralCode(ref);
    }
  }, [searchParams]);

  // Store referral code when it changes
  useEffect(() => {
    if (referralCode && referralCode.trim() !== '') {
      storePendingReferralCode(referralCode);
    }
  }, [referralCode]);

  /**
   * Handle Google sign-in with CAPTCHA verification
   * CAPTCHA is required before OAuth redirect for security
   */
  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      // Store referral code for later processing
      if (referralCode && referralCode.trim() !== '') {
        storePendingReferralCode(referralCode);
        console.log('🔗 Referral code stored for Google signup:', referralCode);
      }

      // Execute CAPTCHA verification before Google OAuth
      let token: string | null = null;
      if (TURNSTILE_SITEKEY && TURNSTILE_SITEKEY.trim() !== '') {
        console.log('🔒 Turnstile configured, attempting verification for Google sign-in...');
        token = await executeTurnstile();
        if (!token) {
          toast({
            variant: 'destructive',
            title: AUTH_MESSAGES.CAPTCHA_FAILED,
            description: AUTH_MESSAGES.CAPTCHA_REQUIRED,
          });
          setLoadingGoogle(false);
          return;
        }
      } else {
        console.log('ℹ️ Turnstile not configured, proceeding without captcha for Google sign-in');
      }

      // Proceed with Google OAuth only after CAPTCHA verification (if required)
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: 'destructive',
          title: AUTH_MESSAGES.GOOGLE_LOGIN_FAILED,
          description: error.message,
        });
      } else {
        console.log('✅ Google signup successful, referral will be processed by useEffect');
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

  /**
   * Handle email/password signup with CAPTCHA verification
   */
  const handleEmailSignup = async () => {
    // Validate form
    const validation = validateSignupForm(fullName, email, password, confirmPassword);
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
      // Store referral code for later processing
      if (referralCode && referralCode.trim() !== '') {
        storePendingReferralCode(referralCode);
        console.log('🔗 Processing referral after manual signup:', referralCode);
      }

      // Execute CAPTCHA verification
      let turnstileToken: string | null = null;
      if (TURNSTILE_SITEKEY && TURNSTILE_SITEKEY.trim() !== '') {
        console.log('🔒 Turnstile configured, attempting verification...');
        turnstileToken = await executeTurnstile();
        if (!turnstileToken) {
          console.warn('⚠️ Turnstile verification failed, proceeding without captcha');
        }
      } else {
        console.log('ℹ️ Turnstile not configured, skipping captcha verification');
      }

      // Prepare signup options with metadata
      const signupOptions: { data: { full_name: string; turnstile_token?: string } } = {
        data: {
          full_name: fullName,
        },
      };

      // Only include turnstile_token if we have a valid token
      if (turnstileToken && turnstileToken.trim() !== '') {
        signupOptions.data.turnstile_token = turnstileToken;
      }

      // Sign up with Supabase
      const { error } = await supabase.auth.signUp({
        email,
        password,
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
        // Redirect to login page after successful signup
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

  // Redirect if already authenticated
  if (isAuthenticated) {
    const destination = getRoleBasedRedirect((profile?.role as UserRole) ?? 'customer');
    return <Navigate to={destination} replace />;
  }

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Daftar', url: 'https://regalpaw.id/signup' }
  ]);

  return (
    <>
      <SEOHead
        title="Daftar Akun Baru - Regal Paw"
        description="Daftar akun Regal Paw untuk mengakses produk makanan kucing premium, program referral, dan layanan eksklusif. Daftar dengan email atau Google untuk memulai."
        keywords="daftar, signup, akun baru, Regal Paw, makanan kucing, program referral"
        canonical="/signup"
        ogType="website"
        structuredData={breadcrumbData}
        noindex={true}
      />

      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `url(${bgLogin})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full max-w-md">
          <Card className="w-full shadow-xl border-0 fade-in">
            <CardHeader className="text-center pb-0">
              <div className="flex justify-center">
                <img src={logoImg} alt="Regal Paw" className="h-14 w-auto" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary mt-2">
                Buat Akun Baru
              </CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                Daftar untuk mulai berbelanja makanan kucing berkualitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Referral Code Banner */}
              {referralCode && (
                <div className="p-3 bg-orange-100 rounded-lg text-center border border-orange-200">
                  <p className="text-sm text-orange-700">
                    🎉 Anda diundang dengan kode: <strong>{referralCode}</strong>
                  </p>
                </div>
              )}

              {/* Email Signup Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-primary font-medium">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    placeholder="Masukkan nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="!border-2 !border-primary focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="!border-2 !border-primary focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0"
                  />
                </div>

                <PasswordInput
                  id="password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Masukkan password (min. 6 karakter)"
                />

                <PasswordInput
                  id="confirmPassword"
                  label="Konfirmasi Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Konfirmasi password Anda"
                />

                <div className="space-y-2">
                  <Label htmlFor="referral" className="text-primary font-medium">Kode Referral (Opsional)</Label>
                  <Input
                    id="referral"
                    placeholder="Masukkan kode referral"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="!border-2 !border-primary focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0"
                  />
                </div>

                {/* Turnstile Widget Container - Visible and Responsive */}
                {TURNSTILE_SITEKEY && (
                  <div className="flex justify-center w-full">
                    <div ref={widgetContainerRef as unknown as React.RefObject<HTMLDivElement>} className="w-full" />
                  </div>
                )}

                <Button
                  onClick={handleEmailSignup}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm py-2"
                  size="lg"
                  disabled={loadingEmailSignup}
                >
                  {loadingEmailSignup && <LoadingSpinner className="h-5 w-5 mr-2 text-white" />}
                  {loadingEmailSignup ? 'Mendaftar...' : 'Daftar Sekarang'}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Atau</span>
                </div>
              </div>

              {/* Google Signup */}
              <Button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-blue-50 text-gray-700 font-semibold shadow-sm py-2"
                size="lg"
                disabled={loadingGoogle}
              >
                {loadingGoogle ? (
                  <LoadingSpinner className="h-5 w-5 mr-2 text-blue-500" />
                ) : (
                  <img src={googleLogo} alt="Google logo" className="h-5 w-5 mr-2" />
                )}
                {loadingGoogle ? 'Memproses...' : 'Daftar dengan Google'}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-2">
                Dengan mendaftar, Anda menyetujui <a href="/terms" className="underline text-blue-700">syarat dan ketentuan</a> kami.
              </p>

              <div className="text-sm text-center mt-4">
                <span className="text-muted-foreground">Sudah punya akun? </span>
                <Link to={AUTH_ROUTES.AUTH} className="underline text-blue-700 hover:text-blue-900">
                  Masuk di sini
                </Link>
              </div>

              <div className="mb-4 text-sm text-muted-foreground text-center">
                <Link to={AUTH_ROUTES.HOME} className="underline">Kembali ke Beranda</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
