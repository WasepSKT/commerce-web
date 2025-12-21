import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getShippingRates, ShippingRate } from '@/services/shippingService';
import { OrderItem } from '@/types/checkout';
import { safeJsonParse } from '@/utils/storage';

export function useShippingRates(profile: any, items: OrderItem[]) {
  const { toast } = useToast();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);

  useEffect(() => {
    let postal: string | undefined = profile?.postal_code as string | undefined;
    if (!postal) {
      const raw = localStorage.getItem('rp_profile');
      if (raw) {
        try {
          const parsed = safeJsonParse(raw, {} as { postal_code?: string });
          postal = parsed.postal_code;
        } catch (_) {
          // ignore
        }
      }
    }
    if (!postal) return;

    const loadRates = async () => {
      setLoadingRates(true);
      try {
        const allowedServices = await getProductShippingServices(items);
        const r = await getShippingRates({ to_postal: postal, weight: 1000 });
        
        if (!r || !Array.isArray(r)) throw new Error('Invalid shipping rates response');

        if (allowedServices.length > 0) {
          const filtered = filterRatesByAllowedServices(r, allowedServices);
          if (filtered.length > 0) {
            setRates(filtered);
            setSelectedRate(filtered[0]);
            return;
          }
          toast({ 
            title: 'Opsi pengiriman terbatas', 
            description: 'Produk ini memiliki layanan pengiriman terbatas; menampilkan opsi terdekat.' 
          });
        }

        setRates(r || []);
      } catch (err: unknown) {
        console.error('Failed to load shipping rates', err);
        handleShippingRatesError(err, items);
      } finally {
        setLoadingRates(false);
      }
    };

    void loadRates();
  }, [profile?.postal_code, toast, items]);

  const getProductShippingServices = async (items: OrderItem[]): Promise<string[]> => {
    try {
      const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean) as string[]));
      if (productIds.length === 1) {
        const pid = productIds[0];
        const prodRes = await supabase
          .from('products')
          .select('id,available_shipping_services,shipping_options')
          .eq('id', pid)
          .single();
        
        const prod = (prodRes as { data?: Record<string, unknown> | null }).data ?? null;
        if (prod) {
          const raw = (prod['available_shipping_services'] ?? prod['shipping_options']) as unknown;
          if (Array.isArray(raw)) {
            return raw.map(String).map(s => s.trim()).filter(Boolean);
          } else if (typeof raw === 'string' && raw.trim() !== '') {
            return raw.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
      }
    } catch (prodErr) {
      console.warn('Failed to read product shipping services, continuing without restriction', prodErr);
    }
    return [];
  };

  const filterRatesByAllowedServices = (rates: ShippingRate[], allowedServices: string[]): ShippingRate[] => {
    const normalized = allowedServices.map(s => s.toLowerCase());
    return rates.filter(rate => {
      const name = String(rate.service_name ?? rate.service_code ?? '').toLowerCase();
      return normalized.some(tok => name.includes(tok) || tok.includes(name));
    });
  };

  const handleShippingRatesError = async (err: unknown, items: OrderItem[]) => {
    const errStr = String(err ?? '');
    if (errStr.includes('<!DOCTYPE') || errStr.includes('<html') || errStr.includes('Invalid shipping rates response')) {
      const dummy: ShippingRate[] = [
        { provider: 'shipper', service_code: 'INST', service_name: 'Instan', cost: 15000, etd: '1-2 hari' },
        { provider: 'shipper', service_code: 'REG', service_name: 'Reguler', cost: 10000, etd: '2-4 hari' },
      ];

      const allowedServicesFallback = await getProductShippingServices(items);
      if (allowedServicesFallback.length > 0) {
        const filteredDummy = filterRatesByAllowedServices(dummy, allowedServicesFallback);
        setRates(filteredDummy.length > 0 ? filteredDummy : dummy);
        setSelectedRate((filteredDummy.length > 0 ? filteredDummy : dummy)[0]);
      } else {
        setRates(dummy);
        setSelectedRate(dummy[0]);
      }
      toast({ 
        title: 'Menggunakan tarif pengiriman sementara', 
        description: 'Gagal memuat tarif resmi — menampilkan opsi sementara.' 
      });
    } else {
      toast({ variant: 'destructive', title: 'Gagal memuat tarif pengiriman' });
    }
  };

  return {
    rates,
    selectedRate,
    loadingRates,
    setSelectedRate
  };
}
