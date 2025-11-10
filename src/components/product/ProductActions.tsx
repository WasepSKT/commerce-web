import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { QuantitySelector } from './QuantitySelector';
import { ShareButtons } from './ShareButtons';

interface ProductActionsProps {
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  stockQuantity: number;
  effectivePrice: number;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
  onCheckout: () => void;
  formatPrice: (price: number) => string;
}

export const ProductActions = ({
  productId,
  productName,
  description,
  quantity,
  stockQuantity,
  effectivePrice,
  onQuantityChange,
  onAddToCart,
  onCheckout,
  formatPrice
}: ProductActionsProps) => {
  return (
    <div className="space-y-4">
      <QuantitySelector value={quantity} stock={stockQuantity} onChange={onQuantityChange} />

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full border-primary text-primary hover:bg-transparent hover:text-primary"
            onClick={onAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Masukkan Keranjang
          </Button>

          <Button
            size="lg"
            className="w-full"
            onClick={onCheckout}
          >
            Checkout - {formatPrice(effectivePrice * quantity)}
          </Button>
        </div>
      </div>

      <ShareButtons productId={productId} name={productName} description={description} />
    </div>
  );
};
