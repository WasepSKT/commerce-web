import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { useCheckoutInitialization } from '@/hooks/useCheckoutInitialization';
import { useAddressForm } from '@/hooks/useAddressForm';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useShippingRates } from '@/hooks/useShippingRates';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';
import AddressSection from '@/components/checkout/AddressSection';
import ShippingSection from '@/components/checkout/ShippingSection';
import OrderSummary from '@/components/checkout/OrderSummary';
import { CheckoutQueryParams } from '@/types/checkout';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function CheckoutPage() {
  const query = useQuery();
  const { profile } = useAuth();

  // Extract query parameters
  const queryParams: CheckoutQueryParams = {
    order_id: query.get('order_id'),
    product_id: query.get('product_id'),
    from_cart: query.get('from_cart'),
    quantity: Number(query.get('quantity') ?? '1'),
    dry_run: query.get('dry_run')
  };

  // Dry-run mode: when true the checkout will NOT persist orders/order_items
  // to the database. Enable via query ?dry_run=1 or automatically on localhost.
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const dryRun = useMemo(() => {
    if (queryParams.dry_run === '1' || queryParams.dry_run === 'true') return true;
    if (queryParams.dry_run === '0' || queryParams.dry_run === 'false') return false;
    return isLocalhost; // default to true on localhost for safe testing
  }, [queryParams.dry_run, isLocalhost]);

  // Custom hooks for different concerns
  const { order, items, initializing, setOrder } = useCheckoutInitialization(queryParams);
  const {
    isEditingAddress,
    savingAddress,
    addressForm,
    setIsEditingAddress,
    updateAddressForm,
    saveAddress,
    cancelEditing
  } = useAddressForm();
  const {
    paymentMethods,
    selectedPaymentMethod,
    selectedEwallet,
    selectedBank,
    handlePaymentMethodChange,
    handleEwalletChange,
    handleBankChange,
    getPaymentChannel
  } = usePaymentMethods();
  const { rates, selectedRate, loadingRates, setSelectedRate } = useShippingRates(profile, items);
  const { creatingSession, processPayment } = usePaymentProcessing();

  // Calculate totals
  const subtotal = useMemo(() =>
    items.reduce((s, it) => s + (it.unit_price ?? it.price ?? 0) * (it.quantity ?? 1), 0),
    [items]
  );
  const total = useMemo(() =>
    subtotal + (selectedRate ? selectedRate.cost : 0),
    [subtotal, selectedRate]
  );

  // Handle payment processing
  const handlePay = async () => {
    try {
      await processPayment({
        order,
        items,
        selectedRate,
        selectedPaymentMethod,
        paymentChannel: getPaymentChannel(),
        profile,
        dryRun,
        subtotal,
        total
      });
    } catch (err) {
      // Error handling is done in the hook
      console.error('Payment processing failed:', err);
    }
  };

  if (initializing) return null;

  return (
    <Layout>
      <SEOHead title="Checkout - Regal Paw" description="Pilih alamat, jasa pengiriman, dan metode pembayaran." />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AddressSection
              profile={profile}
              isEditingAddress={isEditingAddress}
              savingAddress={savingAddress}
              addressForm={addressForm}
              onEditClick={() => setIsEditingAddress(true)}
              onSaveAddress={saveAddress}
              onCancelEditing={cancelEditing}
              onUpdateAddressForm={updateAddressForm}
            />

            <ShippingSection
              rates={rates}
              selectedRate={selectedRate}
              loadingRates={loadingRates}
              onRateSelect={setSelectedRate}
            />
          </div>

          <div className="space-y-4">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              selectedRate={selectedRate}
              total={total}
              selectedPaymentMethod={selectedPaymentMethod}
              selectedEwallet={selectedEwallet}
              selectedBank={selectedBank}
              creatingSession={creatingSession}
              onPaymentMethodChange={handlePaymentMethodChange}
              onEwalletChange={handleEwalletChange}
              onBankChange={handleBankChange}
              onPay={handlePay}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
