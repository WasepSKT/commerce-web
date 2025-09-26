import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-48 w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400';
            }}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Stok Habis
              </Badge>
            </div>
          )}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 text-xs"
          >
            {product.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-muted-foreground">
            Stok: {product.stock_quantity}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to={`/product/${product.id}`}>
            <Eye className="w-4 h-4 mr-1" />
            Detail
          </Link>
        </Button>
        {!isOutOfStock && onAddToCart && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Tambah
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}