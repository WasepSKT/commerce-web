import { Layout } from '@/components/Layout';

export default function TermPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-brand mb-4">Syarat & Ketentuan</h1>
        <ul className="list-disc pl-5 mb-6 text-brand space-y-2">
          <li>Penggunaan Layanan</li>
          <li>Akun dan Keamanan</li>
          <li>Pembayaran, Pengiriman & Pengembalian</li>
          <li>Hak Cipta & Konten</li>
        </ul>

        <section className="space-y-6 text-muted-foreground">
          <div>
            <h2 className="text-xl font-semibold text-primary">1. Penggunaan Layanan</h2>
            <p>Regal Purrfect Shop menyediakan platform untuk melihat, memilih, dan membeli produk hewan peliharaan. Anda setuju menggunakan layanan sesuai hukum yang berlaku dan tidak menggunakan layanan untuk kegiatan penipuan, penyalahgunaan, atau pelanggaran hak pihak ketiga.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">2. Akun dan Keamanan</h2>
            <p>Untuk melakukan pembelian dan mengakses fitur tertentu, Anda perlu membuat akun. Jaga kerahasiaan kredensial akun Anda. Segera laporkan ke tim kami jika mengetahui akses tidak sah. Kami dapat menghentikan akun yang melanggar ketentuan ini.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">3. Pembayaran, Pengiriman & Pengembalian</h2>
            <p>Pembayaran diproses melalui penyedia pembayaran pihak ketiga. Pastikan detail pembayaran benar sebelum mengonfirmasi pesanan. Kebijakan pengembalian, penggantian, dan pengembalian dana dijelaskan dalam halaman kebijakan pengembalian; pengembalian hanya diproses jika memenuhi syarat.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">4. Harga dan Ketersediaan</h2>
            <p>Harga yang ditampilkan dapat berubah. Stok produk dapat berfluktuasi; jika pesanan tidak dapat dipenuhi karena ketersediaan, kami akan menghubungi Anda untuk opsi pengembalian dana atau produk pengganti.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">5. Hak Cipta & Konten</h2>
            <p>Semua konten pada situs ini (gambar, teks, logo) adalah milik kami atau pemegang lisensi. Dilarang menyalin, mereproduksi, atau mendistribusikan tanpa izin tertulis.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">6. Batasan Tanggung Jawab</h2>
            <p>Kami berusaha memberikan informasi yang akurat, namun tidak menjamin kesalahan atau kelengkapan informasi. Dalam kondisi apa pun, tanggung jawab kami terbatas sebagaimana diatur oleh hukum yang berlaku. Kami tidak bertanggung jawab atas kerugian tidak langsung atau konsekuensial.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">7. Perubahan Ketentuan</h2>
            <p>Kami dapat memperbarui syarat ini sewaktu-waktu. Perubahan akan dipublikasikan di situs dan berlaku efektif setelah diumumkan. Penggunaan berkelanjutan dianggap menerima perubahan tersebut.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">8. Hukum yang Berlaku</h2>
            <p>Syarat ini diatur oleh hukum Republik Indonesia. Sengketa akan diselesaikan sesuai mekanisme hukum yang berlaku.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-primary">9. Kontak</h2>
            <p>Untuk pertanyaan terkait syarat & ketentuan ini, hubungi kami melalui <a href="/contact" className="text-primary underline">halaman kontak</a>.</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
