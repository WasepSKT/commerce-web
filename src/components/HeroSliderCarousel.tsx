import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { imageUrlWithCacheBust } from '@/utils/imageHelpers';
import type { Database } from '@/types/supabase';

type HeroSliderItem = Database['public']['Tables']['hero_slider_items']['Row'];

export function HeroSliderCarousel() {
  const [sliderItems, setSliderItems] = useState<HeroSliderItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSliderItems();
  }, []);

  useEffect(() => {
    if (sliderItems.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % sliderItems.length);
      }, 5000); // Auto-slide every 5 seconds

      return () => clearInterval(timer);
    }
  }, [sliderItems.length]);

  const fetchSliderItems = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slider_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching hero slider items:', error);
        return;
      }

      setSliderItems(data || []);
    } catch (error) {
      console.error('Exception in fetchSliderItems:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? sliderItems.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sliderItems.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    // Better skeleton that matches the real banner layout
    return (
      <div className="relative h-[20vh] md:h-96 overflow-hidden rounded-lg bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5" />
        <div className="relative h-full flex items-center justify-center px-4 md:px-8">
          <div className="w-full max-w-3xl text-center">
            <div className="mb-3">
              <div className="animate-pulse mx-auto h-6 md:h-10 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="hidden md:block mb-4">
              <div className="animate-pulse mx-auto h-4 md:h-6 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="flex items-center justify-center mt-2">
              <div className="animate-pulse h-9 md:h-12 bg-gray-200 rounded w-36 md:w-44" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sliderItems.length === 0) {
    return null; // Don't show anything if no active slides
  }

  const currentItem = sliderItems[currentIndex];

  return (
    <div className="relative h-[20vh] md:h-96 overflow-hidden rounded-lg bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 group">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url(${imageUrlWithCacheBust(currentItem.image_url, currentItem.updated_at)})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center text-white px-4 md:px-8">
        <div className="max-w-3xl">
          <h1 className="text-xl md:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg">
            {currentItem.title}
          </h1>
          {currentItem.subtitle && (
            <p className="hidden md:block text-lg md:text-xl mb-6 drop-shadow-md opacity-90">
              {currentItem.subtitle}
            </p>
          )}
          {(currentItem.button_text && currentItem.link_url) && (
            <Button
              asChild
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 text-sm md:px-8 md:py-3 md:text-lg font-medium drop-shadow-lg"
            >
              <a href={currentItem.link_url}>
                {currentItem.button_text}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Arrows (show on hover) */}
      {sliderItems.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {sliderItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {sliderItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                ? 'bg-white'
                : 'bg-white/50 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}