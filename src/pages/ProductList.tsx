import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/ProductCard';
import { useToast } from '@/hooks/use-toast';
import useCart from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter } from 'lucide-react';
import { Layout } from '@/components/Layout';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { map: cart, add, totalItems } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const categories = ['all', 'Dry Food', 'Wet Food', 'Kitten Food'];

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Gagal memuat produk",
        description: "Terjadi kesalahan saat memuat produk.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const currentQuantity = cart[product.id] || 0;
    if (currentQuantity >= product.stock_quantity) {
      toast({
        variant: "destructive",
        title: "Stok tidak mencukupi",
        description: "Jumlah yang dipilih melebihi stok yang tersedia.",
      });
      return;
    }

    add(product.id, 1);

    toast({
      title: "Produk ditambahkan",
      description: `${product.name} telah ditambahkan ke keranjang.`,
    });
  };

  const getTotalItems = () => totalItems;

  const proceedToCheckout = () => {
    if (getTotalItems() === 0) {
      toast({
        variant: "destructive",
        title: "Keranjang kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu.",
      });
      return;
    }

    // Require auth before opening WhatsApp
    if (!isAuthenticated) {
      toast({ variant: 'destructive', title: 'Harap masuk terlebih dahulu', description: 'Silakan login untuk melanjutkan ke checkout.' });
      navigate('/auth', { state: { from: '/products' } });
      return;
    }
    // Navigate to cart page so user can review & use the unified checkout flow
    navigate('/cart');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-brand">Produk Kami</h1>
          <p className="text-muted-foreground">
            Temukan makanan kucing berkualitas tinggi untuk kesehatan kucing Anda
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 hover:bg-primary hover:text-white data-[state=open]:bg-primary data-[state=open]:text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="all"
                className="hover:bg-primary hover:text-white data-[state=checked]:bg-primary data-[state=checked]:text-white"
                onMouseEnter={() => setSelectedCategory('all')}
              >
                Semua Kategori
              </SelectItem>
              {categories.slice(1).map(category => (
                <SelectItem
                  key={category}
                  value={category}
                  className="hover:bg-primary hover:text-white data-[state=checked]:bg-primary data-[state=checked]:text-white"
                  onMouseEnter={() => setSelectedCategory(category)}
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cart Summary */}
        {getTotalItems() > 0 && (
          <div className="bg-primary/10 rounded-lg p-4 mb-8 flex items-center justify-between">
            <span className="font-medium">
              {getTotalItems()} item(s) dalam keranjang
            </span>
            <Button onClick={proceedToCheckout}>
              Checkout
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada produk yang ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}