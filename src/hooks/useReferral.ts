import { useEffect, useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ReferralService } from "@/services/referralService";
import { ReferralStats, ReferralRecord } from "@/types/referral";
import { REFERRAL_CONFIG, REFERRAL_ERROR_MESSAGES, REFERRAL_SUCCESS_MESSAGES } from "@/constants/referral";

export function useReferral() {
  const { isAuthenticated, profile } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralRecord[]>([]);
  const [referralLevel, setReferralLevel] = useState<{ levelId: string; levelName: string; commissionPct: number; totalAmount: number } | null>(null);

  // Load referral stats
  const loadReferralStats = useCallback(async (userId: string) => {
    try {
      const stats = await ReferralService.getReferralStats(userId);
      setReferralStats(stats);
      // compute level after stats load (uses purchases table)
      const level = await ReferralService.computeReferralLevel(userId);
      setReferralLevel(level);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  }, []);

  // Load referral history
  const loadReferralHistory = useCallback(async (userId: string) => {
    try {
      const history = await ReferralService.getReferralHistory(userId);
      setReferralHistory(history);
    } catch (error) {
      console.error('Error loading referral history:', error);
    }
  }, []);

  const handleReferral = useCallback(async (
    refCode: string, 
    userId: string, 
    retryCount = 0
  ): Promise<boolean> => {
    console.log('[REFERRAL] Processing referral:', { refCode, userId, retryCount });
    
    if (!refCode || !userId) {
      console.log('[REFERRAL] Missing refCode or userId');
      toast({ 
        variant: 'destructive', 
        title: 'Referral gagal', 
        description: REFERRAL_ERROR_MESSAGES.INVALID_CODE 
      });
      return false;
    }

    setIsProcessing(true);

    try {
      // First validate the referral code
      const validation = await ReferralService.validateReferralCode(refCode);
      if (!validation.isValid) {
        toast({ 
          variant: 'destructive', 
          title: 'Referral gagal', 
          description: validation.error || REFERRAL_ERROR_MESSAGES.INVALID_CODE 
        });
        return false;
      }

      // Check if user can use referral code
      const canUse = await ReferralService.canUseReferralCode(userId);
      if (!canUse) {
        toast({ 
          variant: 'destructive', 
          title: 'Referral gagal', 
          description: REFERRAL_ERROR_MESSAGES.ALREADY_USED 
        });
        return false;
      }

      // Process the referral
      const result = await ReferralService.processReferralSignup(refCode, userId);
      
      if (result.success) {
        toast({ 
          title: REFERRAL_SUCCESS_MESSAGES.REFERRAL_SUCCESS, 
          description: `Poin berhasil ditambahkan: ${result.pointsAwarded || 0} poin!` 
        });
        
        // Refresh referral stats after successful referral
        if (profile?.user_id) {
          await loadReferralStats(profile.user_id);
        }
        
        return true;
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Referral gagal', 
          description: result.error || REFERRAL_ERROR_MESSAGES.SYSTEM_ERROR 
        });
        
        // Retry logic for network errors
        if (retryCount < REFERRAL_CONFIG.MAX_RETRY_ATTEMPTS) {
          setTimeout(() => {
            handleReferral(refCode, userId, retryCount + 1);
          }, REFERRAL_CONFIG.RETRY_DELAY_MS);
        }
        
        return false;
      }
    } catch (err) {
      console.error('[REFERRAL] Unexpected error:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Referral error', 
        description: REFERRAL_ERROR_MESSAGES.NETWORK_ERROR 
      });
      
      // Retry logic for unexpected errors
      if (retryCount < REFERRAL_CONFIG.MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          handleReferral(refCode, userId, retryCount + 1);
        }, REFERRAL_CONFIG.RETRY_DELAY_MS);
      }
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, profile?.user_id, loadReferralStats]);


  // Validate referral code
  const validateReferralCode = useCallback(async (code: string) => {
    return await ReferralService.validateReferralCode(code);
  }, []);

  // Generate referral code for current user
  const generateReferralCode = useCallback((userName?: string) => {
    if (!profile?.user_id) return null;
    return ReferralService.generateReferralCode(profile.user_id, userName);
  }, [profile?.user_id]);

  // Process pending referral from localStorage
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | undefined;
    let pollingAttempts = 0;

    if (isAuthenticated && profile?.user_id) {
      const pendingRef = localStorage.getItem(REFERRAL_CONFIG.STORAGE_KEYS.PENDING_REFERRAL);
      
      if (pendingRef) {
        const tryProcessReferral = async () => {
          pollingAttempts++;
          
          if (profile?.user_id && !isProcessing) {
            const success = await handleReferral(pendingRef, profile.user_id);
            if (success) {
              localStorage.removeItem(REFERRAL_CONFIG.STORAGE_KEYS.PENDING_REFERRAL);
              if (pollingInterval) clearInterval(pollingInterval);
            }
          } else if (pollingAttempts >= REFERRAL_CONFIG.MAX_POLLING_ATTEMPTS) {
            // Stop polling after max attempts
            localStorage.removeItem(REFERRAL_CONFIG.STORAGE_KEYS.PENDING_REFERRAL);
            if (pollingInterval) clearInterval(pollingInterval);
            console.log('[REFERRAL] Max polling attempts reached, stopping...');
          } else {
            console.log('[REFERRAL POLLING] Waiting for profile.user_id...', { attempts: pollingAttempts });
          }
        };

        pollingInterval = setInterval(tryProcessReferral, REFERRAL_CONFIG.POLLING_INTERVAL_MS);
        tryProcessReferral();
      }
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isAuthenticated, profile?.user_id, handleReferral, isProcessing]);

  // Load referral data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && profile?.user_id) {
      loadReferralStats(profile.user_id);
      loadReferralHistory(profile.user_id);
    }
  }, [isAuthenticated, profile?.user_id, loadReferralStats, loadReferralHistory]);

  return {
    handleReferral,
    validateReferralCode,
    generateReferralCode,
    loadReferralStats,
    loadReferralHistory,
    isProcessing,
    referralStats,
    referralHistory,
    referralLevel
  };
}
