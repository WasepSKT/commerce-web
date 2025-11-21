// Structured Image Management System
// Best practices for product image handling with Supabase Storage

import { supabase } from '@/integrations/supabase/client';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  index?: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export class ProductImageManager {
  private static readonly BUCKET_NAME = 'product-images';
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private static readonly MAX_WIDTH = 1200;
  private static readonly QUALITY = 0.8;

  /**
   * Validate image file before upload
   */
  static validateImageFile(file?: File): ImageValidationResult {
    if (!file) return { valid: true };
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File terlalu besar. Maksimum ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF'
      };
    }

    return { valid: true };
  }

  /**
   * Compress image before upload
   */
  static async compressImage(
    file: File, 
    maxWidth: number = this.MAX_WIDTH, 
    quality: number = this.QUALITY
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate structured file path for product image
   * - main: products/{productId}/main.{ext}
   * - gallery: products/{productId}/gallery/image_{index}.{ext}
   */
  static generateImagePath(productId: string, file: File, index: number = 0, target: 'gallery' | 'main' = 'gallery'): string {
    const extension = file.name.split('.').pop() || 'jpg';
    // Use a UUID for filenames to ensure uniqueness across uploads and avoid cache issues.
    // Prefer browser `crypto.randomUUID()` when available, fallback to timestamp+random.
    const makeUuid = (): string => {
      try {
        const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
        if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID();
      } catch (e) {
        // ignore
      }
      return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    };
    const uid = makeUuid();
    if (target === 'main') {
      return `products/${productId}/main_${uid}.${extension}`;
    }
    return `products/${productId}/gallery/image_${index + 1}_${uid}.${extension}`;
  }

  /**
   * Upload product image with structured path
   */
  static async uploadProductImage(
    productId: string,
    file: File,
    index: number = 0,
    target: 'gallery' | 'main' = 'gallery'
  ): Promise<ImageUploadResult> {
    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Compress image
      const compressedFile = await this.compressImage(file);

    // Generate structured path
      const filePath = this.generateImagePath(productId, compressedFile, index, target); // Generate structured path

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, compressedFile, {
          // avoid caching to ensure new files are immediately visible
          cacheControl: '0',
          upsert: false
        });

      if (uploadError) {
        return { success: false, error: `Upload failed: ${uploadError.message}` };
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return { success: true, url: publicData.publicUrl, index };
    } catch (error) {
      console.error('Image upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Upload multiple product images (preserves order)
   */
  static async uploadProductImages(productId: string, files: (File | undefined)[]): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    const limited = (files || []).slice(0, 4);
    // Preserve original indices so uploads map to specific slots
    for (let i = 0; i < limited.length && i < 4; i++) {
      const f = limited[i];
      if (!f) continue; // skip empty slot but keep index

      // Validate
      const validation = this.validateImageFile(f);
      if (!validation.valid) {
        results.push({ success: false, error: validation.error, index: i });
        continue;
      }

      try {
        const compressedFile = await this.compressImage(f);
        const uploadRes = await this.uploadProductImage(productId, compressedFile, i, 'gallery');
        results.push(uploadRes);
      } catch (err) {
        results.push({ success: false, error: err instanceof Error ? err.message : 'Upload failed', index: i });
      }
    }

    return results;
  }

  /**
   * Delete product image from storage
   */
  static async deleteProductImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === this.BUCKET_NAME);
      
      if (bucketIndex === -1) {
        console.warn('Invalid image URL format');
        return false;
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      
      // Delete from storage
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.warn('Failed to delete image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Delete all images for a product
   */
  static async deleteProductImages(productId: string): Promise<boolean> {
    try {
      const folderPath = `products/${productId}/`;
      
      // List all files in the product folder
      const { data: files, error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(folderPath);

      if (listError) {
        console.warn('Failed to list product images:', listError);
        return false;
      }

      if (!files || files.length === 0) {
        return true; // No images to delete
      }

      // Delete all files
      const filePaths = files.map(file => `${folderPath}${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        console.warn('Failed to delete product images:', deleteError);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error deleting product images:', error);
      return false;
    }
  }

  /**
   * Get product image URL
   */
  static getProductImageUrl(productId: string, extension: string = 'jpg'): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(`products/${productId}/image.${extension}`);
    
    return data.publicUrl;
  }
}
