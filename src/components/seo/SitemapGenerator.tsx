import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

interface SitemapGeneratorProps {
  baseUrl?: string;
}

const SitemapGenerator: React.FC<SitemapGeneratorProps> = ({
  baseUrl = 'https://regalpaw.id'
}) => {
  const [sitemap, setSitemap] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSitemap();
  }, [baseUrl]);

  const generateSitemap = async () => {
    try {
      const urls: SitemapUrl[] = [];

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

  const downloadSitemap = () => {
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Sitemap Generator</h2>
        <p className="text-gray-600 mb-4">
          Generated sitemap with {sitemap.split('<url>').length - 1} URLs
        </p>
        <button
          onClick={downloadSitemap}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Download Sitemap
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <pre className="text-xs overflow-auto max-h-96">
          {sitemap}
        </pre>
      </div>
    </div>
  );
};

export default SitemapGenerator;

