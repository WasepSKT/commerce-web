import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type BlogStatus = 'draft' | 'published';

export interface BlogForm {
  title: string;
  slug: string;
  meta_description: string;
  content: string; // HTML from TipTap
  coverFile: File | null;
  cover_url: string;
  status: BlogStatus;
  categories?: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  content: string;
  cover_url: string | null;
  status: BlogStatus;
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

const BLOG_BUCKET = 'blog-images';

async function uploadCoverImage(postId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `posts/${postId}/cover.${ext}`;
  const { error: uploadError } = await supabase.storage.from(BLOG_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(BLOG_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function deletePostImages(postId: string): Promise<void> {
  // Delete entire folder for this post if supported
  // List files under posts/{postId}
  const { data: files, error } = await supabase.storage.from(BLOG_BUCKET).list(`posts/${postId}`, { limit: 100 });
  if (error) return; // ignore
  if (!files || files.length === 0) return;
  const paths = files.map((f) => `posts/${postId}/${f.name}`);
  await supabase.storage.from(BLOG_BUCKET).remove(paths);
}

export const useBlogCRUD = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (): Promise<BlogPost[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (form: BlogForm): Promise<BlogPost> => {
    setLoading(true);
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('blogs')
        .insert({
          title: form.title,
          slug: form.slug,
          meta_description: form.meta_description,
          content: form.content,
          cover_url: null,
          status: form.status,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      let coverUrl: string | null = null;
      if (form.coverFile) {
        coverUrl = await uploadCoverImage(inserted.id, form.coverFile);
        await supabase.from('blogs').update({ cover_url: coverUrl }).eq('id', inserted.id);
      }

      // Insert category mappings if provided
      if (form.categories && form.categories.length > 0) {
        const mappings = form.categories.map((cId) => ({ blog_id: inserted.id, category_id: cId }));
        await supabase.from('blog_categories').insert(mappings);
      }

      toast({ title: 'Blog berhasil dibuat' });
      return { ...(inserted as BlogPost), cover_url: coverUrl } as BlogPost;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal membuat blog';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updatePost = useCallback(async (postId: string, form: BlogForm): Promise<BlogPost> => {
    setLoading(true);
    try {
      // Fetch current cover
      const { data: current, error: fetchErr } = await supabase
        .from('blogs')
        .select('cover_url')
        .eq('id', postId)
        .single();
      if (fetchErr) throw fetchErr;

      let coverUrl = current?.cover_url ?? null;
      if (form.coverFile) {
        coverUrl = await uploadCoverImage(postId, form.coverFile);
      }

      const { data: updated, error: updErr } = await supabase
        .from('blogs')
        .update({
          title: form.title,
          slug: form.slug,
          meta_description: form.meta_description,
          content: form.content,
          cover_url: coverUrl,
          status: form.status,
        })
        .eq('id', postId)
        .select()
        .single();
      if (updErr) throw updErr;

      // Update category mappings: remove existing mappings and insert new ones
      if (form.categories) {
        // delete existing
        await supabase.from('blog_categories').delete().eq('blog_id', postId);
        if (form.categories.length > 0) {
          const mappings = form.categories.map((cId) => ({ blog_id: postId, category_id: cId }));
          await supabase.from('blog_categories').insert(mappings);
        }
      }

      toast({ title: 'Blog diperbarui' });
      return updated as BlogPost;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal memperbarui blog';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deletePost = useCallback(async (postId: string): Promise<void> => {
    setLoading(true);
    try {
      await deletePostImages(postId);
      const { error } = await supabase.from('blogs').delete().eq('id', postId);
      if (error) throw error;
      toast({ title: 'Blog dihapus' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal menghapus blog';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const togglePublish = useCallback(async (postId: string, publish: boolean): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ status: publish ? 'published' : 'draft' })
        .eq('id', postId);
      if (error) throw error;
      toast({ title: publish ? 'Dipublikasikan' : 'Diubah ke draft' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal mengubah status';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw e;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { loading, fetchPosts, createPost, updatePost, deletePost, togglePublish };
};


