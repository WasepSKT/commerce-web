/**
 * Responsive AOS utilities
 * Automatically adjusts AOS animations based on screen size
 */

export interface ResponsiveAosOptions {
  mobile: string;
  desktop: string;
  duration?: string;
  easing?: string;
  delay?: string;
}

/**
 * Get responsive AOS attributes based on current screen size
 */
export const getResponsiveAosProps = (options: ResponsiveAosOptions) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return {
    'data-aos': isMobile ? options.mobile : options.desktop,
    'data-aos-duration': options.duration || '700',
    'data-aos-easing': options.easing || 'ease-out-cubic',
    'data-aos-delay': options.delay || '100'
  };
};

/**
 * React hook for responsive AOS
 */
export const useResponsiveAos = (options: ResponsiveAosOptions) => {
  const [aosProps, setAosProps] = useState(() => getResponsiveAosProps(options));

  useEffect(() => {
    const updateAosProps = () => {
      setAosProps(getResponsiveAosProps(options));
    };

    // Update on resize
    window.addEventListener('resize', updateAosProps);
    
    // Initial update
    updateAosProps();

    return () => window.removeEventListener('resize', updateAosProps);
  }, [options]);

  return aosProps;
};

/**
 * Higher-order component for responsive AOS
 */
export const withResponsiveAos = <T extends object>(
  Component: React.ComponentType<T>,
  aosOptions: ResponsiveAosOptions
) => {
  return (props: T) => {
    const aosProps = useResponsiveAos(aosOptions);
    
    return React.createElement('div', aosProps, React.createElement(Component, props));
  };
};

import React, { useEffect, useState } from 'react';