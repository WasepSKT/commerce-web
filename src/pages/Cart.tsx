import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import useCart from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/EmptyState';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock_quantity?: number;
}

export default function CartPage() {
  const { items, map, totalItems, update, removeItem, clear } = useCart();
  const { profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,image_url,stock_quantity')
        .in('id', ids)
        .eq('is_active', true);

      if (error) throw error;
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
  const idsKey = useMemo(() => items.map(i => i.id).sort().join(','), [items]);

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

    // Require profile completion: full_name, phone, address
    const missingFields: string[] = [];
    if (!profile?.full_name) missingFields.push('Nama penerima');
    if (!profile?.phone) missingFields.push('Nomor HP/WA');
    if (!profile?.address) missingFields.push('Alamat lengkap');
    if (missingFields.length > 0) {
      toast({ title: 'Lengkapi Profil', description: `Silakan lengkapi: ${missingFields.join(', ')}.` });
      // Redirect to profile page so user can complete it, return to cart after save
      navigate('/profile?next=/cart');
      return;
    }

    let message = `Halo, saya ${profile?.full_name ?? ''} ingin memesan:\n\n`;
    lineItems.forEach(li => {
      message += `${li.name}\nJumlah: ${li.quantity}\nHarga: ${formatPrice(li.price * li.quantity)}\n\n`;
    });
    message += `Total: ${formatPrice(subtotal)}\n\n`;
    message += `Nama penerima: ${profile?.full_name}\n`;
    message += `No. HP/WA: ${profile?.phone}\n`;
    message += `Alamat: ${profile?.address}\n\nTerima kasih.`;

    const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
          <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
          <div className="space-x-2">
            <Button variant="ghost" asChild>
              <Link to="/products">Lanjut Belanja</Link>
            </Button>
            <Button variant="destructive" onClick={() => { clear(); toast({ title: 'Keranjang dibersihkan' }); }}>
              Kosongkan
            </Button>
          </div>
        </div>

        {lineItems.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Keranjang kosong"
              description="Tambahkan produk ke keranjang untuk memulai belanja."
              lottieSrc="https://lottie.host/6ebe5320-be98-4e5d-90b5-a9f5d2f186fd/ez07wuijAR.lottie"
              cta={{ label: 'Lanjut Belanja', onClick: () => { navigate('/products'); } }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {lineItems.map(li => (
                <Card key={li.id} className="flex items-center p-4">
                  <img src={li.image_url || '/placeholder.svg'} alt={li.name} className="w-28 h-28 object-cover rounded mr-4" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{li.name}</h3>
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
                  <h3 className="font-semibold mb-2">Ringkasan Pesanan</h3>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Jumlah item</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-lg font-medium mb-4">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <Button className="w-full" onClick={handleCheckout}>Checkout via WhatsApp</Button>
                </CardContent>
              </Card>

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
