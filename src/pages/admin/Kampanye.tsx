import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminKampanyePage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Kampanye</h1>
        <p className="text-sm md:text-base text-muted-foreground">Atur kampanye promo yang muncul di halaman utama</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Konfigurasi Kampanye</CardTitle>
          <CardDescription>Fitur kampanye akan ditambahkan.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[50vh] grid place-items-center text-center text-sm text-muted-foreground">
          Form dan daftar kampanye akan tampil di sini.
        </CardContent>
      </Card>
    </AdminLayout>
  );
}


