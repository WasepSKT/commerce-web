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
    <Card className="grid grid-cols-12 gap-3 items-stretch p-2">
      <Link to={`/product/${item.id}`} className="col-span-3 sm:col-span-3 lg:col-span-2 block h-full overflow-hidden p-1">
        <img
          src={item.image_url ? imageUrlWithCacheBust(item.image_url, item.updated_at ?? item.updated_at_timestamp) : '/placeholder.svg'}
          alt={item.name}
          className="w-full h-full object-cover rounded cursor-pointer"
        />
      </Link>

      <div className="col-span-9 sm:col-span-10 p-3 pl-0 flex-1 w-full flex flex-col">
        <div className="flex items-start justify-between w-full">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-primary line-clamp-2">
              <Link to={`/product/${item.id}`} className="hover:underline">{item.name}</Link>
            </h3>

            {/* price details: show on mobile under title */}
            <div className="flex sm:hidden items-baseline gap-2 mt-1">
              {typeof item.discount_percent === 'number' && item.discount_percent > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {formatPrice(item.unit_price ?? item.price)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-primary">{formatPrice(item.price)}</span>
              )}
            </div>

            {/* mobile subtotal will appear in footer to align with quantity controls */}

            {/* price details: hide on mobile to reduce clutter */}
            <div className="hidden sm:flex items-baseline gap-2 mt-1">
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

          {/* desktop subtotal */}
          <div className="text-sm text-muted-foreground text-right hidden sm:block">
            Subtotal: {formatPrice((item.unit_price ?? item.price) * item.quantity)}
          </div>
        </div>

        {/* removed old mobile actions block (now rendered below content so it spans full width) */}

        {/* footer: only quantity controls on mobile; on desktop the action buttons are shown beside quantity */}
        <div className="mt-3 flex items-center gap-2 justify-between">
          <div className="hidden sm:flex items-center gap-2">
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
          </div>

          {/* mobile subtotal moved under image; footer shows desktop-only elements */}

          <div className="ml-auto hidden sm:flex items-center gap-2">
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

      {/* Mobile-only actions: placed as sibling to image/content so they span full card width */}
      <div className="col-span-12 sm:hidden mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
          </div>

          <div className="text-sm text-muted-foreground">Subtotal: {formatPrice((item.unit_price ?? item.price) * item.quantity)}</div>
        </div>

        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="w-1/2 text-white bg-primary border-primary"
            onClick={handleSingleCheckout}
            disabled={(item.stock_quantity ?? 1) <= 0}
          >
            Checkout
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-1/2 text-primary border-primary hover:text-primary"
            onClick={() => onRemove(item.id)}
          >
            Hapus
          </Button>
        </div>
      </div>
    </Card>
  );
}

