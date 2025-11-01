import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import computePriceAfterDiscount from '@/utils/price';
import { Order, OrderItem, CheckoutQueryParams } from '@/types/checkout';
import { safeJsonParse } from '@/utils/storage';

export function useCheckoutInitialization(params: CheckoutQueryParams) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      setInitializing(true);
      try {
        if (params.order_id) {
          await loadExistingOrder(params.order_id);
        } else if (params.product_id) {
          await loadSingleProduct(params.product_id, params.quantity);
        } else if (params.from_cart === '1' || params.from_cart === 'true') {
          await loadFromCart();
        } else {
          navigate('/cart');
        }
      } catch (err) {
        console.error('Failed to initialize checkout', err);
        toast({ 
          variant: 'destructive', 
          title: 'Gagal memuat checkout', 
          description: String(err) 
        });
        navigate('/cart');
      } finally {
        setInitializing(false);
      }
    };

    void init();
  }, [params.order_id, params.product_id, params.quantity, params.from_cart, navigate, toast]);

  const loadExistingOrder = async (orderId: string) => {
    const res = await supabase.from('orders').select('*').eq('id', orderId).single();
    const ord = (res as { data?: Order | null }).data;
    if (!ord) throw new Error('Order tidak ditemukan');
    
    setOrder(ord);
    
    const itemsRes = await supabase
      .from('order_items')
      .select('id,order_id,product_id,price,unit_price,quantity,product_name')
      .eq('order_id', orderId);
    
    setItems(((itemsRes as { data?: OrderItem[] | null }).data) ?? []);
  };

  const loadSingleProduct = async (productId: string, quantity: number) => {
    type ProdRow = { 
      id: string; 
      name: string; 
      price: number; 
      image_url?: string; 
      discount_percent?: number | null 
    };
    
    const prodRes = await supabase
      .from('products')
      .select('id,name,price,image_url,discount_percent')
      .eq('id', productId)
      .single();
    
    const prod = (prodRes as { data?: ProdRow | null }).data;
    if (!prod) throw new Error('Produk tidak ditemukan');
    
    const priceInfo = computePriceAfterDiscount({ 
      price: prod.price, 
      discount_percent: prod.discount_percent ?? 0 
    });
    
    setItems([{ 
      product_id: prod.id, 
      product_name: prod.name, 
      unit_price: priceInfo.discounted, 
      quantity: Math.max(1, quantity) 
    }]);
  };

  const loadFromCart = async () => {
    try {
      const raw = localStorage.getItem('rp_cart_v1');
      if (!raw) throw new Error('Keranjang kosong');

      const parsedRaw = parseCartData(raw);
      const entries = normalizeCartEntries(parsedRaw);
      const ids = Array.from(new Set(entries.map(p => p.id).filter(Boolean) as string[]));
      
      if (ids.length === 0) throw new Error('Tidak ada produk di keranjang');

      const itemsBuilt = await buildOrderItemsFromCart(entries, ids);
      if (itemsBuilt.length === 0) throw new Error('Produk keranjang tidak tersedia');
      
      setItems(itemsBuilt);
    } catch (err) {
      console.error('Failed to initialize from cart', err);
      toast({ 
        variant: 'destructive', 
        title: 'Gagal memuat keranjang', 
        description: String(err) 
      });
      throw err;
    }
  };

  const parseCartData = (raw: string) => {
    try {
      const parsed = safeJsonParse(raw, null);
      if (!parsed) throw new Error('Data keranjang tidak valid');
      return parsed;
    } catch (parseErr) {
      throw new Error('Data keranjang tidak valid');
    }
  };

  const normalizeCartEntries = (parsedRaw: unknown): Array<{ id?: string; quantity?: number }> => {
    if (Array.isArray(parsedRaw)) {
      return parsedRaw as Array<{ id?: string; quantity?: number }>;
    }
    
    if (parsedRaw && typeof parsedRaw === 'object') {
      const obj = parsedRaw as Record<string, unknown>;
      if (Array.isArray((obj as unknown as { items?: unknown }).items)) {
        return (obj as unknown as { items?: Array<{ id?: string; quantity?: number }> })
          .items as Array<{ id?: string; quantity?: number }>;
      } else {
        // convert map-like to entries
        return Object.keys(obj).map(k => {
          const v = obj[k];
          if (v && typeof v === 'object' && 'quantity' in (v as Record<string, unknown>)) {
            const q = (v as Record<string, unknown>)['quantity'];
            return { id: k, quantity: typeof q === 'number' ? q as number : Number(q) || 1 };
          }
          return { id: k, quantity: typeof v === 'number' ? Number(v) : 1 };
        });
      }
    }
    
    return [];
  };

  const buildOrderItemsFromCart = async (
    entries: Array<{ id?: string; quantity?: number }>, 
    ids: string[]
  ): Promise<OrderItem[]> => {
    type ProdRow = { 
      id: string; 
      name: string; 
      price: number; 
      image_url?: string; 
      discount_percent?: number | null 
    };
    
    const prodRes = await supabase
      .from('products')
      .select('id,name,price,image_url,discount_percent')
      .in('id', ids);
    
    const prodData = (prodRes as { data?: ProdRow[] | null }).data ?? [];
    
    return entries.map(entry => {
      const prod = prodData.find(p => p.id === entry.id);
      if (!prod) return null;
      
      const priceInfo = computePriceAfterDiscount({ 
        price: prod.price ?? 0, 
        discount_percent: prod.discount_percent ?? 0 
      });
      
      return { 
        product_id: prod.id, 
        product_name: prod.name, 
        unit_price: priceInfo.discounted, 
        price: prod.price, 
        quantity: entry.quantity ?? 1 
      } as OrderItem;
    }).filter((x): x is OrderItem => x !== null && x !== undefined);
  };

  return {
    order,
    items,
    initializing,
    setOrder
  };
}
