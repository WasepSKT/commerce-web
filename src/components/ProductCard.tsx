import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StarRating } from '@/components/ui/StarRating';
import computePriceAfterDiscount from '@/utils/price';
import { useProductRating } from '@/hooks/useProductRating';


interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  discount_percent?: number | null;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { ratingData } = useProductRating(product.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isOutOfStock = product.stock_quantity === 0;

  const goToDetail = () => navigate(`/product/${product.id}`);

  return (
    <Card onClick={goToDetail} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') goToDetail(); }} className="group rounded-2xl overflow-hidden shadow-card bg-white hover:shadow-lg cursor-pointer flex flex-col h-full">
      {/* Header: full-width image */}
      <div className="relative bg-white rounded-t-2xl overflow-hidden">
        <div className="w-full aspect-square bg-white">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover object-center transform transition-transform duration-300 motion-safe:group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400'; }}
          />
        </div>

        {/* overlay removed per request: no hover/focus overlay */}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">
              Stok Habis
            </Badge>
          </div>
        )}


        {/* Discount badge (top-right) */}
        {typeof product.discount_percent === 'number' && product.discount_percent > 0 && (
          <div className="absolute top-3 right-3">
            <div className="bg-rose-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md">Diskon {Math.round(product.discount_percent)}%</div>
          </div>
        )}

        {/* category badge removed per request */}
      </div>

      {/* Body: title, price, stock */}
      <div className="px-4 py-2 flex-1">
        <h3 className="text-xs sm:text-sm font-normal text-brand mb-1 line-clamp-2">{product.name}</h3>

        {/* Rating Section: show compact on mobile (single star + value or 0) */}
        <div className="mb-1">
          <div className="hidden sm:flex items-center gap-2">
            <StarRating
              rating={ratingData.averageRating}
              size="sm"
              showValue={ratingData.totalReviews > 0}
            />
            {ratingData.totalReviews > 0 ? (
              <span className="text-xs text-muted-foreground">({ratingData.totalReviews})</span>
            ) : (
              <span className="text-xs text-muted-foreground">Belum ada rating</span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:hidden text-xs text-muted-foreground">
            <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${ratingData.totalReviews > 0 ? 'text-yellow-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 20.202 4.665 24 6 15.595 0 9.748l8.332-1.73z" />
            </svg>
            <span className="text-[10px] sm:text-[11px]">{ratingData.totalReviews > 0 ? ratingData.averageRating.toFixed(1) : '0'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="w-full">
            {typeof product.discount_percent === 'number' && product.discount_percent > 0 ? (
              // On mobile: price stacked (strike above discounted), on sm+ inline
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="block text-[8px] sm:text-[10px] text-muted-foreground line-through mb-1 sm:mb-0 sm:mr-2 truncate">{formatPrice(product.price)}</span>
                <span className="text-sm sm:text-base font-medium text-brand">{formatPrice(computePriceAfterDiscount({ price: product.price, discount_percent: product.discount_percent }).discounted)}</span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-medium text-brand">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: actions */}
      {/* <div className="px-4 pb-4">
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="flex-1 bg-[#FBF4EB] text-brand border-none rounded-md py-2 text-sm">
            <Link to={`/product/${product.id}`} className="inline-flex items-center justify-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm">Beli</span>
            </Link>
          </Button>

          {!isOutOfStock && onAddToCart && (
            <Button
              size="sm"
              aria-label={`Tambah ${product.name} ke keranjang`}
              className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm inline-flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                if (!isAuthenticated) {
                  navigate('/auth', { state: { from: window.location.pathname } });
                  return;
                }
                onAddToCart(product);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Tambah</span>
            </Button>
          )}
        </div>
      </div> */}
    </Card>
  );
}