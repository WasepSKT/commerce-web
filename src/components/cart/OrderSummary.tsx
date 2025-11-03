/**
 * Order summary card component
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/format';
import { CART_MESSAGES, CART_ROUTES } from '@/constants/cart';
import type { UserProfile } from '@/hooks/useAuth';

interface OrderSummaryProps {
  totalItems: number;
  subtotal: number;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  onCheckout: () => void;
}

export default function OrderSummary({
  totalItems,
  subtotal,
  isAuthenticated,
  profile,
  onCheckout,
}: OrderSummaryProps) {
  const isProfileComplete =
    isAuthenticated &&
    profile &&
    profile.full_name &&
    profile.phone &&
    profile.address &&
    profile.postal_code;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 text-primary">{CART_MESSAGES.ORDER_SUMMARY}</h3>
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{CART_MESSAGES.ITEM_COUNT}</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between text-lg font-medium mb-4">
          <span>{CART_MESSAGES.TOTAL}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {isProfileComplete ? (
          <a href={`${CART_ROUTES.CHECKOUT}?dry_run=1&from_cart=1`} className="inline-block w-full">
            <Button className="w-full">{CART_MESSAGES.CHECKOUT}</Button>
          </a>
        ) : (
          <Button className="w-full" onClick={onCheckout}>
            {CART_MESSAGES.CHECKOUT}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

