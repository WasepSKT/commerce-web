import { supabase } from '@/integrations/supabase/client';
import { 
  ReferralResponse, 
  ReferralValidation, 
  ReferralProcessResult, 
  ReferralStats,
  ReferralLevel,
  ReferralSettings,
  ReferralRecord
} from '@/types/referral';
import { 
  REFERRAL_CONFIG, 
  REFERRAL_ERROR_MESSAGES, 
  REFERRAL_SUCCESS_MESSAGES 
} from '@/constants/referral';

export class ReferralService {
  /**
   * Validate referral code
   */
  static async validateReferralCode(code: string): Promise<ReferralValidation> {
    try {
      if (!code || code.trim().length < REFERRAL_CONFIG.MIN_REFERRAL_CODE_LENGTH) {
        return {
          isValid: false,
          error: REFERRAL_ERROR_MESSAGES.INVALID_CODE
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, referral_code')
        .eq('referral_code', code.trim())
        .single();

      if (error || !data) {
        return {
          isValid: false,
          error: REFERRAL_ERROR_MESSAGES.INVALID_CODE
        };
      }

      return {
        isValid: true,
        referrerId: data.id,
        referrerName: data.full_name
      };
    } catch (error) {
      console.error('Referral validation error:', error);
      return {
        isValid: false,
        error: REFERRAL_ERROR_MESSAGES.SYSTEM_ERROR
      };
    }
  }

  /**
   * Compute referral level from total amount of purchases by referred users
   */
  static async computeReferralLevel(userId: string): Promise<{ levelId: string; levelName: string; commissionPct: number; totalAmount: number }> {
    try {
      // Sum of successful referral purchases for this referrer
      const { data, error } = await supabase
        .from('referral_purchases')
        .select('amount')
        .eq('referrer_id', userId)
        .eq('status', 'completed');

      if (error) throw error;

      const totalAmount = (data || []).reduce((sum, row) => sum + Number((row as { amount?: number }).amount || 0), 0);

      // Try dynamic levels from DB first
      const { data: levelRows, error: levelErr } = await supabase
        .from('referral_levels')
        .select('id,name,min_amount,commission_pct,priority,active')
        .eq('active', true)
        .order('priority', { ascending: true });

      let pickedId = 'bronze';
      let pickedName = 'Bronze';
      let pickedPct = 0.03;

      if (!levelErr && Array.isArray(levelRows) && levelRows.length > 0) {
        // choose highest level where totalAmount >= min_amount
        const sorted = levelRows.sort((a, b) => Number(a.priority ?? 0) - Number(b.priority ?? 0));
        for (const lv of sorted) {
          if (totalAmount >= Number(lv.min_amount ?? 0)) {
            pickedId = String(lv.id ?? pickedId);
            pickedName = String(lv.name ?? pickedName);
            pickedPct = Number(lv.commission_pct ?? pickedPct);
          }
        }
      } else {
        // Fallback to static config if table not available
        const levels = [...REFERRAL_CONFIG.LEVELS].sort((a, b) => a.priority - b.priority);
        let picked = levels[0];
        for (const lv of levels) {
          if (totalAmount >= lv.min_amount) picked = lv as unknown as typeof picked;
        }
        pickedId = picked.id;
        pickedName = picked.name;
        pickedPct = picked.commission_pct;
      }

      return { levelId: pickedId, levelName: pickedName, commissionPct: pickedPct, totalAmount };
    } catch (err) {
      console.error('Failed to compute referral level', err);
      // Fallback to lowest level
      const lv = REFERRAL_CONFIG.LEVELS[0];
      return { levelId: lv.id, levelName: lv.name, commissionPct: lv.commission_pct, totalAmount: 0 };
    }
  }

  /**
   * Process referral signup with corrected logic
   * Only referrer gets points, referee gets no points
   */
  static async processReferralSignup(
    referralCode: string, 
    userId: string
  ): Promise<ReferralProcessResult> {
    try {
      console.log('[REFERRAL SERVICE] Processing referral:', { referralCode, userId });

      // Validate inputs
      if (!referralCode || !userId) {
        return {
          success: false,
          error: REFERRAL_ERROR_MESSAGES.INVALID_CODE
        };
      }

      // Call the updated database function
      const { data, error } = await supabase.rpc('handle_referral_signup', {
        referral_code_input: referralCode.trim(),
        new_user_id: userId
      });

      if (error) {
        console.error('[REFERRAL SERVICE] RPC Error:', error);
        return {
          success: false,
          error: error.message || REFERRAL_ERROR_MESSAGES.SYSTEM_ERROR
        };
      }

  // Parse response (cast via unknown first to satisfy TS safety)
  const response = (data as unknown) as ReferralResponse;
      
      if (response.success) {
        return {
          success: true,
          referralId: response.referral_id,
          pointsAwarded: response.referrer_points || 0,
          message: REFERRAL_SUCCESS_MESSAGES.REFERRAL_SUCCESS
        };
      } else {
        return {
          success: false,
          error: response.error || response.message || REFERRAL_ERROR_MESSAGES.SYSTEM_ERROR
        };
      }
    } catch (error) {
      console.error('[REFERRAL SERVICE] Unexpected error:', error);
      return {
        success: false,
        error: REFERRAL_ERROR_MESSAGES.SYSTEM_ERROR
      };
    }
  }

  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: string): Promise<ReferralStats | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          referral_code,
          referral_points,
          referred_invites_count,
          referred_purchases_total
        `)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }
      // Narrow the result into a safe local shape
      const row = (data as unknown) as {
        id?: string;
        referral_code?: string | null;
        referral_points?: number | null;
        referred_invites_count?: number | null;
        referred_purchases_total?: number | null;
      };

      // Get total referrals count
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', row.id);

      // Fetch level info based on total purchases amount
      let levelName: string | null = null;
      let commissionRate: number | null = null;
      
      const totalAmount = row.referred_purchases_total || 0;
      
      if (totalAmount > 0) {
        const { data: levelsData } = await supabase
          .from('referral_levels')
          .select('name, commission_pct, min_amount, max_amount, priority')
          .eq('active', true)
          .order('priority', { ascending: false });
        
        if (levelsData) {
          // Find the highest level where totalAmount >= min_amount
          const matchingLevel = levelsData
            .filter(l => (Number(l.min_amount) || 0) <= totalAmount)
            .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0))[0];
          
          if (matchingLevel) {
            levelName = matchingLevel.name || null;
            commissionRate = matchingLevel.commission_pct ?? null;
          }
        }
      }

      return {
        total_referrals: count || 0,
        total_points_earned: row.referral_points || 0,
        active_referrals: row.referred_invites_count || 0,
        referral_code: row.referral_code || '',
        level: levelName,
        commission_rate: commissionRate
      };
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      return null;
    }
  }

  /**
   * Get referral history for a user
   */
  static async getReferralHistory(userId: string): Promise<ReferralRecord[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_profile:profiles!referrals_referred_id_fkey(
            full_name,
            email,
            created_at
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referral history:', error);
        return [];
      }

      // Normalize and cast rows to ReferralRecord[] safely
      const rows = (data ?? []) as unknown[];
      const normalizeStatus = (s: unknown) => {
        const st = String(s ?? '').toLowerCase();
        if (st === 'active') return 'active';
        if (st === 'expired') return 'expired';
        return 'inactive';
      };

      const mapped = rows.map(r => {
        const rec = r as Record<string, unknown>;
        return {
          created_at: String(rec.created_at ?? ''),
          id: String(rec.id ?? ''),
          referral_code: String(rec.referral_code ?? ''),
          referred_id: String(rec.referred_id ?? ''),
          referrer_id: String(rec.referrer_id ?? ''),
          reward_points: Number(rec.reward_points ?? 0),
          status: normalizeStatus(rec.status),
          updated_at: String(rec.updated_at ?? ''),
          referred_profile: (rec.referred_profile as Record<string, unknown> | undefined) ? {
            full_name: String((rec.referred_profile as Record<string, unknown>).full_name ?? ''),
            email: String((rec.referred_profile as Record<string, unknown>).email ?? ''),
            created_at: String((rec.referred_profile as Record<string, unknown>).created_at ?? '')
          } : undefined
        } as ReferralRecord;
      });

      return mapped;
    } catch (error) {
      console.error('Error fetching referral history:', error);
      return [];
    }
  }

  /**
   * Get referral levels
   */
  static async getReferralLevels(): Promise<ReferralLevel[]> {
    try {
      const { data, error } = await supabase
        .from('referral_levels')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });
      
      if (error) {
        console.error('Error fetching referral levels:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching referral levels:', error);
      return [];
    }
  }

  /**
   * Get referral settings
   */
  static async getReferralSettings(): Promise<ReferralSettings | null> {
    try {
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching referral settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching referral settings:', error);
      return null;
    }
  }

  /**
   * Generate unique referral code for user
   */
  static generateReferralCode(userId: string, userName?: string): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    const userPrefix = userName ? userName.substring(0, 3).toUpperCase() : 'REF';
    
    return `${userPrefix}${timestamp}${randomStr}`.toUpperCase();
  }

  /**
   * Check if user can use referral code
   */
  static async canUseReferralCode(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', userId)
        .limit(1);

      if (error) {
        console.error('Error checking referral eligibility:', error);
        return false;
      }

      // If no referral record exists, user can use referral code
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking referral eligibility:', error);
      return false;
    }
  }
}

// Legacy ReferralLevelService for backward compatibility
export class ReferralLevelService {
  static async fetchLevels(): Promise<{ data: ReferralLevel[] | null; error: Error | null }> {
    try {
      const levels = await ReferralService.getReferralLevels();
      return { data: levels, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async saveLevel(
    formData: Record<string, unknown>, 
    editingLevel: ReferralLevel | null
  ): Promise<{ error: Error | null }> {
    try {
    // Normalize and validate incoming form values before sending to DB
    const nameVal = String(formData.name ?? '');
    const minAmount = Number(formData.min_amount) || 0;
    const maxAmount = formData.max_amount != null ? Number(formData.max_amount) : null;
    const commissionRaw = Number(formData.commission_pct);
    const commissionPct = Number.isFinite(commissionRaw) ? commissionRaw / 100 : 0.05;
    const priority = Number(formData.priority) || 0;
    const active = Boolean(formData.active ?? true);

    const payload = {
      name: nameVal,
      min_amount: minAmount,
      max_amount: maxAmount,
      commission_pct: commissionPct,
      priority,
      active,
    };

      if (editingLevel) {
        const { error } = await supabase
          .from('referral_levels')
          .update(payload)
          .eq('id', editingLevel.id);
        return { error };
      } else {
        const { error } = await supabase
          .from('referral_levels')
          .insert(payload);
        return { error };
      }
    } catch (error) {
      return { error: error as Error };
    }
  }

  static async deleteLevel(levelId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('referral_levels')
        .delete()
        .eq('id', levelId);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }
}