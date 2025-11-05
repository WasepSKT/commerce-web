import { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useAuth } from '@/hooks/useAuth';
import { useSignupForm } from '@/hooks/useSignupForm';
import { useSignupHandlers } from '@/hooks/useSignupHandlers';
import { getRoleBasedRedirect, UserRole } from '@/utils/rolePermissions';
import { logTurnstileDebug } from '@/utils/turnstileDebug';
import { AUTH_ROUTES } from '@/constants/auth';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';
import bgLogin from '@/assets/bg/bg-login.webp';
import logoImg from '/regalpaw.png';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SEOHead from '@/components/seo/SEOHead';
import { SignupForm } from '@/components/auth/SignupForm';

export default function Signup() {
  const { isAuthenticated, profile } = useAuth();
  const { formData, updateField } = useSignupForm();
  const { sitekey: TURNSTILE_SITEKEY, containerRef: widgetContainerRef, execute: executeTurnstile } = useTurnstile();

  const { handleGoogleSignIn, handleEmailSignup, loadingGoogle, loadingEmailSignup } = useSignupHandlers(
    formData,
    executeTurnstile,
    TURNSTILE_SITEKEY
  );

  // Debug Turnstile configuration (development only)
  useEffect(() => {
    logTurnstileDebug(TURNSTILE_SITEKEY);
  }, [TURNSTILE_SITEKEY]);

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
              <SignupForm
                formData={formData}
                onFieldChange={updateField}
                onEmailSignup={handleEmailSignup}
                onGoogleSignIn={handleGoogleSignIn}
                loadingEmail={loadingEmailSignup}
                loadingGoogle={loadingGoogle}
                turnstileContainerRef={widgetContainerRef as unknown as React.RefObject<HTMLDivElement>}
                showTurnstile={!!TURNSTILE_SITEKEY}
              />

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
