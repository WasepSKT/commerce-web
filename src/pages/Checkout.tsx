import { useEffect, useMemo, useRef, useState } from 'react';

// Typing for Cloudflare Turnstile client API used on the window object.
type TurnstileAPI = {
  render: (el: HTMLElement, opts: { sitekey: string; theme?: string; size?: 'invisible' | 'normal'; callback?: (token: string) => void }) => number | string | undefined;
  execute: (id: number | string) => void;
  reset: (id: number | string) => void;
  getResponse?: (id: number | string) => string | null;
};

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { getShippingRates, ShippingRate } from '@/services/shippingService';
import { createPaymentSession, CreateSessionResult, CreatePaymentPayload } from '@/services/paymentService';
import computePriceAfterDiscount from '@/utils/price';
import OVOIcon from '@/assets/img/Logo OVO.png';
import GoPayIcon from '@/assets/img/LOGO-GOPAY.png';
import DANAIcon from '@/assets/img/Logo DANA.png';
import BCAIcon from '@/assets/img/Logo BCA_Biru.png';
import BRIIcon from '@/assets/img/BRI_2020.png';
import MandiriIcon from '@/assets/img/Bank_Mandiri_logo.png';
import BNIIcon from '@/assets/img/Bank_Negara_Indonesia_logo.png';
import AddressSelectors from '@/components/profile/AddressSelectors';
import { Edit } from 'lucide-react';

type Order = { id: string; total_amount?: number; user_id?: string };
type OrderItem = { id?: string; order_id?: string; product_id?: string; product_name?: string; price?: number; unit_price?: number; quantity?: number };

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function CheckoutPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  // Xendit payment method identifiers (frontend labels). When wiring real
  // Xendit integrations server-side, these should match the provider's expected
  // method parameters (e.g. 'CARD', 'QRIS', 'EWALLET', 'VIRTUAL_ACCOUNT').
  const [paymentMethods] = useState(() => [
    { id: 'QRIS', name: 'QRIS', description: 'Pembayaran QRIS melalui aplikasi bank/dompet digital' },
    { id: 'EWALLET', name: 'E-Wallet', description: 'Dompet digital (OVO, GoPay, Dana) sesuai ketersediaan' },
    { id: 'VIRTUAL_ACCOUNT', name: 'Virtual Account', description: 'Transfer bank via Virtual Account (BRI, BCA, BNI, Mandiri, etc.)' },
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(paymentMethods[0].id);
  // Specific channel selection for certain methods
  const [selectedEwallet, setSelectedEwallet] = useState<string>('OVO');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');

  // Dry-run mode: when true the checkout will NOT persist orders/order_items
  // to the database. Enable via query ?dry_run=1 or automatically on localhost.
  const dryRunFlag = query.get('dry_run');
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const dryRun = useMemo(() => {
    if (dryRunFlag === '1' || dryRunFlag === 'true') return true;
    if (dryRunFlag === '0' || dryRunFlag === 'false') return false;
    return isLocalhost; // default to true on localhost for safe testing
  }, [dryRunFlag, isLocalhost]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  // Cloudflare Turnstile sitekey (optional) - set in env as VITE_TURNSTILE_SITEKEY
  const TURNSTILE_SITEKEY = (import.meta.env.VITE_TURNSTILE_SITEKEY as string) ?? '';
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);

  // Debug Turnstile configuration
  useEffect(() => {
    console.log('🔧 Turnstile Debug Info (Checkout):', {
      sitekey: TURNSTILE_SITEKEY,
      hasSitekey: !!TURNSTILE_SITEKEY,
      sitekeyLength: TURNSTILE_SITEKEY?.length || 0
    });
  }, [TURNSTILE_SITEKEY]);
  const [initializing, setInitializing] = useState(true);
  // Address editing state (persist to profile via useAuth.updateProfile)
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    province: profile?.province ?? '',
    city: profile?.city ?? '',
    district: profile?.district ?? '',
    subdistrict: profile?.subdistrict ?? '',
    postal_code: profile?.postal_code ?? '',
  });

  const orderIdParam = query.get('order_id');
  const productId = query.get('product_id');
  const fromCartParam = query.get('from_cart');
  const quantityParam = Number(query.get('quantity') ?? '1');

  useEffect(() => {
    const init = async () => {
      setInitializing(true);
      try {
        if (orderIdParam) {
          // load existing pending order
          const res = await supabase.from('orders').select('*').eq('id', orderIdParam).single();
          const ord = (res as { data?: Order | null }).data;
          if (!ord) throw new Error('Order tidak ditemukan');
          setOrder(ord);
          const itemsRes = await supabase.from('order_items').select('id,order_id,product_id,price,unit_price,quantity,product_name').eq('order_id', orderIdParam);
          setItems(((itemsRes as { data?: OrderItem[] | null }).data) ?? []);
        } else if (productId) {
          // single-product flow: show product and create order when user pays
          type ProdRow = { id: string; name: string; price: number; image_url?: string; discount_percent?: number | null };
          const prodRes = await supabase.from('products').select('id,name,price,image_url,discount_percent').eq('id', productId).single();
          const prod = (prodRes as { data?: ProdRow | null }).data;
          if (!prod) throw new Error('Produk tidak ditemukan');
          const priceInfo = computePriceAfterDiscount({ price: prod.price, discount_percent: prod.discount_percent ?? 0 });
          setItems([{ product_id: prod.id, product_name: prod.name, unit_price: priceInfo.discounted, quantity: Math.max(1, quantityParam) }]);
        } else if (fromCartParam === '1' || fromCartParam === 'true') {
          // initialize from client-side cart (dry-run). Read cart from localStorage and fetch product details.
          try {
            const raw = localStorage.getItem('rp_cart_v1');
            if (!raw) throw new Error('Keranjang kosong');

            // Normalize several possible shapes saved in localStorage:
            // - Array of { id, quantity }
            // - Object { items: [...] }
            // - Map-like object { <id>: { quantity } } or { <id>: qty }
            let parsedRaw: unknown;
            try {
              parsedRaw = JSON.parse(raw);
            } catch (parseErr) {
              throw new Error('Data keranjang tidak valid');
            }

            let entries: Array<{ id?: string; quantity?: number }> = [];
            if (Array.isArray(parsedRaw)) {
              entries = parsedRaw as Array<{ id?: string; quantity?: number }>;
            } else if (parsedRaw && typeof parsedRaw === 'object') {
              const obj = parsedRaw as Record<string, unknown>;
              if (Array.isArray((obj as unknown as { items?: unknown }).items)) {
                entries = (obj as unknown as { items?: Array<{ id?: string; quantity?: number }> }).items as Array<{ id?: string; quantity?: number }>;
              } else {
                // convert map-like to entries
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

            const ids = Array.from(new Set(entries.map(p => p.id).filter(Boolean) as string[]));
            if (ids.length === 0) throw new Error('Tidak ada produk di keranjang');

            // fetch product rows
            type ProdRow = { id: string; name: string; price: number; image_url?: string; discount_percent?: number | null };
            const prodRes = await supabase.from('products').select('id,name,price,image_url,discount_percent').in('id', ids);
            const prodData = (prodRes as { data?: ProdRow[] | null }).data ?? [];
            // map cart entries to checkout items
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
            toast({ variant: 'destructive', title: 'Gagal memuat keranjang', description: String(err) });
            throw err;
          }
        } else {
          navigate('/cart');
        }
      } catch (err) {
        console.error('Failed to initialize checkout', err);
        toast({ variant: 'destructive', title: 'Gagal memuat checkout', description: String(err) });
        navigate('/cart');
      } finally {
        setInitializing(false);
      }
    };

    void init();
  }, [orderIdParam, productId, quantityParam, fromCartParam, navigate, toast]);

  // Sync local address form when profile changes
  useEffect(() => {
    setAddressForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      province: profile?.province ?? '',
      city: profile?.city ?? '',
      district: profile?.district ?? '',
      subdistrict: profile?.subdistrict ?? '',
      postal_code: profile?.postal_code ?? '',
    });
  }, [profile?.full_name, profile?.phone, profile?.address, profile?.province, profile?.city, profile?.district, profile?.subdistrict, profile?.postal_code]);

  // load shipping rates using profile postal code or saved profile in localStorage
  useEffect(() => {
    let postal: string | undefined = profile?.postal_code as string | undefined;
    if (!postal) {
      const raw = localStorage.getItem('rp_profile');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { postal_code?: string };
          postal = parsed.postal_code;
        } catch (_) {
          // ignore
        }
      }
    }
    if (!postal) return;
    const loadRates = async () => {
      setLoadingRates(true);
      try {
        // If this is a single-product checkout, try to read allowed shipping services from the product row.
        let allowedServices: string[] = [];
        try {
          const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean) as string[]));
          if (productIds.length === 1) {
            const pid = productIds[0];
            const prodRes = await supabase.from('products').select('id,shipping_services,available_shipping_services,shipping_options').eq('id', pid).single();
            const prod = (prodRes as { data?: Record<string, unknown> | null }).data ?? null;
            if (prod) {
              // product may store shipping options as JSON array or comma-separated string
              const raw = (prod['shipping_services'] ?? prod['available_shipping_services'] ?? prod['shipping_options']) as unknown;
              if (Array.isArray(raw)) {
                allowedServices = raw.map(String).map(s => s.trim()).filter(Boolean);
              } else if (typeof raw === 'string' && raw.trim() !== '') {
                allowedServices = raw.split(',').map(s => s.trim()).filter(Boolean);
              }
            }
          }
        } catch (prodErr) {
          // non-fatal: log and continue to fetch rates normally
          console.warn('Failed to read product shipping services, continuing without restriction', prodErr);
        }

        const r = await getShippingRates({ to_postal: postal, weight: 1000 });
        // If the service unexpectedly returns HTML or other non-JSON, getShippingRates may throw.
        // Guard: if r is falsy or not an array, fall back to dummy rates.
        if (!r || !Array.isArray(r)) throw new Error('Invalid shipping rates response');

        // If allowedServices is provided by the product, filter rates to match those labels.
        if (allowedServices.length > 0) {
          const normalized = allowedServices.map(s => s.toLowerCase());
          const filtered = (r as ShippingRate[]).filter(rate => {
            const name = String(rate.service_name ?? rate.service_code ?? '').toLowerCase();
            // match if any allowed token appears in the service name/code
            return normalized.some(tok => name.includes(tok) || tok.includes(name));
          });
          if (filtered.length > 0) {
            setRates(filtered);
            setSelectedRate(filtered[0]);
            return;
          }
          // if filtering removed everything, fall back to original rates but inform the user
          toast({ title: 'Opsi pengiriman terbatas', description: 'Produk ini memiliki layanan pengiriman terbatas; menampilkan opsi terdekat.' });
        }

        setRates(r || []);
      } catch (err: unknown) {
        console.error('Failed to load shipping rates', err);
        // Detect HTML error pages (e.g. Unexpected token '<') and show dummy rates instead of crashing
        const errStr = String(err ?? '');
        if (errStr.includes('<!DOCTYPE') || errStr.includes('<html') || errStr.includes('Invalid shipping rates response')) {
          const dummy: ShippingRate[] = [
            { provider: 'shipper', service_code: 'INST', service_name: 'Instan', cost: 15000, etd: '1-2 hari' },
            { provider: 'shipper', service_code: 'REG', service_name: 'Reguler', cost: 10000, etd: '2-4 hari' },
          ];
          // If product restricts services, filter dummy as well
          // (reuse allowedServices parsing above by recalculating briefly)
          let allowedServicesFallback: string[] = [];
          try {
            const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean) as string[]));
            if (productIds.length === 1) {
              const pid = productIds[0];
              const prodRes = await supabase.from('products').select('id,shipping_services,available_shipping_services,shipping_options').eq('id', pid).single();
              const prod = (prodRes as { data?: Record<string, unknown> | null }).data ?? null;
              if (prod) {
                const raw = (prod['shipping_services'] ?? prod['available_shipping_services'] ?? prod['shipping_options']) as unknown;
                if (Array.isArray(raw)) allowedServicesFallback = raw.map(String).map(s => s.trim()).filter(Boolean);
                else if (typeof raw === 'string' && raw.trim() !== '') allowedServicesFallback = raw.split(',').map(s => s.trim()).filter(Boolean);
              }
            }
          } catch (_e) {
            // ignore
          }
          if (allowedServicesFallback.length > 0) {
            const normalized = allowedServicesFallback.map(s => s.toLowerCase());
            const filteredDummy = dummy.filter(d => normalized.some(tok => d.service_name.toLowerCase().includes(tok) || d.service_code.toLowerCase().includes(tok)));
            setRates(filteredDummy.length > 0 ? filteredDummy : dummy);
            setSelectedRate((filteredDummy.length > 0 ? filteredDummy : dummy)[0]);
          } else {
            setRates(dummy);
            setSelectedRate(dummy[0]);
          }
          toast({ title: 'Menggunakan tarif pengiriman sementara', description: 'Gagal memuat tarif resmi — menampilkan opsi sementara.' });
        } else {
          toast({ variant: 'destructive', title: 'Gagal memuat tarif pengiriman' });
        }
      } finally {
        setLoadingRates(false);
      }
    };
    void loadRates();
  }, [profile?.postal_code, toast, items]);

  // Load Cloudflare Turnstile script and render invisible widget if sitekey present.
  // Improvements: idempotent loader, cancellation guard, and safe render.
  useEffect(() => {
    if (!TURNSTILE_SITEKEY) return;

    let cancelled = false;

    // global loader promise to avoid multiple inserts when component remounts
    const ensureScript = (() => {
      let promise: Promise<void> | null = null;
      return () => {
        if (promise) return promise;
        promise = new Promise<void>((resolve, reject) => {
          if ((window as Window & { turnstile?: TurnstileAPI }).turnstile) return resolve();
          const existing = document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
          if (existing) {
            // script exists but widget may not be ready yet
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Gagal memuat Turnstile script')));
            return;
          }
          const s = document.createElement('script');
          s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
          s.async = true;
          s.defer = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Gagal memuat Turnstile script'));
          document.head.appendChild(s);
        });
        return promise;
      };
    })();

    const renderWidget = async () => {
      try {
        await ensureScript();
        if (cancelled) return;
        // Render invisible widget into container
        const win = window as Window & { turnstile?: TurnstileAPI };
        if (win.turnstile && widgetContainerRef.current) {
          try {
            const id = win.turnstile.render(widgetContainerRef.current, {
              sitekey: TURNSTILE_SITEKEY,
              theme: 'light',
              size: 'invisible',
              callback: (_token: string) => {
                // token will be read via getResponse or by callback if needed
              }
            });
            widgetIdRef.current = typeof id === 'number' || typeof id === 'string' ? id : null;
            if (!cancelled) setTurnstileReady(true);
          } catch (err) {
            console.warn('Turnstile render failed', err);
          }
        }
      } catch (err) {
        console.warn('Turnstile load failed', err);
      }
    };

    void renderWidget();

    return () => { cancelled = true; };
  }, [TURNSTILE_SITEKEY]);

  // Helper to execute the turnstile widget and obtain a token (or null)
  // Wrapped in useRef/useCallback pattern to keep stable identity for hooks
  const executeTurnstile = useRef<((timeoutMs?: number) => Promise<string | null>) | null>(null);
  if (!executeTurnstile.current) {
    executeTurnstile.current = async (timeoutMs = 10000): Promise<string | null> => {
      if (!TURNSTILE_SITEKEY) return null;
      const win = window as Window & { turnstile?: TurnstileAPI };
      if (!win.turnstile) return null;
      const wid = widgetIdRef.current;
      if (wid == null) return null;

      return await new Promise<string | null>((resolve) => {
        let finished = false;
        const finish = (val: string | null) => {
          if (finished) return;
          finished = true;
          resolve(val);
        };

        const timer = window.setTimeout(() => {
          try { win.turnstile?.reset(wid); } catch (_e) { void _e; }
          finish(null);
        }, timeoutMs);

        try {
          win.turnstile.execute(wid);
        } catch (err) {
          window.clearTimeout(timer);
          finish(null);
          return;
        }

        // Poll for response token using requestAnimationFrame loop
        const poll = () => {
          try {
            const resp = win.turnstile?.getResponse ? win.turnstile.getResponse(wid) : null;
            if (resp) {
              window.clearTimeout(timer);
              finish(String(resp));
              return;
            }
          } catch (_e) {
            void _e;
          }
          if (!finished) requestAnimationFrame(poll);
        };
        requestAnimationFrame(poll);
      });
    };
  }

  const subtotal = useMemo(() => items.reduce((s, it) => s + (it.unit_price ?? it.price ?? 0) * (it.quantity ?? 1), 0), [items]);
  const total = useMemo(() => subtotal + (selectedRate ? selectedRate.cost : 0), [subtotal, selectedRate]);

  const formatPrice = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const handlePay = useMemo(() => async () => {
    setCreatingSession(true);
    try {
      // If Turnstile sitekey is configured, obtain a token and include it in payloads
      let turnstileToken: string | null = null;
      if (TURNSTILE_SITEKEY && executeTurnstile.current) {
        turnstileToken = await executeTurnstile.current();
        if (!turnstileToken) {
          throw new Error('Gagal mendapatkan token perlindungan (Turnstile). Coba lagi.');
        }
      }
      let oid = order?.id;
      if (!oid) {
        if (dryRun) {
          // In dry-run mode we do NOT persist orders/order_items. Instead build
          // a lightweight order payload and pass it to the payment session
          // creation API so the server can create test transactions without
          // creating DB rows.
          const tempOrder = {
            total_amount: subtotal,
            status: 'pending',
            customer_name: profile?.full_name ?? '',
            customer_phone: profile?.phone ?? '',
            customer_address: profile?.address ?? '',
            user_id: profile?.user_id ?? null,
            items: items.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity ?? 1, price: i.price ?? i.unit_price ?? 0, unit_price: i.unit_price ?? i.price ?? 0 })),
          } as const;

          // Pass the full order payload with `test: true` so the server knows
          // this is a dry-run and should not persist the order. The server can
          // respond with a provider checkout URL for testing.
          const payload: CreatePaymentPayload = {
            order: tempOrder,
            return_url: window.location.href,
            payment_method: selectedPaymentMethod,
            test: true,
            ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
            // include specific channel if applicable
            ...(selectedPaymentMethod === 'EWALLET' ? { payment_channel: selectedEwallet } : {}),
            ...(selectedPaymentMethod === 'VIRTUAL_ACCOUNT' ? { payment_channel: selectedBank } : {}),
          };
          const session = await createPaymentSession(payload);
          const redirectUrl = session?.url ?? session?.checkout_url;
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }

          toast({ title: 'Sesi pembayaran (uji) dibuat', description: 'Ini adalah mode uji — tidak ada data yang disimpan.' });
          setCreatingSession(false);
          return;
        }

        // Normal mode: persist the order in DB and create items
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
        oid = created.id;

        // order_items table in DB expects (order_id, product_id, price, quantity)
        const itemsPayload = items.map(i => ({ order_id: oid, product_id: i.product_id, quantity: i.quantity ?? 1, price: i.price ?? i.unit_price ?? 0, unit_price: i.unit_price ?? i.price ?? 0 }));
        // attempt insert; use a narrow runtime wrapper to avoid TypeScript complaining about generated types
        const sb = (supabase as unknown) as { from: (table: string) => { insert: (v: unknown) => Promise<unknown> } };
        await sb.from('order_items').insert(itemsPayload);
        setOrder({ id: oid, total_amount: subtotal, user_id: profile?.user_id });
      }

      // attach shipping selection to order via server endpoint or update order (simplified here)
      if (selectedRate) {
        // The orders table has `shipping_courier` column; update that and total_amount
        await supabase.from('orders').update({ shipping_courier: selectedRate.provider, total_amount: total }).eq('id', oid);
      }

      // create payment session via server wrapper
      const session: CreateSessionResult | null = await createPaymentSession({
        order_id: oid as string,
        return_url: window.location.href,
        payment_method: selectedPaymentMethod,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
        ...(selectedPaymentMethod === 'EWALLET' ? { payment_channel: selectedEwallet } : {}),
        ...(selectedPaymentMethod === 'VIRTUAL_ACCOUNT' ? { payment_channel: selectedBank } : {}),
      });
      const redirectUrl = session?.url ?? session?.checkout_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      toast({ title: 'Sesi pembayaran dibuat', description: 'Lanjutkan ke penyedia pembayaran.' });
    } catch (err) {
      console.error('Failed to initiate payment', err);
      toast({ variant: 'destructive', title: 'Gagal memulai pembayaran', description: String(err) });
    } finally {
      setCreatingSession(false);
    }
  }, [dryRun, items, order, profile, selectedPaymentMethod, selectedEwallet, selectedBank, selectedRate, subtotal, total, toast, TURNSTILE_SITEKEY]);

  if (initializing) return null;

  return (
    <Layout>
      <SEOHead title="Checkout - Regal Paw" description="Pilih alamat, jasa pengiriman, dan metode pembayaran." />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold mb-2">Alamat Pengiriman</h3>
                  {!isEditingAddress ? (
                    <button type="button" className="text-sm text-primary underline flex items-center gap-1" onClick={() => setIsEditingAddress(true)}><Edit className="h-4 w-4" />Edit</button>
                  ) : null}
                </div>

                {!isEditingAddress ? (
                  <div className="text-sm text-muted-foreground">
                    <div>{profile?.full_name}</div>
                    <div>{profile?.phone}</div>
                    <div>{profile?.address}</div>
                    <div>{profile?.city}, {profile?.province} {profile?.postal_code}</div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Nama Penerima</label>
                      <input className="w-full border rounded px-2 py-1" value={addressForm.full_name} onChange={e => setAddressForm(f => ({ ...f, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">No. Telepon</label>
                      <input className="w-full border rounded px-2 py-1" value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Alamat</label>
                      <input className="w-full border rounded px-2 py-1" value={addressForm.address} onChange={e => setAddressForm(f => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div>
                      <AddressSelectors
                        province={addressForm.province}
                        setProvince={(v: string) => setAddressForm(f => ({ ...f, province: v, city: '', district: '', subdistrict: '', postal_code: '' }))}
                        city={addressForm.city}
                        setCity={(v: string) => setAddressForm(f => ({ ...f, city: v, district: '', subdistrict: '', postal_code: '' }))}
                        district={addressForm.district}
                        setDistrict={(v: string) => setAddressForm(f => ({ ...f, district: v, subdistrict: '', postal_code: '' }))}
                        subdistrict={addressForm.subdistrict}
                        setSubdistrict={(v: string) => setAddressForm(f => ({ ...f, subdistrict: v }))}
                        postalCode={addressForm.postal_code}
                        setPostalCode={(v: string) => setAddressForm(f => ({ ...f, postal_code: v }))}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button disabled={savingAddress} onClick={async () => {
                        if (!updateProfile) {
                          toast({ variant: 'destructive', title: 'Tidak dapat menyimpan', description: 'Fungsi pembaruan profil tidak tersedia.' });
                          return;
                        }
                        setSavingAddress(true);
                        try {
                          const payload: Record<string, unknown> = {
                            full_name: addressForm.full_name,
                            phone: addressForm.phone,
                            address: addressForm.address,
                            province: addressForm.province,
                            city: addressForm.city,
                            district: addressForm.district,
                            subdistrict: addressForm.subdistrict,
                            postal_code: addressForm.postal_code,
                          };
                          const res = await updateProfile(payload);
                          if ('error' in res && res.error) {
                            throw res.error;
                          }
                          toast({ title: 'Berhasil', description: 'Alamat pengiriman disimpan ke profil.' });
                          setIsEditingAddress(false);
                          // updateProfile updates the global store and localStorage; the useEffect
                          // above will sync the local form when profile changes.
                        } catch (err) {
                          console.error('Failed to update profile from checkout', err);
                          toast({ variant: 'destructive', title: 'Gagal menyimpan alamat', description: String(err) });
                        } finally {
                          setSavingAddress(false);
                        }
                      }}>{savingAddress ? 'Menyimpan...' : 'Simpan ke Profil'}</Button>
                      <button type="button" className="px-3 py-1 rounded border" onClick={() => {
                        // revert changes
                        setAddressForm({
                          full_name: profile?.full_name ?? '',
                          phone: profile?.phone ?? '',
                          address: profile?.address ?? '',
                          province: profile?.province ?? '',
                          city: profile?.city ?? '',
                          district: profile?.district ?? '',
                          subdistrict: profile?.subdistrict ?? '',
                          postal_code: profile?.postal_code ?? '',
                        });
                        setIsEditingAddress(false);
                      }}>Batal</button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Pilih Jasa Pengiriman</h3>
                {loadingRates ? <div>Memuat tarif...</div> : (
                  <div className="space-y-2">
                    {rates.map(r => (
                      <div key={`${r.provider}-${r.service_code}`} className={`p-3 border rounded cursor-pointer ${selectedRate?.service_code === r.service_code ? 'border-primary bg-primary/5' : 'border-transparent'}`} onClick={() => setSelectedRate(r)}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{r.provider} - {r.service_name || r.service_code}</div>
                            {r.etd ? <div className="text-xs text-muted-foreground">Estimasi: {r.etd}</div> : null}
                          </div>
                          <div className="font-medium">{formatPrice(r.cost)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="p-6 border rounded">
              <h3 className="font-semibold mb-2">Ringkasan Pesanan</h3>
              <div className="mb-3">
                <h4 className="font-medium mb-2">Metode Pembayaran</h4>
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {paymentMethods.map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        className={`px-4 py-2 rounded border text-sm font-medium transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedPaymentMethod === pm.id ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-gray-300 hover:border-primary'}`}
                        onClick={() => setSelectedPaymentMethod(pm.id)}
                        aria-pressed={selectedPaymentMethod === pm.id}
                        title={pm.description}
                      >
                        {pm.name}
                      </button>
                    ))}
                  </div>

                  {selectedPaymentMethod === 'EWALLET' && (
                    <div className="mt-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Pilih Dompet Digital</label>
                      <div className="flex gap-2 flex-wrap">
                        {['OVO', 'GOPAY', 'DANA'].map(wallet => {
                          const icons: Record<string, string> = { OVO: OVOIcon, GOPAY: GoPayIcon, DANA: DANAIcon };
                          return (
                            <button
                              key={wallet}
                              type="button"
                              className={`flex items-center justify-center px-1 py-1 rounded border transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/30 ${selectedEwallet === wallet ? 'bg-primary/10 border-primary' : 'bg-white border-gray-300 hover:bg-primary/5 hover:border-primary'}`}
                              onClick={() => setSelectedEwallet(wallet)}
                              aria-pressed={selectedEwallet === wallet}
                              aria-label={wallet}
                              title={wallet}
                            >
                              <img src={icons[wallet]} alt={`${wallet} icon`} className="h-10 w-20 object-contain" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'VIRTUAL_ACCOUNT' && (
                    <div className="mt-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Pilih Bank (VA)</label>
                      <div className="flex gap-2 flex-wrap">
                        {['BCA', 'BNI', 'BRI', 'MANDIRI'].map(bank => {
                          const icons: Record<string, string> = { BCA: BCAIcon, BNI: BNIIcon, BRI: BRIIcon, MANDIRI: MandiriIcon };
                          return (
                            <button
                              key={bank}
                              type="button"
                              className={`flex items-center justify-center px-1 py-1 rounded border transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary/30 ${selectedBank === bank ? 'bg-primary/10 border-primary' : 'bg-white border-gray-300 hover:bg-primary/5 hover:border-primary'}`}
                              onClick={() => setSelectedBank(bank)}
                              aria-pressed={selectedBank === bank}
                              aria-label={bank}
                              title={bank}
                            >
                              <img src={icons[bank]} alt={`${bank} logo`} className="h-10 w-20 object-contain" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>{it.product_name || it.product_id} x{it.quantity}</div>
                    <div>{formatPrice((it.unit_price ?? it.price ?? 0) * (it.quantity ?? 1))}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-3">
                <div className="flex justify-between text-muted-foreground">Subtotal <div>{formatPrice(subtotal)}</div></div>
                <div className="flex justify-between text-muted-foreground">Ongkos Kirim <div>{formatPrice(selectedRate?.cost ?? 0)}</div></div>
                <div className="flex justify-between font-semibold text-lg">Total <div>{formatPrice(total)}</div></div>
                
                {/* Turnstile Widget Container (Hidden) */}
                <div ref={widgetContainerRef} style={{ display: 'none' }} />
                
                <Button className="w-full mt-3" onClick={handlePay} disabled={creatingSession || !selectedRate}>{creatingSession ? 'Mengarahkan...' : 'Bayar & Lanjutkan'}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
