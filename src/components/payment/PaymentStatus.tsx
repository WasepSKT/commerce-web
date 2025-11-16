import { CheckCircle2, XCircle, Clock, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

type PaymentStatusType = 'success' | 'pending' | 'failed';

interface PaymentStatusProps {
  status: PaymentStatusType;
  orderId?: string;
  amount?: number;
  transactionId?: string;
  message?: string;
}

export function PaymentStatus({
  status,
  orderId,
  amount,
  transactionId,
  message
}: PaymentStatusProps) {
  const navigate = useNavigate();

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      title: 'Pembayaran Berhasil!',
      description: message || 'Terima kasih atas pembelian Anda. Pesanan Anda sedang diproses.',
    },
    pending: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      title: 'Menunggu Pembayaran',
      description: message || 'Pembayaran Anda sedang diproses. Mohon tunggu beberapa saat.',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      title: 'Pembayaran Gagal',
      description: message || 'Maaf, pembayaran Anda gagal. Silakan coba lagi.',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardContent className="p-8">
          {/* Icon with Animation */}
          <div className="flex justify-center mb-6">
            <div className={`${config.bgColor} rounded-full p-6 animate-bounce-slow`}>
              <Icon className={`h-16 w-16 ${config.color}`} strokeWidth={2} />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>

          {/* Transaction Details */}
          {(orderId || amount || transactionId) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
              {orderId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order ID</span>
                  <span className="text-sm font-semibold text-gray-900">{orderId}</span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transaction ID</span>
                  <span className="text-sm font-semibold text-gray-900">{transactionId}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <span className="text-lg font-bold text-primary">
                    Rp {amount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <>
                <Button
                  onClick={() => navigate(`/orders/${orderId}`)}
                  className="w-full"
                  size="lg"
                >
                  Lihat Detail Pesanan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </>
            )}

            {status === 'pending' && (
              <>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                  size="lg"
                >
                  Refresh Status
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </>
            )}

            {status === 'failed' && (
              <>
                <Button
                  onClick={() => navigate(`/checkout/${orderId}`)}
                  className="w-full"
                  size="lg"
                >
                  Coba Lagi
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </>
            )}
          </div>

          {/* Support Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Butuh bantuan?{' '}
              <a href="/contact" className="text-primary hover:underline font-medium">
                Hubungi Customer Service
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
