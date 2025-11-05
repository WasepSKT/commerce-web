import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollAnimation, FadeInUp } from '@/components/ui/ScrollAnimation';
import CatLeft from '@/assets/img/Kucing - 01.webp';
import CatRight from '@/assets/img/Kucing - 02.webp';
import Lampu from '@/assets/img/Lampu - 01.webp';
import Lampu2 from '@/assets/img/Lampu - 02.webp';

export default function BusinessOpportunitySection() {
  return (
    <section className="py-10 md:py-16" aria-labelledby="bo-heading">
      {/* Local keyframes for smooth up-down animation */}
      <style>{`
        @keyframes floatY { 0% { transform: translateY(0); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0); } }
      `}</style>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Business Opportunity */}
          <div className="relative">
            <FadeInUp duration={1000} delay={100}>
              <h2 id="bo-heading" className="text-3xl md:text-6xl font-extrabold text-brand mb-4 text-center md:text-left">Business Opportunity</h2>
              <p className="text-muted-foreground max-w-2xl mb-6 text-base md:text-lg text-center md:text-left">
                Membuka peluang bisnis yang besar bagi Anda untuk ikut berkembang bersama <strong>Regal Paw</strong> yang terus bertumbuh.
              </p>
            </FadeInUp>

            {/* Left area: cat centered, lamps positioned absolute for precise placement */}
            <ScrollAnimation animation="slideUp" duration={1000} delay={200}>
              <div className="mt-8 relative flex justify-center">
                <img
                  src={CatLeft}
                  alt="Kucing"
                  className="w-full max-w-[240px] sm:max-w-[480px] md:max-w-[480px] lg:max-w-[360px]"
                  loading="lazy"
                />
                {/* Left lamp */}
                <img
                  src={Lampu2}
                  alt="Lamp kiri"
                  className="absolute bottom-28 left-[16%] sm:bottom-28 sm:left-[16%] md:bottom-28 md:left-[16%] w-20 sm:w-20 md:w-20 rotate-6"
                  style={{ animation: 'floatY 3s ease-in-out infinite' }}
                  loading="lazy"
                />
                {/* Right lamp */}
                <img
                  src={Lampu}
                  alt="Lamp kanan"
                  className="absolute top-2 right-[18%] sm:top-2 sm:right-[18%] md:top-3 md:right-[18%] w-24 sm:w-24 md:w-24 -rotate-8"
                  style={{ animation: 'floatY 3s ease-in-out infinite', animationDelay: '1.5s' }}
                  loading="lazy"
                />
              </div>
            </ScrollAnimation>
            <FadeInUp duration={1000} delay={300}>
              <div className="flex justify-center md:justify-end relative">
                <Button asChild className="absolute bottom-0 md:bottom-32 rounded-full px-6 py-2 text-white" style={{ backgroundColor: '#7A1316' }}>
                  <Link to="/contact">Hubungi Lebih Lanjut</Link>
                </Button>
              </div>
            </FadeInUp>
          </div>

          {/* Right: Agent card */}
          <ScrollAnimation animation="slideUp" duration={1000} delay={250}>
            <div className="relative bg-[#7A1316] text-white rounded-[64px] overflow-hidden p-0">
              <div className="max-w-2xl mx-auto text-center px-8 md:px-12 pt-8 md:pt-12 pb-0">
                <h3 className="text-5xl md:text-6xl font-extrabold mb-4">Agent</h3>
                <p className="text-base md:text-lg opacity-90">
                  Regal Paw membuka peluang bagi Anda untuk menjadi bagian dari jaringan agent eksklusif kami — karena setiap bisnis besar dimulai dari rasa percaya dan produk yang luar biasa.
                </p>
                <FadeInUp duration={1000} delay={350}>
                  <div className="mt-6 flex justify-center">
                    <Button asChild variant="secondary" className="rounded-full text-[#7A1316] bg-[#F8DF7C] hover:bg-[#f4d75e]">
                      <Link to="/career">Pelajari Lebih Lanjut</Link>
                    </Button>
                  </div>
                </FadeInUp>
              </div>
              {/* Right Cat full width, unaffected by card padding */}
              <FadeInUp duration={1000} delay={400}>
                <div className="flex justify-center">
                  <img
                    src={CatRight}
                    alt="Kucing"
                    className="pointer-events-none select-none w-full md:w-[400px] lg:w-[520px] object-contain block"
                    loading="lazy"
                  />
                </div>
              </FadeInUp>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}