import React from 'react';
import { Layout } from '@/components/Layout';
import FaqCollapse from '@/components/ui/FaqCollapse';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData, generateFAQStructuredData } from '@/utils/seoData';

const FAQS = [
  {
    id: 'cs-1',
    question: 'Bagaimana cara memulai program referral?',
    answer: (
      <p>
        Daftar di halaman <a href="/signup" className="text-primary underline">Sign up</a>, dapatkan kode referral, dan bagikan ke teman.
      </p>
    )
  },
  {
    id: 'cs-2',
    question: 'Apa syarat untuk mendapatkan komisi?',
    answer: (
      <p>Komisi diberikan ketika referral menyelesaikan pembelian dan pembayaran terverifikasi dalam 30 hari.</p>
    )
  },
  {
    id: 'cs-3',
    question: 'Apakah komisi dapat dicairkan setiap bulan?',
    answer: (
      <p>Ya. Komisi akan dikumpulkan dan dapat dicairkan sesuai kebijakan yang tercantum di dashboard Anda.</p>
    )
  }
  ,
  {
    id: 'prod-1',
    question: 'Apa kebijakan pengembalian barang?',
    answer: (
      <p>
        Pengembalian diterima dalam 14 hari sejak barang diterima jika produk dikembalikan dalam kondisi layak jual (bersih, tidak rusak, dan tidak menunjukkan tanda penggunaan yang berlebihan), serta disertai bukti pembelian. Untuk alasan kebersihan dan keselamatan hewan, beberapa item (mis. perlengkapan kebersihan atau makanan) mungkin tidak dapat dikembalikan—lihat catatan di halaman produk. Jika pengiriman salah atau produk rusak, kami akan menanggung biaya pengembalian.
      </p>
    )
  },
  {
    id: 'ship-1',
    question: 'Berapa lama waktu pengiriman?',
    answer: (
      <p>
        Waktu pengiriman domestik biasanya 2–5 hari kerja tergantung lokasi dan metode pengiriman. Untuk estimasi lebih akurat lihat opsi kurir saat checkout.
      </p>
    )
  },
  {
    id: 'ship-2',
    question: 'Berapa biaya pengiriman?',
    answer: (
      <p>
        Biaya pengiriman dihitung otomatis di halaman checkout berdasarkan berat, ukuran paket, dan alamat tujuan. Kami juga menyediakan promo gratis ongkir pada syarat tertentu.
      </p>
    )
  },
  {
    id: 'ship-3',
    question: 'Bagaimana cara melacak pesanan saya?',
    answer: (
      <p>
        Setelah pesanan dikirim, kami akan mengirim nomor resi melalui email dan notifikasi. Gunakan nomor tersebut di situs kurir untuk pelacakan real-time.
      </p>
    )
  },
  {
    id: 'ship-4',
    question: 'Apakah kalian melayani pengiriman internasional?',
    answer: (
      <p>
        Saat ini kami menyediakan pengiriman internasional ke negara tertentu. Ketersediaan dan biaya akan muncul saat memasukkan alamat tujuan di checkout.
      </p>
    )
  },
  {
    id: 'ship-5',
    question: 'Siapa yang menanggung biaya pengembalian untuk pengiriman yang rusak?',
    answer: (
      <p>
        Jika barang tiba rusak atau ada kesalahan dari pihak kami, kami menanggung biaya pengembalian dan akan mengganti produk atau mengembalikan dana setelah verifikasi.
      </p>
    )
  }
];

export default function CaseStudiesPage() {
  // Generate FAQ structured data
  const faqData = FAQS.map(faq => ({
    question: faq.question,
    answer: typeof faq.answer === 'string' ? faq.answer : faq.answer.props.children
  }));

  const faqStructuredData = generateFAQStructuredData(faqData);
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Case Studies', url: 'https://regalpaw.id/case-studies' }
  ]);

  return (
    <Layout>
      <SEOHead
        title="Case Studies - FAQ Regal Paw"
        description="Kumpulan kasus nyata dan solusi umum yang sering terjadi di Regal Paw. Temukan jawaban untuk pertanyaan tentang program referral, pengiriman, dan layanan pelanggan."
        keywords="case studies, FAQ, pertanyaan umum, program referral, pengiriman, layanan pelanggan, Regal Paw"
        canonical="/case-studies"
        ogType="website"
        structuredData={[faqStructuredData, breadcrumbData]}
      />

      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-6 text-primary">Case Studies</h1>

        <p className="text-muted-foreground mb-6">Kumpulan kasus nyata dan solusi umum yang sering terjadi — disajikan dalam format tanya jawab agar mudah dipahami.</p>

        <div className="space-y-4">
          {FAQS.map((f) => (
            <FaqCollapse key={f.id} item={f} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
