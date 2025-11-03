/**
 * Blog grid card component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText } from 'lucide-react';
import { createExcerpt } from '@/lib/textUtils';
import { formatBlogDate } from '@/utils/blogUtils';
import { BLOG_MESSAGES } from '@/constants/blog';
import type { Database } from '@/types/supabase';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

interface BlogGridCardProps {
  post: BlogPost;
}

export default function BlogGridCard({ post }: BlogGridCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative">
        <img
          src={post.cover_url || '/placeholder.svg'}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <Badge
          className="absolute top-3 left-3 bg-white text-brand hover:bg-white/90"
        >
          {BLOG_MESSAGES.BLOG}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-lg leading-tight">
          <a
            href={`/blog/${post.slug}`}
            className="text-brand hover:text-brand/80 transition-colors duration-200 flex items-start gap-2"
          >
            <FileText className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{post.title}</span>
          </a>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {createExcerpt(post.content)}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {BLOG_MESSAGES.AUTHOR}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatBlogDate(post.created_at)}
            </div>
          </div>

          <a href={`/blog/${post.slug}`}>
            <Button
              variant="blog-link"
              size="sm"
              className="px-3 py-2"
            >
              {BLOG_MESSAGES.READ_SHORT}
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

