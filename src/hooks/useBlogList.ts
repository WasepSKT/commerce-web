/**
 * Custom hook for fetching and filtering blog list
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import { BLOG_STATUS } from '@/constants/blog';

type BlogPost = Database['public']['Tables']['blogs']['Row'];

export type BlogListTab = 'published' | 'draft';

export function useBlogList(isAdmin: boolean) {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [tab, setTab] = useState<BlogListTab>('published');

  useEffect(() => {
    const load = async () => {
      const query = supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = isAdmin
        ? await query
        : await query.eq('status', BLOG_STATUS.PUBLISHED);

      if (!error) {
        setItems((data ?? []) as BlogPost[]);
      }
    };
    void load();
  }, [isAdmin]);

  const visible = useMemo(() => {
    return isAdmin ? items.filter((i) => i.status === tab) : items;
  }, [items, isAdmin, tab]);

  return {
    items,
    visible,
    tab,
    setTab,
  };
}

