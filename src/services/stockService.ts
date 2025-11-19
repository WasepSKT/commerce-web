import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

// Helper untuk memanggil RPC dengan type safety
const callRpc = async (fn: string, params?: Record<string, unknown>) => {
  // @ts-expect-error: RPC name mungkin belum terdaftar di tipe supabase d.ts
  return await supabase.rpc(fn as never, params);
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

      const { data, error } = await callRpc('validate_cart_stock', {
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

      const { data, error } = await callRpc('check_stock_availability', {
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

      // Pastikan session valid dan ter-refresh sebelum memanggil RPC
      let sessionInfo = await supabase.auth.getSession();
      let session = sessionInfo.data.session;
      
      // Jika session tidak ada atau token expired, coba refresh
      if (!session || !session.access_token) {
        console.debug('[StockService] Session missing or expired, attempting refresh...');
        const refreshed = await supabase.auth.refreshSession();
        sessionInfo = refreshed;
        session = refreshed.data.session;
      }
      
      if (!session || !session.access_token) {
        console.error('[StockService] No valid session after refresh attempt');
        return {
          success: false,
          error: 'Unauthenticated: No active session. Please login.'
        };
      }
      
      console.debug('[StockService] Session valid, user ID:', session.user.id);

      // Backend hanya menangani payment & webhook, stock decrement langsung via Supabase RPC
      // Supabase client akan otomatis mengirim JWT dari session yang valid
      return await this.decrementViaSecureRpc(orderId);
    } catch (error) {
      console.error('Stock decrement error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'System error during stock decrement'
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

      const { data, error } = await callRpc('restore_stock_for_order', {
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

  private static async decrementViaSecureRpc(orderId: string): Promise<StockDecrementResult> {
    try {
      // Pastikan session masih valid dan ter-refresh sebelum memanggil RPC
      // Supabase client akan otomatis membaca session dari localStorage
      let sessionData = await supabase.auth.getSession();
      
      if (sessionData.error) {
        console.error('[StockService] Session error:', sessionData.error);
        return {
          success: false,
          error: 'Session error: ' + sessionData.error.message
        };
      }
      
      // Jika session tidak ada, coba refresh
      if (!sessionData.data.session) {
        console.warn('[StockService] No session found, attempting refresh...');
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.error || !refreshed.data.session) {
          console.error('[StockService] Failed to refresh session');
          return {
            success: false,
            error: 'Unauthenticated: No active session. Please login again.'
          };
        }
        sessionData = refreshed;
        console.debug('[StockService] Session refreshed successfully');
      }

      const currentSession = sessionData.data.session;
      if (!currentSession) {
        console.error('[StockService] No session available after refresh');
        return {
          success: false,
          error: 'Unauthenticated: No active session'
        };
      }

      // Pastikan access token ada
      if (!currentSession.access_token) {
        console.error('[StockService] No access token in session');
        return {
          success: false,
          error: 'Unauthenticated: No access token'
        };
      }

      // Decode JWT untuk verifikasi (opsional, untuk debugging)
      try {
        const tokenParts = currentSession.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.debug('[StockService] JWT payload:', {
            sub: payload.sub,
            role: payload.role,
            exp: payload.exp,
            expDate: new Date(payload.exp * 1000).toISOString()
          });
        }
      } catch (e) {
        console.warn('[StockService] Failed to decode JWT for debugging:', e);
      }

      console.debug('[StockService] Calling decrement_stock_for_order_secure for order:', orderId);
      console.debug('[StockService] Session user ID:', currentSession.user.id);
      console.debug('[StockService] Access token exists:', !!currentSession.access_token);
      console.debug('[StockService] Token expires at:', new Date(currentSession.expires_at! * 1000).toISOString());
      
      // Gunakan supabase client langsung - client akan otomatis mengirim JWT dari session
      // Pastikan tidak ada konflik dengan token manual di localStorage
      const { data, error } = await callRpc('decrement_stock_for_order_secure', {
        order_id: orderId
      });

      if (error) {
        console.error('[StockService] RPC error:', error);
        console.error('[StockService] Error details:', JSON.stringify(error, null, 2));
        // RPC bisa mengembalikan error dengan detail lebih spesifik
        const errorMessage = error.message || 'Failed to decrement stock';
        
        // Jika error adalah "Unauthenticated", coba refresh session sekali lagi
        if (errorMessage.includes('Unauthenticated') || errorMessage.includes('unauthenticated')) {
          console.warn('[StockService] Unauthenticated error, attempting to refresh session...');
          const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshedSession.session) {
            return {
              success: false,
              error: 'Unauthenticated: Please login again'
            };
          }
          // Coba sekali lagi dengan session yang fresh
          console.debug('[StockService] Retrying with refreshed session...');
          const retry = await callRpc('decrement_stock_for_order_secure', {
            order_id: orderId
          });
          if (retry.error) {
            return {
              success: false,
              error: retry.error.message || 'Failed to decrement stock after session refresh'
            };
          }
          const retryData = retry.data as unknown;
          const retryResult = typeof retryData === 'string' ? JSON.parse(retryData) : retryData;
          return retryResult as StockDecrementResult;
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      if (!data) {
        console.warn('[StockService] RPC returned null/undefined data');
        return {
          success: false,
          error: 'Invalid response from stock service'
        };
      }

      // Parse response dari RPC (bisa berupa JSON string atau object)
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Jika response adalah object dengan success: false, return langsung
      if (typeof result === 'object' && result !== null && 'success' in result) {
        return result as StockDecrementResult;
      }
      
      return result as StockDecrementResult;
    } catch (err) {
      console.error('[StockService] RPC exception:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to decrement stock'
      };
    }
  }
}
