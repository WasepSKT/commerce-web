import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useBlogCRUD, BlogForm, BlogPost } from '@/hooks/useBlogCRUD';
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, Calendar, User } from 'lucide-react';
import BlogEditor from '@/components/ui/BlogEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';

export default function AdminBlogsPage() {
  const { loading, fetchPosts, createPost, updatePost, deletePost, togglePublish } = useBlogCRUD();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogForm>({ title: '', slug: '', meta_description: '', content: '', coverFile: null, cover_url: '', status: 'draft', categories: [] });
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; post: BlogPost | null; action: 'publish' | 'unpublish' | 'delete' }>({ open: false, post: null, action: 'publish' });
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 blog cards per page

  // Pagination calculations
  const totalPages = Math.ceil(posts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPosts = posts.slice(startIndex, endIndex);

  const load = useCallback(async () => {
    const data = await fetchPosts();
    setPosts(data);
    // Reset to first page when posts change
    setCurrentPage(1);
  }, [fetchPosts]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm({ title: '', slug: '', meta_description: '', content: '', coverFile: null, cover_url: '', status: 'draft', categories: [] });
    setEditing(null);
  };

  const onSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({
        title: "Error",
        description: "Judul dan slug harus diisi",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updatePost(editing.id, form);
        toast({
          title: "Berhasil",
          description: "Artikel berhasil diperbarui",
        });
      } else {
        await createPost(form);
        toast({
          title: "Berhasil",
          description: "Artikel berhasil dibuat",
        });
      }
      setOpen(false);
      reset();
      await load();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan artikel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      meta_description: post.meta_description || '',
      content: post.content,
      coverFile: null,
      cover_url: post.cover_url || '',
      status: post.status,
      categories: []
    });

    // Fetch existing category mappings for this post and set into form
    (async () => {
      try {
        const { data: rows, error } = await supabase.from('blog_categories').select('category_id').eq('blog_id', post.id);
        if (error) throw error;
        const categoryIds = (rows ?? []).map((r: { category_id: string }) => r.category_id);
        setForm((prev) => ({ ...prev, categories: categoryIds }));
      } catch (err) {
        console.error('Failed to load blog categories for edit', err);
      }
    })();
    setOpen(true);
  };

  const handleTogglePublish = (post: BlogPost) => {
    const action = post.status === 'published' ? 'unpublish' : 'publish';
    setConfirmDialog({ open: true, post, action });
  };

  const handleDeletePost = (post: BlogPost) => {
    setConfirmDialog({ open: true, post, action: 'delete' });
  };

  const confirmAction = async () => {
    if (!confirmDialog.post) return;

    const { post, action } = confirmDialog;

    if (action === 'delete') {
      setDeleteLoading(post.id);
      try {
        await deletePost(post.id);

        // Realtime update - remove post from local state
        setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));

        setConfirmDialog({ open: false, post: null, action: 'publish' });
      } catch (error) {
        console.error('Delete post error:', error);
      } finally {
        setDeleteLoading(null);
      }
    } else {
      const publish = action === 'publish';

      setToggleLoading(post.id);
      try {
        await togglePublish(post.id, publish);

        // Realtime update - update local state immediately
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? { ...p, status: publish ? 'published' : 'draft' as const }
              : p
          )
        );

        setConfirmDialog({ open: false, post: null, action: 'publish' });
      } catch (error) {
        console.error('Toggle publish error:', error);
      } finally {
        setToggleLoading(null);
      }
    }
  };

  return (
    <AdminLayout>
      <SEOHead
        title="Manajemen Blog - Admin Regal Paw"
        description="Panel admin untuk mengelola artikel blog dan konten. Buat, edit, dan publikasikan artikel blog dengan editor rich text yang lengkap."
        keywords="admin blog, manajemen blog, artikel blog, Regal Paw, admin panel, editor blog"
        canonical="/admin/blogs"
        ogType="website"
        noindex={true}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Blog Management</h1>
            <p className="text-muted-foreground">Kelola artikel blog dan kontennya</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Blog
          </Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            // Skeleton Loading - Consistent Gray Colors
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4 bg-gray-200" />
                        <div className="flex gap-3">
                          <Skeleton className="h-3 w-20 bg-gray-200" />
                          <Skeleton className="h-3 w-16 bg-gray-200" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full bg-gray-200" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Skeleton className="w-32 h-24 rounded-lg bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full bg-gray-200" />
                        <Skeleton className="h-4 w-5/6 bg-gray-200" />
                        <Skeleton className="h-4 w-4/6 bg-gray-200" />
                        <div className="flex gap-2 mt-4">
                          <Skeleton className="h-8 w-20 bg-gray-200" />
                          <Skeleton className="h-8 w-16 bg-gray-200" />
                          <Skeleton className="h-8 w-16 bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-primary">Belum Ada Artikel</h3>
                <p className="text-muted-foreground mb-4">Mulai membuat artikel blog pertama Anda</p>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Artikel Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {currentPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2 mb-1 text-primary">{post.title}</CardTitle>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.created_at).toLocaleDateString('id-ID')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Admin
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={post.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {post.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="w-20 h-16 sm:w-32 sm:h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {post.cover_url ? (
                          <img
                            src={post.cover_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="line-clamp-2 text-sm text-muted-foreground mb-3"
                          dangerouslySetInnerHTML={{ __html: post.content.replace(/<[^>]*>/g, '') }}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => onEdit(post)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleTogglePublish(post)}
                            disabled={toggleLoading === post.id}
                          >
                            {toggleLoading === post.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : post.status === 'published' ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Unpublish</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Publish</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeletePost(post)}
                            disabled={deleteLoading === post.id}
                          >
                            {deleteLoading === post.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 mr-1" />
                            )}
                            <span className="hidden sm:inline">Hapus</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogContent className="w-[95vw] max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
            {/* Modal Header - Fixed */}
            <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-background">
              <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                {editing ? (
                  <>
                    <Edit className="h-6 w-6" />
                    Edit Artikel
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6" />
                    Buat Artikel Baru
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-base">
                {editing
                  ? 'Perbarui konten artikel Anda dengan editor yang lengkap'
                  : 'Gunakan editor lengkap untuk membuat artikel blog yang menarik'
                }
              </DialogDescription>
            </DialogHeader>

            {/* Modal Body - Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <BlogEditor
                form={form}
                onFormChange={setForm}
                className="space-y-6"
              />
            </div>

            {/* Modal Footer - Fixed */}
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-background">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => { setOpen(false); reset(); }}
                  disabled={saving}
                  className="w-full sm:w-auto min-w-20 order-2 sm:order-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving || !form.title.trim() || !form.slug.trim()}
                  className="w-full sm:w-auto min-w-24 order-1 sm:order-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    editing ? 'Perbarui Artikel' : 'Simpan Artikel'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog for Publish/Unpublish */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {confirmDialog.action === 'publish' ? (
                  <>
                    <Eye className="h-5 w-5 text-brand-primary" />
                    <span className="text-brand-primary">Publish Artikel</span>
                  </>
                ) : confirmDialog.action === 'unpublish' ? (
                  <>
                    <EyeOff className="h-5 w-5 text-brand-primary" />
                    <span className="text-brand-primary">Unpublish Artikel</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 text-brand-primary" />
                    <span className="text-brand-primary">Hapus Artikel</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <p>
                  {confirmDialog.action === 'publish'
                    ? 'Artikel ini akan dipublikasikan dan dapat dilihat oleh pengunjung website.'
                    : confirmDialog.action === 'unpublish'
                      ? 'Artikel ini akan diubah menjadi draft dan tidak akan terlihat oleh pengunjung website.'
                      : 'Artikel ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.'
                  }
                </p>
                {confirmDialog.post && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-medium text-sm">{confirmDialog.post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Status saat ini: <Badge variant={confirmDialog.post.status === 'published' ? 'default' : 'secondary'}>
                        {confirmDialog.post.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, post: null, action: 'publish' })}
                disabled={toggleLoading !== null}
                className="w-full sm:w-auto border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
              >
                Batal
              </Button>
              <Button
                onClick={confirmAction}
                disabled={toggleLoading !== null || deleteLoading !== null}
                className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-90 text-white"
              >
                {toggleLoading !== null || deleteLoading !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {confirmDialog.action === 'publish' ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Ya, Publish
                      </>
                    ) : confirmDialog.action === 'unpublish' ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Ya, Unpublish
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Ya, Hapus
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}


