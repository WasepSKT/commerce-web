import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Gift, Users, ShoppingCart } from 'lucide-react';

export default function QuickActions() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle style={{ color: 'hsl(var(--primary))' }}>Aksi Cepat</CardTitle>
        <CardDescription>Akses fitur utama dengan mudah</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
            <a href="/products" className="flex flex-col items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              <span className="text-sm">Belanja</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
            <a href="/my-orders" className="flex flex-col items-center gap-2">
              <Gift className="h-6 w-6" />
              <span className="text-sm">Pesanan Saya</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
            <a href="/profile" className="flex flex-col items-center gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Profil</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white">
            <a href="/cart" className="flex flex-col items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Keranjang</span>
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


