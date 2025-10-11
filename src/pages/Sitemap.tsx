import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const SitemapPage = () => {
  const [sitemap, setSitemap] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    try {
      const urls: SitemapUrl[] = [];
      const baseUrl = 'https://regalpaw.id';

      // Static pages
      const staticPages = [
        { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
        { loc: '/about', changefreq: 'monthly' as const, priority: 0.8 },
        { loc: '/products', changefreq: 'daily' as const, priority: 0.9 },
        { loc: '/blog', changefreq: 'daily' as const, priority: 0.8 },
        { loc: '/contact', changefreq: 'monthly' as const, priority: 0.7 },
        { loc: '/career', changefreq: 'weekly' as const, priority: 0.6 },
        { loc: '/career/openings', changefreq: 'weekly' as const, priority: 0.6 },
        { loc: '/career/benefits', changefreq: 'monthly' as const, priority: 0.5 },
        { loc: '/terms', changefreq: 'yearly' as const, priority: 0.3 },
        { loc: '/privacy', changefreq: 'yearly' as const, priority: 0.3 },
        { loc: '/case-studies', changefreq: 'monthly' as const, priority: 0.6 },
        { loc: '/reviews', changefreq: 'weekly' as const, priority: 0.7 },
        { loc: '/updates', changefreq: 'weekly' as const, priority: 0.6 }
      ];

      // Add static pages
      staticPages.forEach(page => {
        urls.push({
          ...page,
          lastmod: new Date().toISOString().split('T')[0]
        });
      });

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, updated_at')
        .eq('is_active', true);

      if (!productsError && products) {
        products.forEach(product => {
          urls.push({
            loc: `/product/${product.id}`,
            lastmod: new Date(product.updated_at).toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.8
          });
        });
      }

      // Fetch blog posts
      const { data: blogPosts, error: blogError } = await supabase
        .from('blogs')
        .select('slug, updated_at')
        .eq('status', 'published');

      if (!blogError && blogPosts) {
        blogPosts.forEach(post => {
          urls.push({
            loc: `/blog/${post.slug}`,
            lastmod: new Date(post.updated_at).toISOString().split('T')[0],
            changefreq: 'monthly',
            priority: 0.7
          });
        });
      }

      // Generate XML sitemap
      const sitemapXml = generateSitemapXML(urls, baseUrl);
      setSitemap(sitemapXml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSitemapXML = (urls: SitemapUrl[], baseUrl: string): string => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = '</urlset>';

    const urlEntries = urls.map(url => {
      return `
  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
    }).join('');

    return `${xmlHeader}
${urlsetOpen}${urlEntries}
${urlsetClose}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <pre className="text-xs overflow-auto p-4">
        {sitemap}
      </pre>
    </div>
  );
};

export default SitemapPage;

