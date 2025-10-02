import React from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function CareerBenefits() {
  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div>
            <h1 className="text-4xl font-extrabold text-brand mb-4 text-left md:text-center">Kenapa Bergabung dengan Regal Paw</h1>
            <p className="text-muted-foreground mb-8 text-left md:text-center">Kami percaya bahwa tim yang bahagia dan berkembang menghasilkan produk yang lebih baik untuk hewan peliharaan. Berikut beberapa keuntungan bekerja bersama kami.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-[#7A1316]">
                <h3 className="text-lg font-semibold mb-2 text-brand">Kompensasi Kompetitif</h3>
                <p className="text-sm text-muted-foreground">Gaji kompetitif yang dievaluasi secara berkala berdasarkan peran dan pengalaman. Paket bonus tergantung kinerja dan kontribusi tim.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-[#7A1316]">
                <h3 className="text-lg font-semibold mb-2 text-brand">Asuransi & Kesejahteraan</h3>
                <p className="text-sm text-muted-foreground">Asuransi kesehatan untuk karyawan penuh waktu, program konseling, dan dukungan kesehatan mental.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-[#7A1316]">
                <h3 className="text-lg font-semibold mb-2 text-brand">Pengembangan & Pembelajaran</h3>
                <p className="text-sm text-muted-foreground">Akses ke kursus, workshop, dan program pembelajaran internal. Kita juga menyediakan dana untuk konferensi dan sertifikasi yang relevan.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-[#7A1316]">
                <h3 className="text-lg font-semibold mb-2 text-brand">Fleksibilitas Kerja</h3>
                <p className="text-sm text-muted-foreground">Pilihan kerja hybrid, jadwal fleksibel, dan kebijakan cuti yang mendukung kehidupan pribadi.</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-3 text-brand text-center">Budaya & Nilai</h3>
              <p className="text-muted-foreground text-center">Kami mengutamakan kolaborasi, transparansi, dan riset berbasis data. Tim kami kecil namun berdedikasi — kami menghargai ide baru, eksperimen yang aman, dan pendekatan berbasis bukti untuk mengembangkan produk berkualitas.</p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-3 text-brand text-center">Kebijakan Keberagaman & Inklusi</h3>
              <p className="text-muted-foreground text-center">Regal Paw berkomitmen menciptakan lingkungan inklusif. Kami mendukung keberagaman latar belakang, pengalaman, dan perspektif dalam tim kami.</p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-6 py-2" style={{ backgroundColor: '#7A1316', color: '#F8DF7C' }}>
                <Link to="/career/openings">Lihat Lowongan</Link>
              </Button>
              <Button variant="ghost" asChild className="rounded-full px-5 py-2 border border-[#7A1316] text-[#7A1316] hover:text-brand">
                <a href="mailto:hr@regalpaw.example">Kirim Pertanyaan</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
