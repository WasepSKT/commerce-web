import React from 'react';
import { imageUrlWithCacheBust } from '@/utils/imageHelpers';

type ProductRef = { name?: string; image_url?: string } | undefined;

type OrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: ProductRef;
};

export default function OrderItemsList({ items }: { items?: OrderItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-primary mb-3">Detail Pesanan</h3>

      {/* Desktop/table layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 pb-2 border-b">
          <div className="col-span-5">Produk</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-3 text-right">Harga Satuan</div>
          <div className="col-span-2 text-right">Total</div>
        </div>
        <div className="space-y-3 mt-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 text-sm items-center">
              <div className="col-span-5 font-medium text-gray-900 flex items-center gap-3 min-w-0">
                {item.products?.image_url && (
                  <img src={imageUrlWithCacheBust(item.products.image_url, '')} alt={item.products?.name} className="w-12 h-12 object-cover rounded" />
                )}
                <span className="truncate">{item.products?.name || `Product ${item.product_id.slice(0, 8)}`}</span>
              </div>
              <div className="col-span-2 text-center text-gray-700">{item.quantity}</div>
              <div className="col-span-3 text-right text-gray-700">Rp {item.price.toLocaleString('id-ID')}</div>
              <div className="col-span-2 text-right font-semibold text-gray-900">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile stacked layout */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            {item.products?.image_url ? (
              <img src={imageUrlWithCacheBust(item.products.image_url, '')} alt={item.products?.name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0 text-sm">
              <div className="font-medium text-gray-900 truncate">{item.products?.name || `Product ${item.product_id.slice(0, 8)}`}</div>
              <div className="text-gray-700 text-xs mt-1">Qty: {item.quantity} • Rp {item.price.toLocaleString('id-ID')}</div>
            </div>
            <div className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-2 text-right">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
