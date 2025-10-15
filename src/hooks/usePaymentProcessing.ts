import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';
import { createPaymentSession, CreateSessionResult, CreatePaymentPayload } from '@/services/paymentService';
import { Order, OrderItem } from '@/types/checkout';
import { StockService } from '@/services/stockService';

export function usePaymentProcessing() {
  const { toast } = useToast();
  const [creatingSession, setCreatingSession] = useState(false);

  const processPayment = async ({
    order,
    items,
    selectedRate,
    selectedPaymentMethod,
    paymentChannel,
    profile,
    dryRun,
    subtotal,
    total
  }: {
    order: Order | null;
    items: OrderItem[];
    selectedRate: any;
    selectedPaymentMethod: string;
    paymentChannel?: string;
    profile: any;
    dryRun: boolean;
    subtotal: number;
    total: number;
  }) => {
    setCreatingSession(true);
    try {
      // Validate stock before processing payment
      if (!dryRun) {
        const cartItems = items.map(item => ({
          product_id: item.product_id!,
          quantity: item.quantity || 1
        }));

        const stockValidation = await StockService.validateCartStock(cartItems);
        if (!stockValidation.valid) {
          throw new Error('Stok tidak mencukupi untuk beberapa produk');
        }
      }

      let oid = order?.id;
      
      if (!oid) {
        if (dryRun) {
          return await handleDryRunPayment({
            items,
            selectedPaymentMethod,
            paymentChannel,
            profile,
            subtotal
          });
        } else {
          oid = await createOrderInDatabase({
            profile,
            subtotal
          });
          await createOrderItemsInDatabase(oid, items);
        }
      }

      if (selectedRate) {
        await updateOrderWithShipping(oid, selectedRate, total);
      }

      // Decrement stock after successful order creation
      if (!dryRun && oid) {
        const stockResult = await StockService.decrementStockForOrder(oid);
        if (!stockResult.success) {
          console.warn('Failed to decrement stock:', stockResult.error);
          // Don't throw error here as order is already created
          // Stock can be managed manually by admin if needed
        }
      }

      return await createPaymentSessionForOrder({
        orderId: oid,
        selectedPaymentMethod,
        paymentChannel
      });
    } catch (err) {
      console.error('Failed to initiate payment', err);
      toast({ 
        variant: 'destructive', 
        title: 'Gagal memulai pembayaran', 
        description: String(err) 
      });
      throw err;
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDryRunPayment = async ({
    items,
    selectedPaymentMethod,
    paymentChannel,
    profile,
    subtotal
  }: {
    items: OrderItem[];
    selectedPaymentMethod: string;
    paymentChannel?: string;
    profile: any;
    subtotal: number;
  }) => {
    const tempOrder = {
      total_amount: subtotal,
      status: 'pending',
      customer_name: profile?.full_name ?? '',
      customer_phone: profile?.phone ?? '',
      customer_address: profile?.address ?? '',
      user_id: profile?.user_id ?? null,
      items: items.map(i => ({ 
        product_id: i.product_id, 
        product_name: i.product_name, 
        quantity: i.quantity ?? 1, 
        price: i.price ?? i.unit_price ?? 0, 
        unit_price: i.unit_price ?? i.price ?? 0 
      })),
    } as const;

    const payload: CreatePaymentPayload = {
      order: tempOrder,
      return_url: window.location.href,
      payment_method: selectedPaymentMethod,
      test: true,
      ...(paymentChannel ? { payment_channel: paymentChannel } : {}),
    };

    const session = await createPaymentSession(payload);
    const redirectUrl = session?.url ?? session?.checkout_url;
    
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    toast({ 
      title: 'Sesi pembayaran (uji) dibuat', 
      description: 'Ini adalah mode uji — tidak ada data yang disimpan.' 
    });
  };

  const createOrderInDatabase = async (profile: any, subtotal: number): Promise<string> => {
    type OrderInsert = Database['public']['Tables']['orders']['Insert'];
    const orderPayload: OrderInsert = {
      total_amount: subtotal,
      status: 'pending',
      customer_name: profile?.full_name ?? '',
      customer_phone: profile?.phone ?? '',
      customer_address: profile?.address ?? '',
      user_id: profile?.user_id ?? '' as string,
    } as OrderInsert;

    const insertRes = await supabase.from('orders').insert([orderPayload]).select().single();
    const created = (insertRes as { data?: Order | null }).data;
    if (!created?.id) throw new Error('Gagal membuat pesanan');
    
    return created.id;
  };

  const createOrderItemsInDatabase = async (orderId: string, items: OrderItem[]) => {
    const itemsPayload = items.map(i => ({ 
      order_id: orderId, 
      product_id: i.product_id, 
      quantity: i.quantity ?? 1, 
      price: i.price ?? i.unit_price ?? 0, 
      unit_price: i.unit_price ?? i.price ?? 0 
    }));
    
    const sb = (supabase as unknown) as { 
      from: (table: string) => { insert: (v: unknown) => Promise<unknown> } 
    };
    await sb.from('order_items').insert(itemsPayload);
  };

  const updateOrderWithShipping = async (orderId: string, selectedRate: any, total: number) => {
    await supabase
      .from('orders')
      .update({ 
        shipping_courier: selectedRate.provider, 
        total_amount: total 
      })
      .eq('id', orderId);
  };

  const createPaymentSessionForOrder = async ({
    orderId,
    selectedPaymentMethod,
    paymentChannel
  }: {
    orderId: string;
    selectedPaymentMethod: string;
    paymentChannel?: string;
  }): Promise<CreateSessionResult | null> => {
    const session = await createPaymentSession({
      order_id: orderId,
      return_url: window.location.href,
      payment_method: selectedPaymentMethod,
      ...(paymentChannel ? { payment_channel: paymentChannel } : {}),
    });

    const redirectUrl = session?.url ?? session?.checkout_url;
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    toast({ 
      title: 'Sesi pembayaran dibuat', 
      description: 'Lanjutkan ke penyedia pembayaran.' 
    });

    return session;
  };

  return {
    creatingSession,
    processPayment
  };
}
