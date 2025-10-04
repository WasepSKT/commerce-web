import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StarRating } from '@/components/ui/StarRating';
import { useProductRating } from '@/hooks/useProductRating';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
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

  return (
    <Card className="group rounded-2xl overflow-hidden shadow-card bg-white">
      {/* Header: full-width image */}
      <div className="relative bg-white rounded-t-2xl overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-56 object-cover object-center bg-white transform transition-transform duration-300 motion-safe:group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400';
          }}
        />

        {/* overlay removed per request: no hover/focus overlay */}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">
              Stok Habis
            </Badge>
          </div>
        )}

        <Badge variant="secondary" className="absolute top-4 left-4 text-xs">
          {product.category}
        </Badge>
      </div>

      {/* Body: title, description, price, stock */}
      <div className="px-6 pb-2 pt-2">
        <h3 className="text-xl font-extrabold text-brand mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>

        {/* Rating Section */}
        <div className="flex items-center gap-2 mb-2">
          <StarRating
            rating={ratingData.averageRating}
            size="sm"
            showValue={ratingData.totalReviews > 0}
          />
          {ratingData.totalReviews > 0 && (
            <span className="text-xs text-muted-foreground">({ratingData.totalReviews})</span>
          )}
          {ratingData.totalReviews === 0 && (
            <span className="text-xs text-muted-foreground">Belum ada rating</span>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-brand">{formatPrice(product.price)}</span>
          <span className="text-sm text-muted-foreground">Stok: {product.stock_quantity}</span>
        </div>
      </div>

      {/* Footer: actions */}
      <div className="px-6 pb-6 pt-0">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="flex-1 bg-[#FBF4EB] text-brand border-none rounded-xl py-3">
            <Link to={`/product/${product.id}`} className="inline-flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Detail</span>
            </Link>
          </Button>

          {!isOutOfStock && onAddToCart && (
            <Button
              size="sm"
              className="flex-1 bg-[#7A1316] text-[#F8DF7C] rounded-xl py-3 inline-flex items-center justify-center"
              onClick={() => {
                if (!isAuthenticated) {
                  // Redirect to login page and preserve current location
                  navigate('/auth', { state: { from: window.location.pathname } });
                  return;
                }
                onAddToCart(product);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="font-medium">Tambah</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}