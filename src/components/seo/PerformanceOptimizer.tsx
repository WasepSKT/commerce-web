import { useEffect } from 'react';

interface PerformanceOptimizerProps {
  preloadImages?: string[];
  preloadFonts?: string[];
  prefetchRoutes?: string[];
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  preloadImages = [],
  preloadFonts = [],
  prefetchRoutes = []
}) => {
  useEffect(() => {
    // Preload critical images
    preloadImages.forEach(imageSrc => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageSrc;
      document.head.appendChild(link);
    });

    // Preload critical fonts
    preloadFonts.forEach(fontSrc => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.href = fontSrc;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Prefetch routes for faster navigation
    prefetchRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    // Add performance monitoring
    if ('performance' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming;
            console.log('FID:', fidEntry.processingStart - entry.startTime);
          }
          if (entry.entryType === 'layout-shift') {
            const clsEntry = entry as PerformanceEntry & { value: number };
            console.log('CLS:', clsEntry.value);
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

      return () => {
        observer.disconnect();
      };
    }
  }, [preloadImages, preloadFonts, prefetchRoutes]);

  return null;
};

export default PerformanceOptimizer;
