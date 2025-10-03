import React, { useEffect, useState } from 'react';

// Type for AOS global object
declare global {
  interface Window {
    AOS?: {
      refresh: () => void;
    };
  }
}

interface ResponsiveAOSProps {
  children: React.ReactNode;
  mobileAnimation?: string;
  desktopAnimation?: string;
  duration?: string;
  easing?: string;
  delay?: string;
  className?: string;
}

const ResponsiveAOS: React.FC<ResponsiveAOSProps> = ({
  children,
  mobileAnimation = 'fade-up',
  desktopAnimation,
  duration = '700',
  easing = 'ease-out-cubic',
  delay = '100',
  className = ''
}) => {
  const [currentAnimation, setCurrentAnimation] = useState(() => {
    // Initial state based on current screen size
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      return isMobile ? mobileAnimation : (desktopAnimation || mobileAnimation);
    }
    return mobileAnimation; // Default for SSR
  });

  useEffect(() => {
    const updateAnimation = () => {
      const isMobile = window.innerWidth < 768;
      const newAnimation = isMobile ? mobileAnimation : (desktopAnimation || mobileAnimation);
      setCurrentAnimation(newAnimation);

      // Refresh AOS to recognize the new animation
      if (typeof window !== 'undefined' && window.AOS) {
        window.AOS.refresh();
      }
    };

    // Initial check after component mounts
    updateAnimation();

    // Listen for resize events
    window.addEventListener('resize', updateAnimation);

    return () => window.removeEventListener('resize', updateAnimation);
  }, [mobileAnimation, desktopAnimation]);

  // Refresh AOS when currentAnimation changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.refresh();
    }
  }, [currentAnimation]);

  return (
    <div
      className={className}
      data-aos={currentAnimation}
      data-aos-duration={duration}
      data-aos-easing={easing}
      data-aos-delay={delay}
    >
      {children}
    </div>
  );
};

export default ResponsiveAOS;