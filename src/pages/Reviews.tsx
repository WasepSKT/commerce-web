import React from 'react';
import { Layout } from '@/components/Layout';
import { Star } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';

export default function ReviewsPage() {
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Reviews', url: 'https://regalpaw.id/reviews' }
  ]);

  return (
    <Layout>
      <SEOHead
        title="Reviews & Testimoni Pelanggan - Regal Paw"
        description="Baca pengalaman pelanggan lain tentang produk dan layanan Regal Paw. Temukan testimoni asli dari pemilik kucing yang puas dengan nutrisi premium kami."
        keywords="reviews, testimoni, pengalaman pelanggan, Regal Paw, makanan kucing, nutrisi kucing"
        canonical="/reviews"
        ogType="website"
        structuredData={breadcrumbData}
      />

      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4 text-primary">Reviews</h1>
        <p className="text-muted-foreground mb-6">Baca pengalaman pelanggan lain tentang produk dan layanan kami. Jika Anda sudah membeli, bagikan pengalaman Anda dengan menambahkan review.</p>

        <div>
          <div className="w-full border rounded-lg p-6 bg-muted/50 text-muted-foreground flex items-center gap-4">
            <div className="flex-shrink-0">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1 text-primary">Belum ada review</h2>
              <p className="mb-0">Kami akan menampilkan testimoni pelanggan di sini saat tersedia.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
