// Enhanced Product CRUD Hook with Structured Image Management
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductImageManager, ImageUploadResult } from '@/utils/imageManagement';

// Narrow type for fields we only read from product rows in this hook
interface ProductImageFields {
  image_url?: string | null;
  image_gallery?: string[] | null;
  image_path?: string | null;
  image_gallery_paths?: string[] | null;
}

export interface ProductForm {
  name: string;
  description: string;
  price: string;
  image_url: string;
  imageFiles: File[];
  imagePreviews: string[];
  // Optional: existing gallery URLs (used by the admin edit UI to represent
  // the desired gallery state). When provided, updateProduct will treat
  // this as the desired gallery and detect removals accordingly.
  imageGallery?: string[];
  imageGalleryPaths?: string[];
  category: string;
  stock_quantity: string;
  meta?: Record<string, unknown>;
  // explicit fields (optional) to help typing when UI sends them separately
  brand?: string;
  product_type?: string;
  pet_type?: string;
  origin_country?: string;
  expiry_date?: string; // ISO date
  age_category?: string;
  weight_grams?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  discount_percent?: number;
  sku?: string;
  shipping_options?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_gallery?: string[];
  meta?: Record<string, unknown>;
  brand?: string;
  product_type?: string;
  pet_type?: string;
  origin_country?: string;
  expiry_date?: string;
  age_category?: string;
  weight_grams?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  discount_percent?: number;
  sku?: string;
  shipping_options?: string[];
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

// Lightweight, safe wrapper type to call RPCs by string name without depending
// on generated supabase RPC union types. Uses `unknown` for response shape so
// we avoid `any` while still allowing runtime checks and fallbacks.
type SupabaseRpcCaller = {
  rpc: (name: string, params?: unknown) => Promise<{ data: unknown; error: unknown }>;
};

const supabaseRpc = (supabase as unknown) as SupabaseRpcCaller;

export const useProductCRUD = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const updateInFlight = useRef(false);

  // helpers to safely extract values from meta
  const metaString = (m: Record<string, unknown> | undefined, key: string): string | undefined => {
    if (!m) return undefined;
    const v = m[key];
    return typeof v === 'string' ? v : undefined;
  };

  const metaNumber = (m: Record<string, unknown> | undefined, key: string): number | undefined => {
    if (!m) return undefined;
    const v = m[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const metaArray = (m: Record<string, unknown> | undefined, key: string): unknown[] | undefined => {
    if (!m) return undefined;
    const v = m[key];
    return Array.isArray(v) ? v : undefined;
  };

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
          // Map known spec fields if your schema already has them
          brand: form.brand ?? null,
          product_type: form.product_type ?? null,
          pet_type: form.pet_type ?? null,
          origin_country: form.origin_country ?? null,
          expiry_date: form.expiry_date ?? null,
          age_category: form.age_category ?? null,
          weight_grams: form.weight_grams ?? null,
          length_cm: form.length_cm ?? null,
          width_cm: form.width_cm ?? null,
          height_cm: form.height_cm ?? null,
          discount_percent: form.discount_percent ?? null,
          sku: form.sku ?? null,
          shipping_options: form.shipping_options ?? []
        })
        .select()
        .single();

      if (insertError) throw insertError;

      type InsertResult = { id?: string } & Record<string, unknown>;
      const inserted = productData as InsertResult | null;
      if (!inserted || typeof inserted.id !== 'string') {
        throw new Error('Inserted product did not return an id');
      }

      // Use a mutable record to track updates (avoid reassigning the const productData)
      let createdRecord: InsertResult = inserted;
      let pendingImagePath: string | undefined;

      let imageUrl = '';
      let imageGallery: string[] = [];

      // Upload gallery images if provided (up to 4)
      if (form.imageFiles && form.imageFiles.some(Boolean)) {
        setUploading(true);
        const uploadResults = await ProductImageManager.uploadProductImages(inserted.id!, form.imageFiles.slice(0,4));

        const successfulResults = uploadResults.filter(r => r.success && typeof r.index === 'number') as ({ success: true; url: string; index: number; path?: string })[];
        const failed = uploadResults.filter(r => !r.success);

        if (successfulResults.length === 0 && failed.length > 0) {
          // no images uploaded successfully — delete product and error
          await supabase.from('products').delete().eq('id', productData.id);
          const agg = failed.map(f => f.error).filter(Boolean).join('; ') || 'Gagal mengunggah gambar';
          // show toast before throwing so user sees the reason
          toast({ variant: 'destructive', title: 'Gagal mengunggah gambar', description: agg });
          throw new Error(agg);
        }

        // Build ordered gallery array by index
        const maxIdx = Math.max(0, ...(successfulResults.map(r => r.index)));
        const galleryArr: (string | undefined)[] = Array.from({ length: maxIdx + 1 }, (_, i) => undefined);
        for (const r of successfulResults) galleryArr[r.index] = r.url;
        imageGallery = galleryArr.filter(Boolean) as string[];

        // Upload a separate main image to a dedicated path if admin provided the first file
        try {
          const firstFile = form.imageFiles[0];
            if (firstFile) {
              const mainRes = await ProductImageManager.uploadProductImage(inserted.id!, firstFile, 0, 'main');
              if (mainRes.success && mainRes.url) {
                imageUrl = mainRes.url;
              } else {
                imageUrl = imageGallery[0] || '';
              }
              // store main path if available
              const mainPath = mainRes.path;
              if (mainPath) {
                // attempt to include image_path in the update below
                pendingImagePath = mainPath;
              }
            } else {
              imageUrl = imageGallery[0] || '';
            }
        } catch (err) {
          imageUrl = imageGallery[0] || '';
        }

        // Update product with primary image_url and image_gallery
        // Try to update product including image paths if available (safe fallback)
        try {
          const galleryPaths = (successfulResults && successfulResults.length > 0)
            ? successfulResults.map(r => r.path).filter(Boolean) as string[]
            : [];
          const payload: Record<string, unknown> = {
            image_url: imageUrl,
            image_gallery: imageGallery,
            image_path: pendingImagePath ?? '',
            image_gallery_paths: galleryPaths
          };

          const { data: updateData, error: updateError } = await supabase
            .from('products')
            .update(payload)
            .eq('id', inserted.id)
            .select()
            .single();

          if (updateError) {
            // fallback: try basic update without path fields
            console.warn('Failed to update product with image paths, retrying without paths:', updateError.message || updateError);
            const { data: updateData2, error: updateError2 } = await supabase
              .from('products')
              .update({ image_url: imageUrl, image_gallery: imageGallery })
              .eq('id', inserted.id)
              .select()
              .single();
            if (!updateError2 && updateData2) createdRecord = updateData2 as InsertResult;
            else console.warn('Retry without image paths also failed:', updateError2);
          } else if (updateData && (updateData as InsertResult).id) {
            createdRecord = updateData as InsertResult;
          }
        } catch (err) {
          console.warn('Error while updating product image paths:', err);
        }
      }

      // Fetch full product record to return latest state (covers case with/without images)
      const createdId = inserted.id as string;
      const { data: fullProduct, error: fetchFullErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', createdId)
        .single();

      if (fetchFullErr) {
        console.warn('Failed to fetch created product after insert:', fetchFullErr);
      }

      toast({ title: 'Produk berhasil ditambahkan' });
  return (fullProduct as Product) || ({ ...(createdRecord as unknown as Record<string, unknown>), image_url: imageUrl, image_gallery: imageGallery } as Product);
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
    // Prevent concurrent updates (debounce double-clicks / multiple submits)
    if (updateInFlight.current) {
      throw new Error('Update already in progress');
    }
    updateInFlight.current = true;
    setLoading(true);
    setUploading(false);

    try {
      // Get current product data
      const { data: currentProductRaw, error: fetchError } = await supabase
        .from('products')
        .select('image_url, image_gallery, image_path, image_gallery_paths')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;
      const currentProduct = (currentProductRaw as unknown as { image_url?: string; image_gallery?: string[] }) || {};
      const currentProductAny = (currentProductRaw as ProductImageFields) || {};
      let imageUrl = currentProduct.image_url || '';
      // handle existing gallery from DB if present. If the UI provided
      // `form.imageGallery` (editing case), prefer that as the desired
      // gallery state so removals performed in the modal are respected.
      const existingGallery = currentProduct.image_gallery;
      let imageGallery: string[] = Array.isArray(form.imageGallery)
        ? form.imageGallery.slice()
        : (Array.isArray(existingGallery) ? existingGallery.slice() : []);

      // Prepare holders for upload results and gallery paths
      let successfulResultsVar: ({ success: true; url: string; index: number; path?: string })[] = [];
      let imageGalleryPaths: string[] = [];

      // Handle image update: merge uploaded slots into existing gallery
      if (form.imageFiles && form.imageFiles.some(Boolean)) {
        setUploading(true);

        // Upload new/updated images to their respective slots (preserve indices)
        const uploadResults = await ProductImageManager.uploadProductImages(productId, form.imageFiles.slice(0,4));

        // Map successful uploads into the existing gallery by index
        successfulResultsVar = uploadResults.filter(r => r.success && typeof r.index === 'number') as ({ success: true; url: string; index: number; path?: string })[];
        const failed = uploadResults.filter(r => !r.success);

        // Initialize gallery array up to max of existing or uploaded indices
        const maxLen = Math.max(imageGallery.length, ...(successfulResultsVar.map(r => r.index + 1)), 0);
        const mergedGallery = Array.from({ length: maxLen }, (_, i) => imageGallery[i] || undefined) as (string | undefined)[];

        for (const res of successfulResultsVar) {
          mergedGallery[res.index] = res.url;
        }

        // Filter undefined and keep order
        imageGallery = mergedGallery.filter(Boolean) as string[];

        // Build gallery paths array from successful results mapping by index
        const galleryPaths: (string | undefined)[] = Array.from({ length: imageGallery.length }, (_, i) => undefined);
        for (const r of successfulResultsVar) {
          if (r.path) galleryPaths[r.index] = r.path;
        }
        imageGalleryPaths = galleryPaths.filter(Boolean) as string[];

        // Delete replaced images from storage for indices that were overwritten
        try {
          for (const res of successfulResultsVar) {
            const oldUrl = existingGallery && existingGallery[res.index];
            if (oldUrl && oldUrl !== res.url) {
              // best-effort delete; don't fail the update if deletion fails
              try {
                await ProductImageManager.deleteProductImage(oldUrl);
              } catch (e) {
                console.warn('Failed to delete old product image:', e);
              }
            }
          }

          // Instead of performing inline deletes here, compute removed storage paths
          // and enqueue them via the RPC `rpc_update_product_gallery` below so deletion
          // happens in the background worker. We still keep a safe fallback to the
          // previous inline deletion behavior if the RPC is not available.
          // Additionally, if the admin removed images (e.g. decreased gallery length
          // or cleared specific slots), delete any previously-stored gallery images
          // that are no longer referenced in the merged gallery.
          try {
            const prevGallery = Array.isArray(existingGallery) ? existingGallery.filter(Boolean) as string[] : [];
            const removed = prevGallery.filter((u) => u && !imageGallery.includes(u));
            for (const oldUrl of removed) {
              try {
                await ProductImageManager.deleteProductImage(oldUrl);
              } catch (e) {
                console.warn('Failed to delete removed product image:', e);
              }
            }
          } catch (e) {
            console.debug('Error while deleting removed images from previous gallery:', e);
          }
        } catch (e) {
          console.debug('Error while cleaning up old images:', e);
        }

        if (successfulResultsVar.length === 0 && failed.length > 0) {
          // No successful uploads; preserve existing images and surface an error to the user
          const errMsg = failed.map(f => f.error).filter(Boolean).join('; ') || 'Gagal mengunggah gambar';
          console.warn('No new images uploaded:', errMsg);
          // Show toast so admin sees the validation/upload failure
          toast({ variant: 'destructive', title: 'Gagal mengunggah gambar', description: String(errMsg) });
        }

        imageUrl = imageGallery[0] || imageUrl;
      } else {
        // No new uploads in this update. Respect any gallery state the UI sent
        // (this enables removing existing gallery URLs without uploading
        // replacements). Also use any provided gallery path list from the form.
        if (Array.isArray(form.imageGallery)) {
          imageGallery = form.imageGallery.filter(Boolean) as string[];
        }
        if (Array.isArray(form.imageGalleryPaths)) {
          imageGalleryPaths = form.imageGalleryPaths.filter(Boolean) as string[];
        }
        imageUrl = imageGallery[0] || imageUrl;
      }

        // Update product (attempt to include image path fields if available)
      try {
        const payload: Record<string, unknown> = {
          // Prepare payload to send to RPC or direct update
          name: form.name,
          description: form.description,
          price: Number(form.price) || 0,
          category: form.category,
          stock_quantity: Number(form.stock_quantity) || 0,
          image_url: imageUrl,
          image_gallery: imageGallery,
          brand: form.brand ?? null,
          product_type: form.product_type ?? null,
          pet_type: form.pet_type ?? null,
          origin_country: form.origin_country ?? null,
          expiry_date: form.expiry_date ?? null,
          age_category: form.age_category ?? null,
          weight_grams: form.weight_grams ?? null,
          length_cm: form.length_cm ?? null,
          width_cm: form.width_cm ?? null,
          height_cm: form.height_cm ?? null,
          discount_percent: form.discount_percent ?? null,
          sku: form.sku ?? null,
          shipping_options: form.shipping_options ?? []
        };
        // Always send the latest gallery paths and image_path, even if empty
        payload.image_gallery_paths = imageGalleryPaths;
        payload.image_path = (successfulResultsVar.length > 0 && successfulResultsVar[0].path) ? successfulResultsVar[0].path : null;

        // Attempt to call the RPC `rpc_update_product_gallery` to atomically update
        // the product row and enqueue any removed storage paths for background deletion.
        const imagePathForPayload = (payload.image_path as string | undefined) || null;
        const prevGalleryPaths: string[] = Array.isArray(currentProductAny?.image_gallery_paths) ? currentProductAny.image_gallery_paths.filter(Boolean) as string[] : [];
        const prevGalleryUrls: string[] = Array.isArray(currentProductAny?.image_gallery) ? currentProductAny.image_gallery.filter(Boolean) as string[] : [];
        const prevImagePath: string | null = typeof currentProductAny?.image_path === 'string' ? currentProductAny.image_path : null;
        const removedPaths: string[] = [];
        // compute removed paths by comparing previous stored paths with new ones (stored-paths)
        if (prevImagePath && prevImagePath !== imagePathForPayload) removedPaths.push(prevImagePath);
        for (const p of prevGalleryPaths) if (!imageGalleryPaths.includes(p) && p && p.trim() !== '') removedPaths.push(p);
        // Also handle case where frontend only removed URLs (no new uploads) - derive storage paths from previous URLs
        const removedUrls = prevGalleryUrls.filter(u => !imageGallery.includes(u));
        for (const url of removedUrls) {
          if (!url) continue;
          const m = url.match(/\/storage\/v1\/object\/public\/product-images\/(.*)$/);
          if (m && m[1]) {
            const derived = m[1];
            if (!removedPaths.includes(derived)) removedPaths.push(derived);
          } else if (url.startsWith('product-images/')) {
            if (!removedPaths.includes(url)) removedPaths.push(url);
          }
        }

        try {
          // Use the lightweight RPC caller wrapper to avoid strict union RPC name types
          const { data: rpcRes, error: rpcErr } = await supabaseRpc.rpc('rpc_update_product_gallery', {
            product_id: productId,
            new_image_url: imageUrl,
            new_image_gallery: imageGallery,
            new_image_path: imagePathForPayload,
            new_image_gallery_paths: imageGalleryPaths,
            removed_paths: removedPaths
          });

          // rpcErr is unknown; treat truthy as failure and fallback to direct update
          if (rpcErr) {
            console.warn('rpc_update_product_gallery failed, falling back to direct update:', rpcErr as unknown);
            const { data: updatedProduct, error: updateError } = await supabase
              .from('products')
              .update(payload)
              .eq('id', productId)
              .select()
              .single();
            if (updateError) throw updateError;
          }
        } catch (rpcCallErr) {
          console.warn('Error calling rpc_update_product_gallery, falling back to direct update:', rpcCallErr);
          const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update(payload)
            .eq('id', productId)
            .select()
            .single();
          if (updateError) throw updateError;
        }
      } catch (err) {
        console.warn('Error while updating product with image path fields:', err);
        // Fallback: try update without any image path fields
        const { data: updatedProduct3, error: updateError3 } = await supabase
          .from('products')
          .update({
            name: form.name,
            description: form.description,
            price: Number(form.price) || 0,
            category: form.category,
            stock_quantity: Number(form.stock_quantity) || 0,
            image_url: imageUrl,
            image_gallery: imageGallery,
            brand: form.brand ?? null,
            product_type: form.product_type ?? null,
            pet_type: form.pet_type ?? null,
            origin_country: form.origin_country ?? null,
            expiry_date: form.expiry_date ?? null,
            age_category: form.age_category ?? null,
            weight_grams: form.weight_grams ?? null,
            length_cm: form.length_cm ?? null,
            width_cm: form.width_cm ?? null,
            height_cm: form.height_cm ?? null,
            discount_percent: form.discount_percent ?? null,
            sku: form.sku ?? null,
            shipping_options: form.shipping_options ?? []
          })
          .eq('id', productId)
          .select()
          .single();

        if (updateError3) throw updateError3;
      }

      toast({ title: 'Produk berhasil diperbarui' });
      // ensure returned product includes any gallery we set
      const fetched = await supabase.from('products').select('*').eq('id', productId).single();
      if (fetched.error) {
        throw fetched.error;
      }
      return fetched.data as Product;
    } catch (error) {
      console.error('Update product error:', error);
      const message = error instanceof Error ? error.message : 'Gagal memperbarui produk';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    } finally {
      setLoading(false);
      setUploading(false);
      updateInFlight.current = false;
    }
  }, [toast]);

  /**
   * Delete product with image cleanup
   */
  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    setLoading(true);

    try {
      // Get product data to access storage paths (if available)
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_url, image_path, image_gallery_paths')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const productAny = (product as ProductImageFields) || {};
      const prevPaths: string[] = [];
      if (typeof productAny.image_path === 'string' && productAny.image_path) prevPaths.push(productAny.image_path);
      if (Array.isArray(productAny.image_gallery_paths)) prevPaths.push(...productAny.image_gallery_paths.filter(Boolean));

      // Try RPC to delete product and enqueue storage deletes (preferred)
      try {
        const { data: rpcRes, error: rpcErr } = await supabaseRpc.rpc('rpc_delete_product_enqueue', { product_id: productId, removed_paths: prevPaths });
        if (rpcErr) throw rpcErr;
        toast({ title: 'Produk berhasil dihapus' });
        return;
      } catch (rpcErr) {
        console.warn('rpc_delete_product_enqueue not available or failed, falling back to inline delete:', rpcErr);
      }

      // Fallback: delete images inline and then delete product record
      if (productAny.image_url) {
        await ProductImageManager.deleteProductImages(productId);
      }

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
