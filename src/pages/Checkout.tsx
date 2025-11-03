import { useEffect, useMemo, useState } from 'react';
import { useTurnstile } from '@/hooks/useTurnstile';
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
import { safeJsonParse } from '@/utils/storage';
import { Edit } from 'lucide-react';
import { CHECKOUT_MESSAGES, PAYMENT_METHODS } from '@/constants/checkout';
import AddressBlock from '@/components/checkout/AddressBlock';
import ShippingRateList from '@/components/checkout/ShippingRateList';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import OrderSummaryCard from '@/components/checkout/OrderSummaryCard';
import CheckoutCaptcha from '@/components/checkout/CheckoutCaptcha';
import { useCheckoutInitialization } from '@/hooks/useCheckoutInitialization';
import { useCheckoutShippingRates } from '@/hooks/useCheckoutShippingRates';
import { useDryRun } from '@/hooks/useDryRun';
import type { Order, OrderItem } from '@/types/checkout';

// types moved to src/types/checkout.ts; query is provided by useCheckoutInitialization

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { order, setOrder, items, setItems, initializing, query } = useCheckoutInitialization();
  const { rates, selectedRate, setSelectedRate, loadingRates } = useCheckoutShippingRates(profile, items);
  // Xendit payment method identifiers (frontend labels). When wiring real
  // Xendit integrations server-side, these should match the provider's expected
  // method parameters (e.g. 'CARD', 'QRIS', 'EWALLET', 'VIRTUAL_ACCOUNT').
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);
  // Specific channel selection for certain methods
  const [selectedEwallet, setSelectedEwallet] = useState<string>('OVO');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');

  // Dry-run mode: when true the checkout will NOT persist orders/order_items
  // to the database. Enable via query ?dry_run=1 or automatically on localhost.
  const dryRun = useDryRun(query.get('dry_run'));
  const [creatingSession, setCreatingSession] = useState(false);
  // Turnstile via hook
  const { sitekey: TURNSTILE_SITEKEY, containerRef: widgetContainerRef, execute: executeTurnstile } = useTurnstile();

  // Debug Turnstile configuration
  useEffect(() => {
    console.log('🔧 Turnstile Debug Info (Checkout):', {
      sitekey: TURNSTILE_SITEKEY,
      hasSitekey: !!TURNSTILE_SITEKEY,
      sitekeyLength: TURNSTILE_SITEKEY?.length || 0
    });
  }, [TURNSTILE_SITEKEY]);
  // initializing comes from useCheckoutInitialization
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

  // initialization moved to useCheckoutInitialization

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

  // shipping rates moved to useCheckoutShippingRates

  // Removed local Turnstile script handling in favor of useTurnstile hook

  const subtotal = useMemo(() => items.reduce((s, it) => s + (it.unit_price ?? it.price ?? 0) * (it.quantity ?? 1), 0), [items]);
  const total = useMemo(() => subtotal + (selectedRate ? selectedRate.cost : 0), [subtotal, selectedRate]);

  const formatPrice = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const handlePay = useMemo(() => async () => {
    setCreatingSession(true);
    try {
      // If Turnstile sitekey is configured, obtain a token and include it in payloads
      let turnstileToken: string | null = null;
      if (TURNSTILE_SITEKEY && executeTurnstile) {
        turnstileToken = await executeTurnstile();
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
  }, [dryRun, items, order, profile, selectedPaymentMethod, selectedEwallet, selectedBank, selectedRate, subtotal, total, toast, TURNSTILE_SITEKEY, executeTurnstile, setOrder]);

  if (initializing) return null;

  return (
    <Layout>
      <SEOHead title={CHECKOUT_MESSAGES.PAGE_TITLE} description={CHECKOUT_MESSAGES.PAGE_DESC} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                <AddressBlock
                  isEditing={isEditingAddress}
                  setIsEditing={setIsEditingAddress}
                  form={addressForm}
                  setForm={setAddressForm}
                  saving={savingAddress}
                  onSave={async () => {
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
                      if ('error' in res && (res as Record<string, unknown>)['error']) {
                        throw (res as Record<string, unknown>)['error'];
                      }
                      toast({ title: 'Berhasil', description: 'Alamat pengiriman disimpan ke profil.' });
                      setIsEditingAddress(false);
                    } catch (err) {
                      console.error('Failed to update profile from checkout', err);
                      toast({ variant: 'destructive', title: 'Gagal menyimpan alamat', description: String(err) });
                    } finally {
                      setSavingAddress(false);
                    }
                  }}
                  onCancel={() => {
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
                  }}
                  profile={profile}
                  EditIcon={Edit}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <ShippingRateList loading={loadingRates} rates={rates} selected={selectedRate} onSelect={setSelectedRate} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <OrderSummaryCard items={items} subtotal={subtotal} selectedRate={selectedRate} total={total}>
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod}
                setSelectedMethod={setSelectedPaymentMethod}
                selectedEwallet={selectedEwallet}
                setSelectedEwallet={setSelectedEwallet}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
              />

              {/* Turnstile Widget Container (Visible & Responsive) */}
              <CheckoutCaptcha sitekey={TURNSTILE_SITEKEY} containerRef={widgetContainerRef as unknown as React.RefObject<HTMLDivElement>} />

              <Button className="w-full mt-3 mb-2" onClick={handlePay} disabled={creatingSession || !selectedRate}>{creatingSession ? 'Mengarahkan...' : 'Bayar & Lanjutkan'}</Button>
            </OrderSummaryCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
