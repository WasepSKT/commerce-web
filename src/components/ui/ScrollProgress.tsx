import React from 'react';
import { cn } from '@/lib/utils';
import { useCustomScroll } from '@/hooks/useCustomScroll';

export interface ScrollProgressProps {
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  interactive?: boolean;
  animationDuration?: number;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  position = 'top',
  thickness = 4,
  color = 'hsl(358, 73%, 28%)', // primary color
  backgroundColor = 'hsl(210, 40%, 96%)', // muted background
  showPercentage = false,
  interactive = true,
  animationDuration = 300
}) => {
  const { progress, scrollToPercent, isScrolling } = useCustomScroll();

  const isVertical = position === 'left' || position === 'right';

  const handleClick = (event: React.MouseEvent) => {
    if (!interactive) return;

    const rect = event.currentTarget.getBoundingClientRect();
    let clickPercent: number;

    if (isVertical) {
      clickPercent = ((event.clientY - rect.top) / rect.height) * 100;
    } else {
      clickPercent = ((event.clientX - rect.left) / rect.width) * 100;
    }

    scrollToPercent(Math.max(0, Math.min(100, clickPercent)));
  };

  const progressBarStyle: React.CSSProperties = {
    transition: `all ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    backgroundColor: color,
    ...(isVertical
      ? {
        height: `${progress}%`,
        width: '100%'
      }
      : {
        width: `${progress}%`,
        height: '100%'
      })
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor,
    ...(isVertical
      ? {
        width: thickness,
        height: '100vh',
        cursor: interactive ? 'pointer' : 'default'
      }
      : {
        height: thickness,
        width: '100%',
        cursor: interactive ? 'pointer' : 'default'
      })
  };

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    left: 'fixed top-0 left-0 bottom-0 z-50',
    right: 'fixed top-0 right-0 bottom-0 z-50'
  };

  return (
    <div
      className={cn(positionClasses[position], className)}
      style={containerStyle}
      onClick={handleClick}
      role={interactive ? 'progressbar' : undefined}
      aria-label={`Page scroll progress: ${Math.round(progress)}%`}
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'transition-all duration-300 ease-out',
          isScrolling && 'shadow-lg',
          interactive && 'hover:shadow-md'
        )}
        style={progressBarStyle}
      />

      {showPercentage && (
        <div
          className={cn(
            'absolute text-xs font-medium text-white bg-black/75 px-2 py-1 rounded pointer-events-none',
            'transition-opacity duration-200',
            isScrolling ? 'opacity-100' : 'opacity-0',
            isVertical
              ? position === 'left' ? 'left-full ml-2' : 'right-full mr-2'
              : position === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'
          )}
          style={{
            ...(isVertical
              ? { top: `${progress}%`, transform: 'translateY(-50%)' }
              : { left: `${progress}%`, transform: 'translateX(-50%)' })
          }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

export default ScrollProgress;