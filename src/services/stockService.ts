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

      let currentSession = sessionData.data.session;
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
      // Verifikasi cepat format access token: harus berupa JWT Supabase
      // (format: header.payload.signature -> 3 bagian dipisah titik)
      const tokenParts = currentSession.access_token.split('.');
      if (tokenParts.length !== 3) {
        console.error('[StockService] Access token is not a Supabase JWT (unexpected format)', { token: currentSession.access_token });
        return {
          success: false,
          error: 'Unauthenticated: Access token is not a Supabase JWT. Please login via Supabase auth flow (do not pass provider OAuth token directly).'
        };
      }

      // Decode JWT untuk verifikasi (opsional, untuk debugging)
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.debug('[StockService] JWT payload:', {
          sub: payload.sub,
          role: payload.role,
          exp: payload.exp,
          expDate: new Date(payload.exp * 1000).toISOString()
        });
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
        console.warn('[StockService] Session not found in Supabase client — attempting to rehydrate from localStorage');
        try {
          // Some environments may not have supabase client session hydrated
          // but the browser localStorage contains the sb-<ref>-auth-token entry.
          // Attempt to read and set the session so supabase client sends the same JWT.
          const authKey = Object.keys(localStorage).find(k => /sb-.*-auth-token/.test(k));
          if (authKey) {
            const raw = localStorage.getItem(authKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              // `parsed` shape: { currentSession: { access_token, refresh_token, ... }, ... }
              const cs = parsed.currentSession || parsed.current_session || parsed;
              const access = cs?.access_token ?? cs?.accessToken ?? null;
              const refresh = cs?.refresh_token ?? cs?.refreshToken ?? null;
              if (access) {
                // setSession will hydrate the client to use this JWT for subsequent RPCs
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
                console.debug('[StockService] Supabase client session rehydrated from localStorage');
              }
            }
          }
        } catch (e) {
          console.warn('[StockService] Failed to rehydrate session from localStorage', e);
        }
        // Re-check session after attempt
        const recheck = await supabase.auth.getSession();
        if (!recheck.data.session) {
          console.error('[StockService] Session not available after rehydration');
          return {
            success: false,
            error: 'Session not found in Supabase client'
          };
        }
        // use recheck as the active session
        sessionData = recheck as any;
      }

      // Proactively compare localStorage auth token with the Supabase client session token.
      try {
        const authKey = Object.keys(localStorage).find(k => /sb-.*-auth-token/.test(k));
        let localToken: string | null = null;
        if (authKey) {
          try {
            const raw = localStorage.getItem(authKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              // search for first JWT-looking string inside parsed object
              const findToken = (o: any): string | null => {
                if (!o) return null;
                if (typeof o === 'string' && o.split('.').length === 3) return o;
                if (Array.isArray(o)) {
                  for (const v of o) {
                    const r = findToken(v); if (r) return r;
                  }
                }
                if (typeof o === 'object') {
                  for (const k in o) {
                    try { const r = findToken(o[k]); if (r) return r; } catch (_) { /* ignore */ }
                  }
                }
                return null;
              };
              localToken = findToken(parsed);
            }
          } catch (e) {
            /* ignore parse errors */
          }
        }

        console.debug('[StockService] Token preview - client:', String(currentSession?.access_token ?? '').slice(0,8) + '...', 'localStorage:', localToken ? String(localToken).slice(0,8) + '...' : null);

        if (localToken && currentSession && currentSession.access_token !== localToken) {
          try {
            console.debug('[StockService] Local token differs from client session; applying one-time setSession');
            // @ts-ignore setSession exists
            await supabase.auth.setSession({ access_token: localToken, refresh_token: null });
            // re-fetch session
            const after = await supabase.auth.getSession();
            if (after.data && after.data.session) {
              currentSession = after.data.session;
              console.debug('[StockService] Session updated from local token (preview):', String(currentSession.access_token).slice(0,8) + '...');
            }
          } catch (e) {
            console.warn('[StockService] Failed to setSession from local token', e);
          }
        }
      } catch (e) {
        console.warn('[StockService] Error while comparing local token and client session', e);
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

        const checkJwtResult = async (forceRehydrate = false) => {
          if (jwtTestData && typeof jwtTestData === 'object' && 'can_read_jwt' in jwtTestData) {
            const jwtTestResult = jwtTestData as { can_read_jwt: boolean; user_id?: string; error?: string };
            if (!jwtTestResult.can_read_jwt) {
              console.error('[StockService] JWT cannot be read by RPC!', jwtTestResult);
              if (!forceRehydrate) {
                // Try a one-time client rehydrate from localStorage and retry the test/RPC
                try {
                  console.debug('[StockService] Attempting one-time rehydrate from localStorage and retry');
                  const authKey = Object.keys(localStorage).find(k => /sb-.*-auth-token/.test(k));
                  if (authKey) {
                    const raw = localStorage.getItem(authKey);
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      const cs = parsed.currentSession || parsed.current_session || parsed;
                      const access = cs?.access_token ?? cs?.accessToken ?? null;
                      const refresh = cs?.refresh_token ?? cs?.refreshToken ?? null;
                      if (access) {
                        // Only attempt to set session if token differs to avoid thrash
                        if (access !== currentSession.access_token) {
                          // @ts-ignore setSession exists
                          await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
                          console.debug('[StockService] One-time rehydrate setSession applied (token preview):', String(access).slice(0, 8) + '...');
                        } else {
                          console.debug('[StockService] LocalStorage access token matches current session token; skipping setSession');
                        }
                        // Retry jwtTest after rehydrate
                        const jwtTest2 = await callRpc('test_jwt_read', {});
                        return jwtTest2.data as unknown;
                      }
                    }
                  }
                } catch (rehErr) {
                  console.warn('[StockService] One-time rehydrate attempt failed', rehErr);
                }
              }
              return jwtTestData;
            }
            return jwtTestResult;
          }
          return null;
        };

        const firstCheck = await checkJwtResult(false);
        if (firstCheck && typeof firstCheck === 'object' && 'can_read_jwt' in (firstCheck as any)) {
          const r = firstCheck as { can_read_jwt: boolean; user_id?: string; error?: string };
          if (!r.can_read_jwt) {
            return {
              success: false,
              error: 'JWT authentication failed: ' + (r.error || 'Cannot read JWT claims')
            };
          }
          console.debug('[StockService] JWT test passed, user_id:', r.user_id);
        }
      } catch (e) {
        // Skip JWT test if function doesn't exist, continue with main RPC call
        console.debug('[StockService] JWT test function not available, skipping test', e);
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
