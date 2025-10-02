import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';
import { FaLeaf, FaShieldAlt, FaStar, FaTruck, FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import heroImg from '@/assets/img/heroimg.svg';
import ProductShowcase from '@/components/ProductShowcase';
import AboutSection from '@/components/AboutSection';
import ReferralCareerSection from '@/components/ReferralCareerSection';
import TestimonialSection from '@/components/TestimonialSection';
import ContactSection from '@/components/ContactSection';
import CTASection from '@/components/CTASection';

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
      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6" data-aos="fade-right" data-aos-duration="700" data-aos-easing="ease-out-cubic">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-center md:text-left text-brand leading-tight">
                Nutrisi Terbaik untuk
                <div className="text-4xl lg:text-5xl font-extrabold">Kucing kesayangan</div>
              </h1>
              <p className="text-base text-muted-foreground text-center md:text-left">
                Berikan yang terbaik untuk kucing Anda dengan makanan premium berkualitas tinggi, dipercaya oleh ribuan pemilik kucing di Indonesia.
              </p>
              <div className="flex justify-start sm:justify-start md:justify-start lg:justify-start">
                <div className="sm:flex sm:justify-start md:justify-start lg:justify-start w-full sm:w-auto md:w-auto lg:w-auto">
                  <div className="flex justify-center sm:justify-start w-full sm:w-auto">
                    <Button asChild size="lg" className="rounded-full px-5 py-2" style={{ backgroundColor: '#7A1316', color: '#F8DF7C' }}>
                      <Link to="/products">
                        <span className="inline-flex items-center gap-2"><FaShoppingCart className="h-4 w-4" />Belanja Sekarang</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end" data-aos="fade-left" data-aos-duration="700" data-aos-easing="ease-out-cubic">
              <img src={heroImg} alt="Hero" className="w-[520px] h-auto rounded-[90px] shadow-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-16"
        style={{ background: 'linear-gradient(180deg, #FFF8E0 0%, hsl(var(--background)) 100%)' }}
      >
        <div className="container mx-auto px-4" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="200">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-brand">Mengapa Regal Paw?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Kami berkomitmen memberikan nutrisi terbaik untuk kucing kesayangan Anda,
              dengan standar kualitas internasional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                  <FaLeaf className="h-6 w-6 text-[#F8DF7C]" />
                </div>
                <h3 className="text-lg font-semibold text-brand mb-2">100% Natural</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Terbuat dari bahan-bahan alami pilihan tanpa pengawet buatan atau pewarna kimia
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                  <FaShieldAlt className="h-6 w-6 text-[#F8DF7C]" />
                </div>
                <h3 className="text-lg font-semibold text-brand mb-2">Kualitas Premium</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Diproduksi dengan standar internasional dan telah mendapat sertifikasi dari AAFCO
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="200">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                  <FaStar className="h-6 w-6 text-[#F8DF7C]" />
                </div>
                <h3 className="text-lg font-semibold text-brand mb-2">Nutrisi Lengkap</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Mengandung protein, vitamin, dan mineral yang dibutuhkan kucing untuk tumbuh sehat
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="300">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 bg-[#7A1316] rounded-lg flex items-center justify-center mb-4">
                  <FaTruck className="h-6 w-6 text-[#F8DF7C]" />
                </div>
                <h3 className="text-lg font-semibold text-brand mb-2">Pengiriman Cepat</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Pengiriman ke seluruh Indonesia dengan sistem tracking dan kemasan yang aman.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase (carousel) */}
      <section className="py-16">
        <ProductShowcase />
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
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
        </div>
      </section>

      {/* About Section (below Featured Products) */}
      <AboutSection />

      {/* Referral / Career Section */}
      <ReferralCareerSection />


      {/* Testimonials (marquee) */}
      <TestimonialSection />
      {/* Contact Section */}
      <ContactSection />

      {/* CTA Section */}
      <CTASection />
    </Layout>
  );
};

export default Index;
