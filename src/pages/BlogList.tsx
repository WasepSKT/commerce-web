import { Layout } from '@/components/Layout';
import { BookOpen } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { pageSEOData, generateBreadcrumbStructuredData } from '@/utils/seoData';
import { useAuth } from '@/hooks/useAuth';
import { useBlogList } from '@/hooks/useBlogList';
import BlogListEmptyState from '@/components/blog/BlogListEmptyState';
import BlogListItem from '@/components/blog/BlogListItem';
import BlogListTabs from '@/components/blog/BlogListTabs';

export default function BlogList() {
  const { isAdmin } = useAuth();
  const { visible, tab, setTab } = useBlogList(isAdmin);

  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Blog', url: 'https://regalpaw.id/blog' }
  ]);

  return (
    <Layout>
      <SEOHead
        title={pageSEOData.blog.title}
        description={pageSEOData.blog.description}
        keywords={pageSEOData.blog.keywords}
        canonical="/blog"
        ogType="website"
        structuredData={breadcrumbData}
      />

      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <BookOpen className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Blog</h1>
          </div>
          <p className="text-muted-foreground">Artikel dan update terbaru dari Regal Paw</p>
        </div>

        {isAdmin && <BlogListTabs tab={tab} onTabChange={setTab} />}

        {visible.length === 0 ? (
          <BlogListEmptyState isAdmin={isAdmin} />
        ) : (
          <div className="grid gap-4 md:gap-6">
            {visible.map((post) => (
              <BlogListItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
