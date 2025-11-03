/**
 * Loading skeleton for blog page
 */

import { Skeleton } from '@/components/ui/skeleton';
import { BLOG_MESSAGES } from '@/constants/blog';

export default function BlogSkeleton() {
  return (
    <div className="space-y-8">
      {/* Featured skeleton */}
      <div className="md:flex md:gap-6">
        <div className="md:w-1/3">
          <Skeleton className="w-full h-48 md:h-full rounded-lg" />
        </div>
        <div className="md:w-2/3 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>

      {/* Grid skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="w-full h-40 rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      <p className="sr-only">{BLOG_MESSAGES.LOADING}</p>
    </div>
  );
}

