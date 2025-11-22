import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  size?: 'sm' | 'md';
  className?: string;
}

export default function ProductCardSkeleton({ size = 'sm', className = '' }: Props) {
  const isSmall = size === 'sm';

  return (
    <div className={`rounded-lg overflow-hidden shadow-card bg-white ${className}`}>
      {/* Image: keep same aspect ratio as real card */}
      <div className="w-full aspect-square bg-white">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Body */}
      <div className={`px-4 py-2 ${isSmall ? 'space-y-2' : 'space-y-3'}`}>
        {/* title lines */}
        <Skeleton className={`${isSmall ? 'h-3 w-3/4' : 'h-4 w-11/12'} rounded-sm`} />
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className={`${isSmall ? 'h-3 w-1/3' : 'h-4 w-1/2'} rounded-sm`} />
          </div>
          <div className="ml-3">
            <Skeleton className={`${isSmall ? 'h-5 w-16' : 'h-6 w-20'} rounded-sm`} />
          </div>
        </div>
      </div>
    </div>
  );
}
