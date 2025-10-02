import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ShoppingCart, Star, Shield, Truck, Package } from 'lucide-react';
import useCart from '@/hooks/useCart';

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
    if (!product) return;

    // Add to local cart and show toast
    add(product.id, quantity);
    toast({ title: 'Produk ditambahkan', description: `${product.name} x${quantity} telah ditambahkan ke keranjang.` });
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
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(4.8/5 dari 120 review)</span>
              </div>

              <p className="text-4xl font-bold text-primary mb-4">
                {formatPrice(product.price)}
              </p>

              <p className="text-muted-foreground leading-relaxed mb-6">
                {product.description}
              </p>

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
                    Pesan via WhatsApp - {formatPrice(product.price * quantity)}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Klik untuk melanjutkan pemesanan melalui WhatsApp
                  </p>
                </div>
              </div>
            )}

            {/* Product Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Informasi Produk</h3>
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
          </div>
        </div>
      </div>
    </Layout>
  );
}