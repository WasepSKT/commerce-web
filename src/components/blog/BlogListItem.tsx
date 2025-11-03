/**
 * Blog list item card component
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, ArrowRight } from 'lucide-react';
import { formatBlogDateShort } from '@/utils/blogUtils';
import { BLOG_MESSAGES, BLOG_STATUS } from '@/constants/blog';
import type { Database } from '@/types/supabase';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

interface BlogListItemProps {
  post: BlogPost;
}

export default function BlogListItem({ post }: BlogListItemProps) {
  const excerpt = post.meta_description || post.content.replace(/<[^>]*>/g, '').slice(0, 200) + '...';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-2">
        <CardTitle className="text-lg md:text-xl">
          <Link
            to={`/blog/${post.slug}`}
            className="text-brand hover:text-brand/80 transition-colors duration-200 flex items-center gap-2"
          >
            <FileText className="h-5 w-5 text-brand hidden md:block" />
            {post.title}
          </Link>
        </CardTitle>
        <div className="flex items-center gap-2 text-sm md:text-base">
          {post.status === BLOG_STATUS.DRAFT && (
            <Badge variant="secondary">{BLOG_MESSAGES.DRAFT}</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatBlogDateShort(post.created_at)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="w-full md:w-32 h-48 md:h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {post.cover_url ? (
              <img
                src={post.cover_url}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="text-xs text-muted-foreground text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                {BLOG_MESSAGES.NO_COVER}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="line-clamp-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {excerpt}
            </div>
            <Button asChild variant="blog-link" size="sm" className="group w-full md:w-auto">
              <Link to={`/blog/${post.slug}`}>
                <BookOpen className="h-4 w-4" />
                {BLOG_MESSAGES.READ_MORE}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

