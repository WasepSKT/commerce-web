/**
 * Product carousel component with autoplay and modal support
 */

import { useRef, useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { AboutProduct } from '@/data/aboutProducts';
import CarouselControls from './CarouselControls';
import ProductModal from './ProductModal';
import { CAROUSEL_CONFIG, ABOUT_COLORS } from '@/constants/about';

interface ProductCarouselProps {
  products: AboutProduct[];
  brandColor?: string;
}

export default function ProductCarousel({ products, brandColor = ABOUT_COLORS.brand }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center', containScroll: 'trimSnaps' });
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<AboutProduct | null>(null);
  const mountedRef = useRef(false);

  // Handle carousel selection changes
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      try {
        setSelected(emblaApi.selectedScrollSnap());
        setCanPrev(Boolean(emblaApi.canScrollPrev && emblaApi.canScrollPrev()));
        setCanNext(Boolean(emblaApi.canScrollNext && emblaApi.canScrollNext()));
      } catch (e) {
        // Ignore embla API errors during transitions
      }
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      try {
        emblaApi.off('select', onSelect);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [emblaApi]);

  // Autoplay on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    let intervalId: number | undefined;
    if (emblaApi) {
      intervalId = window.setInterval(() => {
        try {
          emblaApi.scrollNext();
        } catch (e) {
          // Ignore autoplay errors
        }
      }, CAROUSEL_CONFIG.autoplayInterval) as unknown as number;
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId as number);
    };
  }, [emblaApi]);

  const handleOpenModal = (product: AboutProduct) => {
    setModalProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalProduct(null);
  };

  return (
    <div className="relative">
      <CarouselControls
        onPrev={() => emblaApi?.scrollPrev()}
        onNext={() => emblaApi?.scrollNext()}
        canPrev={canPrev}
        canNext={canNext}
        brandColor={brandColor}
      />

      <div className="embla">
        <div className="embla__viewport overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex gap-6 items-center">
            {products.map((product) => (
              <div key={product.id} className="embla__slide min-w-full flex items-center justify-center px-4 sm:px-6">
                <div className="relative overflow-hidden h-[60vh] md:h-[70vh] lg:h-[75vh] flex items-center justify-center w-full">
                  <img
                    src={product.img}
                    alt={product.title}
                    className="max-h-full object-contain w-auto mx-auto"
                  />

                  <button
                    aria-label={`Open details for ${product.title}`}
                    onClick={() => handleOpenModal(product)}
                    className="absolute inset-0 bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalProduct && (
        <ProductModal product={modalProduct} isOpen={modalOpen} onClose={handleCloseModal} />
      )}
    </div>
  );
}

