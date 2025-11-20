import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { rehydrateSupabaseSession } from '@/integrations/supabase/rehydrateSession';
import computePriceAfterDiscount from '@/utils/price';
import { safeJsonParse } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderItem } from '@/types/checkout';
import { CHECKOUT_MESSAGES } from '@/constants/checkout';
import { useAuth } from '@/hooks/useAuth';

export function useCheckoutInitialization() {
  const query = new URLSearchParams(useLocation().search);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [initializing, setInitializing] = useState(true);

  const orderIdParam = query.get('order_id');
  const productId = query.get('product_id');
  const fromCartParam = query.get('from_cart');
  const quantityParam = Number(query.get('quantity') ?? '1');
    const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const init = async () => {
      setInitializing(true);
      try {
        // Wait for auth to be initialized before attempting to read server-side cart
        if (authLoading) return; // effect will re-run when authLoading changes
        // Best-effort: rehydrate supabase-js session from localStorage so RPCs/sendings have correct token
        try { await rehydrateSupabaseSession(); } catch (e) { /* swallow - best-effort */ }
        if (orderIdParam) {
          const res = await supabase.from('orders').select('*').eq('id', orderIdParam).single();
          const ord = (res as { data?: Order | null }).data;
          if (!ord) throw new Error('Order tidak ditemukan');
          setOrder(ord);
          const itemsRes = await supabase.from('order_items').select('id,order_id,product_id,price,unit_price,quantity,product_name').eq('order_id', orderIdParam);
          setItems(((itemsRes as { data?: OrderItem[] | null }).data) ?? []);
        } else if (productId) {
          type ProdRow = { id: string; name: string; price: number; image_url?: string; discount_percent?: number | null };
          const prodRes = await supabase.from('products').select('id,name,price,image_url,discount_percent').eq('id', productId).single();
          const prod = (prodRes as { data?: ProdRow | null }).data;
          if (!prod) throw new Error('Produk tidak ditemukan');
          const priceInfo = computePriceAfterDiscount({ price: prod.price, discount_percent: prod.discount_percent ?? 0 });
          setItems([{ product_id: prod.id, product_name: prod.name, unit_price: priceInfo.discounted, quantity: Math.max(1, quantityParam) }]);
        } else if (fromCartParam === '1' || fromCartParam === 'true') {
          try {
              // If user is logged in, prefer server-side cart (supabase `carts` table)
              let entries: Array<{ id?: string; quantity?: number }> = [];
              if (user && user.id) {
                // Try to load server-side cart; if the request errors (RLS, network, etc.)
                // we fall back to reading localStorage below.
                try {
                  const cartRes = await supabase.from('carts').select('items').eq('user_id', user.id).maybeSingle();
                  // supabase-js returns { data, error }
                  const cartRow = (cartRes as { data?: Record<string, unknown> | null, error?: unknown }).data ?? null;
                  const fetchError = (cartRes as { error?: unknown }).error;
                  if (fetchError) {
                    console.debug('[useCheckoutInitialization] server cart fetch error', fetchError);
                  } else {
                    const serverItems = cartRow && typeof cartRow === 'object' && Array.isArray(cartRow.items) ? (cartRow.items as unknown[]) : [];
                    if (Array.isArray(serverItems) && serverItems.length > 0) {
                      entries = serverItems.map(it => {
                        if (!it || typeof it !== 'object') return { id: undefined, quantity: 0 };
                        const rec = it as Record<string, unknown>;
                        return { id: String(rec['product_id'] ?? rec['id'] ?? ''), quantity: typeof rec['quantity'] === 'number' ? (rec['quantity'] as number) : Number(rec['quantity']) || 1 };
                      }).filter(e => !!e.id);
                    }
                  }
                } catch (e) {
                  console.debug('[useCheckoutInitialization] server cart fetch threw', e);
                }
              }

              // Fallback: legacy localStorage cart for unauthenticated users or empty server cart
              if (entries.length === 0) {
                const raw = localStorage.getItem('rp_cart_v1');
                if (!raw) throw new Error('Keranjang kosong');

                const parsedRaw: unknown = safeJsonParse(raw, null);
                if (!parsedRaw) throw new Error('Data keranjang tidak valid');

                if (Array.isArray(parsedRaw)) {
                  entries = parsedRaw as Array<{ id?: string; quantity?: number }>;
                } else if (parsedRaw && typeof parsedRaw === 'object') {
                  const obj = parsedRaw as Record<string, unknown>;
                  if (Array.isArray((obj as unknown as { items?: unknown }).items)) {
                    entries = (obj as unknown as { items?: Array<{ id?: string; quantity?: number }> }).items as Array<{ id?: string; quantity?: number }>;
                  } else {
                    entries = Object.keys(obj).map(k => {
                      const v = obj[k];
                      if (v && typeof v === 'object' && 'quantity' in (v as Record<string, unknown>)) {
                        const q = (v as Record<string, unknown>)['quantity'];
                        return { id: k, quantity: typeof q === 'number' ? q as number : Number(q) || 1 };
                      }
                      return { id: k, quantity: typeof v === 'number' ? Number(v) : 1 };
                    });
                  }
                }
              }

              const ids = Array.from(new Set(entries.map(p => p.id).filter(Boolean) as string[]));
              if (ids.length === 0) throw new Error('Tidak ada produk di keranjang');

              type ProdRow = { id: string; name: string; price: number; image_url?: string; discount_percent?: number | null };
              const prodRes = await supabase.from('products').select('id,name,price,image_url,discount_percent').in('id', ids);
              const prodData = (prodRes as { data?: ProdRow[] | null }).data ?? [];
              const itemsBuilt: OrderItem[] = entries.map(entry => {
                const prod = prodData.find(p => p.id === entry.id);
                if (!prod) return null;
                const priceInfo = computePriceAfterDiscount({ price: prod.price ?? 0, discount_percent: prod.discount_percent ?? 0 });
                return { product_id: prod.id, product_name: prod.name, unit_price: priceInfo.discounted, price: prod.price, quantity: entry.quantity ?? 1 } as OrderItem;
              }).filter((x): x is OrderItem => x !== null && x !== undefined);
              if (itemsBuilt.length === 0) throw new Error('Produk keranjang tidak tersedia');
              setItems(itemsBuilt);
          } catch (err) {
            console.error('Failed to initialize from cart', err);
            toast({ variant: 'destructive', title: CHECKOUT_MESSAGES.CART_LOAD_FAIL, description: String(err) });
            // Don't re-throw to avoid an uncaught error stack in the console on deployed bundles.
            // Navigate back to cart view instead and stop initialization.
            navigate('/cart');
            return;
          }
        } else {
          navigate('/cart');
        }
      } catch (err) {
        console.error('Failed to initialize checkout', err);
        toast({ variant: 'destructive', title: CHECKOUT_MESSAGES.CHECKOUT_LOAD_FAIL, description: String(err) });
        navigate('/cart');
      } finally {
        setInitializing(false);
      }
    };
    // If auth is still loading we don't call init yet; effect depends on authLoading
    if (!authLoading) void init();
  }, [orderIdParam, productId, quantityParam, fromCartParam, navigate, toast, authLoading, user]);

  return { order, setOrder, items, setItems, initializing, query } as const;
}

// (removed duplicate accidental implementation)
