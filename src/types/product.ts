export type ProductId = string & { readonly brand: 'ProductId' };
export type DiscountPercent = number; // 0-100
export type StockQuantity = number; // >= 0
export const asProductId = (id: string): ProductId => id as ProductId;

export interface ProductBase {
  id: ProductId;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: StockQuantity;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  image_url: string;
  image_gallery?: string[];
}

export interface ProductMeta {
  brand?: string | null;
  product_type?: string | null;
  pet_type?: string | null;
  origin_country?: string | null;
  expiry_date?: string | null;
  age_category?: string | null;
}

export interface SeoFields {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  seo_structured_data?: Record<string, unknown>;
}

export type Product = ProductBase & ProductMedia & ProductMeta & Partial<SeoFields> & {
  discount_percent?: DiscountPercent;
};


