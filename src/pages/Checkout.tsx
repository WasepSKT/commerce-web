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
import { createPaymentSession, CreateSessionResult } from '@/services/paymentService';
import computePriceAfterDiscount from '@/utils/price';
import { safeJsonParse } from '@/utils/storage';
import { Edit } from 'lucide-react';
import { CHECKOUT_MESSAGES } from '@/constants/checkout';
import AddressBlock from '@/components/checkout/AddressBlock';
import ShippingRateList from '@/components/checkout/ShippingRateList';
import OrderSummaryCard from '@/components/checkout/OrderSummaryCard';
import CheckoutCaptcha from '@/components/checkout/CheckoutCaptcha';
import { useCheckoutInitialization } from '@/hooks/useCheckoutInitialization';
import { useCheckoutShippingRates } from '@/hooks/useCheckoutShippingRates';
import type { Order, OrderItem } from '@/types/checkout';

// types moved to src/types/checkout.ts; query is provided by useCheckoutInitialization

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { order, setOrder, items, setItems, initializing, query } = useCheckoutInitialization();
  const { rates, selectedRate, setSelectedRate, loadingRates } = useCheckoutShippingRates(profile, items);

  const [creatingSession, setCreatingSession] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  // Turnstile via hook
  const { sitekey: TURNSTILE_SITEKEY, containerRef: widgetContainerRef, execute: executeTurnstile } = useTurnstile();

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
    // Validate shipping selection
    if (!selectedRate) {
      toast({
        variant: 'destructive',
        title: '📦 Pilih Jasa Pengiriman',
        description: 'Mohon pilih metode pengiriman sebelum melanjutkan ke pembayaran.',
      });
      return;
    }

    // Validate captcha when user clicks pay
    if (TURNSTILE_SITEKEY && !captchaVerified) {
      toast({
        variant: 'destructive',
        title: '🔒 Verifikasi Keamanan Diperlukan',
        description: 'Mohon selesaikan verifikasi captcha terlebih dahulu untuk melanjutkan pembayaran.',
        duration: 5000,
      });
      return;
    }

    setCreatingSession(true);
    try {
      // Get Turnstile token if enabled
      let turnstileToken: string | null = null;
      if (TURNSTILE_SITEKEY && executeTurnstile) {
        turnstileToken = await executeTurnstile();
        if (!turnstileToken) {
          throw new Error('Gagal memverifikasi captcha. Silakan coba lagi.');
        }
        setCaptchaVerified(true);
      }
      let oid = order?.id;

      if (!oid) {
        // Create order in database
        type OrderInsert = Database['public']['Tables']['orders']['Insert'];
        const orderPayload: OrderInsert = {
          total_amount: subtotal,
          status: 'pending',
          customer_name: profile?.full_name ?? '',
          customer_phone: profile?.phone ?? '',
          customer_address: profile?.address ?? '',
          user_id: profile?.user_id ?? '' as string,
        } as OrderInsert;

        const insertRes = await supabase
          .from('orders')
          .insert([orderPayload])
          .select()
          .single();

        const created = (insertRes as { data?: Order | null }).data;
        if (!created?.id) throw new Error('Gagal membuat pesanan');

        oid = created.id;

        // Create order items - hanya field yang ada di schema database
        const itemsPayload = items.map(i => ({
          order_id: oid,
          product_id: i.product_id,
          quantity: i.quantity ?? 1,
          price: i.unit_price ?? i.price ?? 0
        }));

        const itemsInsert = await supabase.from('order_items').insert(itemsPayload);

        if (itemsInsert.error) {
          throw new Error('Gagal membuat detail pesanan');
        }
        setOrder({ id: oid, total_amount: subtotal, user_id: profile?.user_id });
      }

      // Update order with shipping info
      if (selectedRate) {
        await supabase
          .from('orders')
          .update({
            shipping_courier: selectedRate.provider,
            total_amount: total,
          })
          .eq('id', oid);
      }

      // Create payment session and redirect to Xendit
      const session = await createPaymentSession(oid as string, {
        return_url: `${window.location.origin}/payment/success`,
      });

      const redirectUrl = session?.url ?? session?.checkout_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      toast({
        title: 'Sesi pembayaran dibuat',
        description: 'Lanjutkan ke penyedia pembayaran.',
      });
    } catch (err) {
      console.error('Payment initiation failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Determine error type and show appropriate message
      const getErrorInfo = (msg: string) => {
        if (msg.includes('captcha') || msg.includes('Turnstile')) {
          return {
            title: '🔒 Verifikasi Keamanan Gagal',
            description: 'Gagal memverifikasi captcha. Mohon refresh halaman dan coba lagi.',
          };
        }
        if (msg.includes('network') || msg.includes('fetch')) {
          return {
            title: '🌐 Koneksi Bermasalah',
            description: 'Tidak dapat terhubung ke server pembayaran. Periksa koneksi internet Anda.',
          };
        }
        if (msg.includes('order') || msg.includes('pesanan')) {
          return {
            title: '📋 Kesalahan Pesanan',
            description: 'Gagal membuat pesanan. Mohon coba lagi atau hubungi customer service.',
          };
        }
        return {
          title: '❌ Pembayaran Gagal',
          description: msg,
        };
      };

      const errorInfo = getErrorInfo(errorMessage);
      toast({
        variant: 'destructive',
        ...errorInfo,
        duration: 5000,
      });

      setCaptchaVerified(false);
    } finally {
      setCreatingSession(false);
    }
  }, [items, order, profile, selectedRate, subtotal, total, toast, TURNSTILE_SITEKEY, executeTurnstile, setOrder, captchaVerified]);

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
              {/* Info about payment gateway */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 text-center font-medium">
                  🔒 Pembayaran aman melalui Xendit
                </p>
                <p className="text-xs text-blue-700 text-center mt-1">
                  Pilih metode pembayaran (QRIS, E-Wallet, Transfer Bank, Kartu Kredit) di halaman selanjutnya
                </p>
              </div>

              {/* Turnstile Widget Container (Visible & Responsive) */}
              {selectedRate && TURNSTILE_SITEKEY && (
                <div className="space-y-2">
                  <CheckoutCaptcha
                    sitekey={TURNSTILE_SITEKEY}
                    containerRef={widgetContainerRef as unknown as React.RefObject<HTMLDivElement>}
                    onVerified={setCaptchaVerified}
                  />
                  {!captchaVerified && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800 text-center font-medium">
                        ⚠️ Selesaikan verifikasi keamanan di atas sebelum melanjutkan
                      </p>
                    </div>
                  )}
                  {captchaVerified && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-800 text-center font-medium">
                        ✅ Verifikasi berhasil! Anda dapat melanjutkan pembayaran
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button
                className="w-full mt-3 mb-2"
                onClick={handlePay}
                disabled={creatingSession || !selectedRate}
              >
                {creatingSession ? 'Mengarahkan ke Pembayaran...' : 'Lanjutkan ke Pembayaran'}
              </Button>

              {/* Helper text for disabled button */}
              {!selectedRate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-800 text-center font-medium">
                    📦 Pilih jasa pengiriman terlebih dahulu
                  </p>
                </div>
              )}
            </OrderSummaryCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
