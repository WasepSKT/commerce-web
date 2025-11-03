/**
 * SEO utilities for blog posts
 */

import { generateBlogPostStructuredData, generatePageTitle } from '@/utils/seoData';
import { createExcerpt } from '@/lib/textUtils';
import type { Database } from '@/types/supabase';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

export interface BlogSEOData {
  title: string;
  description: string;
  keywords: string;
  ogImage: string | null;
  canonical: string;
  structuredData: Record<string, unknown>[];
}

/**
 * Generate SEO data for blog post
 */
export function generateBlogPostSEO(
  post: BlogPost,
  breadcrumbData: Record<string, unknown>
): BlogSEOData {
  // Use auto-generated SEO data or fallback to manual generation
  const seoTitle = (post as any).meta_title || generatePageTitle(post.title);
  const seoDescription = post.meta_description || createExcerpt(post.content, 160);
  const seoKeywords =
    (post as any).meta_keywords ||
    `${post.title}, blog kucing, tips kucing, perawatan kucing, Regal Paw`;
  const seoOgImage = (post as any).og_image || post.cover_url;
  const seoCanonical = (post as any).canonical_url || `/blog/${post.slug}`;

  // Use auto-generated structured data or fallback to manual generation
  const structuredData = (post as any).seo_structured_data
    ? [(post as any).seo_structured_data]
    : [
        generateBlogPostStructuredData({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          cover_url: post.cover_url,
          created_at: post.created_at,
          updated_at: post.updated_at || post.created_at,
          author: 'Regal Paw Team',
          excerpt: seoDescription,
        }),
      ];

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    ogImage: seoOgImage,
    canonical: seoCanonical,
    structuredData: [...structuredData, breadcrumbData],
  };
}

