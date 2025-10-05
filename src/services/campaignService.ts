import { supabase } from '@/integrations/supabase/client';
import { campaignImageService, type CampaignImageBucket } from './campaignImageService';

// Temporary type assertion for campaign tables until migration is run
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseTyped = supabase as any;

// Type definitions for campaigns
export interface HeroSliderItem {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  button_text?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FixedBanner {
  id: string;
  name: string;
  position: 'left' | 'right';
  image_url: string;
  link_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PopupCampaign {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  show_frequency: 'once' | 'daily' | 'always';
  delay_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Input types for creating/updating campaigns
export type CreateHeroSliderInput = Omit<HeroSliderItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateHeroSliderInput = Partial<CreateHeroSliderInput>;

export type CreateFixedBannerInput = Omit<FixedBanner, 'id' | 'created_at' | 'updated_at'>;
export type UpdateFixedBannerInput = Partial<CreateFixedBannerInput>;

export type CreatePopupCampaignInput = Omit<PopupCampaign, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePopupCampaignInput = Partial<CreatePopupCampaignInput>;

class CampaignService {
  
  // ========== HERO SLIDER METHODS ==========
  
  /**
   * Get all hero slider items
   */
  async getHeroSliderItems(): Promise<HeroSliderItem[]> {
    try {
      const { data, error } = await supabaseTyped
        .from('hero_slider_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching hero slider items:', error);
        throw new Error('Gagal mengambil data slider hero');
      }

      return (data as unknown as HeroSliderItem[]) || [];
    } catch (error) {
      console.error('Exception in getHeroSliderItems:', error);
      throw error;
    }
  }

  /**
   * Create new hero slider item with image upload
   */
  async createHeroSliderItem(
    input: CreateHeroSliderInput,
    imageFile?: File
  ): Promise<HeroSliderItem> {
    try {
      let imageUrl = input.image_url;

      // Upload image if provided
      if (imageFile) {
        const uploadResult = await campaignImageService.uploadImage(
          imageFile,
          'hero-slider-images'
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Gagal mengupload gambar');
        }

        imageUrl = uploadResult.url!;
      }

      // Insert to database
      const { data, error } = await supabaseTyped
        .from('hero_slider_items')
        .insert({
          ...input,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating hero slider item:', error);
        
        // Clean up uploaded image if database insert fails
        if (imageFile && imageUrl) {
          await campaignImageService.deleteImage(imageUrl, 'hero-slider-images');
        }
        
        throw new Error('Gagal membuat item slider hero');
      }

      return data as unknown as HeroSliderItem;
    } catch (error) {
      console.error('Exception in createHeroSliderItem:', error);
      throw error;
    }
  }

  /**
   * Update hero slider item
   */
  async updateHeroSliderItem(
    id: string,
    input: UpdateHeroSliderInput,
    imageFile?: File,
    deleteExistingImage: boolean = false
  ): Promise<HeroSliderItem> {
    try {
      const updateData = { ...input };

      // Handle image update/deletion
      if (imageFile || deleteExistingImage) {
        // Get current item to get existing image URL
        const { data: currentItem } = await supabaseTyped
          .from('hero_slider_items')
          .select('image_url')
          .eq('id', id)
          .single();

        const oldImageUrl = currentItem?.image_url;

        if (imageFile) {
          // Upload new image
          const uploadResult = await campaignImageService.uploadImage(
            imageFile,
            'hero-slider-images'
          );

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Gagal mengupload gambar');
          }

          updateData.image_url = uploadResult.url!;
        } else if (deleteExistingImage) {
          updateData.image_url = '';
        }

        // Delete old image if it exists and we're replacing/removing it
        if (oldImageUrl && (imageFile || deleteExistingImage)) {
          await campaignImageService.deleteImage(oldImageUrl, 'hero-slider-images');
        }
      }

      // Update in database
      const { data, error } = await supabaseTyped
        .from('hero_slider_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating hero slider item:', error);
        throw new Error('Gagal memperbarui item slider hero');
      }

      return data as unknown as HeroSliderItem;
    } catch (error) {
      console.error('Exception in updateHeroSliderItem:', error);
      throw error;
    }
  }

  /**
   * Delete hero slider item
   */
  async deleteHeroSliderItem(id: string): Promise<void> {
    try {
      // Get item to delete associated image
      const { data: item } = await supabaseTyped
        .from('hero_slider_items')
        .select('image_url')
        .eq('id', id)
        .single();

      // Delete from database
      const { error } = await supabaseTyped
        .from('hero_slider_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting hero slider item:', error);
        throw new Error('Gagal menghapus item slider hero');
      }

      // Delete associated image
      if (item?.image_url) {
        await campaignImageService.deleteImage(item.image_url, 'hero-slider-images');
      }
    } catch (error) {
      console.error('Exception in deleteHeroSliderItem:', error);
      throw error;
    }
  }

  /**
   * Reorder hero slider items
   */
  async reorderHeroSliderItems(itemIds: string[]): Promise<void> {
    try {
      const updates = itemIds.map((id, index) => ({
        id,
        order_index: index
      }));

      for (const update of updates) {
        await supabaseTyped
          .from('hero_slider_items')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Exception in reorderHeroSliderItems:', error);
      throw new Error('Gagal mengubah urutan slider');
    }
  }

  // ========== FIXED BANNER METHODS ==========

  /**
   * Get all fixed banners
   */
  async getFixedBanners(): Promise<FixedBanner[]> {
    try {
      const { data, error } = await supabaseTyped
        .from('fixed_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fixed banners:', error);
        throw new Error('Gagal mengambil data banner tetap');
      }

      return (data as unknown as FixedBanner[]) || [];
    } catch (error) {
      console.error('Exception in getFixedBanners:', error);
      throw error;
    }
  }

  /**
   * Create new fixed banner
   */
  async createFixedBanner(
    input: CreateFixedBannerInput,
    imageFile?: File
  ): Promise<FixedBanner> {
    try {
      let imageUrl = input.image_url;

      if (imageFile) {
        const uploadResult = await campaignImageService.uploadImage(
          imageFile,
          'fixed-banner-images'
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Gagal mengupload gambar');
        }

        imageUrl = uploadResult.url!;
      }

      const { data, error } = await supabaseTyped
        .from('fixed_banners')
        .insert({
          ...input,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating fixed banner:', error);
        
        if (imageFile && imageUrl) {
          await campaignImageService.deleteImage(imageUrl, 'fixed-banner-images');
        }
        
        throw new Error('Gagal membuat banner tetap');
      }

      return data as unknown as FixedBanner;
    } catch (error) {
      console.error('Exception in createFixedBanner:', error);
      throw error;
    }
  }

  /**
   * Update fixed banner
   */
  async updateFixedBanner(
    id: string,
    input: UpdateFixedBannerInput,
    imageFile?: File,
    deleteExistingImage: boolean = false
  ): Promise<FixedBanner> {
    try {
      const updateData = { ...input };

      if (imageFile || deleteExistingImage) {
        const { data: currentItem } = await supabaseTyped
          .from('fixed_banners')
          .select('image_url')
          .eq('id', id)
          .single();

        const oldImageUrl = currentItem?.image_url;

        if (imageFile) {
          const uploadResult = await campaignImageService.uploadImage(
            imageFile,
            'fixed-banner-images'
          );

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Gagal mengupload gambar');
          }

          updateData.image_url = uploadResult.url!;
        } else if (deleteExistingImage) {
          updateData.image_url = '';
        }

        if (oldImageUrl && (imageFile || deleteExistingImage)) {
          await campaignImageService.deleteImage(oldImageUrl, 'fixed-banner-images');
        }
      }

      const { data, error } = await supabaseTyped
        .from('fixed_banners')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating fixed banner:', error);
        throw new Error('Gagal memperbarui banner tetap');
      }

      return data as unknown as FixedBanner;
    } catch (error) {
      console.error('Exception in updateFixedBanner:', error);
      throw error;
    }
  }

  /**
   * Delete fixed banner
   */
  async deleteFixedBanner(id: string): Promise<void> {
    try {
      const { data: item } = await supabaseTyped
        .from('fixed_banners')
        .select('image_url')
        .eq('id', id)
        .single();

      const { error } = await supabaseTyped
        .from('fixed_banners')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting fixed banner:', error);
        throw new Error('Gagal menghapus banner tetap');
      }

      if (item?.image_url) {
        await campaignImageService.deleteImage(item.image_url, 'fixed-banner-images');
      }
    } catch (error) {
      console.error('Exception in deleteFixedBanner:', error);
      throw error;
    }
  }

  // ========== POPUP CAMPAIGN METHODS ==========

  /**
   * Get all popup campaigns
   */
  async getPopupCampaigns(): Promise<PopupCampaign[]> {
    try {
      const { data, error } = await supabaseTyped
        .from('popup_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching popup campaigns:', error);
        throw new Error('Gagal mengambil data kampanye popup');
      }

      return (data as unknown as PopupCampaign[]) || [];
    } catch (error) {
      console.error('Exception in getPopupCampaigns:', error);
      throw error;
    }
  }

  /**
   * Create new popup campaign
   */
  async createPopupCampaign(
    input: CreatePopupCampaignInput,
    imageFile?: File
  ): Promise<PopupCampaign> {
    try {
      let imageUrl = input.image_url;

      if (imageFile) {
        const uploadResult = await campaignImageService.uploadImage(
          imageFile,
          'popup-campaign-images'
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Gagal mengupload gambar');
        }

        imageUrl = uploadResult.url!;
      }

      const { data, error } = await supabaseTyped
        .from('popup_campaigns')
        .insert({
          ...input,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating popup campaign:', error);
        
        if (imageFile && imageUrl) {
          await campaignImageService.deleteImage(imageUrl, 'popup-campaign-images');
        }
        
        throw new Error('Gagal membuat kampanye popup');
      }

      return data as unknown as PopupCampaign;
    } catch (error) {
      console.error('Exception in createPopupCampaign:', error);
      throw error;
    }
  }

  /**
   * Update popup campaign
   */
  async updatePopupCampaign(
    id: string,
    input: UpdatePopupCampaignInput,
    imageFile?: File,
    deleteExistingImage: boolean = false
  ): Promise<PopupCampaign> {
    try {
      const updateData = { ...input };

      if (imageFile || deleteExistingImage) {
        const { data: currentItem } = await supabaseTyped
          .from('popup_campaigns')
          .select('image_url')
          .eq('id', id)
          .single();

        const oldImageUrl = currentItem?.image_url;

        if (imageFile) {
          const uploadResult = await campaignImageService.uploadImage(
            imageFile,
            'popup-campaign-images'
          );

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Gagal mengupload gambar');
          }

          updateData.image_url = uploadResult.url!;
        } else if (deleteExistingImage) {
          updateData.image_url = '';
        }

        if (oldImageUrl && (imageFile || deleteExistingImage)) {
          await campaignImageService.deleteImage(oldImageUrl, 'popup-campaign-images');
        }
      }

      const { data, error } = await supabaseTyped
        .from('popup_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating popup campaign:', error);
        throw new Error('Gagal memperbarui kampanye popup');
      }

      return data as unknown as PopupCampaign;
    } catch (error) {
      console.error('Exception in updatePopupCampaign:', error);
      throw error;
    }
  }

  /**
   * Delete popup campaign
   */
  async deletePopupCampaign(id: string): Promise<void> {
    try {
      const { data: item } = await supabaseTyped
        .from('popup_campaigns')
        .select('image_url')
        .eq('id', id)
        .single();

      const { error } = await supabaseTyped
        .from('popup_campaigns')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting popup campaign:', error);
        throw new Error('Gagal menghapus kampanye popup');
      }

      if (item?.image_url) {
        await campaignImageService.deleteImage(item.image_url, 'popup-campaign-images');
      }
    } catch (error) {
      console.error('Exception in deletePopupCampaign:', error);
      throw error;
    }
  }

  /**
   * Get active popup campaign (for public display)
   */
  async getActivePopupCampaign(): Promise<PopupCampaign | null> {
    try {
      const { data, error } = await supabaseTyped
        .from('popup_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching active popup campaign:', error);
        return null;
      }

      return (data as unknown as PopupCampaign) || null;
    } catch (error) {
      console.error('Exception in getActivePopupCampaign:', error);
      return null;
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService();

// Types are already exported above via interface declarations