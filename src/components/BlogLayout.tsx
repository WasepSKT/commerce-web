import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { LeftFixedBanner, RightFixedBanner } from '@/components/FixedBannerDisplay';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

interface LatestPost {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}

interface BlogLayoutProps {
  children: ReactNode;
  title?: string;
  showBanners?: boolean;
}

export function BlogLayout({ children, title = 'Blog', showBanners = true }: BlogLayoutProps) {
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string; slug?: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const fetchLatestPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setLatestPosts(data || []);
    } catch (error) {
      console.error('Error fetching latest posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestPosts();
  }, [fetchLatestPosts]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const { data, error } = await supabase.from('categories').select('id, name, slug').order('name', { ascending: true });
      if (error) throw error;
      setCategories(data ?? []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const formatDate = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - postDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 hari yang lalu';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    return `${Math.floor(diffDays / 30)} bulan yang lalu`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-brand text-center">
            {title}
          </h1>
          <p className="text-muted-foreground text-center">
            Artikel dan tips seputar perawatan kucing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Fixed Banner */}
          {showBanners && (
            <div className="lg:col-span-2">
              <div className="sticky top-4">
                <LeftFixedBanner className="mb-6" />

                {/* Additional sidebar content can go here */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-brand">Kategori Populer</h3>
                    <div className="space-y-2 text-sm">
                      {categoriesLoading ? (
                        <div className="text-sm text-muted-foreground">Memuat kategori...</div>
                      ) : categories.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Belum ada kategori</div>
                      ) : (
                        // show up to 8 categories
                        categories.slice(0, 8).map((cat) => (
                          <a
                            key={cat.id}
                            href={`/blog?category=${encodeURIComponent(cat.slug || cat.id)}`}
                            className="block text-muted-foreground hover:text-brand transition-colors"
                          >
                            {cat.name}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={`${showBanners ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            {children}
          </div>

          {/* Right Sidebar - Fixed Banner */}
          {showBanners && (
            <div className="lg:col-span-2">
              <div className="sticky top-4">
                <RightFixedBanner className="mb-6" />

                {/* Additional sidebar content can go here */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-brand">Artikel Terbaru</h3>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                              <div className="animate-pulse">
                                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : latestPosts.length > 0 ? (
                        latestPosts.map((post) => (
                          <div key={post.id} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                            <a href={`/blog/${post.slug}`} className="block">
                              <h4 className="text-sm font-medium text-brand hover:text-brand/80 transition-colors line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(post.created_at)}
                              </p>
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Belum ada artikel
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-brand">Newsletter</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Dapatkan tips perawatan kucing terbaru
                    </p>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email Anda"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                      />
                      <button className="w-full bg-brand text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-brand/90 transition-colors">
                        Berlangganan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}