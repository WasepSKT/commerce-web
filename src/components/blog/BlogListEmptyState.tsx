/**
 * Empty state component for blog list page
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import { BLOG_MESSAGES } from '@/constants/blog';

interface BlogListEmptyStateProps {
  isAdmin: boolean;
}

export default function BlogListEmptyState({ isAdmin }: BlogListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 relative w-48 h-48 mx-auto">
        {/* Primary Animation - CSS-based book animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Spinning ring */}
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            {/* Bouncing book icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary animate-bounce" />
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-8 left-8 w-3 h-3 bg-primary/30 rounded-full animate-ping"></div>
        <div className="absolute top-16 right-12 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-12 left-16 w-2 h-2 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-8 right-8 w-3 h-3 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>

        {/* Lottie Animation (will show if loads successfully) */}
        <dotlottie-wc
          src="https://lottie.host/embed/b4b36145-2c4f-4b4e-9b7f-8a9c7b2d1e5f/XdZY8r2Hq8.json"
          style={{
            width: '12rem',
            height: '12rem',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10
          }}
          autoplay
          loop
        ></dotlottie-wc>
      </div>
      <div className="space-y-2 mb-6">
        <h3 className="text-xl font-semibold text-primary">{BLOG_MESSAGES.NO_ARTICLES}</h3>
        <p className="text-muted-foreground max-w-md">
          {isAdmin ? BLOG_MESSAGES.NO_ARTICLES_ADMIN : BLOG_MESSAGES.NO_ARTICLES_USER}
        </p>
      </div>
      {isAdmin && (
        <Button asChild className="gap-2">
          <Link to="/admin/blogs">
            <Plus className="h-4 w-4" />
            {BLOG_MESSAGES.WRITE_FIRST}
          </Link>
        </Button>
      )}
    </div>
  );
}

