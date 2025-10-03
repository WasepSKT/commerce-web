import React from 'react';
import { cn } from '@/lib/utils';
import { useCustomScroll } from '@/hooks/useCustomScroll';

export interface CustomScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  enableCustomScrollbar?: boolean;
  smoothScroll?: boolean;
}

export const CustomScrollContainer: React.FC<CustomScrollContainerProps> = ({
  children,
  className,
  enableCustomScrollbar = true,
  smoothScroll = true
}) => {
  const { isScrolling, direction } = useCustomScroll();

  return (
    <div
      className={cn(
        'relative',
        smoothScroll && 'scroll-smooth',
        enableCustomScrollbar && [
          // Custom scrollbar styles
          'scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent',
          'hover:scrollbar-thumb-primary/50',
          // Webkit scrollbar styles
          '[&::-webkit-scrollbar]:w-2',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:bg-primary/30',
          '[&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-thumb:hover]:bg-primary/50',
          // Firefox scrollbar
          '[scrollbar-width:thin]',
          '[scrollbar-color:hsl(358_73%_28%/0.3)_transparent]'
        ],
        className
      )}
      data-scrolling={isScrolling}
      data-scroll-direction={direction}
    >
      {children}

      {/* Scroll indicator */}
      {isScrolling && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className={cn(
            'w-2 h-8 rounded-full transition-colors duration-200',
            direction === 'up' ? 'bg-blue-500' : 'bg-primary'
          )} />
        </div>
      )}
    </div>
  );
};

export default CustomScrollContainer;