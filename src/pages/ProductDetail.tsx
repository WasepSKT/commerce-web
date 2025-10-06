import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ShoppingCart, Star, Shield, Truck, Package, MessageCircle, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import useCart from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { StarRating, RatingDistribution } from '@/components/ui/StarRating';
import { maskName } from '@/lib/maskName';
import { useProductRating } from '@/hooks/useProductRating';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { add } = useCart();
  const { toast } = useToast();
  const { isAuthenticated, profile } = useAuth();
  const navigateTo = useNavigate();
  const { ratingData, loading: ratingLoading } = useProductRating(id || '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isProductInfoOpen, setIsProductInfoOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Image zoom (lens) refs and state
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lensVisible, setLensVisible] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 }); // pixels relative to image
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 }); // percent for background-position
  // remove separate lens box; we'll scale the original image itself
  const LENS_WIDTH = 0; // unused
  const LENS_HEIGHT = 0; // unused
  const ZOOM = 2; // 2x zoom

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        variant: "destructive",
        title: "Gagal memuat produk",
        description: "Produk tidak ditemukan atau terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (id) void fetchProduct(id);
  }, [id, fetchProduct]);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    setConfirmOpen(true);
  };

  // Create a pending order in the DB and return the created order id
  const createPendingOrder = async (): Promise<string | null> => {
    if (!product || !profile) {
      console.error('Missing product or profile when creating order');
      return null;
    }
    setCreatingOrder(true);
    try {
      // Orders table expects specific columns (customer_address, user_id, etc.).
      // Insert the order row first, then insert items into order_items.

      // Build complete address string
      let fullAddress = profile.address || '';
      if (profile.subdistrict) fullAddress += `\n${profile.subdistrict}`;
      if (profile.district) fullAddress += `, ${profile.district}`;
      if (profile.city) fullAddress += `\n${profile.city}`;
      if (profile.province) fullAddress += `, ${profile.province}`;
      if (profile.postal_code) fullAddress += `\nKode Pos: ${profile.postal_code}`;

      const orderPayload = {
        total_amount: product.price * quantity,
        status: 'pending' as const,
        customer_name: profile.full_name ?? '',
        customer_phone: profile.phone ?? '',
        customer_address: fullAddress,
        user_id: profile.user_id,
      };

      // insert and return the created order row
      // supabase generated types may not match local schema here; cast `from` to any to avoid overload issues
      const { data, error } = await supabase.from('orders').insert([orderPayload]).select().single();
      if (error) {
        throw error;
      }

      // Use the returned primary key (id) as the order identifier
      const createdOrder = data as { id?: string } | null;
      const id = createdOrder?.id ?? null;
      if (!id) {
        throw new Error('No order id returned');
      }

      // Insert order items into `order_items` table (separate table expected)
      const itemsPayload = [
        {
          order_id: id,
          product_id: product.id,
          quantity,
          price: product.price,
        },
      ];

      // Insert items into order_items and request the inserted rows back so we can verify success
      const itemsRes = await supabase.from('order_items').insert(itemsPayload).select();
      // normalize items response
      const itemsError = (itemsRes as unknown as { error?: unknown })?.error ?? null;
      const itemsData = (itemsRes as unknown as { data?: unknown })?.data ?? itemsRes;
      if (itemsError || !itemsData || (Array.isArray(itemsData) && itemsData.length === 0)) {
        console.error('Failed to insert order items', itemsError ?? itemsRes);
        // attempt to rollback the created order to avoid dangling pending orders without items
        try {
          await supabase.from('orders').delete().eq('id', id);
        } catch (delErr) {
          console.error('Failed to rollback order after item insert failure', delErr);
        }
        let msg = 'Unknown error while inserting items';
        if (itemsError) {
          if (typeof itemsError === 'object' && itemsError !== null && 'message' in itemsError) {
            const maybeMsg = (itemsError as { message?: unknown }).message;
            if (maybeMsg) msg = String(maybeMsg);
          } else {
            try {
              msg = typeof itemsError === 'string' ? itemsError : JSON.stringify(itemsError);
            } catch (_err) {
              msg = String(itemsError);
            }
          }
        }
        toast({ variant: 'destructive', title: 'Gagal menyimpan item pesanan', description: String(msg) });
        setCreatingOrder(false);
        return null;
      }

      // set pending order id so the UI can show it
      setPendingOrderId(id);
      return id;
    } catch (err: unknown) {
      console.error('Failed to create order', err);
      let message = 'Terjadi kesalahan saat membuat pesanan.';
      if (typeof err === 'object' && err) {
        const maybe = err as { message?: unknown };
        if (maybe.message) message = String(maybe.message);
      }
      toast({ variant: 'destructive', title: 'Gagal membuat pesanan', description: message });
    } finally {
      setCreatingOrder(false);
    }
  };

  // Open payment/recap modal without creating order yet. Order will be created on second confirm or when countdown ends.
  const openPaymentRecap = () => {
    // Require complete address information before proceeding
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
      // Redirect to profile page so user can complete it, return to product after save
      navigateTo(`/profile?next=/product/${id}`);
      return;
    }

    setConfirmOpen(false);
    setPaymentOpen(true);
  };

  // Ensure order exists (create if missing), then build message and redirect to WhatsApp.
  const redirectToWhatsApp = async () => {
    if (!product || !profile) return;
    try {
      let usedOrderId = pendingOrderId;
      if (!usedOrderId) {
        const id = await createPendingOrder();
        usedOrderId = id ?? null;
        if (id) {
          // show a small toast so user sees the created Order ID even when redirected
          toast({ title: 'Pesanan disimpan', description: `Order ID: ${id}` });
        }
      }

      let message = `Halo, saya ${profile.full_name ?? ''} ingin memesan:\n\n`;
      message += `${product.name}\nJumlah: ${quantity}\nHarga: ${formatPrice(product.price * quantity)}\n\n`;
      message += `Total: ${formatPrice(product.price * quantity)}\n\n`;
      message += `📋 *DETAIL PENGIRIMAN:*\n`;
      message += `Nama penerima: ${profile.full_name}\n`;
      message += `No. HP/WA: ${profile.phone}\n`;
      message += `\n📍 *ALAMAT LENGKAP:*\n`;
      message += `${profile.address || ''}\n`;
      if (profile.subdistrict) message += `${profile.subdistrict}, `;
      if (profile.district) message += `${profile.district}\n`;
      if (profile.city) message += `${profile.city}, `;
      if (profile.province) message += `${profile.province}\n`;
      if (profile.postal_code) message += `Kode Pos: ${profile.postal_code}\n`;

      // Add Google Maps share link if coordinates are available
      if (profile.latitude && profile.longitude) {
        const googleMapsUrl = `https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`;
        message += `\n📍 *LOKASI PENERIMA:*\n${googleMapsUrl}\n`;
      }

      message += `\nTerima kasih.`;
      if (usedOrderId) message = `Order ID: ${usedOrderId}\n` + message;

      const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setPaymentOpen(false);
    } catch (err) {
      console.error('Failed to create order before redirect', err);
      let message = 'Gagal membuat pesanan sebelum redirect.';
      if (typeof err === 'object' && err) {
        const maybe = err as { message?: unknown };
        if (maybe.message) message = String(maybe.message);
      }
      toast({ variant: 'destructive', title: 'Gagal membuat pesanan', description: message });
    }
  };

  // No auto-countdown/redirect — user must explicitly confirm to create order and redirect

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-gray-200 rounded-lg h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Produk Tidak Ditemukan</h1>
          <Button asChild>
            <Link to="/products">Kembali ke Produk</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Beranda</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">Produk</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div
              className={`relative overflow-hidden rounded-lg ${/* ensure cursor styles change when hovering */ ''}`}
            >
              {/* Zoom-enabled image: on desktop shows a lens that follows the cursor */}
              <div
                ref={containerRef}
                className="w-full h-96 bg-gray-100 relative overflow-hidden"
                onMouseMove={(e) => {
                  const img = imgRef.current;
                  if (!img) return;
                  const rect = img.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  // clamp
                  const cx = Math.max(0, Math.min(x, rect.width));
                  const cy = Math.max(0, Math.min(y, rect.height));
                  const px = (cx / rect.width) * 100;
                  const py = (cy / rect.height) * 100;
                  setLensPos({ x: cx, y: cy });
                  setBgPos({ x: px, y: py });
                  setLensVisible(true);
                }}
                onMouseLeave={() => setLensVisible(false)}
                style={{ cursor: 'zoom-in' }}
              >
                <img
                  ref={imgRef}
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-96 object-cover transform-gpu"
                  style={{
                    transformOrigin: `${bgPos.x}% ${bgPos.y}%`,
                    transform: lensVisible ? `scale(${ZOOM})` : 'none',
                    transition: 'transform 0.08s linear',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=600';
                  }}
                />
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg p-2">
                    Stok Habis
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-3">
                <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Kualitas Terjamin</p>
              </Card>
              <Card className="text-center p-3">
                <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Pengiriman Cepat</p>
              </Card>
              <Card className="text-center p-3">
                <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Kemasan Aman</p>
              </Card>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-4 text-primary">{product.name}</h1>

              <div className="flex items-center space-x-2 mb-4">
                <StarRating
                  rating={ratingData.averageRating}
                  size="md"
                  showValue={ratingData.totalReviews > 0}
                />
                <span className="text-sm text-muted-foreground">
                  {ratingData.totalReviews > 0
                    ? `(${ratingData.averageRating.toFixed(1)}/5 dari ${ratingData.totalReviews} review)`
                    : '(Belum ada review)'
                  }
                </span>
              </div>

              <p className="text-4xl font-bold text-primary mb-4">
                {formatPrice(product.price)}
              </p>

              <p className="text-muted-foreground leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Collapsible Product Info */}
              <Collapsible open={isProductInfoOpen} onOpenChange={setIsProductInfoOpen} className="mb-6">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-primary/10 hover:text-primary">
                    <span className="text-sm font-medium">Informasi Produk</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProductInfoOpen ? 'transform rotate-180' : ''
                      }`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Kategori:</span>
                          <p className="font-medium">{product.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stok:</span>
                          <p className="font-medium">{product.stock_quantity} unit</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Berat:</span>
                          <p className="font-medium">1.5 kg</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Asal:</span>
                          <p className="font-medium">Import</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex items-center space-x-2 mb-6">
                <span className="text-sm">Stok tersedia:</span>
                <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                  {product.stock_quantity} unit
                </Badge>
              </div>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Jumlah:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Checkout - {formatPrice(product.price * quantity)}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Klik untuk memulai proses checkout — Anda akan diminta konfirmasi dan pembayaran sebelum diarahkan ke WhatsApp.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Reviews Section - Full Width */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-primary flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Ulasan & Rating
              </h3>

              {ratingData.totalReviews > 0 ? (
                <div className="space-y-6">
                  {/* Rating Summary */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-center mb-4">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {ratingData.averageRating.toFixed(1)}
                        </div>
                        <StarRating rating={ratingData.averageRating} size="lg" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Berdasarkan {ratingData.totalReviews} ulasan
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Distribusi Rating</h4>
                      <RatingDistribution
                        distribution={ratingData.ratingDistribution}
                        totalReviews={ratingData.totalReviews}
                      />
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Ulasan Pelanggan</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {ratingData.reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                {maskName(review.profiles?.full_name, 1)}
                              </p>
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Belum ada ulasan untuk produk ini</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Jadilah yang pertama memberikan ulasan setelah membeli produk ini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pesanan</DialogTitle>
            <DialogDescription>Periksa kembali pesanan Anda sebelum kami simpan sebagai <strong>pending</strong>.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">Produk: <strong>{product.name}</strong></p>
            <p className="mb-2">Jumlah: <strong>{quantity}</strong></p>
            <p className="mb-2">Total: <strong>{formatPrice(product.price * quantity)}</strong></p>
            <p className="mb-2">Pengiriman ke: <strong>{profile?.address}</strong></p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button onClick={openPaymentRecap} disabled={creatingOrder}>{creatingOrder ? 'Menyimpan...' : 'Setuju, Lanjutkan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment / Recap Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lakukan Pembayaran</DialogTitle>
            <DialogDescription>Periksa rekap pembelian. Tekan konfirmasi untuk melanjutkan ke WhatsApp.</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="border p-3 rounded">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-medium">{pendingOrderId ?? '-'}</p>
              {!pendingOrderId ? (
                <p className="text-xs text-muted-foreground mt-1">Order akan dibuat setelah Anda menekan "Konfirmasi & Lanjutkan ke WhatsApp".</p>
              ) : null}
            </div>
            <div className="border p-3 rounded">
              <p className="text-sm text-muted-foreground">Rekap Pembelian</p>
              <p className="font-medium">{product.name} x{quantity} — {formatPrice(product.price * quantity)}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-sm text-muted-foreground">Alamat Pengiriman</p>
              <div className="font-medium text-sm">
                <div>{profile?.full_name}</div>
                <div>{profile?.phone}</div>
                <div className="mt-1">
                  {profile?.address}<br />
                  {profile?.subdistrict && profile?.district && `${profile.subdistrict}, ${profile.district}`}<br />
                  {profile?.city && profile?.province && `${profile.city}, ${profile.province}`}<br />
                  {profile?.postal_code && `Kode Pos: ${profile.postal_code}`}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentOpen(false)}>Tutup</Button>
            <Button onClick={() => void redirectToWhatsApp()} disabled={creatingOrder}>{creatingOrder ? 'Menyimpan...' : 'Konfirmasi & Lanjutkan ke WhatsApp'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}