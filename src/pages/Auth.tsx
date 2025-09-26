import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { isAuthenticated, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    // Check if there's a referral code in URL
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    
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
  useEffect(() => {
    if (isAuthenticated) {
      const pendingRef = localStorage.getItem('pendingReferralCode');
      if (pendingRef) {
        // Process referral
        handleReferral(pendingRef);
        localStorage.removeItem('pendingReferralCode');
      }
    }
  }, [isAuthenticated]);

  const handleReferral = async (refCode: string) => {
    try {
      // Find the referrer
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', refCode)
        .single();

      if (referrer) {
        // Get current user profile
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (currentProfile) {
          // Update current user's referred_by
          await supabase
            .from('profiles')
            .update({ referred_by: referrer.id })
            .eq('id', currentProfile.id);

          // Create referral record
          await supabase
            .from('referrals')
            .insert({
              referrer_id: referrer.id,
              referred_id: currentProfile.id,
              referral_code: refCode,
              reward_points: 10 // Default reward points
            });

          toast({
            title: "Referral berhasil!",
            description: "Anda telah terdaftar menggunakan kode referral.",
          });
        }
      }
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Selamat Datang di Regal Paw</CardTitle>
          <CardDescription>
            Masuk untuk mulai berbelanja makanan kucing berkualitas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralCode && (
            <div className="p-3 bg-accent/50 rounded-lg text-center">
              <p className="text-sm text-accent-foreground">
                🎉 Anda diundang dengan kode: <strong>{referralCode}</strong>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="referral">Kode Referral (Opsional)</Label>
            <Input
              id="referral"
              placeholder="Masukkan kode referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleGoogleSignIn} 
            className="w-full"
            size="lg"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Lanjutkan dengan Google
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Dengan masuk, Anda menyetujui syarat dan ketentuan kami.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}