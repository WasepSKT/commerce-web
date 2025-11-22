import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ActionButtons({ status, orderId }: { status: 'success' | 'pending' | 'failed'; orderId?: string }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {status === 'success' && (
        <>
          <Button onClick={() => navigate(`/orders/${orderId}`)} className="w-full" size="lg">
            Lihat Detail Pesanan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </>
      )}

      {status === 'pending' && (
        <>
          <Button onClick={() => window.location.reload()} className="w-full" size="lg">
            Refresh Status
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </>
      )}

      {status === 'failed' && (
        <>
          <Button onClick={() => navigate(`/checkout/${orderId}`)} className="w-full" size="lg">
            Coba Lagi
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </>
      )}
    </div>
  );
}
