/**
 * Empty state component for blog page when no posts available
 */

import { BLOG_MESSAGES } from '@/constants/blog';

export default function BlogEmptyState() {
  return (
    <div className="space-y-8">
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">
          {BLOG_MESSAGES.NO_ARTICLES}
        </h3>
        <p className="text-muted-foreground">
          {BLOG_MESSAGES.NO_ARTICLES_DESC}
        </p>
      </div>
    </div>
  );
}

