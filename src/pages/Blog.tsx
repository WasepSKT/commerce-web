import { useState, useEffect, useCallback } from 'react';
import { BlogLayout } from '@/components/BlogLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, FileText, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createExcerpt } from '@/lib/textUtils';
import type { Database } from '@/integrations/supabase/types';
import { useLocation, useNavigate } from 'react-router-dom';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

export default function Blog() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);

  const fetchBlogPosts = useCallback(async () => {
    try {
      // Check if category filter present in URL
      const params = new URLSearchParams(location.search);
      const categoryParam = params.get('category');

      let blogQuery = supabase.from('blogs').select('*').eq('status', 'published').order('created_at', { ascending: false });

      if (categoryParam) {
        // Try to resolve categoryParam as slug first, otherwise assume id
        let catRow: { id: string; name: string } | null = null;
        try {
          const res = await supabase.from('categories').select('id,name').eq('slug', categoryParam).limit(1).single();
          catRow = res.data as { id: string; name: string } | null;
        } catch (err) {
          // ignore - catRow remains null
          catRow = null;
        }
        const categoryId = catRow?.id ?? categoryParam;

        // fetch blog ids for this category
        const { data: mappingRows, error: mapErr } = await supabase.from('blog_categories').select('blog_id').eq('category_id', categoryId);
        if (!mapErr && mappingRows && mappingRows.length > 0) {
          const ids = (mappingRows as { blog_id: string }[]).map((r) => r.blog_id);
          blogQuery = blogQuery.in('id', ids);
        } else {
          // no posts for this category -> return empty
          setBlogPosts([]);
          setLoading(false);
          // set selectedCategory name if possible
          if (catRow) setSelectedCategory({ id: catRow.id, name: catRow.name });
          return;
        }
        if (catRow) setSelectedCategory({ id: catRow.id, name: catRow.name });
      }

      const { data, error } = await blogQuery;
      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({ variant: 'destructive', title: 'Gagal memuat artikel', description: 'Terjadi kesalahan saat memuat artikel blog.' });
    } finally {
      setLoading(false);
    }
  }, [toast, location.search]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  // Watch location changes to refetch when query param changes
  useEffect(() => {
    fetchBlogPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  if (loading) {
    return (
      <BlogLayout title="Blog & Artikel">
        <div className="space-y-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Memuat artikel...</p>
          </div>
        </div>
      </BlogLayout>
    );
  }

  if (blogPosts.length === 0) {
    return (
      <BlogLayout title="Blog & Artikel">
        <div className="space-y-8">
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Belum Ada Artikel
            </h3>
            <p className="text-muted-foreground">
              Artikel blog sedang dalam tahap pengembangan. Silakan kembali lagi nanti!
            </p>
          </div>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout title="Blog & Artikel">
      <div className="space-y-8">
        {blogPosts.length > 0 && (
          <>
            {/* Featured Article */}
            <Card className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={blogPosts[0].cover_url || '/placeholder.svg'}
                    alt={blogPosts[0].title}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-2/3 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-brand border-brand">
                      Featured
                    </Badge>
                    <Badge variant="secondary">
                      Blog
                    </Badge>
                  </div>

                  <h2 className="text-2xl font-bold mb-3 text-brand hover:text-brand/80 transition-colors">
                    <a href={`/blog/${blogPosts[0].slug}`}>
                      {blogPosts[0].title}
                    </a>
                  </h2>

                  <p className="text-muted-foreground mb-4">
                    {createExcerpt(blogPosts[0].content)}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Admin
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(blogPosts[0].created_at)}
                      </div>
                    </div>

                    <a href={`/blog/${blogPosts[0].slug}`}>
                      <Button
                        variant="blog-link"
                        size="sm"
                        className="group"
                      >
                        Baca Selengkapnya
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Blog Posts Grid */}
            {blogPosts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogPosts.slice(1).map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <img
                        src={post.cover_url || '/placeholder.svg'}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge
                        className="absolute top-3 left-3 bg-white text-brand hover:bg-white/90"
                      >
                        Blog
                      </Badge>
                    </div>

                    <CardHeader>
                      <CardTitle className="text-lg leading-tight">
                        <a href={`/blog/${post.slug}`} className="text-brand hover:text-brand/80 transition-colors duration-200 flex items-start gap-2">
                          <FileText className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{post.title}</span>
                        </a>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {createExcerpt(post.content)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Admin
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.created_at)}
                          </div>
                        </div>

                        <a href={`/blog/${post.slug}`}>
                          <Button
                            variant="blog-link"
                            size="sm"
                            className="px-3 py-2"
                          >
                            Baca →
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More Button with filter info above */}
            <div className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedCategory && (
                    <>
                      <span className="text-base text-foreground">{selectedCategory.name}</span>
                      <button onClick={() => { navigate('/blog'); }} className="text-sm text-muted-foreground underline">Hapus filter</button>
                    </>
                  )}
                </div>
                <div />
              </div>

              <div className="flex justify-center">
                <Button variant="blog-link" size="lg" className="group gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Muat Lebih Banyak Artikel</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </BlogLayout>
  );
}