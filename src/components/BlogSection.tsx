import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, FileText, ArrowRight } from 'lucide-react';
import { FadeInUp, FadeInScale } from '@/components/ui/ScrollAnimation';

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

export default function BlogSection() {
  const [latestBlogs, setLatestBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from('blogs' as never)
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          setLatestBlogs(data as unknown as BlogItem[]);
        }
      } catch (error) {
        console.error('Error fetching latest blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestBlogs();
  }, []);

  // Don't render section if no blogs available
  if (!loading && latestBlogs.length === 0) {
    return null;
  }

  return (
    <section id="blog-section" className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <FadeInUp duration={800} delay={100}>
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h2 className="text-3xl lg:text-4xl text-primary">
                Artikel Terbaru
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Dapatkan tips perawatan kucing, informasi nutrisi, dan artikel menarik lainnya dari para ahli
            </p>
          </div>
        </FadeInUp>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse rounded-xl">
                <CardHeader>
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-40 bg-muted rounded-xl"></div>
                    <div className="h-4 bg-muted rounded-lg w-full"></div>
                    <div className="h-4 bg-muted rounded-lg w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Blog Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {latestBlogs.map((blog, index) => (
                <FadeInScale
                  key={blog.id}
                  duration={600}
                  delay={200 + (index * 100)}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group rounded-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                          {new Date(blog.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-tight font-normal">
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="text-brand hover:text-brand/80 transition-colors duration-200 flex items-start gap-2"
                        >
                          <FileText className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{blog.title}</span>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cover Image */}
                      <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                        {blog.cover_url ? (
                          <img
                            src={blog.cover_url}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <span className="text-xs">No Cover</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Excerpt */}
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {blog.meta_description ||
                            blog.content.replace(/<[^>]*>/g, '').slice(0, 120) + '...'
                          }
                        </p>

                        {/* Read More Link */}
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 group/link"
                        >
                          <span>Baca Selengkapnya</span>
                          <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform duration-200" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInScale>
              ))}
            </div>

            {/* View All Blogs Button */}
            <FadeInUp duration={600} delay={500}>
              <div className="text-center">
                <Button asChild variant="blog-link" size="lg" className="group">
                  <Link to="/blog" className="gap-2 transition-all duration-200">
                    <BookOpen className="h-5 w-5" />
                    <span>Lihat Semua Artikel</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </Button>
              </div>
            </FadeInUp>
          </>
        )}
      </div>
    </section>
  );
}