/**
 * Cart item card component
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/utils/format';
import type { LineItem } from '@/hooks/useCartLineItems';
import { Link } from 'react-router-dom';
import { useCallback } from 'react';
import { imageUrlWithCacheBust } from '@/utils/imageHelpers';

interface CartItemCardProps {
  item: LineItem;
  onUpdate: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItemCard({ item, onUpdate, onRemove }: CartItemCardProps) {
  const handleSingleCheckout = useCallback(() => {
    // Navigate to checkout for a single product. Use full page navigation
    // so the checkout initialization (which reads query params) runs cleanly.
    const qty = Math.max(1, item.quantity || 1);
    const target = `/checkout?product_id=${encodeURIComponent(item.id)}&quantity=${qty}`;
    if (typeof window !== 'undefined') {
      window.location.assign(target);
      return;
    }
    // Fallback not needed in SPA, but left intentionally minimal.
  }, [item.id, item.quantity]);

  return (
    <Card className="flex flex-row items-start p-4">
      <Link to={`/product/${item.id}`} className="shrink-0 block">
        <img
          src={item.image_url ? imageUrlWithCacheBust(item.image_url, item.updated_at ?? item.updated_at_timestamp) : '/placeholder.svg'}
          alt={item.name}
          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded mr-4 cursor-pointer"
        />
      </Link>

      <div className="flex-1 w-full flex flex-col">
        <div className="flex items-start justify-between w-full">
          <div className="pr-4 flex-1">
            <h3 className="font-medium text-primary line-clamp-2">
              <Link to={`/product/${item.id}`} className="hover:underline">{item.name}</Link>
            </h3>

            <div className="flex items-baseline gap-2 mt-1">
              {typeof item.discount_percent === 'number' && item.discount_percent > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-lg font-semibold text-primary">
                    {formatPrice(item.unit_price ?? item.price)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-medium text-primary">{formatPrice(item.price)}</span>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground whitespace-nowrap text-right">
            Subtotal: {formatPrice((item.unit_price ?? item.price) * item.quantity)}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-primary border-primary hover:text-primary"
            onClick={() => onUpdate(item.id, Math.max(0, item.quantity - 1))}
          >
            -
          </Button>
          <span className="w-10 text-center">{item.quantity}</span>
          <Button
            size="sm"
            variant="outline"
            className="text-primary border-primary hover:text-primary"
            onClick={() => onUpdate(item.id, Math.min(item.stock_quantity || 9999, item.quantity + 1))}
          >
            +
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-primary border-primary hover:text-primary"
              onClick={handleSingleCheckout}
              disabled={(item.stock_quantity ?? 1) <= 0}
            >
              Checkout
            </Button>
            <Button size="sm" variant="outline" className="text-primary border-primary hover:text-primary" onClick={() => onRemove(item.id)}>
              Hapus
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

