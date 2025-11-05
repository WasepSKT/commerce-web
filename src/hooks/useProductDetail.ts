import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_gallery?: string[];
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brand?: string | null;
  product_type?: string | null;
  pet_type?: string | null;
  origin_country?: string | null;
  expiry_date?: string | null;
  age_category?: string | null;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  seo_structured_data?: Record<string, unknown>;
  discount_percent?: number;
}

export const useProductDetail = (productId: string | undefined) => {
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat produk',
        description: 'Produk tidak ditemukan atau terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  return { product, loading, fetchProduct };
};
