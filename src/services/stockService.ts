import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? '';

const supabaseRpc = supabase as unknown as {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: PostgrestError | null }>;
};

// Types for stock management
export interface StockValidationResult {
  valid: boolean;
  valid_items?: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    available_stock: number;
  }>;
  errors?: Array<{
    product_id: string;
    product_name?: string;
    required_quantity?: number;
    available_stock?: number;
    error: string;
  }>;
  total_items?: number;
  valid_count?: number;
  error_count?: number;
  error?: string;
}

export interface StockDecrementResult {
  success: boolean;
  updated_products?: number;
  errors?: number;
  order_id?: string;
  error?: string;
}

export interface StockAvailabilityResult {
  available: boolean;
  product_id?: string;
  product_name?: string;
  required_quantity?: number;
  available_stock?: number;
  remaining_after_purchase?: number;
  error?: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
}

export class StockService {
  /**
   * Validate stock availability for cart items before checkout
   */
  static async validateCartStock(cartItems: CartItem[]): Promise<StockValidationResult> {
    try {
      if (!cartItems || cartItems.length === 0) {
        return {
          valid: false,
          error: 'Cart is empty'
        };
      }

      const { data, error } = await supabaseRpc.rpc('validate_cart_stock', {
        cart_items: JSON.stringify(cartItems)
      });

      if (error) {
        console.error('Stock validation error:', error);
        return {
          valid: false,
          error: error.message || 'Failed to validate stock'
        };
      }

      return data as unknown as StockValidationResult;
    } catch (error) {
      console.error('Stock validation error:', error);
      return {
        valid: false,
        error: 'System error during stock validation'
      };
    }
  }

  /**
   * Check stock availability for a single product
   */
  static async checkStockAvailability(
    productId: string, 
    requiredQuantity: number
  ): Promise<StockAvailabilityResult> {
    try {
      if (!productId || requiredQuantity <= 0) {
        return {
          available: false,
          error: 'Invalid product ID or quantity'
        };
      }

      const { data, error } = await supabaseRpc.rpc('check_stock_availability', {
        product_id: productId,
        required_quantity: requiredQuantity
      });

      if (error) {
        console.error('Stock availability check error:', error);
        return {
          available: false,
          error: error.message || 'Failed to check stock availability'
        };
      }

      return data as unknown as StockAvailabilityResult;
    } catch (error) {
      console.error('Stock availability check error:', error);
      return {
        available: false,
        error: 'System error during stock check'
      };
    }
  }

  /**
   * Decrement stock for an order (called after successful checkout)
   */
  static async decrementStockForOrder(orderId: string, accessToken?: string): Promise<StockDecrementResult> {
    try {
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      let token = accessToken;
      if (!token) {
        const sessionInfo = await supabase.auth.getSession();
        token = sessionInfo.data.session?.access_token ?? undefined;
      }

      if (!token) {
        return {
          success: false,
          error: 'Unauthenticated'
        };
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase URL or anon key missing for stock decrement');
        return {
          success: false,
          error: 'Konfigurasi Supabase tidak lengkap'
        };
      }

      const endpoint = `${SUPABASE_URL}/rest/v1/rpc/decrement_stock_for_order_secure`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId })
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('Stock decrement HTTP error:', response.status, text);
        return {
          success: false,
          error: text || 'Failed to decrement stock'
        };
      }

      const payload = (await response.json().catch(() => null)) as StockDecrementResult | null;
      if (!payload) {
        return {
          success: false,
          error: 'Invalid response from stock service'
        };
      }

      return payload;
    } catch (error) {
      console.error('Stock decrement error:', error);
      return {
        success: false,
        error: 'System error during stock decrement'
      };
    }
  }

  /**
   * Restore stock for an order (called when order is cancelled)
   */
  static async restoreStockForOrder(orderId: string): Promise<StockDecrementResult> {
    try {
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      const { data, error } = await supabaseRpc.rpc('restore_stock_for_order', {
        order_id: orderId
      });

      if (error) {
        console.error('Stock restoration error:', error);
        return {
          success: false,
          error: error.message || 'Failed to restore stock'
        };
      }

      return data as unknown as StockDecrementResult;
    } catch (error) {
      console.error('Stock restoration error:', error);
      return {
        success: false,
        error: 'System error during stock restoration'
      };
    }
  }

  /**
   * Get current stock for a product
   */
  static async getProductStock(productId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product stock:', error);
        return null;
      }

      return data?.stock_quantity || 0;
    } catch (error) {
      console.error('Error fetching product stock:', error);
      return null;
    }
  }

  /**
   * Update product stock (admin only)
   */
  static async updateProductStock(
    productId: string, 
    newStock: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (newStock < 0) {
        return {
          success: false,
          error: 'Stock cannot be negative'
        };
      }

      const { error } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        console.error('Error updating product stock:', error);
        return {
          success: false,
          error: error.message || 'Failed to update stock'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating product stock:', error);
      return {
        success: false,
        error: 'System error during stock update'
      };
    }
  }

  /**
   * Get stock status for multiple products
   */
  static async getMultipleProductStock(productIds: string[]): Promise<Record<string, number>> {
    try {
      if (!productIds || productIds.length === 0) {
        return {};
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .in('id', productIds);

      if (error) {
        console.error('Error fetching multiple product stocks:', error);
        return {};
      }

      const stockMap: Record<string, number> = {};
      data?.forEach(product => {
        stockMap[product.id] = product.stock_quantity || 0;
      });

      return stockMap;
    } catch (error) {
      console.error('Error fetching multiple product stocks:', error);
      return {};
    }
  }

  /**
   * Check if products are out of stock
   */
  static async checkOutOfStockProducts(productIds: string[]): Promise<string[]> {
    try {
      const stockMap = await this.getMultipleProductStock(productIds);
      return productIds.filter(id => (stockMap[id] || 0) === 0);
    } catch (error) {
      console.error('Error checking out of stock products:', error);
      return [];
    }
  }

  /**
   * Get low stock products (stock <= threshold)
   */
  static async getLowStockProducts(threshold: number = 10): Promise<Array<{
    id: string;
    name: string;
    stock_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .lte('stock_quantity', threshold)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true });

      if (error) {
        console.error('Error fetching low stock products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }
}
