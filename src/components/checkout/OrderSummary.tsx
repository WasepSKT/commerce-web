import { Button } from '@/components/ui/button';
import PaymentSection from './PaymentSection';
import { OrderItem } from '@/types/checkout';

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  selectedRate: any; // ShippingRate type
  total: number;
  selectedPaymentMethod: string;
  selectedEwallet: string;
  selectedBank: string;
  creatingSession: boolean;
  onPaymentMethodChange: (methodId: string) => void;
  onEwalletChange: (ewallet: string) => void;
  onBankChange: (bank: string) => void;
  onPay: () => void;
}

export default function OrderSummary({
  items,
  subtotal,
  selectedRate,
  total,
  selectedPaymentMethod,
  selectedEwallet,
  selectedBank,
  creatingSession,
  onPaymentMethodChange,
  onEwalletChange,
  onBankChange,
  onPay
}: OrderSummaryProps) {
  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(v);

  return (
    <div className="p-6 border rounded">
      <h3 className="font-semibold mb-2">Ringkasan Pesanan</h3>

      <PaymentSection
        selectedPaymentMethod={selectedPaymentMethod}
        selectedEwallet={selectedEwallet}
        selectedBank={selectedBank}
        onPaymentMethodChange={onPaymentMethodChange}
        onEwalletChange={onEwalletChange}
        onBankChange={onBankChange}
      />

      <div className="space-y-2 text-sm">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <div>
              {item.product_name || item.product_id} x{item.quantity}
            </div>
            <div>
              {formatPrice((item.unit_price ?? item.price ?? 0) * (item.quantity ?? 1))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-3">
        <div className="flex justify-between text-muted-foreground">
          Subtotal
          <div>{formatPrice(subtotal)}</div>
        </div>
        <div className="flex justify-between text-muted-foreground">
          Ongkos Kirim
          <div>{formatPrice(selectedRate?.cost ?? 0)}</div>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          Total
          <div>{formatPrice(total)}</div>
        </div>
        <Button
          className="w-full mt-3"
          onClick={onPay}
          disabled={creatingSession || !selectedRate}
        >
          {creatingSession ? 'Mengarahkan...' : 'Bayar & Lanjutkan'}
        </Button>
      </div>
    </div>
  );
}
