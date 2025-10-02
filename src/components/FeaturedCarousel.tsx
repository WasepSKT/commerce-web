import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

interface FeaturedCarouselProps {
  products: Product[];
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ products }) => {
  // pagination handled via `pages` state (fetched from supabase)
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { toast } = useToast();
  const PAGE_SIZE = 4;
  const [items, setItems] = useState<Product[]>(() => (products && products.length ? products.slice(0, PAGE_SIZE) : []));
  const [nextPageToFetch, setNextPageToFetch] = useState(() => (products && products.length ? 1 : 0));
  const [loadingPage, setLoadingPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const fetchPage = useCallback(async (pageIdx: number) => {
    if (loadingPage) return;
    setLoadingPage(true);
    try {
      const from = pageIdx * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      const pageData = data || [];
      setItems((prev) => [...prev, ...(pageData as Product[])]);
      setNextPageToFetch(pageIdx + 1);
      if ((pageData?.length ?? 0) < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error('Failed to fetch featured page', err);
      toast({ title: 'Error', description: 'Gagal memuat produk.' });
    } finally {
      setLoadingPage(false);
    }
  }, [loadingPage, toast]);
  const handleAddToCart = (product: Product) => {
    // future: call cart API here
    toast({ title: 'Ditambahkan', description: `${product.name} berhasil ditambahkan ke keranjang.` });
  };

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    // if embla can scroll next, just scroll
    if (emblaApi && emblaApi.canScrollNext()) {
      emblaApi.scrollNext();
      return;
    }
    // otherwise, if there are more items on the server, fetch next page
    if (hasMore) {
      const pageToFetch = nextPageToFetch;
      fetchPage(pageToFetch).then(() => {
        // after fetch, try to scroll to the next slide
        try {
          emblaApi.reInit();
          emblaApi.scrollNext();
        } catch (e) {
          // ignore
        }
      });
    }
  }, [emblaApi, fetchPage, hasMore, nextPageToFetch]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setSelectedIndex(idx);
      try {
        setCanPrev(emblaApi.canScrollPrev());
        setCanNext(emblaApi.canScrollNext());
      } catch (e) {
        // ignore
      }
      // lazy-load next page when nearing the end
      if (items.length && idx >= items.length - 2 && hasMore) {
        fetchPage(nextPageToFetch);
      }
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      try {
        emblaApi.off('select', onSelect);
      } catch (e) {
        // ignore
      }
    };
  }, [emblaApi, fetchPage, items.length, hasMore, nextPageToFetch, setSelectedIndex]);

  useEffect(() => {
    // fetch first page on mount if we don't already have initial products
    if (items.length === 0) fetchPage(0);
  }, [fetchPage, items.length]);

  useEffect(() => {
    if (!emblaApi) return;
    try {
      emblaApi.reInit();
      // ensure embla is aware of new slides
      if (selectedIndex && emblaApi.slideNodes().length > selectedIndex) emblaApi.scrollTo(selectedIndex);
    } catch (e) {
      // ignore
    }
  }, [items.length, selectedIndex, emblaApi]);

  return (
    <div className="mx-auto overflow-hidden" data-aos="fade-up" data-aos-duration="700" data-aos-easing="ease-out-cubic" data-aos-delay="100">
      <div className="flex items-center justify-center mb-8 px-4">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-brand">Produk Regal Paw</h2>
          <p className="text-sm text-muted-foreground">Temukan Produk Terbaik untuk Kebutuhan Si Manis</p>
        </div>
      </div>

      <div className="relative px-4">
        <div className="embla">
          <div className="embla__viewport overflow-hidden" ref={emblaRef} style={{ overflow: 'hidden' }}>
            <div className="embla__container flex">
              {items.map((p) => (
                <div key={p.id} className="embla__slide flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <ProductCard product={p} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* arrows removed from side — they will appear beside the CTA below for alignment */}
      </div>

      <div className="mt-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* left spacer - reserved for future use or small-screen layout */}
          <div className="w-1/4" />

          {/* center CTA */}
          <div className="flex-1 flex justify-center">
            <Button asChild size="lg" className="rounded-full px-8 py-3" style={{ backgroundColor: '#7A1316', color: '#F8DF7C' }}>
              <a href="/products">Lihat Semua Produk &nbsp;➜</a>
            </Button>
          </div>

          {/* right controls aligned under the 4th card (right edge of carousel) */}
          <div className="w-1/4 flex justify-end">
            {(items.length > 0 || hasMore) && (
              <div className="flex items-center gap-3">
                <button
                  onClick={scrollPrev}
                  aria-label="Prev"
                  disabled={!canPrev}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border border-[#E9E6EE] shadow-md ${!canPrev ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white'}`}>
                  <FaChevronLeft className="text-brand" />
                </button>
                <button
                  onClick={scrollNext}
                  aria-label="Next"
                  disabled={!canNext && !hasMore}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border border-[#E9E6EE] shadow-md ${(!canNext && !hasMore) ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white'}`}>
                  {loadingPage ? (
                    <svg className="animate-spin h-4 w-4 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : (
                    <FaChevronRight className="text-brand" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCarousel;
