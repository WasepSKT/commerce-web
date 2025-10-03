/* eslint-disable react-refresh/only-export-components */
import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AnimationType =
  | 'fade'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'rotate'
  | 'flip'
  | 'parallax';

export interface ScrollAnimationProps {
  children: ReactNode;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  threshold?: number; // intersection ratio to trigger animation (0-1)
  rootMargin?: string;
  className?: string;
  triggerOnce?: boolean;
  parallaxSpeed?: number; // for parallax effect (-1 to 1, negative for reverse)
  customAnimation?: {
    initial: React.CSSProperties;
    animate: React.CSSProperties;
  };
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  animation = 'fade',
  duration = 600,
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px',
  className,
  triggerOnce = true,
  parallaxSpeed = 0.5,
  customAnimation
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  // Animation configurations
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideUp: {
      initial: { opacity: 0, transform: 'translateY(50px)' },
      animate: { opacity: 1, transform: 'translateY(0px)' }
    },
    slideDown: {
      initial: { opacity: 0, transform: 'translateY(-50px)' },
      animate: { opacity: 1, transform: 'translateY(0px)' }
    },
    slideLeft: {
      initial: { opacity: 0, transform: 'translateX(50px)' },
      animate: { opacity: 1, transform: 'translateX(0px)' }
    },
    slideRight: {
      initial: { opacity: 0, transform: 'translateX(-50px)' },
      animate: { opacity: 1, transform: 'translateX(0px)' }
    },
    scale: {
      initial: { opacity: 0, transform: 'scale(0.8)' },
      animate: { opacity: 1, transform: 'scale(1)' }
    },
    rotate: {
      initial: { opacity: 0, transform: 'rotate(-10deg) scale(0.9)' },
      animate: { opacity: 1, transform: 'rotate(0deg) scale(1)' }
    },
    flip: {
      initial: { opacity: 0, transform: 'perspective(400px) rotateY(-90deg)' },
      animate: { opacity: 1, transform: 'perspective(400px) rotateY(0deg)' }
    },
    parallax: {
      initial: { transform: 'translateY(0px)' },
      animate: { transform: `translateY(${parallaxOffset}px)` }
    }
  };

  const currentAnimation = customAnimation || animations[animation];

  // Intersection Observer for scroll detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;

        if (isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce && !hasTriggered) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  // Parallax scroll effect
  useEffect(() => {
    if (animation !== 'parallax') return;

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const windowCenter = windowHeight / 2;

      // Calculate offset based on distance from center
      const distance = (elementCenter - windowCenter) / windowHeight;
      const offset = distance * parallaxSpeed * 100;

      setParallaxOffset(offset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [animation, parallaxSpeed]);

  const shouldAnimate = animation === 'parallax' || (isVisible || hasTriggered);
  const animationStyle = shouldAnimate ? currentAnimation.animate : currentAnimation.initial;

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all ease-out',
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        ...animationStyle
      }}
    >
      {children}
    </div>
  );
};

// Higher-order component for easier usage
export const withScrollAnimation = (
  Component: React.ComponentType<Record<string, unknown>>,
  animationProps?: Partial<ScrollAnimationProps>
) => {
  const WrappedComponent = React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => (
    <ScrollAnimation {...animationProps}>
      <div ref={ref}>
        <Component {...props} />
      </div>
    </ScrollAnimation>
  ));

  WrappedComponent.displayName = `withScrollAnimation(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

// Predefined animation variants for common use cases
export const FadeInUp: React.FC<Omit<ScrollAnimationProps, 'animation'>> = (props) => (
  <ScrollAnimation {...props} animation="slideUp" />
);

export const FadeInLeft: React.FC<Omit<ScrollAnimationProps, 'animation'>> = (props) => (
  <ScrollAnimation {...props} animation="slideLeft" />
);

export const FadeInRight: React.FC<Omit<ScrollAnimationProps, 'animation'>> = (props) => (
  <ScrollAnimation {...props} animation="slideRight" />
);

// Responsive components that adapt based on screen size
export const ResponsiveFadeInLeft: React.FC<Omit<ScrollAnimationProps, 'animation'>> = (props) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Initial check for mobile during component initialization
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false; // Default to desktop during SSR
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check after component mounts
    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <ScrollAnimation {...props} animation={isMobile ? 'slideUp' : 'slideLeft'} />
  );
};

export const ResponsiveFadeInRight: React.FC<Omit<ScrollAnimationProps, 'animation'>> = (props) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Initial check for mobile during component initialization
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false; // Default to desktop during SSR
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check after component mounts
    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <ScrollAnimation {...props} animation={isMobile ? 'slideUp' : 'slideRight'} />
  );
};

export const FadeInScale: React.FC<Omit<ScrollAnimationProps, 'animation'>> = (props) => (
  <ScrollAnimation {...props} animation="scale" />
);

export const ParallaxScroll: React.FC<Omit<ScrollAnimationProps, 'animation'>> = (props) => (
  <ScrollAnimation {...props} animation="parallax" />
);

// Hook for manual scroll animation control
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold]);

  return { ref: elementRef, isVisible };
};

export default ScrollAnimation;