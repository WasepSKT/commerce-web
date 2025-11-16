import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import useCart from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';
import { useCartProducts } from '@/hooks/useCartProducts';
import { useCartValidation } from '@/hooks/useCartValidation';
import { useCartLineItems } from '@/hooks/useCartLineItems';
import { useCartCheckout } from '@/hooks/useCartCheckout';
import CartSkeleton from '@/components/cart/CartSkeleton';
import CartItemCard from '@/components/cart/CartItemCard';
import OrderSummary from '@/components/cart/OrderSummary';
import CartRecapDialog from '@/components/cart/CartRecapDialog';
import { CART_MESSAGES, CART_ROUTES } from '@/constants/cart';
import { formatPrice } from '@/utils/format';

export default function CartPage() {
  const { items, totalItems, update, removeItem, clear } = useCart();
  const { profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showRecap, setShowRecap] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch products for cart items
  const cartItemIds = items.map((item) => item.id);
  const { products, loading } = useCartProducts(cartItemIds);

  // Validate cart items
  const { invalidItemsInfo, clearCorruptedCart } = useCartValidation(items);

  // Calculate line items and subtotal
  const { lineItems, subtotal } = useCartLineItems(items, products);

  // Checkout logic
  const { handleCheckout } = useCartCheckout(totalItems, items);

  // Open recap dialog
  const openRecap = useCallback(() => {
    setShowConfirm(false);
    setShowRecap(true);
  }, []);

  // Navigate to checkout
  const proceedToCheckout = useCallback(async () => {
    try {
      setShowRecap(false);
      navigate(`${CART_ROUTES.CHECKOUT}`);
    } catch (err) {
      console.error('Failed navigate to checkout', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        variant: 'destructive',
        title: 'Gagal ke checkout',
        description: msg,
      });
      throw err;
    }
  }, [navigate, toast]);

  const handleRemoveItem = useCallback(
    (id: string) => {
      removeItem(id);
      toast({ title: CART_MESSAGES.ITEM_REMOVED });
    },
    [removeItem, toast]
  );

  const handleClearCart = useCallback(() => {
    clear();
    toast({ title: CART_MESSAGES.CLEAR_SUCCESS });
  }, [clear, toast]);

  if (loading) {
    return (
      <Layout>
        <CartSkeleton />
      </Layout>
    );
  }

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Keranjang', url: 'https://regalpaw.id/cart' }
  ]);

  return (
    <Layout>
      <SEOHead
        title="Keranjang Belanja - Regal Paw"
        description="Keranjang belanja Regal Paw. Review produk makanan kucing premium yang telah Anda pilih, hitung total belanja, dan lanjutkan ke checkout dengan mudah."
        keywords="keranjang, cart, belanja, checkout, makanan kucing, Regal Paw"
        canonical="/cart"
        ogType="website"
        structuredData={breadcrumbData}
        noindex={true}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">{CART_MESSAGES.CART_TITLE}</h1>
          <div className="space-x-2">
            <Button variant="ghost" asChild>
              <Link to={CART_ROUTES.PRODUCTS}>{CART_MESSAGES.CONTINUE_SHOPPING}</Link>
            </Button>
            <Button variant="destructive" onClick={handleClearCart}>
              {CART_MESSAGES.CLEAR_BUTTON}
            </Button>
          </div>
        </div>

        {/* Invalid Items Error State */}
        {invalidItemsInfo.hasInvalid && (
          <div className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-red-600">{CART_MESSAGES.CART_CORRUPTED}</h3>
              <p className="text-muted-foreground mb-6">{CART_MESSAGES.CART_CORRUPTED_DESC}</p>
              <div className="space-x-2">
                <Button onClick={clearCorruptedCart} variant="destructive">
                  {CART_MESSAGES.CLEAR_CART}
                </Button>
                <Button asChild variant="outline">
                  <Link to={CART_ROUTES.PRODUCTS}>{CART_MESSAGES.START_SHOPPING}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty Cart State */}
        {!invalidItemsInfo.hasInvalid && lineItems.length === 0 && (
          <div className="py-12">
            <EmptyState
              title={CART_MESSAGES.EMPTY_CART}
              description={CART_MESSAGES.EMPTY_CART_DESC}
              lottieSrc="https://lottie.host/6ebe5320-be98-4e5d-90b5-a9f5d2f186fd/ez07wuijAR.lottie"
              cta={{ label: CART_MESSAGES.CONTINUE_SHOPPING, onClick: () => navigate(CART_ROUTES.PRODUCTS) }}
            />
          </div>
        )}

        {/* Cart Items and Summary */}
        {!invalidItemsInfo.hasInvalid && lineItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {lineItems.map((li) => (
                <CartItemCard
                  key={li.id}
                  item={li}
                  onUpdate={update}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            <div className="space-y-4">
              <OrderSummary
                totalItems={totalItems}
                subtotal={subtotal}
                isAuthenticated={isAuthenticated}
                profile={profile}
                onCheckout={handleCheckout}
              />

              {/* Recap Dialog */}
              <CartRecapDialog
                open={showRecap}
                onOpenChange={setShowRecap}
                lineItems={lineItems}
                subtotal={subtotal}
                pendingOrderId={null}
                creatingOrder={false}
                onProceed={proceedToCheckout}
              />

              {/* Confirmation Dialog */}
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
                      {lineItems.map((li) => (
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
                      <div>
                        <span className="font-medium">Nama penerima:</span> {profile?.full_name ?? '-'}
                      </div>
                      <div>
                        <span className="font-medium">No. HP/WA:</span> {profile?.phone ?? '-'}
                      </div>
                      <div>
                        <span className="font-medium">Alamat:</span> {profile?.address ?? '-'}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                      Kembali
                    </Button>
                    <Button onClick={openRecap}>Konfirmasi & Lanjut</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  <p>
                    Silakan konfirmasi pesanan. Setelah konfirmasi Anda akan diarahkan ke halaman
                    Checkout untuk memilih pengiriman dan pembayaran.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
