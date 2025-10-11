import { Layout } from '@/components/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';

export default function PrivacyPage() {
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Kebijakan Privasi', url: 'https://regalpaw.id/privacy' }
  ]);

  return (
    <Layout>
      <SEOHead
        title="Kebijakan Privasi - Regal Paw"
        description="Kebijakan privasi Regal Paw. Pelajari bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda. Transparansi dalam perlindungan privasi pelanggan."
        keywords="kebijakan privasi, privacy policy, perlindungan data, Regal Paw, keamanan data"
        canonical="/privacy"
        ogType="website"
        structuredData={breadcrumbData}
      />

      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-brand mb-4">Kebijakan Privasi</h1>
        <ul className="list-disc pl-5 mb-6 text-brand space-y-2">
          <li>Informasi yang dikumpulkan & tujuan</li>
          <li>Pemrosesan data & dasar hukum</li>
          <li>Keamanan data</li>
          <li>Hak pengguna atas data pribadi</li>
        </ul>

        <section className="space-y-6 text-muted-foreground">
          <div>
            <h2 className="text-xl font-semibold text-primary">1. Informasi yang Kami Kumpulkan</h2>
            <p>Kami mengumpulkan data yang Anda berikan secara langsung (nama, alamat, email, nomor telepon, detail pembayaran) serta data yang dikumpulkan otomatis (log akses, cookie) untuk meningkatkan layanan.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">2. Tujuan & Dasar Hukum Pemrosesan</h2>
            <p>Data digunakan untuk memproses pesanan, mengirimkan produk, layanan pelanggan, pemenuhan kewajiban kontrak, dan tujuan pemasaran bila Anda memberikan persetujuan. Kami memproses data sesuai kewajiban kontraktual dan kepatuhan hukum.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">3. Pengungkapan & Pihak Ketiga</h2>
            <p>Kami dapat berbagi data dengan penyedia layanan pihak ketiga (logistik, pembayaran, analytics) yang membantu operasional toko. Kami hanya berbagi data yang diperlukan dan dengan kontrak yang mengatur perlindungan data.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">4. Keamanan</h2>
            <p>Kami menerapkan langkah teknis dan organisasi (enkripsi, kontrol akses) untuk melindungi data. Namun tidak ada sistem yang 100% aman; oleh karena itu, patuhi praktik keamanan (mis. gunakan password kuat).</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">5. Hak Anda</h2>
            <p>Anda berhak meminta akses, perbaikan, penghapusan, pembatasan pemrosesan, portabilitas data, dan menolak pemrosesan untuk tujuan tertentu. Untuk meminta, hubungi kami melalui halaman <a href="/contact" className="text-primary underline">Kontak</a>.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">6. Retensi Data</h2>
            <p>Kami menyimpan data selama diperlukan untuk memenuhi tujuan pengumpulan, termasuk kepatuhan hukum atau penyelesaian sengketa. Setelah tidak diperlukan, data akan dihapus atau dianonimkan.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">7. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui kebijakan ini. Perubahan akan dipublikasikan di situs dengan tanggal efektif. Penggunaan layanan setelah pembaruan menandikan penerimaan terhadap perubahan.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">8. Kontak</h2>
            <p>Jika Anda memiliki pertanyaan atau ingin mengajukan permintaan terkait data pribadi, silakan hubungi kami melalui <a href="/contact" className="text-primary underline">halaman kontak</a>.</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
