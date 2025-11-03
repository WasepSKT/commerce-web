import { Layout } from '@/components/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';
import { useBlogPost } from '@/hooks/useBlogPost';
import { generateBlogPostSEO } from '@/utils/blogSEOUtils';
import BlogPostSkeleton from '@/components/blog/BlogPostSkeleton';
import BlogPostHeader from '@/components/blog/BlogPostHeader';
import BlogPostNavigation from '@/components/blog/BlogPostNavigation';

export default function BlogPost() {
  const { post, loading } = useBlogPost();

  if (loading || !post) {
    return (
      <Layout>
        <BlogPostSkeleton />
      </Layout>
    );
  }

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Blog', url: 'https://regalpaw.id/blog' },
    { name: post.title, url: `https://regalpaw.id/blog/${post.slug}` }
  ]);

  // Generate SEO data
  const seoData = generateBlogPostSEO(post, breadcrumbData);

  return (
    <Layout>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical={seoData.canonical}
        ogType="article"
        ogImage={seoData.ogImage}
        structuredData={seoData.structuredData}
      />

      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Back Navigation */}
        <BlogPostNavigation variant="top" />

        {/* Article Header */}
        <BlogPostHeader post={post} />

        {/* Article Content */}
        <article
          className="prose prose-base md:prose-lg max-w-none blog-editor-content px-1 md:px-0"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Back to Blog CTA */}
        <BlogPostNavigation variant="bottom" />
      </div>
    </Layout>
  );
}
