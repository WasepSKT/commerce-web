/**
 * Custom hook for calculating cart line items
 */

import { useMemo } from 'react';
import computePriceAfterDiscount from '@/utils/price';
import type { CartProduct } from '@/hooks/useCartProducts';

interface CartItem {
  id: string;
  quantity: number;
}

export interface LineItem {
  id: string;
  name: string;
  price: number;
  unit_price: number;
  discount_percent: number;
  quantity: number;
  image_url?: string;
  stock_quantity: number;
  updated_at?: string | number | null;
  updated_at_timestamp?: string | number | null;
}

export function useCartLineItems(items: CartItem[], products: CartProduct[]) {
  const lineItems = useMemo(() => {
    return items.map((it) => {
      const product = products.find((p) => p.id === it.id);
      const originalPrice = product?.price ?? 0;
      const discountPercent = product?.discount_percent ?? 0;
      const priceInfo = computePriceAfterDiscount({ price: originalPrice, discount_percent: discountPercent });

      return {
        id: it.id,
        name: product?.name ?? 'Produk tidak ditemukan',
        price: originalPrice,
        unit_price: priceInfo.discounted,
        discount_percent: priceInfo.discountPercent,
        quantity: it.quantity,
        image_url: product?.image_url,
        stock_quantity: product?.stock_quantity ?? 0,
      };
    });
  }, [items, products]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((s, it) => s + (it.unit_price ?? it.price) * it.quantity, 0);
  }, [lineItems]);

  return {
    lineItems,
    subtotal,
  };
}

