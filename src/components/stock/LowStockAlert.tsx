import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, Package } from 'lucide-react';
import { StockService } from '@/services/stockService';
import { useAuth } from '@/hooks/useAuth';

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
}

export function LowStockAlert() {
  const { profile } = useAuth();
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadLowStockProducts();
    }
  }, [isAdmin]);

  const loadLowStockProducts = async () => {
    setLoading(true);
    try {
      const products = await StockService.getLowStockProducts(10); // threshold: 10
      setLowStockProducts(products);
      setIsVisible(products.length > 0);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleRefresh = () => {
    loadLowStockProducts();
  };

  if (!isAdmin || !isVisible || loading) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        Peringatan Stok Menipis
      </AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="space-y-2">
          <p>
            {lowStockProducts.length} produk memiliki stok rendah (≤ 10 unit):
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 5).map((product) => (
              <Badge 
                key={product.id}
                variant="outline"
                className="text-xs border-orange-300 text-orange-700"
              >
                {product.name}: {product.stock_quantity}
              </Badge>
            ))}
            {lowStockProducts.length > 5 && (
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                +{lowStockProducts.length - 5} lainnya
              </Badge>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <Package className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-orange-600 hover:bg-orange-100"
            >
              <X className="h-3 w-3 mr-1" />
              Tutup
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
