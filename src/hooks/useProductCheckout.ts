import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import computePriceAfterDiscount from '@/utils/price';
import type { Product } from '@/types/product';

interface Profile {
  user_id: string;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postal_code?: string | null;
}

export const useProductCheckout = (product: Product | null, profile: Profile | null) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const validateAddress = () => {
    const missingFields: string[] = [];
    if (!profile?.full_name) missingFields.push('Nama penerima');
    if (!profile?.phone) missingFields.push('Nomor HP/WA');
    if (!profile?.address) missingFields.push('Alamat lengkap');
    if (!profile?.province) missingFields.push('Provinsi');
    if (!profile?.city) missingFields.push('Kabupaten/Kota');
    if (!profile?.district) missingFields.push('Kecamatan');
    if (!profile?.subdistrict) missingFields.push('Desa/Kelurahan');
    if (!profile?.postal_code) missingFields.push('Kode Pos');

    return { isValid: missingFields.length === 0, missingFields };
  };

  const buildFullAddress = () => {
    if (!profile) return '';
    
    let fullAddress = profile.address || '';
    if (profile.subdistrict) fullAddress += `\n${profile.subdistrict}`;
    if (profile.district) fullAddress += `, ${profile.district}`;
    if (profile.city) fullAddress += `\n${profile.city}`;
    if (profile.province) fullAddress += `, ${profile.province}`;
    if (profile.postal_code) fullAddress += `\nKode Pos: ${profile.postal_code}`;
    
    return fullAddress;
  };

  const createPendingOrder = async (quantity: number): Promise<string | null> => {
    if (!product || !profile) {
      console.error('Missing product or profile when creating order');
      return null;
    }

    setCreatingOrder(true);
    try {
      const { StockService } = await import('@/services/stockService');
      const stockCheck = await StockService.checkStockAvailability(product.id, quantity);
      if (!stockCheck.available) {
        throw new Error(stockCheck.error || 'Stok tidak mencukupi');
      }

      const orderPayload = {
        total_amount: product.price * quantity,
        status: 'pending' as const,
        customer_name: profile.full_name ?? '',
        customer_phone: profile.phone ?? '',
        customer_address: buildFullAddress(),
        user_id: profile.user_id,
      };

      const { data, error } = await supabase.from('orders').insert([orderPayload]).select().single();
      if (error) throw error;

      const createdOrder = data as { id?: string } | null;
      const orderId = createdOrder?.id ?? null;
      if (!orderId) throw new Error('No order id returned');

      const priceInfo = computePriceAfterDiscount({
        price: product.price,
        discount_percent: product.discount_percent ?? 0
      });

      // Insert order items - hanya field yang ada di schema database
      const itemsPayload = [{
        order_id: orderId,
        product_id: product.id,
        quantity,
        price: priceInfo.discounted
      }];

      console.log('Inserting order items from product checkout:', itemsPayload);

      const stockResult = await StockService.decrementStockForOrder(orderId);
      if (!stockResult.success) {
        console.warn('Failed to decrement stock:', stockResult.error);
      }

      const itemsRes = await supabase.from('order_items').insert(itemsPayload).select();
      const itemsError = itemsRes?.error ?? null;

      if (itemsError || !itemsRes?.data?.length) {
        console.error('Failed to insert order items:', itemsError);
        await supabase.from('orders').delete().eq('id', orderId);
        throw new Error('Failed to insert order items');
      }

      console.log('Order items inserted successfully:', itemsRes.data);

      setPendingOrderId(orderId);
      return orderId;
    } catch (err: unknown) {
      console.error('Failed to create order', err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat pesanan.';
      toast({ variant: 'destructive', title: 'Gagal membuat pesanan', description: message });
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const proceedToCheckout = (productId: string, quantity: number) => {
    const validation = validateAddress();
    if (!validation.isValid) {
      toast({
        variant: 'destructive',
        title: 'Data Alamat Belum Lengkap',
        description: `Silakan lengkapi data berikut: ${validation.missingFields.join(', ')}.`
      });
      navigate(`/profile?next=/product/${productId}`);
      return;
    }

    navigate(`/checkout?product_id=${productId}&quantity=${quantity}&from_product=1`);
  };

  return {
    creatingOrder,
    pendingOrderId,
    createPendingOrder,
    proceedToCheckout,
  };
};
