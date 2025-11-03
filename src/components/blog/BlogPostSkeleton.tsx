/**
 * Loading skeleton for blog post page
 */

import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export default function BlogPostSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Back Navigation Skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Article Header Skeleton */}
      <header className="space-y-4 md:space-y-6 mb-6 md:mb-8">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 md:h-12 w-full" />
          <Skeleton className="h-8 md:h-12 w-3/4" />
        </div>

        {/* Meta Info Skeleton */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Cover Image Skeleton */}
        <Skeleton className="w-full h-48 md:h-96 rounded-lg" />
      </header>

      {/* Article Content Skeleton */}
      <article className="space-y-4 prose prose-base md:prose-lg max-w-none">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>

      {/* Back to Blog CTA Skeleton */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
