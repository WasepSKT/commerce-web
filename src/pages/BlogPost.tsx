import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  content: string;
  cover_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
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

  // Update page title and meta description for SEO
  useEffect(() => {
    if (post) {
      document.title = `${post.title} - Regal Purrfect Shop`;

      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', post.meta_description ||
        `${post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...`);
    }

    return () => {
      // Reset to default title when component unmounts
      document.title = 'Regal Purrfect Shop';
    };
  }, [post]);

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

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-8">
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
        <header className="space-y-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
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
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <article
          className="prose prose-lg max-w-none blog-editor-content"
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


