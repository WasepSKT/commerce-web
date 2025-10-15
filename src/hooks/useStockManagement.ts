import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StockService, CartItem, StockValidationResult, StockAvailabilityResult } from '@/services/stockService';

export function useStockManagement() {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [isDecrementing, setIsDecrementing] = useState(false);

  /**
   * Validate stock for cart items
   */
  const validateCartStock = useCallback(async (cartItems: CartItem[]): Promise<StockValidationResult> => {
    setIsValidating(true);
    try {
      const result = await StockService.validateCartStock(cartItems);
      
      if (!result.valid && result.errors && result.errors.length > 0) {
        // Show specific error messages for out of stock items
        const outOfStockItems = result.errors.filter(error => 
          error.error === 'Insufficient stock'
        );
        
        if (outOfStockItems.length > 0) {
          const itemNames = outOfStockItems.map(item => item.product_name).join(', ');
          toast({
            variant: 'destructive',
            title: 'Stok tidak mencukupi',
            description: `Produk berikut tidak memiliki stok yang cukup: ${itemNames}`
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Stock validation error:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal validasi stok',
        description: 'Terjadi kesalahan saat memvalidasi stok produk'
      });
      return {
        valid: false,
        error: 'Validation failed'
      };
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  /**
   * Check stock availability for a single product
   */
  const checkStockAvailability = useCallback(async (
    productId: string, 
    quantity: number
  ): Promise<StockAvailabilityResult> => {
    try {
      const result = await StockService.checkStockAvailability(productId, quantity);
      
      if (!result.available) {
        toast({
          variant: 'destructive',
          title: 'Stok tidak tersedia',
          description: result.error || 'Produk tidak memiliki stok yang cukup'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Stock availability check error:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal cek stok',
        description: 'Terjadi kesalahan saat mengecek ketersediaan stok'
      });
      return {
        available: false,
        error: 'Check failed'
      };
    }
  }, [toast]);

  /**
   * Decrement stock for an order
   */
  const decrementStockForOrder = useCallback(async (orderId: string): Promise<boolean> => {
    setIsDecrementing(true);
    try {
      const result = await StockService.decrementStockForOrder(orderId);
      
      if (result.success) {
        toast({
          title: 'Stok berhasil diperbarui',
          description: `Stok untuk ${result.updated_products || 0} produk telah dikurangi`
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal mengurangi stok',
          description: result.error || 'Terjadi kesalahan saat mengurangi stok'
        });
        return false;
      }
    } catch (error) {
      console.error('Stock decrement error:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal mengurangi stok',
        description: 'Terjadi kesalahan sistem saat mengurangi stok'
      });
      return false;
    } finally {
      setIsDecrementing(false);
    }
  }, [toast]);

  /**
   * Restore stock for an order (cancellation)
   */
  const restoreStockForOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const result = await StockService.restoreStockForOrder(orderId);
      
      if (result.success) {
        toast({
          title: 'Stok berhasil dipulihkan',
          description: `Stok untuk ${result.updated_products || 0} produk telah dipulihkan`
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal memulihkan stok',
          description: result.error || 'Terjadi kesalahan saat memulihkan stok'
        });
        return false;
      }
    } catch (error) {
      console.error('Stock restoration error:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memulihkan stok',
        description: 'Terjadi kesalahan sistem saat memulihkan stok'
      });
      return false;
    }
  }, [toast]);

  /**
   * Get product stock
   */
  const getProductStock = useCallback(async (productId: string): Promise<number | null> => {
    try {
      return await StockService.getProductStock(productId);
    } catch (error) {
      console.error('Error getting product stock:', error);
      return null;
    }
  }, []);

  /**
   * Update product stock (admin)
   */
  const updateProductStock = useCallback(async (
    productId: string, 
    newStock: number
  ): Promise<boolean> => {
    try {
      const result = await StockService.updateProductStock(productId, newStock);
      
      if (result.success) {
        toast({
          title: 'Stok berhasil diperbarui',
          description: `Stok produk telah diubah menjadi ${newStock}`
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal memperbarui stok',
          description: result.error || 'Terjadi kesalahan saat memperbarui stok'
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating product stock:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memperbarui stok',
        description: 'Terjadi kesalahan sistem saat memperbarui stok'
      });
      return false;
    }
  }, [toast]);

  /**
   * Get low stock products
   */
  const getLowStockProducts = useCallback(async (threshold: number = 10) => {
    try {
      return await StockService.getLowStockProducts(threshold);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  }, []);

  return {
    // State
    isValidating,
    isDecrementing,
    
    // Actions
    validateCartStock,
    checkStockAvailability,
    decrementStockForOrder,
    restoreStockForOrder,
    getProductStock,
    updateProductStock,
    getLowStockProducts
  };
}
