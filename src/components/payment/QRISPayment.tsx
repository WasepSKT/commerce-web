import { useEffect, useState } from 'react';
import { createQRPayment } from '@/services/paymentService';

interface QRISPaymentProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function QRISPayment({ orderId, amount, onSuccess, onError }: QRISPaymentProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const result = await createQRPayment(orderId, { amount });
        setQrData(result.qr_string);
        onSuccess?.();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate QR code';
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [orderId, amount, onSuccess, onError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-muted-foreground">Generating QR Code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Scan QR Code untuk Bayar</h3>

      {/* QR Code Display - menggunakan iframe dari Xendit atau render manual */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
        {/* Temporary: Display QR string sebagai text, nanti bisa diganti dengan QR image */}
        <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-xs text-center break-all p-2">{qrData.substring(0, 50)}...</p>
          {/* TODO: Generate QR image dari qr_string menggunakan library atau API */}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-medium">Total Pembayaran</p>
        <p className="text-2xl font-bold text-primary">Rp {amount.toLocaleString('id-ID')}</p>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center max-w-xs">
        <p>Buka aplikasi e-wallet (GoPay, OVO, DANA, dll) dan scan QR code di atas untuk menyelesaikan pembayaran</p>
      </div>
    </div>
  );
}
