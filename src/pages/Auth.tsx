import { useState, useEffect } from 'react';
import { useTurnstile } from '@/hooks/useTurnstile';
import bgLogin from '@/assets/bg/bg-login.webp';
import googleLogo from '@/assets/img/Google__G__logo.svg.png';
import logoImg from '/regalpaw.png';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedRedirect, UserRole } from '@/utils/rolePermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';

export default function Auth() {
  const { isAuthenticated, signInWithGoogle, profile } = useAuth();
  const { toast } = useToast();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmailLogin, setLoadingEmailLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Turnstile via hook (handles sitekey, script, render, execute)
  const { sitekey: TURNSTILE_SITEKEY, containerRef: widgetContainerRef, execute: executeTurnstile } = useTurnstile();

  // Debug Turnstile configuration
  useEffect(() => {
    const env = import.meta.env as Record<string, string | boolean | undefined>;
    console.log('🔧 Turnstile Debug Info:', {
      sitekey: TURNSTILE_SITEKEY,
      hasSitekey: !!TURNSTILE_SITEKEY,
      sitekeyLength: TURNSTILE_SITEKEY?.length || 0,
      env_available: {
        direct: typeof env.VITE_TURNSTILE_SITEKEY === 'string' ? '✅' : '❌',
        dev: typeof env.VITE_TURNSTILE_SITEKEY_DEV === 'string' ? '✅' : '❌',
        stg: typeof env.VITE_TURNSTILE_SITEKEY_STG === 'string' ? '✅' : '❌',
        prod: typeof env.VITE_TURNSTILE_SITEKEY_PROD === 'string' ? '✅' : '❌',
      }
    });
  }, [TURNSTILE_SITEKEY]);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    const { error } = await signInWithGoogle();
    setLoadingGoogle(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal masuk",
        description: error.message,
      });
    }
  };

  // Note: We rely on supabase-js client persistence for OAuth redirects
  // (sessions are stored in localStorage). No server-side /api/set-session
  // call is required in a client-only setup.

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Form tidak lengkap",
        description: "Mohon isi email dan password",
      });
      return;
    }

    setLoadingEmailLogin(true);
    try {
      let token: string | null = null;
      if (TURNSTILE_SITEKEY && TURNSTILE_SITEKEY.trim() !== '') {
        console.log('🔒 Turnstile configured, attempting verification...');
        token = await executeTurnstile();
        if (!token) console.warn('⚠️ Turnstile verification failed, proceeding without captcha');
      } else {
        console.log('ℹ️ Turnstile not configured, skipping captcha verification');
      }

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Gagal masuk', description: json?.message ?? 'Login gagal' });
      } else {
        // Login success — server sets HttpOnly cookie for refresh token
        toast({ title: 'Berhasil', description: 'Anda berhasil masuk.' });
        // Optionally redirect or rely on isAuthenticated from useAuth to update
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Terjadi kesalahan", description: "Silakan coba lagi" });
    } finally {
      setLoadingEmailLogin(false);
    }
  };

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

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-primary font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="!border-2 !border-primary focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleEmailLogin}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm py-2"
                  size="lg"
                  disabled={loadingEmailLogin}
                >
                  {loadingEmailLogin ? (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : null}
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
                  <div ref={widgetContainerRef as unknown as React.RefObject<HTMLDivElement>} className="w-full max-w-[320px]" />
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
                  <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
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
                <Link to="/signup" className="underline text-blue-700 hover:text-blue-900">
                  Daftar di sini
                </Link>
              </div>

              <div className="mb-4 text-sm text-muted-foreground text-center">
                <Link to="/" className="underline">Kembali ke Beranda</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}