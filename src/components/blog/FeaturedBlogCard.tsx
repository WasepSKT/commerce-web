/**
 * Featured blog card component
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { createExcerpt } from '@/lib/textUtils';
import { formatBlogDate } from '@/utils/blogUtils';
import { BLOG_MESSAGES } from '@/constants/blog';
import type { Database } from '@/types/supabase';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

interface FeaturedBlogCardProps {
  post: BlogPost;
}

export default function FeaturedBlogCard({ post }: FeaturedBlogCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3">
          <img
            src={post.cover_url || '/placeholder.svg'}
            alt={post.title}
            className="w-full h-48 md:h-full object-cover"
          />
        </div>
        <div className="md:w-2/3 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-brand border-brand">
              {BLOG_MESSAGES.FEATURED}
            </Badge>
            <Badge variant="secondary">
              {BLOG_MESSAGES.BLOG}
            </Badge>
          </div>

          <h2 className="text-2xl font-bold mb-3 text-brand hover:text-brand/80 transition-colors">
            <a href={`/blog/${post.slug}`}>
              {post.title}
            </a>
          </h2>

          <p className="text-muted-foreground mb-4">
            {createExcerpt(post.content)}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {BLOG_MESSAGES.AUTHOR}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatBlogDate(post.created_at)}
              </div>
            </div>

            <a href={`/blog/${post.slug}`}>
              <Button
                variant="blog-link"
                size="sm"
                className="group"
              >
                <span className="block md:hidden">{BLOG_MESSAGES.READ}</span>
                <span className="hidden md:block">{BLOG_MESSAGES.READ_MORE}</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}

