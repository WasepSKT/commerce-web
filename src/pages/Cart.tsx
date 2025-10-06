import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import useCart from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock_quantity?: number;
}

// Type for referral_purchases table sesuai schema
type ReferralPurchase = {
  id?: string;
  referrer_id: string;
  referred_id?: string;
  order_id: string;
  amount: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export default function CartPage() {
  const { items, map, totalItems, update, removeItem, clear } = useCart();
  const { profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecap, setShowRecap] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const hasCleanedUp = useRef(false);

  // Function to clear corrupted cart data
  const clearCorruptedCart = useCallback(() => {
    try {
      localStorage.removeItem('rp_cart_v1');
      clear();
      toast({
        title: 'Keranjang dibersihkan',
        description: 'Data keranjang yang rusak telah dihapus.'
      });
      window.location.reload(); // Reload to reset state
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }, [clear, toast]);

  // Memoize invalid items detection to prevent loops
  const invalidItemsInfo = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalid = items.filter(item => {
      if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
        return true;
      }
      return !uuidRegex.test(item.id);
    });

    return {
      hasInvalid: invalid.length > 0,
      invalidItems: invalid,
      count: invalid.length
    };
  }, [items]);

  // Clean up invalid cart items only when first detected
  useEffect(() => {
    if (invalidItemsInfo.hasInvalid && !hasCleanedUp.current) {
      console.warn('Found invalid cart items, cleaning up:', invalidItemsInfo.invalidItems);
      hasCleanedUp.current = true; // Mark as cleaned up

      // Clean up invalid items in a single batch
      invalidItemsInfo.invalidItems.forEach(item => removeItem(item.id));

      toast({
        title: 'Data keranjang dibersihkan',
        description: `Dihapus ${invalidItemsInfo.count} item yang tidak valid.`,
        variant: 'default'
      });
    }
  }, [invalidItemsInfo.hasInvalid, invalidItemsInfo.invalidItems, invalidItemsInfo.count, removeItem, toast]);

  // recap modal is now immediate action only; no auto-countdown

  // small helper to normalize Supabase response shapes
  const normalizeSupabaseResult = <T,>(res: unknown): { data?: T | null; error?: unknown } => {
    if (res && typeof res === 'object') {
      const r = res as Record<string, unknown>;
      return { data: r['data'] as T | undefined, error: r['error'] };
    }
    return { data: res as T, error: undefined };
  };

  // UUID validation regex
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchProducts = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    // Filter out invalid IDs and non-UUIDs (don't remove here to avoid loops)
    const validIds = ids.filter(id => {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return false;
      }

      if (!isValidUUID(id)) {
        console.warn('Skipping invalid UUID:', id);
        return false;
      }

      return true;
    });

    if (validIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching products for valid UUIDs:', validIds);
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,image_url,stock_quantity')
        .in('id', validIds)
        .eq('is_active', true);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('Fetched products:', data);
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch cart products', err);
      toast({ variant: 'destructive', title: 'Gagal memuat keranjang', description: 'Terjadi kesalahan saat mengambil data produk.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Only refetch product metadata when the set of product IDs changes.
  // This prevents re-fetching when only quantities change.
  const idsKey = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validIds = items
      .map(i => i.id)
      .filter(id => id && typeof id === 'string' && id.trim() !== '' && uuidRegex.test(id))
      .sort();
    return validIds.join(',');
  }, [items]);

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').filter(Boolean) : [];
    setLoading(true);
    void fetchProducts(ids);
    // depend on idsKey (stable representation of id set) and fetchProducts
  }, [idsKey, fetchProducts]);

  const lineItems = useMemo(() => {
    return items
      .map((it) => {
        const product = products.find((p) => p.id === it.id);
        return {
          id: it.id,
          name: product?.name ?? 'Produk tidak ditemukan',
          price: product?.price ?? 0,
          quantity: it.quantity,
          image_url: product?.image_url,
          stock_quantity: product?.stock_quantity ?? 0,
        };
      });
  }, [items, products]);

  const subtotal = useMemo(() => lineItems.reduce((s, it) => s + it.price * it.quantity, 0), [lineItems]);

  const formatPrice = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const handleCheckout = async () => {
    if (totalItems === 0) {
      toast({ variant: 'destructive', title: 'Keranjang kosong', description: 'Tambahkan produk terlebih dahulu.' });
      return;
    }

    // Require authentication
    if (!isAuthenticated) {
      toast({ variant: 'destructive', title: 'Harap masuk terlebih dahulu', description: 'Silakan login untuk melanjutkan ke checkout.' });
      navigate('/auth');
      return;
    }

    // Require profile completion: all essential shipping information
    const missingFields: string[] = [];
    if (!profile?.full_name) missingFields.push('Nama penerima');
    if (!profile?.phone) missingFields.push('Nomor HP/WA');
    if (!profile?.address) missingFields.push('Alamat lengkap');
    if (!profile?.province) missingFields.push('Provinsi');
    if (!profile?.city) missingFields.push('Kabupaten/Kota');
    if (!profile?.district) missingFields.push('Kecamatan');
    if (!profile?.subdistrict) missingFields.push('Desa/Kelurahan');
    if (!profile?.postal_code) missingFields.push('Kode Pos');

    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Data Alamat Belum Lengkap',
        description: `Silakan lengkapi data berikut: ${missingFields.join(', ')}.`
      });
      // Redirect to profile page so user can complete it, return to cart after save
      navigate('/profile?next=/cart');
      return;
    }

    // show confirmation modal first (user requested explicit confirmation of details)
    setShowConfirm(true);
  };

  // Create pending order (called after user confirms details)
  // idempotent: if a creation is already in-flight or an id already exists, return it
  const createPendingOrder = async (): Promise<string> => {
    if (pendingOrderId) return pendingOrderId;
    if (creatingOrder) {
      // ...existing code...
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
          if (pendingOrderId) {
            clearInterval(interval);
            resolve(pendingOrderId as string);
          }
          if (!creatingOrder && !pendingOrderId && Date.now() - start > 15000) {
            clearInterval(interval);
            reject(new Error('Timeout waiting for order creation'));
          }
        }, 200);
      });
    }

    setCreatingOrder(true);
    try {
      // Build complete address string
      let fullAddress = profile?.address || '';
      if (profile?.subdistrict) fullAddress += `\n${profile.subdistrict}`;
      if (profile?.district) fullAddress += `, ${profile.district}`;
      if (profile?.city) fullAddress += `\n${profile.city}`;
      if (profile?.province) fullAddress += `, ${profile.province}`;
      if (profile?.postal_code) fullAddress += `\nKode Pos: ${profile.postal_code}`;

      const orderPayload = {
        total_amount: subtotal,
        status: 'pending' as const,
        customer_name: profile?.full_name ?? '',
        customer_phone: profile?.phone ?? '',
        customer_address: fullAddress,
        user_id: profile?.user_id,
      };

      const orderInsertRes = await supabase.from('orders').insert([orderPayload]).select().single();
      const { data: orderData, error: orderError } = normalizeSupabaseResult<Record<string, unknown>>(orderInsertRes);
      if (orderError) throw orderError;
      const orderId = orderData && (orderData as Record<string, unknown>)['id'] as string | undefined;
      if (!orderId) throw new Error('No order id returned from insert');

      // build items payload and insert
      const itemsPayload = lineItems.map(li => ({ order_id: orderId, product_id: li.id, quantity: li.quantity, price: li.price }));
      const itemsRes = await supabase.from('order_items').insert(itemsPayload).select();
      const { data: itemsData, error: itemsError } = normalizeSupabaseResult<unknown[]>(itemsRes);
      if (itemsError || !itemsData || (Array.isArray(itemsData) && itemsData.length === 0)) {
        console.error('Failed to insert cart order items', itemsError ?? itemsRes);
        // attempt rollback
        try {
          await supabase.from('orders').delete().eq('id', orderId);
        } catch (delErr) {
          console.error('Failed rollback after item insert failure', delErr);
        }
        throw new Error('Gagal menyimpan item pesanan');
      }

      // Insert referral purchase if user was referred
      if (profile?.referred_by) {
        try {

          const referralPayload: Database['public']['Tables']['referral_purchases']['Insert'] = {
            order_id: orderId,
            referrer_id: profile.referred_by,
            referred_id: profile?.user_id ?? undefined,
            amount: subtotal,
            status: 'pending',
            // created_at, updated_at will be set by DB default
          };
          await supabase
            .from('referral_purchases')
            .insert([referralPayload]);
        } catch (refErr) {
          console.error('Failed to insert referral purchase', refErr);
        }
      }

      setPendingOrderId(orderId);
      return orderId;
    } catch (err) {
      console.error('Checkout failed', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Gagal Checkout', description: msg });
      throw err;
    } finally {
      setCreatingOrder(false);
    }
  };

  // Open the recap dialog (do not create order yet). This mirrors ProductDetail flow.
  const openRecap = () => {
    setShowConfirm(false);
    setShowRecap(true);
  };

  // Ensure an order exists, then redirect to WhatsApp with order details
  const proceedToWhatsApp = async () => {
    try {
      const orderId = await createPendingOrder();
      if (orderId) {
        setPendingOrderId(orderId);
        toast({ title: 'Pesanan disimpan', description: `Order ID: ${orderId}` });
      }

      // build message and redirect
      let message = `Halo, saya ${profile?.full_name ?? ''} ingin memesan:\n\n`;
      lineItems.forEach(li => {
        message += `${li.name}\nJumlah: ${li.quantity}\nHarga: ${formatPrice(li.price * li.quantity)}\n\n`;
      });
      message += `Total: ${formatPrice(subtotal)}\n\n`;
      message += `📋 *DETAIL PENGIRIMAN:*\n`;
      message += `Nama penerima: ${profile?.full_name}\n`;
      message += `No. HP/WA: ${profile?.phone}\n`;
      message += `\n📍 *ALAMAT LENGKAP:*\n`;
      message += `${profile?.address || ''}\n`;
      if (profile?.subdistrict) message += `${profile.subdistrict}, `;
      if (profile?.district) message += `${profile.district}\n`;
      if (profile?.city) message += `${profile.city}, `;
      if (profile?.province) message += `${profile.province}\n`;
      if (profile?.postal_code) message += `Kode Pos: ${profile.postal_code}\n`;

      // Add Google Maps share link if coordinates are available
      if (profile?.latitude && profile?.longitude) {
        const googleMapsUrl = `https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`;
        message += `\n📍 *LOKASI PENERIMA:*\n${googleMapsUrl}\n`;
      }

      message += `\nTerima kasih.`;
      if (orderId) message = `Order ID: ${orderId}\n` + message;
      const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setShowRecap(false);
    } catch (err) {
      console.error('Failed create order before redirect', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Gagal membuat pesanan', description: msg });
      // keep recap open so user can retry
      throw err;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }



  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Keranjang Belanja</h1>
          <div className="space-x-2">
            <Button variant="ghost" asChild>
              <Link to="/products">Lanjut Belanja</Link>
            </Button>
            <Button variant="destructive" onClick={() => { clear(); toast({ title: 'Keranjang dibersihkan' }); }}>
              Kosongkan
            </Button>
          </div>
        </div>

        {(() => {
          if (invalidItemsInfo.hasInvalid) {
            return (
              <div className="py-12 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-2 text-red-600">Data Keranjang Rusak</h3>
                  <p className="text-muted-foreground mb-6">
                    Ditemukan data keranjang yang tidak valid. Silakan bersihkan keranjang untuk melanjutkan.
                  </p>
                  <div className="space-x-2">
                    <Button onClick={clearCorruptedCart} variant="destructive">
                      Bersihkan Keranjang
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/products">Mulai Belanja</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          if (lineItems.length === 0) {
            return (
              <div className="py-12">
                <EmptyState
                  title="Keranjang kosong"
                  description="Tambahkan produk ke keranjang untuk memulai belanja."
                  lottieSrc="https://lottie.host/6ebe5320-be98-4e5d-90b5-a9f5d2f186fd/ez07wuijAR.lottie"
                  cta={{ label: 'Lanjut Belanja', onClick: () => { navigate('/products'); } }}
                />
              </div>
            );
          }

          return null;
        })()}

        {lineItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {lineItems.map(li => (
                <Card key={li.id} className="flex items-center p-4">
                  <img src={li.image_url || '/placeholder.svg'} alt={li.name} className="w-28 h-28 object-cover rounded mr-4" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-primary">{li.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatPrice(li.price)}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">Subtotal: {formatPrice(li.price * li.quantity)}</div>
                    </div>

                    <div className="mt-3 flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => update(li.id, Math.max(0, li.quantity - 1))}>-</Button>
                      <span className="w-10 text-center">{li.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => update(li.id, Math.min(li.stock_quantity || 9999, li.quantity + 1))}>+</Button>
                      <Button size="sm" variant="ghost" onClick={() => { removeItem(li.id); toast({ title: 'Produk dihapus' }); }}>Hapus</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">Ringkasan Pesanan</h3>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Jumlah item</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-lg font-medium mb-4">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <Button className="w-full" onClick={handleCheckout}>Checkout</Button>
                </CardContent>
              </Card>

              {/* Recap Dialog for Cart checkout */}
              {/* Recap Dialog for Cart checkout */}
              <Dialog open={showRecap} onOpenChange={setShowRecap}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ringkasan Pesanan</DialogTitle>
                    <DialogDescription>Periksa rekap pesanan. Tekan konfirmasi untuk menyimpan pesanan dan lanjut ke WhatsApp.</DialogDescription>
                  </DialogHeader>

                  <div className="py-2 space-y-2 text-sm text-muted-foreground">
                    {lineItems.map(li => (
                      <div key={li.id} className="flex justify-between">
                        <div>{li.name} x{li.quantity}</div>
                        <div>{formatPrice(li.price * li.quantity)}</div>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between font-medium"> <div>Total</div> <div>{formatPrice(subtotal)}</div></div>
                    {!pendingOrderId ? (
                      <div className="mt-2 text-xs text-muted-foreground">Order akan dibuat setelah Anda menekan "Lanjut ke WhatsApp".</div>
                    ) : null}
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowRecap(false)}>Batal</Button>
                    <Button disabled={creatingOrder} onClick={async () => {
                      try {
                        await proceedToWhatsApp();
                      } catch (e) {
                        // proceedToWhatsApp already toasts
                      }
                    }}>{creatingOrder ? 'Membuat...' : 'Lanjut ke WhatsApp'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Confirmation Dialog: show order details and ask user to confirm before creating pending order */}
              <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Konfirmasi Pesanan</DialogTitle>
                    <DialogDescription>
                      Periksa kembali detail pesanan sebelum melanjutkan:
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      {lineItems.map(li => (
                        <div key={li.id} className="flex justify-between items-start py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{li.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Jumlah: {li.quantity} • {formatPrice(li.price)}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {formatPrice(li.price * li.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between font-medium text-base pt-2 border-t">
                      <div>Total</div>
                      <div>{formatPrice(subtotal)}</div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-1">
                      <div><span className="font-medium">Nama penerima:</span> {profile?.full_name ?? '-'}</div>
                      <div><span className="font-medium">No. HP/WA:</span> {profile?.phone ?? '-'}</div>
                      <div><span className="font-medium">Alamat:</span> {profile?.address ?? '-'}</div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowConfirm(false)}>Kembali</Button>
                    <Button disabled={creatingOrder} onClick={() => void openRecap()}>
                      {creatingOrder ? 'Membuat...' : 'Konfirmasi & Lanjut'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  <p>Silakan konfirmasi pesanan melalui WhatsApp. Kami akan memproses pesanan setelah konfirmasi.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
