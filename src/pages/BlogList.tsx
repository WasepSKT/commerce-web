import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { BookOpen, FileText, Plus, ArrowRight } from 'lucide-react';

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

export default function BlogList() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<BlogItem[]>([]);
  const [tab, setTab] = useState<'published' | 'draft'>('published');

  useEffect(() => {
    const load = async () => {
      const query = supabase
        .from('blogs' as never)
        .select('*')
        .order('created_at', { ascending: false });
      const { data, error } = isAdmin
        ? await query
        : await query.eq('status', 'published');
      if (!error) setItems((data as unknown as BlogItem[]) ?? []);
    };
    load();
  }, [isAdmin]);

  const visible = useMemo(() => {
    return isAdmin ? items.filter(i => i.status === tab) : items;
  }, [items, isAdmin, tab]);

  // Empty state component with animation
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 relative w-48 h-48 mx-auto">
        {/* Primary Animation - CSS-based book animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Spinning ring */}
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            {/* Bouncing book icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary animate-bounce" />
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-8 left-8 w-3 h-3 bg-primary/30 rounded-full animate-ping"></div>
        <div className="absolute top-16 right-12 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-12 left-16 w-2 h-2 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-8 right-8 w-3 h-3 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>

        {/* Lottie Animation (will show if loads successfully) */}
        <dotlottie-wc
          src="https://lottie.host/embed/b4b36145-2c4f-4b4e-9b7f-8a9c7b2d1e5f/XdZY8r2Hq8.json"
          style={{
            width: '12rem',
            height: '12rem',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10
          }}
          autoplay
          loop
        ></dotlottie-wc>
      </div>
      <div className="space-y-2 mb-6">
        <h3 className="text-xl font-semibold text-primary">Belum Ada Artikel</h3>
        <p className="text-muted-foreground max-w-md">
          {isAdmin
            ? 'Mulai menulis artikel pertama Anda untuk dibagikan dengan pengunjung'
            : 'Artikel sedang dalam persiapan. Kembali lagi nanti untuk membaca konten menarik!'
          }
        </p>
      </div>
      {isAdmin && (
        <Button asChild className="gap-2">
          <Link to="/admin/blogs">
            <Plus className="h-4 w-4" />
            Tulis Artikel Pertama
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Blog</h1>
          </div>
          <p className="text-muted-foreground">Artikel dan update terbaru dari Regal Paw</p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-md text-sm ${tab === 'published' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              onClick={() => setTab('published')}
            >Published</button>
            <button
              className={`px-3 py-1 rounded-md text-sm ${tab === 'draft' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              onClick={() => setTab('draft')}
            >Draft</button>
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6">
            {visible.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-brand hover:text-brand/80 transition-colors duration-200 flex items-center gap-2"
                    >
                      <FileText className="h-5 w-5 text-brand" />
                      {post.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {post.status === 'draft' && <Badge variant="secondary">Draft</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {post.cover_url ? (
                        <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs text-muted-foreground text-center">
                          <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                          No Cover
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                        {post.meta_description ||
                          post.content.replace(/<[^>]*>/g, '').slice(0, 200) + '...'
                        }
                      </div>
                      <Button asChild variant="blog-link" size="sm" className="group">
                        <Link to={`/blog/${post.slug}`}>
                          <BookOpen className="h-4 w-4" />
                          Baca Selengkapnya
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}


