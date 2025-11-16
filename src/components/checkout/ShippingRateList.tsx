import { CHECKOUT_MESSAGES } from '@/constants/checkout';
import { formatPrice } from '@/utils/format';
import { ShippingRate } from '@/services/shippingService';

interface ShippingRateListProps {
  loading: boolean;
  rates: ShippingRate[];
  selected: ShippingRate | null;
  onSelect: (r: ShippingRate) => void;
}

export default function ShippingRateList({ loading, rates, selected, onSelect }: ShippingRateListProps) {
  return (
    <div>
      <h3 className="font-semibold mb-2 text-primary">{CHECKOUT_MESSAGES.SHIPPING_TITLE}</h3>
      {loading ? (
        <div>{CHECKOUT_MESSAGES.LOADING_RATES}</div>
      ) : (
        <div className="space-y-2">
          {rates.map((r) => (
            <div
              key={`${r.provider}-${r.service_code}`}
              className={`p-3 border rounded cursor-pointer ${selected?.provider === r.provider && selected?.service_code === r.service_code ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
              onClick={() => onSelect(r)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {r.provider} - {r.service_name || r.service_code}
                  </div>
                  {r.etd ? <div className="text-xs text-muted-foreground">Estimasi: {r.etd}</div> : null}
                </div>
                <div className="font-medium">{formatPrice(r.cost)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


