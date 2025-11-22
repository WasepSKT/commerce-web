import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { imageUrlWithCacheBust } from '@/utils/imageHelpers';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: { name?: string; image_url?: string };
}

export default function OrderItems({ items }: { items?: OrderItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Package className="h-5 w-5 text-primary" />
          Produk yang Dipesan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items && items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {item.products?.image_url ? (
                  <img
                    src={imageUrlWithCacheBust(item.products.image_url, '')}
                    alt={item.products?.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.products?.name || `Product ${item.product_id.slice(0, 8)}`}</p>
                  <p className="text-sm text-muted-foreground">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <p className="font-semibold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada produk</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
