import { Card, CardContent } from '@/components/ui/card';

interface ShippingSectionProps {
  rates: any[]; // ShippingRate type
  selectedRate: any | null;
  loadingRates: boolean;
  onRateSelect: (rate: any) => void;
}

export default function ShippingSection({
  rates,
  selectedRate,
  loadingRates,
  onRateSelect
}: ShippingSectionProps) {
  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(v);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-2">Pilih Jasa Pengiriman</h3>
        {loadingRates ? (
          <div>Memuat tarif...</div>
        ) : (
          <div className="space-y-2">
            {rates.map(rate => (
              <div
                key={`${rate.provider}-${rate.service_code}`}
                className={`p-3 border rounded cursor-pointer ${selectedRate?.service_code === rate.service_code
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent'
                  }`}
                onClick={() => onRateSelect(rate)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {rate.provider} - {rate.service_name || rate.service_code}
                    </div>
                    {rate.etd && (
                      <div className="text-xs text-muted-foreground">
                        Estimasi: {rate.etd}
                      </div>
                    )}
                  </div>
                  <div className="font-medium">
                    {formatPrice(rate.cost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
