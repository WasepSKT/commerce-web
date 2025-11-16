import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createQRPayment } from '@/services/paymentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Membuat QR Code...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive">
        <CardContent className="p-6">
          <div className="bg-destructive/10 rounded-lg p-4">
            <p className="text-destructive text-sm text-center">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-semibold">Scan QR Code untuk Bayar</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center space-y-6 pb-8">
        {/* QR Code Display */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
          <QRCodeSVG
            value={qrData}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Payment Amount */}
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Total Pembayaran</p>
          <p className="text-3xl font-bold text-primary">
            Rp {amount.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 w-full">
          <p className="text-xs text-blue-900 text-center leading-relaxed">
            Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay, LinkAja)
            dan scan QR code di atas untuk menyelesaikan pembayaran
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Menunggu pembayaran...</span>
        </div>
      </CardContent>
    </Card>
  );
}
