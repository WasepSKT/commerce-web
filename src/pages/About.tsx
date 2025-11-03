import { Layout } from '@/components/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { pageSEOData, generateBreadcrumbStructuredData } from '@/utils/seoData';
import ProductCarousel from '@/components/product/ProductCarousel';
import { aboutProducts } from '@/data/aboutProducts';
import { ABOUT_COLORS } from '@/constants/about';

export default function AboutPage() {
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Tentang Kami', url: 'https://regalpaw.id/about' }
  ]);

  return (
    <Layout>
      <SEOHead
        title={pageSEOData.about.title}
        description={pageSEOData.about.description}
        keywords={pageSEOData.about.keywords}
        canonical="/about"
        ogType="website"
        structuredData={breadcrumbData}
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-brand mb-4">Tentang Regal Paw</h1>
            <p className="text-lg text-muted-foreground">
              Regal Paw berdedikasi untuk menghadirkan nutrisi kucing berkualitas tinggi yang dirancang berdasarkan penelitian dan praktik terbaik dalam nutrisi hewan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">
              <h2 className="text-2xl font-semibold text-brand mb-4">Misi Kami</h2>
              <p className="text-muted-foreground mb-6">
                Menyediakan produk nutrisi kucing yang aman, bergizi, dan terjangkau untuk membantu setiap kucing mencapai kesehatan optimal.
              </p>

              <h2 className="text-2xl font-semibold text-brand mb-4">Visi</h2>
              <p className="text-muted-foreground mb-6">
                Menjadi merek nutrisi hewan terkemuka di Indonesia yang dipercaya oleh pemilik kucing dan profesional perawatan hewan.
              </p>

              <h2 className="text-2xl font-semibold text-brand mb-4">Nilai Inti</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Keamanan & kualitas bahan baku</li>
                <li>Riset berbasis ilmiah</li>
                <li>Transparansi proses produksi</li>
              </ul>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Dukungan komunitas pemilik adalah salah satu pilar kami. Kami secara aktif membina
                  forum edukasi, grup diskusi, dan program konsultasi gratis bersama dokter hewan
                  dan ahli nutrisi hewan. Melalui webinar, artikel, dan sesi tanya jawab rutin, kami
                  membantu pemilik kucing memilih produk dan pola makan yang tepat sesuai usia,
                  kondisi kesehatan, dan preferensi makan kucing mereka.
                </p>
              </div>
            </div>

            <div data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="200">
              <ProductCarousel products={aboutProducts} brandColor={ABOUT_COLORS.brand} />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic">
            <div className="rounded-xl p-6" style={{ background: ABOUT_COLORS.brand }}>
              <h4 className="text-lg font-semibold mb-3 text-white">Sertifikasi AACFO</h4>
              <p className="text-sm text-white/90">Semua produk Regal Paw disusun sesuai panduan nutrisi internasional AACFO. Setiap batch melewati uji komposisi nutrisi dan kontrol mutu yang ketat untuk memastikan kandungan protein, lemak, serat, vitamin, dan mineral sesuai label dan standar keamanan pangan hewan.</p>
            </div>
            <div className="rounded-xl p-6" style={{ background: ABOUT_COLORS.brand }}>
              <h4 className="text-lg font-semibold mb-3 text-white">Riset & Pengembangan</h4>
              <p className="text-sm text-white/90">Tim R&D kami terdiri dari ahli nutrisi hewan dan dokter hewan yang melakukan pengujian formulasi, studi pencernaan, dan uji rasa. Produk dikembangkan melalui iterasi laboratorium dan uji konsumsi untuk memastikan mereka aman, bergizi, dan disukai kucing pada berbagai tahap hidup.</p>
            </div>
            <div className="rounded-xl p-6" style={{ background: ABOUT_COLORS.brand }}>
              <h4 className="text-lg font-semibold mb-3 text-white">Kemitraan Global</h4>
              <p className="text-sm text-white/90">Regal Paw bekerja sama dengan pemasok bahan baku terkemuka dari beberapa negara untuk mendapatkan protein, asam lemak, dan suplemen berkualitas. Rantai pasok diaudit secara berkala untuk menjaga standar etika, keberlanjutan, dan traceability bahan baku.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
