import { useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReferralResponse {
  success: boolean;
  error?: string;
  message?: string;
  reward_points?: number;
  referrer_id?: string;
  referrer_name?: string;
  referral_id?: string;
}

export function useReferral() {
  const { isAuthenticated, profile } = useAuth();
  const { toast } = useToast();

  const handleReferral = useCallback(async (refCode: string, userId: string, retryCount = 0) => {
    console.log('[REFERRAL] START', { refCode, userId, retryCount });
    if (!refCode || !userId) {
      console.log('[REFERRAL] Missing refCode or userId');
      return;
    }
    try {
      const { data, error } = await supabase.rpc('handle_referral_signup', {
        referral_code_input: refCode,
        new_user_id: userId
      });
      console.log('[REFERRAL] RPC Response:', { data, error });
  // Supabase RPC returns unknown — cast via `unknown` first and validate runtime shape
  const responseData = data as unknown as ReferralResponse | null;
      if (error) {
        toast({ variant: 'destructive', title: 'Gagal referral', description: error.message });
        if (error.message?.includes('function') && retryCount < 2) {
          setTimeout(() => handleReferral(refCode, userId, retryCount + 1), 2000);
        }
        return;
      }

      // Validate shape before trusting fields
      if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData) || !('success' in responseData)) {
        // Attempt to handle JSON-string responses or unexpected shapes
        let parsed: ReferralResponse | null = null;
        try {
          if (typeof data === 'string') parsed = JSON.parse(data) as ReferralResponse;
        } catch (e) {
          // ignore
        }
        if (!parsed) {
          toast({ variant: 'destructive', title: 'Referral gagal', description: 'Response RPC tidak sesuai format.' });
          return;
        }
        if (parsed.success) {
          toast({ title: 'Referral berhasil!', description: `Bonus: ${parsed.reward_points || 100} poin!` });
        } else {
          toast({ variant: 'destructive', title: 'Referral gagal', description: parsed?.error || parsed?.message || 'Kode tidak valid.' });
        }
        return;
      }

      // At this point TypeScript knows responseData is object-like and has 'success'
      const rr = responseData as ReferralResponse;
      if (rr.success) {
        toast({ title: 'Referral berhasil!', description: `Bonus: ${rr.reward_points || 100} poin!` });
      } else {
        toast({ variant: 'destructive', title: 'Referral gagal', description: rr?.error || rr?.message || 'Kode tidak valid.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Referral error', description: String(err) });
      if (retryCount < 2) setTimeout(() => handleReferral(refCode, userId, retryCount + 1), 2000);
    }
    console.log('[REFERRAL] END');
  }, [toast]);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | undefined;
    if (isAuthenticated) {
      const pendingRef = localStorage.getItem('pendingReferralCode');
      if (pendingRef) {
        const tryProcessReferral = () => {
          if (profile?.user_id) {
            handleReferral(pendingRef, profile.user_id);
            localStorage.removeItem('pendingReferralCode');
            if (pollingInterval) clearInterval(pollingInterval);
          } else {
            console.log('[REFERRAL POLLING] Menunggu profile.user_id...');
          }
        };
        pollingInterval = setInterval(tryProcessReferral, 1000);
        tryProcessReferral();
      }
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isAuthenticated, profile, handleReferral]);
}
