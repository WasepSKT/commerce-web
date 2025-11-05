import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { FaAward, FaCoins, FaStar, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import heroImg from '@/assets/img/heroimg.svg';
import catVideo from '@/assets/video/kucing.mp4';
import ProductShowcase from '@/components/ProductShowcase';
import AboutSection from '@/components/AboutSection';
import BusinessOpportunitySection from '@/components/BusinessOpportunitySection';
// import ReferralCareerSection from '@/components/ReferralCareerSection';
import TestimonialSection from '@/components/TestimonialSection';
import BlogSection from '@/components/BlogSection';
import ContactSection from '@/components/ContactSection';
import CTASection from '@/components/CTASection';
import ScrollProgress from '@/components/ui/ScrollProgress';
import ScrollNavigation from '@/components/ui/ScrollNavigation';
import { ScrollAnimation, FadeInUp, FadeInScale, ParallaxScroll, ResponsiveFadeInRight } from '@/components/ui/ScrollAnimation';
import SEOHead from '@/components/seo/SEOHead';
import { organizationData, websiteData, pageSEOData } from '@/utils/seoData';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hoveringHero, setHoveringHero] = useState(false);

  // Preload hero image dynamically using the imported asset path so build hashed name is respected
  useEffect(() => {
    try {
      const href = String(heroImg);
      if (!href) return;
      // Avoid adding duplicate preload
      if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
      const l = document.createElement('link');
      l.rel = 'preload';
      l.as = 'image';
      l.href = href;
      // Insert early in head
      const head = document.head || document.getElementsByTagName('head')[0];
      head.insertBefore(l, head.firstChild);
    } catch (e) {
      // ignore
    }
  }, []);

  // Define sections for scroll navigation
  const navigationSections = [
    { id: 'hero', label: 'Beranda', selector: '#hero-section' },
    { id: 'features', label: 'Fitur', selector: '#features-section' },
    { id: 'showcase', label: 'Produk Unggulan', selector: '#showcase-section' },
    { id: 'products', label: 'Produk Terbaru', selector: '#products-section' },
    { id: 'about', label: 'Tentang Kami', selector: '#about-section' },
    { id: 'opportunity', label: 'Peluang Bisnis', selector: '#opportunity-section' },
    { id: 'testimonials', label: 'Testimoni', selector: '#testimonials-section' },
    { id: 'blog', label: 'Artikel', selector: '#blog-section' },
    { id: 'contact', label: 'Kontak', selector: '#contact-section' }
  ];

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title={pageSEOData.home.title}
        description={pageSEOData.home.description}
        keywords={pageSEOData.home.keywords}
        canonical="/"
        ogType="website"
        structuredData={[organizationData, websiteData]}
      />

      {/* Scroll Progress Bar */}
      <ScrollProgress
        position="top"
        thickness={2}
        showPercentage={false}
        interactive={true}
        animationDuration={600}
      />

      {/* Scroll Navigation */}
      <ScrollNavigation
        sections={navigationSections}
        position="right"
        showBackToTop={true}
        showDirectionalButtons={true}
        autoHide={true}
        hideThreshold={100}
      />
      {/* Hero Section */}
      <section id="hero-section" className="py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ResponsiveFadeInRight duration={800} delay={200}>
              <div className="space-y-6">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-center md:text-left text-brand leading-tight">
                  Nutrisi Terbaik untuk
                  <div className="text-2xl md:text-4xl lg:text-5xl font-extrabold">Kucing kesayangan</div>
                </h1>
                <p className="text-sm md:text-2xl text-muted-foreground text-center md:text-left">
                  Berikan yang terbaik untuk kucing Anda dengan makanan premium berkualitas tinggi, dipercaya oleh ribuan pemilik kucing di Indonesia.
                </p>
                {/* <div className="flex justify-start sm:justify-start md:justify-start lg:justify-start">
                  <div className="sm:flex sm:justify-start md:justify-start lg:justify-start w-full sm:w-auto md:w-auto lg:w-auto">
                    <div className="flex justify-center sm:justify-start w-full sm:w-auto">
                      <Button asChild size="lg" className="rounded-full px-5 py-2" style={{ backgroundColor: '#7A1316', color: '#F8DF7C' }}>
                        <Link to="/products">
                          <span className="inline-flex items-center gap-2"><FaShoppingCart className="h-4 w-4" />Belanja Sekarang</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div> */}
              </div>
            </ResponsiveFadeInRight>
            <ParallaxScroll parallaxSpeed={-0.3} duration={1000} delay={400}>
              <div className="flex justify-center lg:justify-end relative">
                {/* wrapper to hold image and hover-video; fixed responsive card so layout doesn't shift */}
                <div
                  className="relative w-full max-w-[520px] h-[300px] sm:h-[360px] md:h-[420px] overflow-hidden rounded-[90px] shadow-2xl"
                  onMouseEnter={() => {
                    setHoveringHero(true);
                    const v = videoRef.current;
                    if (v) {
                      v.currentTime = 0;
                      v.muted = false;
                      v.play().catch(() => { });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveringHero(false);
                    const v = videoRef.current;
                    if (v) {
                      v.pause();
                      try {
                        v.currentTime = 0;
                      } catch (e) {
                        // ignore
                      }
                    }
                  }}
                >
                  <img
                    src={heroImg}
                    alt="Hero"
                    width={520}
                    height={420}
                    loading="eager"
                    decoding="async"
                    className={`w-full h-full object-cover ${hoveringHero ? 'hidden' : 'block'}`}
                  />
                  <video
                    src={catVideo}
                    loop
                    playsInline
                    ref={videoRef}
                    className={`${hoveringHero ? 'block' : 'hidden'} w-full h-full object-cover`}
                    aria-hidden
                  />
                </div>
              </div>
            </ParallaxScroll>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features-section"
        className="py-6 md:py-12"
        style={{ background: 'linear-gradient(180deg, #FFF8E0 0%, hsl(var(--background)) 100%)' }}
      >
        <div className="container mx-auto px-4">
          <FadeInUp duration={800} delay={100}>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl lg:text-5xl mb-4 text-brand">Mengapa Regal Paw?</h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
                Kami berkomitmen memberikan nutrisi terbaik untuk kucing kesayangan Anda,
                dengan standar kualitas internasional.
              </p>
            </div>
          </FadeInUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <FadeInScale duration={600} delay={200}>
              <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="flex flex-col items-center text-center">
                  <div className="flex flex-col items-center mb-4">
                    <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                      <FaAward className="h-6 w-6 text-[#F8DF7C]" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-brand mb-2">Best Quality</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Menggunakan bahan baku yang berkualitas tinggi (setara dengan kebutuhan manusia) / Organik.
                  </p>
                </div>
              </div>
            </FadeInScale>

            {/* Card 2 */}
            <FadeInScale duration={600} delay={300}>
              <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="flex flex-col items-center text-center">
                  <div className="flex flex-col items-center mb-4">
                    <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                      <FaCoins className="h-6 w-6 text-[#F8DF7C]" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-brand mb-2">Best Value for Money</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Harga yang terjangkau dengan kualitas produk yang tinggi (Super Premium Class).
                  </p>
                </div>
              </div>
            </FadeInScale>

            {/* Card 3 */}
            <FadeInScale duration={600} delay={400}>
              <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="flex flex-col items-center text-center">
                  <div className="flex flex-col items-center mb-4">
                    <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                      <FaStar className="h-6 w-6 text-[#F8DF7C]" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-brand mb-2">Best Experience</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Diproduksi oleh pabrik berpengalaman lebih dari 25 tahun dalam pengalengan makanan berkualitas ekspor ke Amerika, Eropa, Jepang, dan Hongkong.
                  </p>
                </div>
              </div>
            </FadeInScale>

            {/* Card 4 */}
            <FadeInScale duration={600} delay={500}>
              <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="flex flex-col items-center text-center">
                  <div className="flex flex-col items-center mb-4">
                    <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                      <FaHeart className="h-6 w-6 text-[#F8DF7C]" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-brand mb-2">Best Recommend</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Di rekomendasi kan agar dapat dijadikan makanan untuk pemulihan Anabul (rekomendasi oleh dokter Hewan).
                  </p>
                </div>
              </div>
            </FadeInScale>
          </div>
        </div>
      </section>

      {/* Product Showcase (carousel) */}
      <section id="showcase-section" className="py-2 md:py-6">
        <FadeInUp duration={800} delay={100}>
          <ProductShowcase />
        </FadeInUp>
      </section>

      {/* Featured Products */}
      <section id="products-section" className="py-4 md:py-6">
        <div className="container mx-auto px-4">
          <FadeInUp duration={800} delay={150}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <FeaturedCarousel products={featuredProducts} />
            )}
          </FadeInUp>
        </div>
      </section>

      {/* About Section (below Featured Products) */}
      <section id="about-section">
        <ScrollAnimation animation="slideUp" duration={800} delay={100}>
          <AboutSection />
        </ScrollAnimation>
      </section>

      {/* Business Opportunity Section (after About) */}
      <section id="opportunity-section">
        <ScrollAnimation animation="slideUp" duration={800} delay={100}>
          <BusinessOpportunitySection />
        </ScrollAnimation>
      </section>

      {/* Referral / Career Section */}
      {/* <section id="referral-section">
        <FadeInUp duration={800} delay={200}>
          <ReferralCareerSection />
        </FadeInUp>
      </section> */}

      {/* Testimonials (marquee) */}
      <section id="testimonials-section">
        <FadeInUp duration={800} delay={200}>
          <TestimonialSection />
        </FadeInUp>
      </section>

      {/* Blog Section - Latest Articles */}
      <section id="blog-section">
        <BlogSection />
      </section>

      {/* Contact Section */}
      <section id="contact-section">
        <ScrollAnimation animation="slideUp" duration={800} delay={100}>
          <ContactSection />
        </ScrollAnimation>
      </section>

      {/* CTA Section */}
      <FadeInScale duration={800} delay={150}>
        <CTASection />
      </FadeInScale>
    </Layout>
  );
};

export default Index;
