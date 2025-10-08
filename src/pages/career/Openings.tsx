import React from 'react';
import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';

export default function CareerOpenings() {
  // For now openings are an empty array to show the empty state.
  // In the future this can be fetched from an API or supabase table.
  const openings: Array<{ id: string; title: string; summary: string }> = [];

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Karir', url: 'https://regalpaw.id/career' },
    { name: 'Lowongan Tersedia', url: 'https://regalpaw.id/career/openings' }
  ]);

  return (
    <Layout>
      <SEOHead
        title="Lowongan Tersedia - Karir di Regal Paw"
        description="Temukan lowongan kerja terbaru di Regal Paw. Bergabunglah dengan tim yang berdedikasi untuk meningkatkan kualitas hidup hewan peliharaan. Lihat posisi yang tersedia dan kirimkan lamaran Anda."
        keywords="lowongan kerja, karir, Regal Paw, pekerjaan, rekrutmen, HR, posisi terbuka"
        canonical="/career/openings"
        ogType="website"
        structuredData={breadcrumbData}
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold text-brand mb-6 text-center">Lowongan Tersedia</h1>
          <p className="text-muted-foreground mb-6 text-center">Berikut adalah beberapa posisi yang sedang kami buka. Klik posisi untuk melihat detail dan melamar.</p>

          {openings.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-muted-foreground mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zM6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
                <h2 className="text-2xl font-semibold mb-2 text-brand">Belum Ada Lowongan Saat Ini</h2>
                <p className="text-muted-foreground mb-6">Kami tidak memiliki lowongan terbuka saat ini. Silakan cek kembali nanti atau kirimkan CV Anda ke tim HR.</p>
                <div className="flex items-center justify-center gap-4">
                  <Link to="/career" className="inline-block">
                    <button className="rounded-full bg-[#7A1316] text-white px-5 py-2">Kembali ke Karir</button>
                  </Link>
                  <a href="mailto:hr@regalpaw.example" className="inline-block rounded-full border border-[#7A1316] text-[#7A1316] px-5 py-2">Kirim CV</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openings.map((o) => (
                <div key={o.id} className="bg-white p-6 rounded-2xl shadow-card">
                  <h3 className="text-xl font-semibold mb-2">{o.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{o.summary}</p>
                  <Link to={`/career/openings/${o.id}`} className="text-sm text-primary underline">Lihat detail &amp; lamar</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
