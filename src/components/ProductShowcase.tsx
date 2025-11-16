import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ResponsiveAOS from '@/components/ui/ResponsiveAOS';
import tunaImg from '@/assets/img/Tuna.webp';
import salmonImg from '@/assets/img/salmon.webp';
import oceanfishImg from '@/assets/img/oceanfish.webp';

type Slide = {
  id: string;
  title: string;
  description: string;
  img: string;
};

const slidesData: Slide[] = [
  {
    id: 'tuna',
    title: 'TUNA',
    description:
      'Produk ini terbuat dari tuna yang berkualitas dan hasil sampingan ikan, dipadukan dengan bahan pembentuk gel, serta diperkaya dengan vitamin dan mineral esensial.',
    img: tunaImg,
  },
  {
    id: 'oceanfish',
    title: 'OCEAN FISH',
    description:
      'Kaya akan rasa laut yang lezat dan sumber protein berkualitas tinggi untuk kucing Anda. Formulanya ringan dan mudah dicerna, cocok untuk kucing dengan selera sensitif dan membantu menjaga energi harian.',
    img: oceanfishImg,
  },
  {
    id: 'salmon',
    title: 'SALMON',
    description:
      'Salmon premium dengan kandungan omega-3 yang tinggi untuk mendukung kesehatan kulit dan kilau bulu, serta meningkatkan fungsi jantung dan daya tahan tubuh.',
    img: salmonImg,
  },
];

const ProductShowcase: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const hoverRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  const AUTOPLAY_INTERVAL = 4500;

  const play = useCallback(() => {
    if (autoplayRef.current != null) window.clearInterval(autoplayRef.current);
    autoplayRef.current = window.setInterval(() => {
      if (emblaApi && !hoverRef.current) emblaApi.scrollNext();
    }, AUTOPLAY_INTERVAL) as unknown as number;
  }, [emblaApi]);

  const stop = useCallback(() => {
    if (autoplayRef.current != null) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    play();
    return () => {
      try {
        emblaApi.off('select', onSelect);
      } catch (e) {
        // ignore
      }
      stop();
      if (resumeTimeoutRef.current != null) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    };
  }, [emblaApi, play, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Compute image half-width and expose as CSS variable on the panel so buttons can
  // be positioned relative to the visible image. Recompute on resize.
  useEffect(() => {
    const setCssVar = () => {
      if (!panelRef.current) return;
      const imgEl = panelRef.current.querySelector('.ps-image-wrapper') as HTMLElement | null;
      const half = imgEl ? Math.round(imgEl.offsetWidth / 2) : 180;
      panelRef.current.style.setProperty('--ps-image-half', `${half}px`);
    };
    // initial
    setCssVar();
    window.addEventListener('resize', setCssVar);
    return () => window.removeEventListener('resize', setCssVar);
  }, [emblaApi]);

  const onMouseEnter = () => {
    hoverRef.current = true;
    stop();
  };
  const onMouseLeave = () => {
    hoverRef.current = false;
    play();
  };

  const goPrev = useCallback(() => {
    if (!emblaApi) return;
    stop();
    if (resumeTimeoutRef.current != null) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    try {
      emblaApi.scrollPrev();
    } catch (e) {
      try {
        const current = emblaApi.selectedScrollSnap();
        const prev = (current - 1 + slidesData.length) % slidesData.length;
        emblaApi.scrollTo(prev);
      } catch (e) {
        // ignore
      }
    }
    resumeTimeoutRef.current = window.setTimeout(() => {
      resumeTimeoutRef.current = null;
      if (!hoverRef.current) play();
    }, 2000) as unknown as number;
  }, [emblaApi, play, stop]);

  const goNext = useCallback(() => {
    if (!emblaApi) return;
    stop();
    if (resumeTimeoutRef.current != null) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    try {
      emblaApi.scrollNext();
    } catch (e) {
      try {
        const current = emblaApi.selectedScrollSnap();
        const next = (current + 1) % slidesData.length;
        emblaApi.scrollTo(next);
      } catch (e) {
        // ignore
      }
    }
    resumeTimeoutRef.current = window.setTimeout(() => {
      resumeTimeoutRef.current = null;
      if (!hoverRef.current) play();
    }, 2000) as unknown as number;
  }, [emblaApi, play, stop]);

  return (
    <div className="mt-0 md:mt-2">
      <div className="mx-auto">
        {/* Two-column layout: left = carousel panel, right = description. Stack on mobile. */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Left: carousel panel */}
          <div className="w-full lg:w-1/2">
            <ResponsiveAOS
              mobileAnimation="fade-up"
              desktopAnimation="fade-right"
              duration="700"
              easing="ease-out-cubic"
              delay="100"
            >
              <div
                ref={panelRef}
                className="bg-[#7A1316] sm:rounded-r-2xl rounded-none p-6 sm:p-8 w-full h-[360px] sm:h-[420px] relative overflow-hidden"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                <div className="embla h-full">
                  <div className="embla__viewport h-full" ref={emblaRef}>
                    <div className="embla__container flex h-full">
                      {slidesData.map((s) => (
                        <div
                          className="embla__slide min-w-full flex items-center justify-center px-4 sm:px-6"
                          key={s.id}
                          aria-hidden={selectedIndex !== slidesData.findIndex((sl) => sl.id === s.id)}
                        >
                          <div className="ps-image-wrapper w-[220px] sm:w-[320px] md:w-[380px] lg:w-[420px] h-[180px] sm:h-[260px] md:h-[300px] lg:h-[340px] flex items-center justify-center" data-aos="fade-in" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="500">
                            <img src={s.img} alt={s.title} className="max-w-full max-h-full object-contain" style={{ display: 'block' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Controls inside panel */}
                <button
                  type="button"
                  aria-label="previous"
                  onClick={goPrev}
                  disabled={!emblaApi}
                  aria-disabled={!emblaApi}
                  className="absolute top-1/2 transform -translate-y-1/2 bg-white/95 text-brand rounded-full p-3 sm:p-3.5 shadow pointer-events-auto z-[9999] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  style={{ left: 'calc(50% - var(--ps-image-half, 190px) - 40px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', border: '2px solid rgba(248,223,124,0.95)', touchAction: 'manipulation' }}
                  data-test="ps-prev-btn"
                >
                  <span className="sr-only">Previous</span>
                  <FaChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  aria-label="next"
                  onClick={goNext}
                  disabled={!emblaApi}
                  aria-disabled={!emblaApi}
                  className="absolute top-1/2 transform -translate-y-1/2 bg-white/95 text-brand rounded-full p-3 sm:p-3.5 shadow pointer-events-auto z-[9999] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  style={{ left: 'calc(50% + var(--ps-image-half, 190px) + 12px)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', border: '2px solid rgba(248,223,124,0.95)', touchAction: 'manipulation' }}
                  data-test="ps-next-btn"
                >
                  <span className="sr-only">Next</span>
                  <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-3 pointer-events-auto z-30">
                  {slidesData.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Show slide ${idx + 1} of ${slidesData.length}`}
                      onClick={() => {
                        if (!emblaApi) return;
                        emblaApi.scrollTo(idx);
                      }}
                      disabled={!emblaApi}
                      aria-disabled={!emblaApi}
                      className={`h-2.5 w-2.5 rounded-full ${idx === selectedIndex ? 'bg-[#F8DF7C]' : 'bg-white/60'} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  ))}
                </div>
              </div>
            </ResponsiveAOS>
          </div>

          {/* Right: title & description */}
          <ResponsiveAOS
            mobileAnimation="fade-up"
            desktopAnimation="fade-left"
            duration="700"
            easing="ease-out-cubic"
            delay="200"
            className="w-full lg:w-1/2 text-center lg:text-left px-4 sm:px-8 md:px-12 lg:px-16 min-h-[140px] sm:min-h-[160px] md:min-h-[180px] lg:min-h-0"
          >
            <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-brand tracking-wide mx-auto lg:mx-0">{slidesData[selectedIndex].title}</h3>
            <p className="mt-4 sm:mt-6 text-muted-foreground text-sm md:text-base lg:text-lg max-w-lg mx-auto lg:mx-0 line-clamp-4 sm:line-clamp-5">{slidesData[selectedIndex].description}</p>
          </ResponsiveAOS>
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
