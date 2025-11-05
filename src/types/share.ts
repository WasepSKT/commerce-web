import type { ProductId } from './product';

export interface SharePayload {
  productId: ProductId;
  name: string;
  description?: string;
  productUrl?: string; // optional precomputed
}


