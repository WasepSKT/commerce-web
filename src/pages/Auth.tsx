import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedRedirect, UserRole } from '@/utils/rolePermissions';
import { useToast } from '@/hooks/use-toast';
import { validateLoginForm } from '@/utils/authValidation';
import { logTurnstileDebug } from '@/utils/turnstileDebug';
import { AUTH_MESSAGES, AUTH_ROUTES } from '@/constants/auth';
import { isAuthMaintenanceMode } from '@/utils/maintenance';
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

export default function Auth() {
  const { isAuthenticated, signInWithGoogle, profile } = useAuth();
  const { toast } = useToast();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmailLogin, setLoadingEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check maintenance mode - redirect to home if active
  const maintenanceMode = isAuthMaintenanceMode();

  // Turnstile via hook (handles sitekey, script, render, execute)
  const { sitekey: TURNSTILE_SITEKEY, containerRef: widgetContainerRef, execute: executeTurnstile } = useTurnstile();

  // Debug Turnstile configuration (development only)
  useEffect(() => {
    logTurnstileDebug(TURNSTILE_SITEKEY);
  }, [TURNSTILE_SITEKEY]);

  // Redirect to home if maintenance mode is active
  if (maintenanceMode) {
    return <Navigate to="/" replace />;
  }

  /**
   * Handle Google sign-in with CAPTCHA verification
   * CAPTCHA is required before OAuth redirect for security
   */
  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
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
   * Handle email/password login with CAPTCHA verification
   */
  const handleEmailLogin = async () => {
    // Validate form
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      toast({
        variant: 'destructive',
        title: AUTH_MESSAGES.FORM_INCOMPLETE,
        description: validation.error,
      });
      return;
    }

    setLoadingEmailLogin(true);
    try {
      // Execute CAPTCHA verification
      let token: string | null = null;
      if (TURNSTILE_SITEKEY && TURNSTILE_SITEKEY.trim() !== '') {
        console.log('🔒 Turnstile configured, attempting verification...');
        token = await executeTurnstile();
        if (!token) console.warn('⚠️ Turnstile verification failed, proceeding without captcha');
      } else {
        console.log('ℹ️ Turnstile not configured, skipping captcha verification');
      }

      // Send login request with CAPTCHA token
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: AUTH_MESSAGES.LOGIN_FAILED,
          description: json?.message ?? AUTH_MESSAGES.LOGIN_FAILED,
        });
      } else {
        toast({
          title: AUTH_MESSAGES.LOGIN_SUCCESS,
          description: 'Anda berhasil masuk.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: AUTH_MESSAGES.ERROR_OCCURRED,
        description: AUTH_MESSAGES.PLEASE_RETRY,
      });
    } finally {
      setLoadingEmailLogin(false);
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
    { name: 'Masuk', url: 'https://regalpaw.id/auth' }
  ]);

  return (
    <>
      <SEOHead
        title="Masuk ke Akun - Regal Paw"
        description="Masuk ke akun Regal Paw untuk mengakses produk makanan kucing premium, melacak pesanan, dan menikmati layanan eksklusif. Login dengan email atau Google."
        keywords="login, masuk, akun Regal Paw, autentikasi, sign in, makanan kucing"
        canonical="/auth"
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
                Masuk
              </CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                Masuk untuk mulai berbelanja makanan kucing berkualitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Email Login Form */}
              <div className="space-y-4">
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
                />

                <Button
                  onClick={handleEmailLogin}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm py-2"
                  size="lg"
                  disabled={loadingEmailLogin}
                >
                  {loadingEmailLogin && <LoadingSpinner className="h-5 w-5 mr-2 text-white" />}
                  {loadingEmailLogin ? 'Masuk...' : 'Masuk Sekarang'}
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

              {/* Turnstile Widget Container - Visible and Responsive */}
              {TURNSTILE_SITEKEY && (
                <div className="flex justify-center w-full">
                  <div ref={widgetContainerRef as unknown as React.RefObject<HTMLDivElement>} className="w-full" />
                </div>
              )}

              {/* Google Login */}
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
                {loadingGoogle ? 'Memproses...' : 'Lanjutkan dengan Google'}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-2">
                Dengan masuk, Anda menyetujui <a href="/terms" className="underline text-blue-700">syarat dan ketentuan</a> kami.
              </p>

              <div className="text-sm text-center mt-4">
                <span className="text-muted-foreground">Belum punya akun? </span>
                <Link to={AUTH_ROUTES.SIGNUP} className="underline text-blue-700 hover:text-blue-900">
                  Daftar di sini
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
