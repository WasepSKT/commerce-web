import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

// Helper untuk memanggil RPC dengan type safety
// Menggunakan Supabase client untuk memastikan JWT terkirim dengan benar
// Supabase client otomatis menambahkan header yang diperlukan dan JWT dari session
const callRpc = async (fn: string, params?: Record<string, unknown>) => {
  // Gunakan Supabase client langsung - client akan otomatis:
  // 1. Mengambil session dari localStorage
  // 2. Mengirim JWT dalam header Authorization
  // 3. Menambahkan header apikey
  // 4. Menangani refresh token otomatis
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
   * @param orderId - Order ID untuk decrement stock
   * @param accessToken - Optional: access token dari session (jika sudah diambil sebelumnya)
   */
  static async decrementStockForOrder(orderId: string, accessToken?: string): Promise<StockDecrementResult> {
    try {
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      // Pastikan Supabase client memiliki session yang valid
      // Supabase client akan otomatis mengirim JWT dari session ke RPC
      // Tidak perlu mengirim accessToken secara manual karena Supabase client sudah handle itu
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[StockService] Session error:', sessionError);
        return {
          success: false,
          error: 'Session error: ' + sessionError.message
        };
      }

      if (!sessionData.session) {
        console.error('[StockService] No session found');
        // Coba refresh session
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshed.session) {
          return {
            success: false,
            error: 'Unauthenticated: No active session. Please login.'
          };
        }
        console.debug('[StockService] Session refreshed, User:', refreshed.session.user.id);
      } else {
        console.debug('[StockService] Session found, User:', sessionData.session.user.id);
        console.debug('[StockService] Access token exists:', !!sessionData.session.access_token);
      }

      // Backend hanya menangani payment & webhook, stock decrement langsung via Supabase RPC
      // Supabase client akan otomatis mengirim JWT dari session yang valid ke RPC
      // RPC function akan membaca JWT dari request.jwt.claims.sub
      return await this.decrementViaSecureRpc(orderId);
    } catch (error) {
      console.error('[StockService] Stock decrement error:', error);
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
      
      // Pastikan Supabase client menggunakan session yang benar
      // Supabase client sudah otomatis membaca session dari localStorage
      // Tapi kita perlu memastikan session ter-set dengan benar
      // Verifikasi sekali lagi bahwa session masih valid sebelum memanggil RPC
      const verifySession = await supabase.auth.getSession();
      if (!verifySession.data.session) {
        console.error('[StockService] Session not found in Supabase client');
        return {
          success: false,
          error: 'Session not found in Supabase client'
        };
      }
      
      if (verifySession.data.session.user.id !== currentSession.user.id) {
        console.error('[StockService] Session mismatch:', {
          expected: currentSession.user.id,
          actual: verifySession.data.session.user.id
        });
        // Continue anyway, Supabase client akan menggunakan session yang terbaru
      }
      
      // Pastikan Supabase client menggunakan session yang valid
      // Jika session tidak sama, refresh Supabase client session
      if (verifySession.data.session.access_token !== currentSession.access_token) {
        console.warn('[StockService] Session token mismatch, Supabase client will use its own session');
        // Supabase client akan menggunakan session dari localStorage-nya sendiri
      }
      
      // Test JWT bisa dibaca sebelum memanggil RPC yang sebenarnya (optional, skip if function doesn't exist)
      try {
        console.debug('[StockService] Testing JWT readability...');
        // Supabase client akan otomatis mengirim JWT dari session
        const jwtTest = await callRpc('test_jwt_read', {});
        const jwtTestData = jwtTest.data as unknown;
        if (jwtTestData && typeof jwtTestData === 'object' && 'can_read_jwt' in jwtTestData) {
          const jwtTestResult = jwtTestData as { can_read_jwt: boolean; user_id?: string; error?: string };
          if (!jwtTestResult.can_read_jwt) {
            console.error('[StockService] JWT cannot be read by RPC!', jwtTestResult);
            return {
              success: false,
              error: 'JWT authentication failed: ' + (jwtTestResult.error || 'Cannot read JWT claims')
            };
          }
          console.debug('[StockService] JWT test passed, user_id:', jwtTestResult.user_id);
        }
      } catch (e) {
        // Skip JWT test if function doesn't exist, continue with main RPC call
        console.debug('[StockService] JWT test function not available, skipping test');
      }

      // Gunakan Supabase client langsung - client akan otomatis mengirim JWT dari session
      // Pastikan session sudah ter-set dengan benar sebelum memanggil RPC
      console.debug('[StockService] Session verified, calling RPC via Supabase client...');
      console.debug('[StockService] Session user ID:', currentSession.user.id);
      console.debug('[StockService] Access token exists:', !!currentSession.access_token);
      console.debug('[StockService] Order ID:', orderId);
      
      // Supabase client akan otomatis:
      // 1. Mengirim JWT dari session dalam header Authorization
      // 2. Menambahkan header apikey
      // 3. Menangani refresh token jika diperlukan
      const { data, error } = await callRpc('decrement_stock_for_order_secure', {
        order_id: orderId
      });
      
      console.debug('[StockService] RPC response:', { data, error });

      // Handle HTTP errors
      if (error) {
        console.error('[StockService] RPC HTTP error:', error);
        console.error('[StockService] Error details:', JSON.stringify(error, null, 2));
        return {
          success: false,
          error: error.message || 'Failed to decrement stock'
        };
      }

      // Handle response data
      if (!data) {
        console.warn('[StockService] RPC returned null/undefined data');
        return {
          success: false,
          error: 'Invalid response from stock service'
        };
      }

      // Parse response dari RPC (bisa berupa JSON string atau object)
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Jika response adalah object dengan success: false, check error message
      if (typeof result === 'object' && result !== null && 'success' in result) {
        const rpcResult = result as StockDecrementResult;
        
        // Jika RPC mengembalikan success: false dengan error "Unauthenticated"
        if (!rpcResult.success && rpcResult.error && rpcResult.error.includes('Unauthenticated')) {
          console.error('[StockService] RPC returned Unauthenticated error:', rpcResult);
          console.error('[StockService] This means JWT is not readable by RPC function');
          console.error('[StockService] Session user ID:', currentSession.user.id);
          console.error('[StockService] Access token exists:', !!currentSession.access_token);
          
          // Coba test JWT readability
          try {
            // Supabase client akan otomatis mengirim JWT dari session
            const jwtTest = await callRpc('test_jwt_read', {});
            console.error('[StockService] JWT test result:', jwtTest);
          } catch (e) {
            console.error('[StockService] JWT test failed:', e);
          }
          
          return {
            success: false,
            error: 'Unauthenticated: RPC function cannot read JWT. Please check RPC function configuration or try logging in again.'
          };
        }
        
        return rpcResult;
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
