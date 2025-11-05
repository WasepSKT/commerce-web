import { useState, useEffect, useCallback } from 'react';
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
import { ProductCard } from '@/components/ProductCard';
import SEOHead from '@/components/seo/SEOHead';
import { generateProductStructuredData, generateBreadcrumbStructuredData, generatePageTitle } from '@/utils/seoData';
import computePriceAfterDiscount from '@/utils/price';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ShareButtons } from '@/components/product/ShareButtons';
import { ProductPrice } from '@/components/product/ProductPrice';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { ProductSpecs } from '@/components/product/ProductSpecs';
import { ProductReviews } from '@/components/product/ProductReviews';
import type { ProductRatingData } from '@/types/review';
import type { Product } from '@/types/product';
import { asProductId } from '@/types/product';
import { formatPriceIDR } from '@/utils/currency';

// Product type moved to '@/types/product'

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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isProductInfoOpen, setIsProductInfoOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Image gallery logic handled inside ProductImageGallery

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      // Brand the product id to ProductId
      const row = data as Omit<Product, 'id'> & { id: string };
      const normalized: Product = { ...row, id: asProductId(row.id) };
      setProduct(normalized);
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

  // fetch related products after product is loaded
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      setRelatedLoading(true);
      try {
        // Simple generic fetch: get 4 active products excluding current product, no category filtering
        // Use explicit select list and assert the response shape to avoid using `any`.
        const res = await supabase
          .from('products')
          .select('id,name,price,image_url,stock_quantity,discount_percent')
          .neq('id', product.id)
          .eq('is_active', true)
          .limit(4) as unknown as { data?: Product[]; error?: unknown };

        const items = (res?.data ?? []) as Product[];
        setRelatedProducts(Array.isArray(items) ? items.slice(0, 4) : []);
      } catch (err) {
        console.error('Failed to fetch related products', err);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    void fetchRelated();
  }, [product]);
  const formatPrice = formatPriceIDR;

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
      // Validate stock before creating order
      const { StockService } = await import('@/services/stockService');
      const stockCheck = await StockService.checkStockAvailability(product.id, quantity);
      if (!stockCheck.available) {
        throw new Error(stockCheck.error || 'Stok tidak mencukupi');
      }
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
      const priceInfo = computePriceAfterDiscount({ price: product.price, discount_percent: (product as Product & { discount_percent?: number }).discount_percent ?? 0 });
      const itemsPayload = [
        {
          order_id: id,
          product_id: product.id,
          quantity,
          price: product.price,
          unit_price: priceInfo.discounted,
          discount_percent: priceInfo.discountPercent,
        },
      ];

      // Decrement stock after successful order creation
      const stockResult = await StockService.decrementStockForOrder(id);
      if (!stockResult.success) {
        console.warn('Failed to decrement stock:', stockResult.error);
        // Non-fatal: continue flow, stock can be managed manually
      }

      // Insert items into order_items and request the inserted rows back so we can verify success
      // Some deployments may not yet have `discount_percent` column in `order_items`.
      // Try inserting with discount_percent first; if the server returns an error indicating the column
      // is missing (PGRST204), retry without it.
      type PostgrestError = { code?: string; message?: string; details?: unknown };
      let itemsRes: unknown = await supabase.from('order_items').insert(itemsPayload).select();
      // normalize items response
      let itemsError = (itemsRes as unknown as { error?: unknown })?.error ?? null;
      let itemsData = (itemsRes as unknown as { data?: unknown })?.data ?? itemsRes;

      // If server responded with PGRST204 or a message about missing column, retry without discount_percent
      const errObj = itemsError as PostgrestError | null;
      if (errObj && (errObj.code === 'PGRST204' || (errObj.message && String(errObj.message).includes("Could not find the 'discount_percent' column")))) {
        console.warn('Detected missing discount_percent column, retrying insert without that field', errObj);
        const fallbackPayload = itemsPayload.map(({ order_id, product_id, quantity, price, unit_price }) => ({ order_id, product_id, quantity, price, unit_price }));
        itemsRes = await supabase.from('order_items').insert(fallbackPayload).select();
        itemsError = (itemsRes as unknown as { error?: unknown })?.error ?? null;
        itemsData = (itemsRes as unknown as { data?: unknown })?.data ?? itemsRes;
      }
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
    // Close confirmation modal and navigate to Checkout page in dry-run mode (testing)
    // so we do NOT persist orders/order_items from the client during integration tests.
    setConfirmOpen(false);
    navigateTo(`/checkout?product_id=${product?.id}&quantity=${quantity}&dry_run=1&from_product=1`);
  };

  // Ensure order exists (create if missing), then navigate to Checkout page
  const proceedToCheckout = async () => {
    if (!product || !profile) return;
    try {
      let usedOrderId = pendingOrderId;
      if (!usedOrderId) {
        const id = await createPendingOrder();
        usedOrderId = id ?? null;
        if (id) {
          toast({ title: 'Pesanan disimpan', description: `Order ID: ${id}` });
        }
      }

      if (usedOrderId) {
        // navigate to Checkout page where shipping & payment selection occurs
        navigateTo(`/checkout?order_id=${usedOrderId}`);
      } else {
        throw new Error('Gagal membuat order');
      }
    } catch (err) {
      console.error('Failed to create order before navigating to checkout', err);
      let message = 'Gagal membuat pesanan sebelum melanjutkan ke checkout.';
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

  // Use auto-generated SEO data or fallback to manual generation
  const seoTitle = product.meta_title || generatePageTitle(product.name);
  const seoDescription = product.meta_description || product.description;
  const seoKeywords = product.meta_keywords || `${product.name}, makanan kucing, ${product.category}, Regal Paw, nutrisi kucing`;
  const seoOgImage = product.og_image || product.image_url;
  const seoCanonical = product.canonical_url || `/product/${product.id}`;

  // Use auto-generated structured data or fallback to manual generation
  const structuredData = product.seo_structured_data ?
    [product.seo_structured_data] :
    [generateProductStructuredData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      stock_quantity: product.stock_quantity,
      brand: 'Regal Paw',
      rating: ratingData?.averageRating,
      reviewCount: ratingData?.totalReviews
    })];

  // compute effective per-unit price considering product-level discount
  const productDiscountPercent = (product as Product & { discount_percent?: number }).discount_percent ?? 0;
  const effectiveUnitPrice = Math.round(product.price * (1 - (productDiscountPercent || 0) / 100));

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Produk', url: 'https://regalpaw.id/products' },
    { name: product.name, url: `https://regalpaw.id/product/${product.id}` }
  ]);

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={seoCanonical}
        ogType="product"
        ogImage={seoOgImage}
        structuredData={[...structuredData, breadcrumbData]}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
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
          <ProductImageGallery
            imageUrl={product.image_url}
            imageGallery={product.image_gallery}
            productName={product.name}
            discountPercent={(product as Product & { discount_percent?: number }).discount_percent ?? 0}
            isOutOfStock={isOutOfStock}
          />

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

              <ProductPrice
                price={product.price}
                discountPercent={(product as Product & { discount_percent?: number }).discount_percent ?? 0}
                formatPrice={formatPrice}
              />



              <div className="flex items-center space-x-2 mb-6">
                <span className="text-sm">Stok tersedia:</span>
                <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                  {product.stock_quantity} Kaleng
                </Badge>
              </div>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="space-y-4">
                <QuantitySelector value={quantity} stock={product.stock_quantity} onChange={setQuantity} />

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-primary text-primary hover:bg-transparent hover:text-primary"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigateTo(`/auth?next=/product/${id}`);
                          return;
                        }
                        add(product.id, quantity);
                        toast({ title: 'Ditambahkan ke Keranjang', description: `${product.name} x${quantity}` });
                      }}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Masukkan Keranjang
                    </Button>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigateTo(`/auth?next=/product/${id}`);
                          return;
                        }
                        handleAddToCart();
                      }}
                    >
                      Checkout - {formatPrice(effectiveUnitPrice * quantity)}
                    </Button>
                  </div>
                </div>

                {/* Share buttons */}
                <ShareButtons productId={product.id} name={product.name} description={product.description} />

              </div>
            )}

          </div>
        </div>

        {/* Spesifikasi Produk - Full Width */}
        <div className="mt-10">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3 text-primary">Spesifikasi Produk</h2>
              <ProductSpecs
                category={product.category}
                stock_quantity={product.stock_quantity}
                brand={product.brand}
                product_type={product.product_type}
                pet_type={product.pet_type}
                origin_country={product.origin_country}
                expiry_date={product.expiry_date}
                age_category={product.age_category}
              />
            </CardContent>
          </Card>
        </div>

        {/* Deskripsi Produk - Full Width */}
        <div className="mt-10">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3 text-primary">Deskripsi Produk</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section - Full Width */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-primary flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Ulasan & Rating
              </h3>
              <ProductReviews ratingData={ratingData as ProductRatingData} />
            </CardContent>
          </Card>
        </div>

        {/* Produk Lainnya (appears under Ulasan & Rating) */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 text-primary">Produk Lainnya</h3>
          <div className="max-w-5xl mx-auto">
            {relatedLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-lg h-56" />
                ))}
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground">Tidak ada produk lain yang relevan untuk saat ini.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} onAddToCart={() => add(p.id, 1)} />
                ))}
              </div>
            )}
          </div>
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
      {/* Payment/Recap popup removed. Users are now routed to the dedicated Checkout page after confirmation. */}
      {/* The confirmation button (Setuju, Lanjutkan) now calls openPaymentRecap -> proceedToCheckout which will create a pending order and navigate to /checkout?order_id=... */}
    </Layout>
  );
}