import AdminLayout from '@/components/admin/AdminLayout';
import { CardGridSkeleton, HeaderSkeleton } from '@/components/ui/AdminSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminCampaignPage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 text-primary">Campaign</h1>
        <p className="text-sm md:text-base text-muted-foreground">Atur campaign promo yang muncul di halaman utama</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle style={{ color: 'hsl(var(--primary))' }}>Konfigurasi Campaign</CardTitle>
          <CardDescription>Fitur campaign akan ditambahkan.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[50vh] grid place-items-center text-center text-sm text-muted-foreground">
          Form dan daftar campaign akan tampil di sini.
        </CardContent>
      </Card>
    </AdminLayout>
  );
}


