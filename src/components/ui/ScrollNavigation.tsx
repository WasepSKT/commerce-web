import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useCustomScroll } from '@/hooks/useCustomScroll';
import { ChevronUp, ChevronDown, ArrowUp } from 'lucide-react';

export interface ScrollNavSection {
  id: string;
  label: string;
  selector?: string; // CSS selector for the section
  offset?: number; // offset from the top when scrolling to this section
}

export interface ScrollNavigationProps {
  sections?: ScrollNavSection[];
  position?: 'left' | 'right' | 'center';
  showBackToTop?: boolean;
  showDirectionalButtons?: boolean;
  className?: string;
  autoHide?: boolean;
  hideThreshold?: number;
}

export const ScrollNavigation: React.FC<ScrollNavigationProps> = ({
  sections = [],
  position = 'right',
  showBackToTop = true,
  showDirectionalButtons = true,
  className,
  autoHide = true,
  hideThreshold = 100
}) => {
  const {
    y,
    direction,
    progress,
    isScrolling,
    isAtTop,
    isAtBottom,
    scrollToTop,
    scrollToElement,
    scrollToPercent
  } = useCustomScroll();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(!autoHide);
  const [isMouseNearEdge, setIsMouseNearEdge] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update visibility based on scroll position
  useEffect(() => {
    if (autoHide) {
      setIsVisible(y > hideThreshold);
    }
  }, [y, autoHide, hideThreshold]);

  // Mouse position detection for edge hover
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const edgeThreshold = 80; // pixels from right edge
      const windowWidth = window.innerWidth;
      const mouseX = event.clientX;

      // Check if mouse is near the right edge
      const nearRightEdge = mouseX > windowWidth - edgeThreshold;
      setIsMouseNearEdge(nearRightEdge);
    };

    const handleMouseLeave = () => {
      setIsMouseNearEdge(false);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Track active section
  useEffect(() => {
    if (sections.length === 0) return;

    const checkActiveSection = () => {
      const scrollPosition = window.scrollY + 100; // offset for better UX

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.querySelector(section.selector || `#${section.id}`);

        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;

          if (scrollPosition >= elementTop) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    checkActiveSection();
    window.addEventListener('scroll', checkActiveSection, { passive: true });

    return () => window.removeEventListener('scroll', checkActiveSection);
  }, [sections]);

  const handleSectionClick = (section: ScrollNavSection) => {
    const selector = section.selector || `#${section.id}`;
    scrollToElement(selector, section.offset || -80);
  };

  const handleDirectionalScroll = (direction: 'up' | 'down') => {
    const viewportHeight = window.innerHeight;
    const currentScroll = window.scrollY;
    const scrollAmount = viewportHeight * 0.8; // 80% of viewport height

    if (direction === 'up') {
      scrollToPercent(Math.max(0, ((currentScroll - scrollAmount) / (document.documentElement.scrollHeight - window.innerHeight)) * 100));
    } else {
      scrollToPercent(Math.min(100, ((currentScroll + scrollAmount) / (document.documentElement.scrollHeight - window.innerHeight)) * 100));
    }
  };

  const positionClasses = {
    left: 'left-4',
    right: 'right-4',
    center: 'left-1/2 -translate-x-1/2'
  };

  // Combined visibility logic: 
  // Mobile: show when scrolled (no edge detection needed)
  // Desktop: show only if scrolled enough AND mouse is near edge (or position is not right)
  const shouldShow = isVisible && (isMobile || position !== 'right' || isMouseNearEdge);

  if (!shouldShow && autoHide) {
    return null;
  }

  return (
    <>
      {/* Invisible hover area for right edge detection - Desktop only */}
      {position === 'right' && (
        <div
          className="hidden md:block fixed top-0 right-0 bottom-0 w-20 z-30 bg-transparent"
          onMouseEnter={() => setIsMouseNearEdge(true)}
          onMouseLeave={() => setIsMouseNearEdge(false)}
        />
      )}

      <div
        className={cn(
          // Mobile: fixed bottom-right position (lifted above mobile bottom nav)
          'fixed bottom-20 right-4 z-40 flex flex-col items-center space-y-2',
          // Desktop: use position prop
          'md:top-1/2 md:-translate-y-1/2 md:bottom-auto',
          position === 'left' && 'md:left-4 md:right-auto',
          position === 'right' && 'md:right-4',
          position === 'center' && 'md:left-1/2 md:-translate-x-1/2 md:right-auto',
          'transition-all duration-700 ease-out',
          'transform-gpu will-change-transform',
          shouldShow
            ? 'opacity-100 translate-x-0 scale-100'
            : position === 'right'
              ? 'opacity-0 translate-x-6 scale-95'
              : position === 'left'
                ? 'opacity-0 -translate-x-6 scale-95'
                : 'opacity-0 translate-y-2 scale-95',
          className
        )}
        onMouseEnter={() => position === 'right' && setIsMouseNearEdge(true)}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Directional Scroll Up - Hidden on mobile */}
        {showDirectionalButtons && !isAtTop && (
          <button
            onClick={() => handleDirectionalScroll('up')}
            className={cn(
              'hidden md:block p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-primary/20',
              'hover:bg-primary hover:text-white transition-all duration-400',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'transform hover:scale-110 active:scale-95',
              isScrolling && direction === 'up' && 'bg-primary text-white'
            )}
            style={{
              transitionDelay: shouldShow ? '0.1s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            aria-label="Scroll up one section"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}

        {/* Section Navigation - Hidden on mobile */}
        {sections.length > 0 && (
          <div
            className="hidden md:flex flex-col items-center space-y-1 py-2 transition-all duration-500"
            style={{
              transitionDelay: shouldShow ? '0.2s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section)}
                className={cn(
                  'group relative p-1',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full'
                )}
                aria-label={`Scroll to ${section.label}`}
              >
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 transition-all duration-300',
                    'transform hover:scale-125 active:scale-95',
                    activeSection === section.id
                      ? 'bg-primary border-primary scale-110 shadow-lg shadow-primary/30'
                      : 'bg-white/90 border-primary/40 hover:border-primary hover:scale-105 hover:shadow-md'
                  )}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />

                {/* Section label tooltip */}
                <div
                  className={cn(
                    'absolute whitespace-nowrap bg-black/75 text-white text-xs px-2 py-1 rounded',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none',
                    position === 'left' ? 'left-full ml-3' : 'right-full mr-3',
                    'top-1/2 -translate-y-1/2'
                  )}
                >
                  {section.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Back to Top - Mobile optimized */}
        {showBackToTop && !isAtTop && (
          <button
            onClick={() => scrollToTop()}
            className={cn(
              'p-3 md:p-3 bg-primary text-white rounded-full shadow-lg',
              'hover:bg-primary/90 transition-all duration-400 transform hover:scale-110 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'hover:shadow-xl hover:shadow-primary/40',
              'w-12 h-12 md:w-auto md:h-auto flex items-center justify-center',
              progress > 80 && 'animate-pulse'
            )}
            style={{
              transitionDelay: shouldShow ? '0.3s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        {/* Directional Scroll Down - Hidden on mobile */}
        {showDirectionalButtons && !isAtBottom && (
          <button
            onClick={() => handleDirectionalScroll('down')}
            className={cn(
              'hidden md:block p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-primary/20',
              'hover:bg-primary hover:text-white transition-all duration-400',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'transform hover:scale-110 active:scale-95',
              isScrolling && direction === 'down' && 'bg-primary text-white'
            )}
            style={{
              transitionDelay: shouldShow ? '0.4s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            aria-label="Scroll down one section"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {/* Progress indicator - Hidden on mobile */}
        <div
          className="hidden md:block w-0.5 h-12 bg-primary/15 relative overflow-hidden rounded-full transition-all duration-500"
          style={{
            transitionDelay: shouldShow ? '0.5s' : '0s',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <div
            className="w-full bg-primary transition-all duration-700 ease-out rounded-full"
            style={{
              height: `${progress}%`,
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ScrollNavigation;