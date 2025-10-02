import { useEffect, useState, useCallback } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { isAuthenticated, signInWithGoogle, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    // Check if there's a referral code in URL
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

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

  // Store referral code for later use after signup
  useEffect(() => {
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode);
    }
  }, [referralCode]);

  // Handle referral after successful signup
  const handleReferral = useCallback(async (refCode: string) => {
    try {
      // Find the referrer (still needs DB)
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', refCode)
        .single();

      if (!referrer) return;

      // Prefer the cached profile from useAuth to avoid an extra DB read.
      // If it's not available yet, fall back to querying the profiles table once.
      let currentProfileId: string | null = profile?.id ?? null;
      if (!currentProfileId) {
        const userResp = await supabase.auth.getUser();
        const userId = userResp.data.user?.id;
        if (userId) {
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
          currentProfileId = currentProfile?.id ?? null;
        }
      }

      if (!currentProfileId) return;

      // Update current user's referred_by and create referral record
      await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', currentProfileId);

      await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_id: currentProfileId,
          referral_code: refCode,
          reward_points: 10, // Default reward points
        });

      toast({
        title: 'Referral berhasil!',
        description: 'Anda telah terdaftar menggunakan kode referral.',
      });
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  }, [toast, profile]);

  useEffect(() => {
    if (isAuthenticated) {
      const pendingRef = localStorage.getItem('pendingReferralCode');
      if (pendingRef) {
        // Process referral
        void handleReferral(pendingRef);
        localStorage.removeItem('pendingReferralCode');
      }
    }
  }, [isAuthenticated, handleReferral]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--brand-cream))] via-[hsl(var(--brand-orange-light))] to-[hsl(var(--brand-orange))] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-0">
          <div className="flex justify-center">
            <img src="/regalpaw.png" alt="Regal Paw" className="h-14 w-auto" />
          </div>
          <CardDescription className="text-base mt-2 text-gray-600">
            Masuk untuk mulai berbelanja makanan kucing berkualitas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {referralCode && (
            <div className="p-3 bg-orange-100 rounded-lg text-center border border-orange-200">
              <p className="text-sm text-orange-700">
                🎉 Anda diundang dengan kode: <strong>{referralCode}</strong>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="referral" className="text-blue-900">Kode Referral (Opsional)</Label>
            <Input
              id="referral"
              placeholder="Masukkan kode referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="focus:ring-blue-400"
            />
          </div>

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
              <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.73 1.23 9.24 3.25l6.91-6.91C36.53 2.36 30.64 0 24 0 14.64 0 6.27 5.64 2.18 14.07l8.06 6.27C12.99 14.09 18.01 9.5 24 9.5z" /><path fill="#34A853" d="M46.09 24.59c0-1.64-.15-3.22-.43-4.75H24v9.02h12.41c-.53 2.86-2.13 5.28-4.53 6.91l7.09 5.52C43.73 37.36 46.09 31.41 46.09 24.59z" /><path fill="#FBBC05" d="M10.24 28.34c-.62-1.86-.98-3.84-.98-5.84s.36-3.98.98-5.84l-8.06-6.27C.73 14.64 0 19.13 0 24s.73 9.36 2.18 13.07l8.06-6.27z" /><path fill="#EA4335" d="M24 46c6.64 0 12.53-2.36 16.91-6.34l-7.09-5.52c-2.01 1.35-4.57 2.16-7.32 2.16-5.99 0-11.01-4.59-13.76-10.84l-8.06 6.27C6.27 42.36 14.64 48 24 48z" /></g></svg>
            )}
            {loadingGoogle ? 'Memproses...' : 'Lanjutkan dengan Google'}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-2">
            Dengan masuk, Anda menyetujui <a href="/terms" className="underline text-blue-700">syarat dan ketentuan</a> kami.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}