/**
 * Navigation components for blog post page
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BLOG_ROUTES } from '@/constants/blog';

interface BlogPostNavigationProps {
  variant?: 'top' | 'bottom';
}

export default function BlogPostNavigation({ variant = 'top' }: BlogPostNavigationProps) {
  if (variant === 'top') {
    return (
      <div className="mb-8">
        <Button variant="ghost" asChild className="gap-2">
          <Link to={BLOG_ROUTES.HOME}>
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Blog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t text-center">
      <Button asChild size="lg" className="gap-2">
        <Link to={BLOG_ROUTES.HOME}>
          <ArrowLeft className="h-4 w-4" />
          Baca Artikel Lainnya
        </Link>
      </Button>
    </div>
  );
}

