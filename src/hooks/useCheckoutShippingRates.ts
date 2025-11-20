import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getShippingRates, ShippingRate } from '@/services/shippingService';
import { useToast } from '@/hooks/use-toast';
import { CHECKOUT_MESSAGES } from '@/constants/checkout';

interface ProfileLike {
  postal_code?: string | null;
}

interface OrderItemLike {
  product_id?: string;
}

export function useCheckoutShippingRates(profile: ProfileLike | null, items: OrderItemLike[]) {
  const { toast } = useToast();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);

  // derive a stable key from item product ids to avoid effect re-running on array identity changes
  const itemIdsKey = Array.from(new Set(items.map(it => it.product_id).filter(Boolean) as string[])).join(',');

  useEffect(() => {
    let postal: string | undefined = (profile?.postal_code ?? undefined) as string | undefined;
    if (!postal) {
      const raw = localStorage.getItem('rp_profile');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { postal_code?: string };
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
        let allowedServices: string[] = [];
        try {
          const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean) as string[]));
          if (productIds.length === 1) {
            const pid = productIds[0];
            const prodRes = await supabase.from('products').select('id,shipping_services,available_shipping_services,shipping_options').eq('id', pid).single();
            const prod = (prodRes as { data?: Record<string, unknown> | null }).data ?? null;
            if (prod) {
              const raw = (prod['shipping_services'] ?? prod['available_shipping_services'] ?? prod['shipping_options']) as unknown;
              if (Array.isArray(raw)) allowedServices = raw.map(String).map(s => s.trim()).filter(Boolean);
              else if (typeof raw === 'string' && raw.trim() !== '') allowedServices = raw.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
        } catch (prodErr) {
          console.warn('Failed to read product shipping services, continuing without restriction', prodErr);
        }

        const r = await getShippingRates({ to_postal: postal, weight: 1000 });
        if (!r || !Array.isArray(r)) throw new Error('Invalid shipping rates response');

        if (allowedServices.length > 0) {
          const normalized = allowedServices.map(s => s.toLowerCase());
          const filtered = (r as ShippingRate[]).filter(rate => {
            const name = String(rate.service_name ?? rate.service_code ?? '').toLowerCase();
            return normalized.some(tok => name.includes(tok) || tok.includes(name));
          });
          if (filtered.length > 0) {
            setRates(filtered);
            setSelectedRate(filtered[0]);
            return;
          }
          toast({ title: CHECKOUT_MESSAGES.LIMITED_SHIPPING, description: CHECKOUT_MESSAGES.LIMITED_SHIPPING_DESC });
        }

        setRates(r || []);
      } catch (err: unknown) {
        console.error('Failed to load shipping rates', err);
        const errStr = String(err ?? '');
        if (errStr.includes('<!DOCTYPE') || errStr.includes('<html') || errStr.includes('Invalid shipping rates response')) {
          const dummy: ShippingRate[] = [
            { provider: 'shipper', service_code: 'INST', service_name: 'Instan', cost: 15000, etd: '1-2 hari' },
            { provider: 'shipper', service_code: 'REG', service_name: 'Reguler', cost: 10000, etd: '2-4 hari' },
          ];

          let allowedServicesFallback: string[] = [];
          try {
            const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean) as string[]));
            if (productIds.length === 1) {
              const pid = productIds[0];
              const prodRes = await supabase.from('products').select('id,shipping_services,available_shipping_services,shipping_options').eq('id', pid).single();
              const prod = (prodRes as { data?: Record<string, unknown> | null }).data ?? null;
              if (prod) {
                const raw = (prod['shipping_services'] ?? prod['available_shipping_services'] ?? prod['shipping_options']) as unknown;
                if (Array.isArray(raw)) allowedServicesFallback = raw.map(String).map(s => s.trim()).filter(Boolean);
                else if (typeof raw === 'string' && raw.trim() !== '') allowedServicesFallback = raw.split(',').map(s => s.trim()).filter(Boolean);
              }
            }
          } catch (_e) {
            // ignore
          }
          if (allowedServicesFallback.length > 0) {
            const normalized = allowedServicesFallback.map(s => s.toLowerCase());
            const filteredDummy = dummy.filter(d => normalized.some(tok => d.service_name.toLowerCase().includes(tok) || d.service_code.toLowerCase().includes(tok)));
            setRates(filteredDummy.length > 0 ? filteredDummy : dummy);
            setSelectedRate((filteredDummy.length > 0 ? filteredDummy : dummy)[0]);
          } else {
            setRates(dummy);
            setSelectedRate(dummy[0]);
          }
          toast({ title: CHECKOUT_MESSAGES.USING_TEMP_RATES, description: CHECKOUT_MESSAGES.USING_TEMP_RATES_DESC });
        } else {
          toast({ variant: 'destructive', title: CHECKOUT_MESSAGES.RATES_LOAD_FAIL });
        }
      } finally {
        setLoadingRates(false);
      }
    };
    void loadRates();
  }, [profile?.postal_code, itemIdsKey, toast]);

  return { rates, selectedRate, setSelectedRate, loadingRates } as const;
}


