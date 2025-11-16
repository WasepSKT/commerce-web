import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaymentStatus } from '@/components/payment/PaymentStatus';
import { Loader2 } from 'lucide-react';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') as 'success' | 'pending' | 'failed' || 'success';
  const orderId = searchParams.get('order_id') || undefined;
  const transactionId = searchParams.get('transaction_id') || undefined;
  const amount = searchParams.get('amount') ? Number(searchParams.get('amount')) : undefined;

  useEffect(() => {
    // Simulate checking payment status
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Memverifikasi pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <PaymentStatus
      status={status}
      orderId={orderId}
      amount={amount}
      transactionId={transactionId}
    />
  );
}
