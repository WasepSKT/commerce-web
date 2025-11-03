/**
 * Custom hook for fetching cart products
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { filterValidUUIDs, normalizeSupabaseResult } from '@/utils/cartUtils';
import { CART_MESSAGES } from '@/constants/cart';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock_quantity?: number;
  discount_percent?: number | null;
}

export function useCartProducts(cartItemIds: string[]) {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Create stable key from product IDs
  const idsKey = useMemo(() => {
    const validIds = filterValidUUIDs(cartItemIds).sort();
    return validIds.join(',');
  }, [cartItemIds]);

  const fetchProducts = useCallback(
    async (ids: string[]) => {
      const validIds = filterValidUUIDs(ids);

      if (validIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching products for valid UUIDs:', validIds);
        const res = await supabase
          .from('products')
          .select('id,name,price,image_url,stock_quantity,discount_percent')
          .in('id', validIds)
          .eq('is_active', true);

        const { data: fetched, error: fetchError } = normalizeSupabaseResult<CartProduct[]>(res);
        if (fetchError) {
          console.error('Supabase error while fetching products:', fetchError);
          throw fetchError;
        }
        console.log('Fetched products:', fetched);
        setProducts((fetched as CartProduct[]) || []);
      } catch (err) {
        console.error('Failed to fetch cart products', err);
        toast({
          variant: 'destructive',
          title: CART_MESSAGES.LOAD_ERROR,
          description: CART_MESSAGES.LOAD_ERROR_DESC,
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').filter(Boolean) : [];
    void fetchProducts(ids);
  }, [idsKey, fetchProducts]);

  return {
    products,
    loading,
  };
}

