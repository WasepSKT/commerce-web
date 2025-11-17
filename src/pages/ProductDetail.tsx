import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ShoppingCart, MessageCircle } from 'lucide-react';
import useCart from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { StarRating } from '@/components/ui/StarRating';
import { useProductRating } from '@/hooks/useProductRating';
import { useProductCheckout } from '@/hooks/useProductCheckout';
import { ProductCard } from '@/components/ProductCard';
import SEOHead from '@/components/seo/SEOHead';
import { generateProductStructuredData, generateBreadcrumbStructuredData, generatePageTitle } from '@/utils/seoData';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductPrice } from '@/components/product/ProductPrice';
import { ProductActions } from '@/components/product/ProductActions';
import { ProductSpecs } from '@/components/product/ProductSpecs';
import { ProductReviews } from '@/components/product/ProductReviews';
import type { Product } from '@/types/product';
import { asProductId } from '@/types/product';
import { formatPriceIDR } from '@/utils/currency';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, profile } = useAuth();
  const { add } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const { ratingData } = useProductRating(id || '');
  const { proceedToCheckout, creatingOrder } = useProductCheckout(product, profile);

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      const row = data as Omit<Product, 'id'> & { id: string };
      setProduct({ ...row, id: asProductId(row.id) });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat produk',
        description: 'Produk tidak ditemukan atau terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (id) void fetchProduct(id);
  }, [id, fetchProduct]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      setRelatedLoading(true);
      try {
        const res = await supabase
          .from('products')
          .select('*')
          .neq('id', product.id)
          .eq('is_active', true)
          .limit(4);

        setRelatedProducts((res?.data ?? []) as Product[]);
      } catch (err) {
        console.error('Failed to fetch related products', err);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    void fetchRelated();
  }, [product]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate(`/auth?next=/product/${id}`);
      return;
    }
    if (!product) return;
    add(product.id, quantity);
    toast({ title: 'Ditambahkan ke Keranjang', description: `${product.name} x${quantity}` });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate(`/auth?next=/product/${id}`);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmCheckout = () => {
    if (!product) return;
    setConfirmOpen(false);
    proceedToCheckout(product.id, quantity);
  };

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
  const effectiveUnitPrice = Math.round(product.price * (1 - (product.discount_percent || 0) / 100));

  const seoTitle = product.meta_title || generatePageTitle(product.name);
  const seoDescription = product.meta_description || product.description;
  const seoKeywords = product.meta_keywords || `${product.name}, makanan kucing, ${product.category}, Regal Paw, nutrisi kucing`;
  const seoOgImage = product.og_image || product.image_url;
  const seoCanonical = product.canonical_url || `/product/${product.id}`;

  const structuredData = product.seo_structured_data
    ? [product.seo_structured_data]
    : [generateProductStructuredData({
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
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-6 md:mb-8 overflow-hidden">
          <Link to="/" className="hover:text-primary whitespace-nowrap">Beranda</Link>
          <span className="text-muted-foreground/50">/</span>
          <Link to="/products" className="hover:text-primary whitespace-nowrap">Produk</Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground truncate" title={product.name}>
            {product.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          <ProductImageGallery
            imageUrl={product.image_url}
            imageGallery={product.image_gallery}
            productName={product.name}
            discountPercent={product.discount_percent ?? 0}
            isOutOfStock={isOutOfStock}
          />

          <div className="space-y-3 lg:space-y-4">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 lg:mb-3 text-primary">{product.name}</h1>

              <div className="flex items-center gap-2 mb-3">
                <StarRating
                  rating={ratingData.averageRating}
                  size="sm"
                  showValue={ratingData.totalReviews > 0}
                />
                <span className="text-xs md:text-sm text-muted-foreground">
                  {ratingData.totalReviews > 0
                    ? `(${ratingData.averageRating.toFixed(1)}/5 dari ${ratingData.totalReviews} review)`
                    : '(Belum ada review)'}
                </span>
              </div>

              <ProductPrice
                price={product.price}
                discountPercent={product.discount_percent ?? 0}
                formatPrice={formatPriceIDR}
              />

              {/* Badge Diskon dan Stok dalam satu baris */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.discount_percent && product.discount_percent > 0 && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    Hemat {product.discount_percent}%
                  </Badge>
                )}
                <Badge variant={isOutOfStock ? 'destructive' : 'default'} className="text-xs px-2 py-0.5 bg-green-600">
                  Stok: {product.stock_quantity}
                </Badge>
              </div>
            </div>

            {!isOutOfStock && (
              <ProductActions
                productId={product.id}
                productName={product.name}
                description={product.description}
                quantity={quantity}
                stockQuantity={product.stock_quantity}
                effectivePrice={effectiveUnitPrice}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
                onCheckout={handleCheckout}
                formatPrice={formatPriceIDR}
              />
            )}
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-6 lg:mt-10">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <h2 className="text-base lg:text-lg font-semibold mb-3 text-primary">Spesifikasi Produk</h2>
              <ProductSpecs {...product} />
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <div className="mt-6 lg:mt-10">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <h2 className="text-base lg:text-lg font-semibold mb-3 text-primary">Deskripsi Produk</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        <div className="mt-6 lg:mt-12">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Ulasan & Rating
              </h3>
              <ProductReviews ratingData={ratingData} />
            </CardContent>
          </Card>
        </div>

        {/* Related Products */}
        <div className="mt-6 lg:mt-8">
          <h3 className="text-lg lg:text-xl font-semibold mb-4 text-primary">Produk Lainnya</h3>
          <div className="max-w-5xl mx-auto">
            {relatedLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-lg h-56" />
                ))}
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Tidak ada produk lain yang relevan untuk saat ini.
              </div>
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
            <DialogDescription>
              Periksa kembali pesanan Anda sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">Produk: <strong>{product.name}</strong></p>
            <p className="mb-2">Jumlah: <strong>{quantity}</strong></p>
            <p className="mb-2">Total: <strong>{formatPriceIDR(effectiveUnitPrice * quantity)}</strong></p>
            <p className="mb-2">Pengiriman ke: <strong>{profile?.address}</strong></p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button onClick={handleConfirmCheckout} disabled={creatingOrder}>
              {creatingOrder ? 'Memproses...' : 'Lanjutkan ke Checkout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}