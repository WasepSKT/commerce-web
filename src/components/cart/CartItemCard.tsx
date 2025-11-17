/**
 * Cart item card component
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/utils/format';
import type { LineItem } from '@/hooks/useCartLineItems';
import { Link } from 'react-router-dom';

interface CartItemCardProps {
  item: LineItem;
  onUpdate: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItemCard({ item, onUpdate, onRemove }: CartItemCardProps) {
  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center p-4">
      <Link to={`/product/${item.id}`} className="shrink-0">
        <img
          src={item.image_url || '/placeholder.svg'}
          alt={item.name}
          className="w-28 h-28 object-cover rounded mb-3 sm:mb-0 sm:mr-4 cursor-pointer"
        />
      </Link>

      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h3 className="font-medium text-primary">
              <Link to={`/product/${item.id}`} className="hover:underline">{item.name}</Link>
            </h3>

            <div className="flex items-baseline gap-2">
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

          <div className="text-sm text-muted-foreground mt-2 sm:mt-0 whitespace-nowrap">
            Subtotal: {formatPrice((item.unit_price ?? item.price) * item.quantity)}
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate(item.id, Math.max(0, item.quantity - 1))}
          >
            -
          </Button>
          <span className="w-10 text-center">{item.quantity}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate(item.id, Math.min(item.stock_quantity || 9999, item.quantity + 1))}
          >
            +
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(item.id)}>
            Hapus
          </Button>
        </div>
      </div>
    </Card>
  );
}

