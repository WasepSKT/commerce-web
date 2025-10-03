import { useEffect, useState, useCallback, useRef } from 'react';

export interface ScrollState {
  x: number;
  y: number;
  direction: 'up' | 'down' | null;
  progress: number; // 0-100 percentage of page scroll
  isScrolling: boolean;
  isAtTop: boolean;
  isAtBottom: boolean;
}

export interface UseCustomScrollOptions {
  threshold?: number; // minimum scroll distance to detect direction
  debounceMs?: number; // debounce scroll events
  enableSmoothScroll?: boolean;
}

export function useCustomScroll(options: UseCustomScrollOptions = {}) {
  const {
    threshold = 10,
    debounceMs = 100,
    enableSmoothScroll = true
  } = options;

  const [scrollState, setScrollState] = useState<ScrollState>({
    x: 0,
    y: 0,
    direction: null,
    progress: 0,
    isScrolling: false,
    isAtTop: true,
    isAtBottom: false
  });

  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const ticking = useRef(false);

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
  }, []);

  const updateScrollState = useCallback(() => {
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    const progress = calculateProgress();
    
    let direction: 'up' | 'down' | null = null;
    if (Math.abs(currentScrollY - lastScrollY.current) > threshold) {
      direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;
    }

    const isAtTop = currentScrollY <= 10;
    const isAtBottom = progress >= 95;

    setScrollState({
      x: currentScrollX,
      y: currentScrollY,
      direction,
      progress,
      isScrolling: true,
      isAtTop,
      isAtBottom
    });

    // Clear scrolling state after debounce period
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      setScrollState(prev => ({ ...prev, isScrolling: false }));
    }, debounceMs);

    ticking.current = false;
  }, [threshold, debounceMs, calculateProgress]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollState);
      ticking.current = true;
    }
  }, [updateScrollState]);

  // Smooth scroll to position
  const scrollTo = useCallback((position: number, behavior: ScrollBehavior = 'smooth') => {
    if (enableSmoothScroll && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: position, behavior });
    } else {
      window.scrollTo(0, position);
    }
  }, [enableSmoothScroll]);

  // Scroll to element
  const scrollToElement = useCallback((
    element: HTMLElement | string,
    offset: number = 0,
    behavior: ScrollBehavior = 'smooth'
  ) => {
    const target = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element;
    
    if (target) {
      const targetPosition = target.getBoundingClientRect().top + window.scrollY + offset;
      scrollTo(targetPosition, behavior);
    }
  }, [scrollTo]);

  // Scroll to top
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollTo(0, behavior);
  }, [scrollTo]);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollTo(docHeight, behavior);
  }, [scrollTo]);

  // Scroll by percentage
  const scrollToPercent = useCallback((percent: number, behavior: ScrollBehavior = 'smooth') => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetPosition = (percent / 100) * docHeight;
    scrollTo(targetPosition, behavior);
  }, [scrollTo]);

  useEffect(() => {
    // Initialize scroll state
    updateScrollState();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add resize listener to recalculate progress
    const handleResize = () => {
      updateScrollState();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll, updateScrollState]);

  return {
    ...scrollState,
    scrollTo,
    scrollToElement,
    scrollToTop,
    scrollToBottom,
    scrollToPercent
  };
}

export default useCustomScroll;