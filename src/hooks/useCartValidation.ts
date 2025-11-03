/**
 * Custom hook for cart validation logic
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import useCart from '@/hooks/useCart';
import { isValidUUID } from '@/utils/cartUtils';
import { CART_MESSAGES } from '@/constants/cart';

interface CartItem {
  id: string;
  quantity: number;
}

export function useCartValidation(items: CartItem[]) {
  const { removeItem, clear } = useCart();
  const { toast } = useToast();
  const hasCleanedUp = useRef(false);

  const invalidItemsInfo = useMemo(() => {
    const invalid = items.filter((item) => {
      if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
        return true;
      }
      return !isValidUUID(item.id);
    });

    return {
      hasInvalid: invalid.length > 0,
      invalidItems: invalid,
      count: invalid.length,
    };
  }, [items]);

  // Clean up invalid cart items only when first detected
  useEffect(() => {
    if (invalidItemsInfo.hasInvalid && !hasCleanedUp.current) {
      console.warn('Found invalid cart items, cleaning up:', invalidItemsInfo.invalidItems);
      hasCleanedUp.current = true;

      // Clean up invalid items in a single batch
      invalidItemsInfo.invalidItems.forEach((item) => removeItem(item.id));

      toast({
        title: CART_MESSAGES.INVALID_ITEMS_CLEANED,
        description: CART_MESSAGES.INVALID_ITEMS_DESC(invalidItemsInfo.count),
        variant: 'default',
      });
    }
  }, [invalidItemsInfo.hasInvalid, invalidItemsInfo.invalidItems, invalidItemsInfo.count, removeItem, toast]);

  const clearCorruptedCart = useCallback(() => {
    try {
      localStorage.removeItem('rp_cart_v1');
      clear();
      toast({
        title: CART_MESSAGES.CLEARED,
        description: CART_MESSAGES.CLEARED_DESC,
      });
      window.location.reload(); // Reload to reset state
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }, [clear, toast]);

  return {
    invalidItemsInfo,
    clearCorruptedCart,
  };
}

