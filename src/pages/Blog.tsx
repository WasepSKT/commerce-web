import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { BlogLayout } from '@/components/BlogLayout';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import BlogSkeleton from '@/components/blog/BlogSkeleton';
import BlogEmptyState from '@/components/blog/BlogEmptyState';
import FeaturedBlogCard from '@/components/blog/FeaturedBlogCard';
import BlogGridCard from '@/components/blog/BlogGridCard';
import { BLOG_MESSAGES, BLOG_ROUTES } from '@/constants/blog';

export default function Blog() {
  const { blogPosts, loading, selectedCategory } = useBlogPosts();
  const navigate = useNavigate();

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Blog', url: 'https://regalpaw.id/blog' }
  ]);

  if (loading) {
    return (
      <BlogLayout title="Blog & Artikel">
        <BlogSkeleton />
      </BlogLayout>
    );
  }

  if (blogPosts.length === 0) {
    return (
      <BlogLayout title="Blog & Artikel">
        <BlogEmptyState />
      </BlogLayout>
    );
  }

  return (
    <BlogLayout title="Blog & Artikel">
      <SEOHead
        title="Blog & Artikel - Regal Paw"
        description="Temukan tips, informasi, dan panduan lengkap tentang perawatan dan kesehatan kucing dari para ahli Regal Paw. Artikel terbaru tentang nutrisi kucing dan tips perawatan."
        keywords="blog kucing, tips kesehatan kucing, perawatan kucing, informasi kucing, panduan kucing, Regal Paw"
        canonical="/blog"
        ogType="website"
        structuredData={breadcrumbData}
      />

      <div className="space-y-8">
        {/* Featured Article */}
        {blogPosts.length > 0 && (
          <FeaturedBlogCard post={blogPosts[0]} />
        )}

        {/* Blog Posts Grid */}
        {blogPosts.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogPosts.slice(1).map((post) => (
              <BlogGridCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Category Filter and Load More */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {selectedCategory && (
                <>
                  <span className="text-base text-foreground">{selectedCategory.name}</span>
                  <button
                    onClick={() => navigate(BLOG_ROUTES.HOME)}
                    className="text-sm text-muted-foreground underline"
                  >
                    {BLOG_MESSAGES.REMOVE_FILTER}
                  </button>
                </>
              )}
            </div>
            <div />
          </div>

          <div className="flex justify-center">
            <Button variant="blog-link" size="lg" className="group gap-2">
              <BookOpen className="h-5 w-5" />
              <span>{BLOG_MESSAGES.LOAD_MORE}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
        </div>
      </div>
    </BlogLayout>
  );
}
