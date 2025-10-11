import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/seo/SEOHead';
import { generateBlogPostStructuredData, generateBreadcrumbStructuredData, generatePageTitle } from '@/utils/seoData';

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  content: string;
  cover_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  // SEO fields (auto-generated)
  meta_title?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  seo_structured_data?: Record<string, unknown>;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase
        .from('blogs' as never)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single() as unknown as Promise<{ data: BlogItem | null }>);
      setPost(data ?? null);
    };
    load();
  }, [slug]);

  // Generate excerpt from content
  const generateExcerpt = (content: string, maxLength: number = 160) => {
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length <= maxLength ? textContent : textContent.substring(0, maxLength) + '...';
  };

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl py-12">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">Memuat artikel...</div>
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const readingTime = Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, '').length / 200));

  // Use auto-generated SEO data or fallback to manual generation
  const seoTitle = post.meta_title || generatePageTitle(post.title);
  const seoDescription = post.meta_description || generateExcerpt(post.content);
  const seoKeywords = post.meta_keywords || `${post.title}, blog kucing, tips kucing, perawatan kucing, Regal Paw`;
  const seoOgImage = post.og_image || post.cover_url;
  const seoCanonical = post.canonical_url || `/blog/${post.slug}`;

  // Use auto-generated structured data or fallback to manual generation
  const structuredData = post.seo_structured_data ?
    [post.seo_structured_data] :
    [generateBlogPostStructuredData({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      cover_url: post.cover_url,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: 'Regal Paw Team',
      excerpt: seoDescription
    })];

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Beranda', url: 'https://regalpaw.id/' },
    { name: 'Blog', url: 'https://regalpaw.id/blog' },
    { name: post.title, url: `https://regalpaw.id/blog/${post.slug}` }
  ]);

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={seoCanonical}
        ogType="article"
        ogImage={seoOgImage}
        structuredData={[...structuredData, breadcrumbData]}
      />

      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Back Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Blog
            </Link>
          </Button>
        </div>

        {/* Article Header */}
        <header className="space-y-4 md:space-y-6 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time>{new Date(post.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</time>
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

        {/* Article Content */}
        <article
          className="prose prose-base md:prose-lg max-w-none blog-editor-content px-1 md:px-0"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Back to Blog CTA */}
        <div className="mt-12 pt-8 border-t text-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4" />
              Baca Artikel Lainnya
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}


