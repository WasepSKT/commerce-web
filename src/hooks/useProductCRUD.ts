// Enhanced Product CRUD Hook with Structured Image Management
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductImageManager, ImageUploadResult } from '@/utils/imageManagement';

export interface ProductForm {
  name: string;
  description: string;
  price: string;
  image_url: string;
  imageFile: File | null;
  imagePreview: string;
  category: string;
  stock_quantity: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // SEO fields (auto-generated)
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  seo_structured_data?: Record<string, unknown>;
}

export const useProductCRUD = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  /**
   * Fetch all products
   */
  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new product with structured image management
   */
  const createProduct = useCallback(async (form: ProductForm): Promise<Product> => {
    setLoading(true);
    setUploading(false);

    try {
      // First, create the product record to get the ID
      const { data: productData, error: insertError } = await supabase
        .from('products')
        .insert({
          name: form.name,
          description: form.description,
          price: Number(form.price) || 0,
          category: form.category,
          stock_quantity: Number(form.stock_quantity) || 0,
          image_url: '', // Will be updated after image upload
        })
        .select()
        .single();

      if (insertError) throw insertError;

      let imageUrl = '';

      // Upload image if provided
      if (form.imageFile) {
        setUploading(true);
        const uploadResult: ImageUploadResult = await ProductImageManager.uploadProductImage(
          productData.id,
          form.imageFile
        );

        if (!uploadResult.success) {
          // Delete the product record if image upload fails
          await supabase.from('products').delete().eq('id', productData.id);
          throw new Error(uploadResult.error || 'Image upload failed');
        }

        imageUrl = uploadResult.url!;

        // Update product with image URL
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: imageUrl })
          .eq('id', productData.id);

        if (updateError) {
          console.warn('Failed to update product with image URL:', updateError);
        }
      }

      toast({ title: 'Produk berhasil ditambahkan' });
      return { ...productData, image_url: imageUrl };
    } catch (error) {
      console.error('Create product error:', error);
      const message = error instanceof Error ? error.message : 'Gagal menambahkan produk';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }, [toast]);

  /**
   * Update product with structured image management
   */
  const updateProduct = useCallback(async (
    productId: string, 
    form: ProductForm
  ): Promise<Product> => {
    setLoading(true);
    setUploading(false);

    try {
      // Get current product data
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      let imageUrl = currentProduct.image_url;

      // Handle image update
      if (form.imageFile) {
        setUploading(true);
        
        // Delete old image if exists
        if (currentProduct.image_url) {
          await ProductImageManager.deleteProductImage(currentProduct.image_url);
        }

        // Upload new image
        const uploadResult: ImageUploadResult = await ProductImageManager.uploadProductImage(
          productId,
          form.imageFile
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Image upload failed');
        }

        imageUrl = uploadResult.url!;
      }

      // Update product
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          name: form.name,
          description: form.description,
          price: Number(form.price) || 0,
          category: form.category,
          stock_quantity: Number(form.stock_quantity) || 0,
          image_url: imageUrl,
        })
        .eq('id', productId)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({ title: 'Produk berhasil diperbarui' });
      return updatedProduct;
    } catch (error) {
      console.error('Update product error:', error);
      const message = error instanceof Error ? error.message : 'Gagal memperbarui produk';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }, [toast]);

  /**
   * Delete product with image cleanup
   */
  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    setLoading(true);

    try {
      // Get product data to access image URL
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      // Delete all product images
      if (product.image_url) {
        await ProductImageManager.deleteProductImages(productId);
      }

      // Delete product record
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;

      toast({ title: 'Produk berhasil dihapus' });
    } catch (error) {
      console.error('Delete product error:', error);
      const message = error instanceof Error ? error.message : 'Gagal menghapus produk';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Toggle product active status
   */
  const toggleProductStatus = useCallback(async (productId: string, isActive: boolean): Promise<void> => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId);

      if (error) throw error;

      toast({ 
        title: isActive ? 'Produk diaktifkan' : 'Produk dinonaktifkan' 
      });
    } catch (error) {
      console.error('Toggle product status error:', error);
      const message = error instanceof Error ? error.message : 'Gagal mengubah status produk';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    uploading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
  };
};
