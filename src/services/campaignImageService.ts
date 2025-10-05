import { supabase } from '@/integrations/supabase/client';

export type CampaignImageBucket = 'hero-slider-images' | 'fixed-banner-images' | 'popup-campaign-images';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface StorageFileInfo {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata?: {
    size?: number;
    [key: string]: unknown;
  };
}

interface CampaignImageService {
  uploadImage: (file: File, bucket: CampaignImageBucket, fileName?: string) => Promise<UploadResult>;
  deleteImage: (imageUrl: string, bucket: CampaignImageBucket) => Promise<boolean>;
  getPublicUrl: (fileName: string, bucket: CampaignImageBucket) => string;
  validateImage: (file: File) => { valid: boolean; error?: string };
}

class CampaignImageManager implements CampaignImageService {
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Validate image file before upload
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `Ukuran file terlalu besar. Maksimal ${this.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF'
      };
    }

    return { valid: true };
  }

  /**
   * Generate unique filename with timestamp
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(
    file: File, 
    bucket: CampaignImageBucket, 
    fileName?: string
  ): Promise<UploadResult> {
    try {
      // Validate file first
      const validation = this.validateImage(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate filename if not provided
      const finalFileName = fileName || this.generateFileName(file.name);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(finalFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: 'Gagal mengupload gambar. Silakan coba lagi.'
        };
      }

      // Get public URL
      const publicUrl = this.getPublicUrl(data.path, bucket);

      return {
        success: true,
        url: publicUrl
      };

    } catch (error) {
      console.error('Upload exception:', error);
      return {
        success: false,
        error: 'Terjadi kesalahan saat mengupload gambar'
      };
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(imageUrl: string, bucket: CampaignImageBucket): Promise<boolean> {
    try {
      // Extract filename from URL
      const fileName = this.extractFileNameFromUrl(imageUrl, bucket);
      if (!fileName) {
        console.error('Cannot extract filename from URL:', imageUrl);
        return false;
      }

      // Delete from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete exception:', error);
      return false;
    }
  }

  /**
   * Get public URL for uploaded file
   */
  getPublicUrl(fileName: string, bucket: CampaignImageBucket): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  /**
   * Extract filename from public URL
   */
  private extractFileNameFromUrl(url: string, bucket: CampaignImageBucket): string | null {
    try {
      const bucketPath = `/storage/v1/object/public/${bucket}/`;
      const index = url.indexOf(bucketPath);
      
      if (index === -1) {
        return null;
      }
      
      return url.substring(index + bucketPath.length);
    } catch (error) {
      console.error('Error extracting filename:', error);
      return null;
    }
  }

  /**
   * List images in a bucket (for admin purposes)
   */
  async listImages(bucket: CampaignImageBucket, limit: number = 50): Promise<StorageFileInfo[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          limit,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('List images error:', error);
        return [];
      }

      return (data as StorageFileInfo[]) || [];
    } catch (error) {
      console.error('List images exception:', error);
      return [];
    }
  }

  /**
   * Get storage bucket stats
   */
  async getBucketStats(bucket: CampaignImageBucket): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    try {
      const files = await this.listImages(bucket, 1000); // Get more files for stats
      
      return {
        totalFiles: files.length,
        totalSize: files.reduce((total, file) => total + ((file.metadata?.size as number) || 0), 0)
      };
    } catch (error) {
      console.error('Get bucket stats error:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const campaignImageService = new CampaignImageManager();

// Helper functions for specific campaign types
export const heroSliderImageService = {
  upload: (file: File, fileName?: string) => 
    campaignImageService.uploadImage(file, 'hero-slider-images', fileName),
  delete: (imageUrl: string) => 
    campaignImageService.deleteImage(imageUrl, 'hero-slider-images'),
  getUrl: (fileName: string) => 
    campaignImageService.getPublicUrl(fileName, 'hero-slider-images'),
};

export const fixedBannerImageService = {
  upload: (file: File, fileName?: string) => 
    campaignImageService.uploadImage(file, 'fixed-banner-images', fileName),
  delete: (imageUrl: string) => 
    campaignImageService.deleteImage(imageUrl, 'fixed-banner-images'),
  getUrl: (fileName: string) => 
    campaignImageService.getPublicUrl(fileName, 'fixed-banner-images'),
};

export const popupCampaignImageService = {
  upload: (file: File, fileName?: string) => 
    campaignImageService.uploadImage(file, 'popup-campaign-images', fileName),
  delete: (imageUrl: string) => 
    campaignImageService.deleteImage(imageUrl, 'popup-campaign-images'),
  getUrl: (fileName: string) => 
    campaignImageService.getPublicUrl(fileName, 'popup-campaign-images'),
};

// Export types
export type { UploadResult, CampaignImageService };