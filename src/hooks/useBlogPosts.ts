/**
 * Custom hook for fetching blog posts with category filtering
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase';
import { BLOG_STATUS } from '@/constants/blog';
import { resolveCategoryId } from '@/utils/blogUtils';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

export interface CategoryInfo {
  id: string;
  name: string;
}

export function useBlogPosts() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
  const { toast } = useToast();
  const location = useLocation();

  const fetchBlogPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Check if category filter present in URL
      const params = new URLSearchParams(location.search);
      const categoryParam = params.get('category');

      // Build base query for published blogs
      let blogQuery = supabase
        .from('blogs')
        .select('*')
        .eq('status', BLOG_STATUS.PUBLISHED)
        .order('created_at', { ascending: false });

      // Apply category filter if present
      if (categoryParam) {
        // Resolve category ID from slug or ID
        const catRow = await resolveCategoryId(categoryParam, supabase);
        const categoryId = catRow?.id ?? categoryParam;

        // Fetch blog IDs for this category
        const { data: mappingRows, error: mapErr } = await supabase
          .from('blog_categories')
          .select('blog_id')
          .eq('category_id', categoryId);

        if (!mapErr && mappingRows && mappingRows.length > 0) {
          const ids = (mappingRows as { blog_id: string }[]).map((r) => r.blog_id);
          blogQuery = blogQuery.in('id', ids);
        } else {
          // No posts for this category -> return empty
          setBlogPosts([]);
          setSelectedCategory(catRow || null);
          setLoading(false);
          return;
        }

        // Set selected category info
        if (catRow) {
          setSelectedCategory({ id: catRow.id, name: catRow.name });
        }
      } else {
        setSelectedCategory(null);
      }

      // Execute query
      const { data, error } = await blogQuery;
      if (error) throw error;

      setBlogPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat artikel',
        description: 'Terjadi kesalahan saat memuat artikel blog.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, location.search]);

  // Fetch posts on mount and when search params change
  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  return {
    blogPosts,
    loading,
    selectedCategory,
  };
}

