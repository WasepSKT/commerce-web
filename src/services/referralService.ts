// Service for Referral Level API operations
import { supabase } from '@/integrations/supabase/client';
import { LevelRow, FormData } from '@/types/referral';
import { parseAmount } from '@/lib/referralUtils';

export class ReferralLevelService {
  // Fetch all referral levels
  static async fetchLevels(): Promise<{ data: LevelRow[] | null; error: Error | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('referral_levels')
        .select('*')
        .order('priority', { ascending: false });
      
      return { data: data as LevelRow[], error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Save (create or update) referral level
  static async saveLevel(
    formData: FormData, 
    editingLevel: LevelRow | null
  ): Promise<{ error: Error | null }> {
    const min = parseAmount(formData.min_amount ?? '0') ?? 0;
    const max = parseAmount(formData.max_amount ?? null);
    
    // formData.weight is already in integer percentage format (5 for 5%), use directly
    const weight = formData.weight ?? 5; // default 5%

    const payload = {
      name: formData.name,
      min_amount: min,
      max_amount: max,
      weight: weight, // Store as decimal (e.g., 0.05 for 5%)
      priority: Number(formData.priority ?? 0),
      active: Boolean(formData.active ?? true),
    };

    try {
      if (editingLevel) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('referral_levels')
          .update(payload)
          .eq('id', editingLevel.id);
        return { error };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('referral_levels')
          .insert(payload);
        return { error };
      }
    } catch (error) {
      return { error };
    }
  }

  // Delete referral level
  static async deleteLevel(levelId: string): Promise<{ error: Error | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('referral_levels')
        .delete()
        .eq('id', levelId);
      return { error };
    } catch (error) {
      return { error };
    }
  }
}