/**
 * Custom hook for fetching blog post by slug
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import { BLOG_STATUS } from '@/constants/blog';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

export function useBlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('slug', slug)
          .eq('status', BLOG_STATUS.PUBLISHED)
          .single();

        if (error) throw error;
        setPost((data ?? null) as BlogPost | null);
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  return {
    post,
    loading,
  };
}

