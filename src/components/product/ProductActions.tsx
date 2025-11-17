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
      {/* Quantity Selector dengan layout yang lebih baik */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <span className="text-sm font-medium">Jumlah</span>
        <QuantitySelector value={quantity} stock={stockQuantity} onChange={onQuantityChange} />
      </div>

      {/* Action Buttons dengan layout modern */}
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md"
          onClick={onCheckout}
        >
          Beli Sekarang - {formatPrice(effectivePrice * quantity)}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 text-base font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all"
          onClick={onAddToCart}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Tambah ke Keranjang
        </Button>
      </div>

      {/* Share Buttons */}
      <div className="pt-2 border-t">
        <ShareButtons productId={productId} name={productName} description={description} />
      </div>
    </div>
  );
};
