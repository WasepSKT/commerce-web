/**
 * Blog post header component with title, date, reading time, and cover image
 */

import { Calendar, Clock } from 'lucide-react';
import { formatBlogDate } from '@/utils/blogUtils';
import { calculateReadingTime } from '@/utils/blogUtils';
import type { Database } from '@/types/supabase';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

interface BlogPostHeaderProps {
  post: BlogPost;
}

export default function BlogPostHeader({ post }: BlogPostHeaderProps) {
  const readingTime = calculateReadingTime(post.content);

  return (
    <header className="space-y-4 md:space-y-6 mb-6 md:mb-8">
      <h1 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <time>{formatBlogDate(post.created_at)}</time>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{readingTime} menit baca</span>
        </div>
      </div>

      {post.cover_url && (
        <div className="rounded-lg overflow-hidden shadow-md">
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-48 md:h-96 object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
    </header>
  );
}

