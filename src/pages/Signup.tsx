import { useEffect, useState, useCallback } from 'react';
import bgLogin from '@/assets/bg/bg-login.webp';
import googleLogo from '@/assets/img/Google__G__logo.svg.png';
import logoImg from '/regalpaw.png';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

// Interface untuk response dari function handle_referral_signup
interface ReferralResponse {
  success: boolean;
  error?: string;
  message?: string;
  reward_points?: number;
  referrer_id?: string;
  referrer_name?: string;
  referral_id?: string;
}

// Interface untuk parameter RPC function (sesuai dengan yang diharapkan Supabase)
interface ReferralParams {
  p_referred_id: string;
  p_referral_code: string;
}

export default function Signup() {
  const { isAuthenticated, signInWithGoogle, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmailSignup, setLoadingEmailSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    // Check if there's a referral code in URL
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);

    // Store referral code for later use (for Google signup too)
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode);
      console.log('🔗 Referral code stored for Google signup:', referralCode);
    }

    const { error } = await signInWithGoogle();
    setLoadingGoogle(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal masuk",
        description: error.message,
      });
    } else {
      console.log('✅ Google signup successful, referral will be processed by useEffect');
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName) {
      toast({
        variant: "destructive",
        title: "Form tidak lengkap",
        description: "Mohon isi semua field yang diperlukan",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password tidak cocok",
        description: "Konfirmasi password harus sama dengan password",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password terlalu pendek",
        description: "Password harus minimal 6 karakter",
      });
      return;
    }

    setLoadingEmailSignup(true);

    try {
      // Store referral code for later use
      if (referralCode) {
        localStorage.setItem('pendingReferralCode', referralCode);
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Gagal mendaftar",
          description: error.message,
        });
      } else {
        toast({
          title: "Pendaftaran berhasil!",
          description: "Silakan cek email Anda untuk konfirmasi akun",
        });

        // Process referral after successful signup
        if (referralCode) {
          console.log('🔗 Processing referral after manual signup:', referralCode);
          // Referral will be processed by useEffect when profile is loaded
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Terjadi kesalahan",
        description: "Silakan coba lagi",
      });
    } finally {
      setLoadingEmailSignup(false);
    }
  };

  // Store referral code for later use after signup
  useEffect(() => {
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode);
      console.log('Referral code stored:', referralCode);
    }
  }, [referralCode]);

  // Handle referral after successful signup (works for both email and Google signup)
  const handleReferral = useCallback(async (refCode: string, retryCount = 0) => {
    console.log('=== REFERRAL DEBUG START ===');
    console.log('refCode:', refCode);
    console.log('profile:', profile);
    console.log('profile.user_id:', profile?.user_id);
    console.log('profile.id:', profile?.id);
    console.log('retryCount:', retryCount);

    if (!refCode || !profile?.user_id) {
      console.log('❌ Missing refCode or profile.user_id, returning');
      console.log('refCode exists:', !!refCode);
      console.log('profile.user_id exists:', !!profile?.user_id);
      return;
    }

    try {
      console.log('🚀 Calling supabase.rpc handle_referral_signup...');
      console.log('Parameters:', {
        referral_code_input: refCode,
        new_user_id: profile.user_id
      });

      // Call the database function with correct parameters
      const { data, error } = await supabase.rpc('handle_referral_signup', {
        referral_code_input: refCode,
        new_user_id: profile.user_id
      });

      console.log('📊 RPC Response:');
      console.log('- data:', data);
      console.log('- error:', error);
      console.log('- data type:', typeof data);
      console.log('- error type:', typeof error);

      if (error) {
        console.error('❌ RPC Error Details:', error);

        // If it's a "function not found" error and we haven't retried too many times, retry
        if (error.message?.includes('function') && retryCount < 2) {
          console.log('🔄 Retrying referral in 2 seconds...');
          setTimeout(() => {
            void handleReferral(refCode, retryCount + 1);
          }, 2000);
          return;
        }

        toast({
          variant: 'destructive',
          title: 'Gagal memproses referral',
          description: error.message || 'Function handle_referral_signup tidak ditemukan di database.',
        });
        return;
      }

      const responseData = data as ReferralResponse;

      if (responseData && responseData.success) {
        console.log('✅ Referral Success!');
        toast({
          title: 'Referral berhasil!',
          description: `Selamat! Anda mendapat ${responseData.reward_points || 100} poin bonus dari referral!`,
        });
      } else {
        console.log('❌ Referral Failed:', responseData?.error || responseData?.message);
        toast({
          variant: 'destructive',
          title: 'Kode referral tidak valid',
          description: responseData?.error || responseData?.message || 'Kode referral tidak dapat diproses.',
        });
      }
    } catch (error) {
      console.error('❌ Catch Error:', error);

      // Retry on network errors
      if (retryCount < 2) {
        console.log('🔄 Retrying referral due to network error...');
        setTimeout(() => {
          void handleReferral(refCode, retryCount + 1);
        }, 2000);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Gagal memproses referral',
        description: 'Terjadi kesalahan sistem. Silakan hubungi admin.',
      });
    }
    console.log('=== REFERRAL DEBUG END ===');
  }, [toast, profile]);

  // Process referral after successful signup (both email and Google)
  useEffect(() => {
    console.log('=== REFERRAL EFFECT TRIGGERED ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('profile:', profile);
    console.log('profile?.user_id:', profile?.user_id);
    console.log('profile?.id:', profile?.id);
    console.log('pendingReferralCode:', localStorage.getItem('pendingReferralCode'));

    if (isAuthenticated && profile?.user_id && profile?.id) {
      const pendingRef = localStorage.getItem('pendingReferralCode');
      console.log('✅ All conditions met, processing referral...');
      console.log('pendingRef:', pendingRef);

      if (pendingRef) {
        console.log('🔄 Processing referral code:', pendingRef);

        // Retry mechanism with exponential backoff
        const processReferralWithRetry = async (retryCount = 0) => {
          const maxRetries = 5;
          const baseDelay = 2000; // 2 seconds
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff

          console.log(`Referral processing attempt ${retryCount + 1}/${maxRetries + 1}, delay: ${delay}ms`);

          try {
            await handleReferral(pendingRef);
            localStorage.removeItem('pendingReferralCode');
            console.log('✅ Referral processed successfully');
          } catch (error) {
            console.error(`❌ Referral attempt ${retryCount + 1} failed:`, error);

            if (retryCount < maxRetries) {
              console.log(`🔄 Retrying in ${delay}ms...`);
              setTimeout(() => {
                void processReferralWithRetry(retryCount + 1);
              }, delay);
            } else {
              console.error('❌ All referral attempts failed');
              toast({
                variant: 'destructive',
                title: 'Gagal memproses referral',
                description: 'Silakan hubungi admin untuk bantuan manual.',
              });
              localStorage.removeItem('pendingReferralCode');
            }
          }
        };

        // Start processing with initial delay
        const timer = setTimeout(() => {
          void processReferralWithRetry();
        }, 2000);

        return () => clearTimeout(timer);
      } else {
        console.log('❌ No pending referral code found');
      }
    } else {
      console.log('❌ Conditions not met:');
      console.log('- isAuthenticated:', isAuthenticated);
      console.log('- profile?.user_id:', profile?.user_id);
      console.log('- profile?.id:', profile?.id);
    }
    console.log('=== REFERRAL EFFECT END ===');
  }, [isAuthenticated, profile, handleReferral, toast]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-primary font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password (min. 6 karakter)"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-primary font-medium">Konfirmasi Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Konfirmasi password Anda"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="!border-2 !border-primary focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

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

              <Button
                onClick={handleEmailSignup}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm py-2"
                size="lg"
                disabled={loadingEmailSignup}
              >
                {loadingEmailSignup ? (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : null}
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
                <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
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
              <Link to="/auth" className="underline text-blue-700 hover:text-blue-900">
                Masuk di sini
              </Link>
            </div>

            <div className="mb-4 text-sm text-muted-foreground text-center">
              <Link to="/" className="underline">Kembali ke Beranda</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}