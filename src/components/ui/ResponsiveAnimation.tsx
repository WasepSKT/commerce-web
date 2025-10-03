import React from 'react';

interface ResponsiveAnimationProps {
  children: React.ReactNode;
  mobileAnimation?: string;
  desktopAnimation?: string;
  duration?: string;
  easing?: string;
  delay?: string;
  className?: string;
}

const ResponsiveAnimation: React.FC<ResponsiveAnimationProps> = ({
  children,
  mobileAnimation = 'fade-up',
  desktopAnimation = 'fade-right',
  duration = '700',
  easing = 'ease-out-cubic',
  delay = '100',
  className = ''
}) => {
  return (
    <>
      {/* Mobile version */}
      <div
        className={`block md:hidden ${className}`}
        data-aos={mobileAnimation}
        data-aos-duration={duration}
        data-aos-easing={easing}
        data-aos-delay={delay}
      >
        {children}
      </div>

      {/* Desktop version */}
      <div
        className={`hidden md:block ${className}`}
        data-aos={desktopAnimation}
        data-aos-duration={duration}
        data-aos-easing={easing}
        data-aos-delay={delay}
      >
        {children}
      </div>
    </>
  );
};

export default ResponsiveAnimation;