import React from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import ResponsiveAnimation from '@/components/ui/ResponsiveAnimation';
import heroImg from '@/assets/img/hero-career.webp';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import { pageSEOData, generateBreadcrumbStructuredData } from '@/utils/seoData';

export default function CareerPage() {
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Karir', url: 'https://regalpaw.id/career' }
  ]);

  return (
    <Layout>
      <SEOHead
        title={pageSEOData.career.title}
        description={pageSEOData.career.description}
        keywords={pageSEOData.career.keywords}
        canonical="/career"
        ogType="website"
        structuredData={breadcrumbData}
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            <ResponsiveAnimation
              mobileAnimation="fade-up"
              desktopAnimation="fade-right"
              duration="700"
              easing="ease-out-cubic"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-brand mb-4">Karir di Regal Paw</h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                Bergabunglah dengan tim yang berdedikasi untuk meningkatkan kualitas hidup hewan peliharaan. Kami mencari talenta yang bersemangat,
                kreatif, dan ingin berkembang bersama perusahaan yang berfokus pada riset dan kualitas produk.
              </p>

              <div className="flex items-center gap-4">
                <Button asChild size="lg" className="rounded-full px-6 py-2" style={{ backgroundColor: '#7A1316', color: '#F8DF7C' }}>
                  <Link to="/career/openings">Lihat Lowongan</Link>
                </Button>
                <Button variant="ghost" asChild className="rounded-full px-5 py-2 border border-[#7A1316] text-[#7A1316] hover:text-brand">
                  <Link to="/career/benefits">Kenapa Bergabung</Link>
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-card border-2 border-[#7A1316] ">
                  <h4 className="text-sm font-semibold text-brand mb-1">Budaya Kerja</h4>
                  <p className="text-sm text-muted-foreground">Lingkungan kolaboratif, dukungan pengembangan karir, dan keseimbangan hidup-kerja.</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-card border-2 border-[#7A1316] ">
                  <h4 className="text-sm font-semibold text-brand mb-1">Benefit</h4>
                  <p className="text-sm text-muted-foreground">Asuransi kesehatan, cuti tahunan, dan akses ke program edukasi internal.</p>
                </div>
              </div>
            </ResponsiveAnimation>

            <ResponsiveAnimation
              mobileAnimation="fade-up"
              desktopAnimation="fade-left"
              duration="700"
              easing="ease-out-cubic"
              delay="200"
              className="flex justify-center lg:justify-end"
            >
              <img src={heroImg} alt="Career hero" className="w-full max-w-[520px] object-cover" />
            </ResponsiveAnimation>
          </div>
        </div>
      </section>
    </Layout>
  );
}
