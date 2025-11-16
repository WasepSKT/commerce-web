/**
 * Custom hook for cart checkout logic
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateProfileForCheckout } from '@/utils/profileValidation';
import { CART_MESSAGES, CART_ROUTES } from '@/constants/cart';

export function useCartCheckout(
  totalItems: number,
  items: Array<{ id: string; quantity: number }>
) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, profile } = useAuth();

  const handleCheckout = useCallback(async () => {
    if (totalItems === 0) {
      toast({
        variant: 'destructive',
        title: CART_MESSAGES.CART_EMPTY,
        description: CART_MESSAGES.CART_EMPTY_DESC,
      });
      return;
    }

    // Validate stock before checkout
    try {
      const { StockService } = await import('@/services/stockService');
      const cartItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const stockValidation = await StockService.validateCartStock(cartItems);
      if (!stockValidation.valid) {
        toast({
          variant: 'destructive',
          title: CART_MESSAGES.STOCK_INSUFFICIENT,
          description: CART_MESSAGES.STOCK_INSUFFICIENT_DESC,
        });
        return;
      }
    } catch (error) {
      console.warn('Failed to validate stock before checkout:', error);
      // Continue with checkout if stock validation fails
    }

    // Require authentication
    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: CART_MESSAGES.LOGIN_REQUIRED,
        description: CART_MESSAGES.LOGIN_REQUIRED_DESC,
      });
      navigate(CART_ROUTES.AUTH);
      return;
    }

    // Validate profile completion
    const validation = validateProfileForCheckout(profile);
    if (!validation.isValid) {
      toast({
        variant: 'destructive',
        title: CART_MESSAGES.PROFILE_INCOMPLETE,
        description: `Silakan lengkapi data berikut: ${validation.missingFields.join(', ')}.`,
      });
      navigate(`${CART_ROUTES.PROFILE}?next=/cart`);
      return;
    }

    // Navigate directly to the Checkout page in dry-run/test mode
    const target = `${CART_ROUTES.CHECKOUT}?from_cart=1`;
    console.debug('[Cart] Redirecting to checkout (dry-run):', target);
    if (typeof window !== 'undefined') {
      window.location.assign(target);
      return;
    }
    // Fallback to SPA navigation
    navigate(target);
  }, [totalItems, items, isAuthenticated, profile, navigate, toast]);

  return {
    handleCheckout,
  };
}

