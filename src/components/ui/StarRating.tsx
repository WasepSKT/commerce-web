import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  className,
  interactive = false,
  onRatingChange
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          const isPartialFilled = starValue - 1 < rating && starValue > rating;

          return (
            <div
              key={index}
              className={cn(
                'relative',
                interactive && 'cursor-pointer hover:scale-110 transition-transform'
              )}
              onClick={() => handleStarClick(starValue)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200',
                  interactive && 'hover:fill-yellow-300 hover:text-yellow-300'
                )}
              />
              {isPartialFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${((rating - (starValue - 1)) * 100)}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'fill-yellow-400 text-yellow-400'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={cn('font-medium text-gray-700', textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface RatingDistributionProps {
  distribution: { [key: number]: number };
  totalReviews: number;
  className?: string;
}

export function RatingDistribution({ distribution, totalReviews, className }: RatingDistributionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 min-w-[60px]">
              <span className="text-gray-600">{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 rounded-full h-2 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-gray-500 min-w-[30px] text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}