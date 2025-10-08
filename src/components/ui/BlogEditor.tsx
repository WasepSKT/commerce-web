import { useCallback, useEffect, useState } from 'react';
import type { Extension } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { getDefaultExtensions } from './tiptapExtensions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TiptapToolbar from '@/components/ui/TiptapToolbar';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, FileImage, Info, Keyboard, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import SEOPreview from '@/components/admin/SEOPreview';
import { useAutoSEO } from '@/hooks/useAutoSEO';

interface BlogForm {
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  coverFile: File | null;
  cover_url: string;
  status: 'draft' | 'published';
  categories?: string[];
}

interface BlogEditorProps {
  form: BlogForm;
  onFormChange: (form: BlogForm) => void;
  className?: string;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
}

// Interactive help component
function EditorHelp({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  if (!isVisible) return null;

  return (
    <Card className="mb-4 bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="relative">
          {/* Info icon positioned at top left */}
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h4 className="font-medium text-foreground flex items-center justify-between">
                📝 Tips Blog Editor
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </h4>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-primary" />
                  <span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+B</kbd> Bold,
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono ml-1">Ctrl+I</kbd> Italic
                  </span>
                </div>
                <div>💡 <strong className="text-foreground">H2</strong> untuk section heading, <strong className="text-foreground">H3</strong> untuk sub-section</div>
                <div>📋 Copy-paste markdown akan otomatis terkonversi</div>
                <div>🎨 Gunakan color picker dan font selector untuk styling</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlogEditor({ form, onFormChange, className }: BlogEditorProps) {
  const [showHelp, setShowHelp] = useState(true);
  const [showSEOPreview, setShowSEOPreview] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const autoSEO = useAutoSEO();
  const { generateMetaDescription, generateKeywords } = autoSEO;
  const makeSlug = autoSEO.generateSlug;
  // Initialize TipTap editor with better configuration
  const extensions = getDefaultExtensions();
  // Defensive: remove duplicate extension names to prevent TipTap duplicate-name warnings
  const uniqueExtensions = (() => {
    const seen = new Set<string>();
    const out: Extension[] = [];
    for (const ext of extensions as Extension[]) {
      const name = (ext as Extension)?.name || '';
      if (!name) {
        out.push(ext as Extension);
        continue;
      }
      if (!seen.has(name)) {
        seen.add(name);
        out.push(ext as Extension);
      }
    }
    return out;
  })();

  const editor = useEditor({
    extensions: uniqueExtensions,
    content: form.content || '<p style="color: #7A1316; font-family: Roboto, sans-serif;"></p>',
    onUpdate: ({ editor }) => {
      onFormChange({ ...form, content: editor.getHTML() });
    },
    onCreate: ({ editor }) => {
      // Set default styling for new content
      if (!form.content) {
        editor.chain().focus().setColor('#7A1316').setFontFamily('Roboto').run();
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          // Base prose styling
          'prose prose-base max-w-none focus:outline-none',
          'min-h-[350px] p-6 w-full',
          // Custom blog editor styling with explicit sizes
          'blog-editor-content',
          // Blog-specific styling with proper hierarchy
          'prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:text-base prose-p:leading-7 prose-p:text-foreground',
          'prose-strong:font-semibold prose-strong:text-foreground',
          'prose-em:italic prose-em:text-foreground',
          'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4',
          'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6',
          'prose-li:text-foreground prose-li:mb-1',
          'prose-a:text-primary prose-a:underline prose-a:decoration-primary/30 prose-a:underline-offset-4',
          'prose-img:rounded-lg prose-img:border prose-img:shadow-sm'
        ),
      },
    },
  });

  // Load categories for selector
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setCategoriesLoading(true);
      try {
        const { data, error } = await supabase.from('categories').select('id, name').order('name', { ascending: true });
        if (error) throw error;
        if (!mounted) return;
        setCategories((data as Category[]) || []);
      } catch (err) {
        console.error('Failed to load categories', err);
        setCategories([]);
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const toggleCategory = useCallback((id: string) => {
    const current = form.categories ?? [];
    const has = current.includes(id);
    const next = has ? current.filter((c) => c !== id) : [...current, id];
    onFormChange({ ...form, categories: next });
  }, [form, onFormChange]);

  // Handle cover image upload
  const handleCoverUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert('Ukuran file maksimal 5MB');
          return;
        }
        onFormChange({ ...form, coverFile: file });
      }
    };
    input.click();
  }, [form, onFormChange]);

  // Handle image insertion in content
  const handleImageInsert = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 5MB');
        return;
      }

      try {
        // Show loading state
        editor.chain().focus().insertContent('<p>📤 Mengupload gambar...</p>').run();

        // Upload to Supabase Storage
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `content/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type || 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        // Replace loading text with image
        const currentContent = editor.getHTML();
        const updatedContent = currentContent.replace('<p>📤 Mengupload gambar...</p>', '');
        editor.commands.setContent(updatedContent);
        editor.chain().focus().setImage({
          src: data.publicUrl,
          alt: file.name
        }).run();

      } catch (error) {
        console.error('Error uploading image:', error);
        // Remove loading text
        const currentContent = editor.getHTML();
        const updatedContent = currentContent.replace('<p>📤 Mengupload gambar...</p>', '');
        editor.commands.setContent(updatedContent);
        alert('Gagal mengupload gambar. Silakan coba lagi.');
      }
    };

    input.click();
  }, [editor]);



  return (
    <div className={cn("space-y-6", className)}>
      {/* Basic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="blog-title" className="text-sm font-medium">
            Judul Artikel
          </Label>
          <Input
            id="blog-title"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              onFormChange({
                ...form,
                title,
                // Auto-generate slug only if current slug is empty or was auto-generated
                slug: (!form.slug || form.slug === makeSlug(form.title)) ? makeSlug(title) : form.slug
              });
            }}
            placeholder="Masukkan judul artikel..."
            className="focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Judul yang menarik dan deskriptif untuk SEO
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blog-slug" className="text-sm font-medium">
            Slug URL
          </Label>
          <Input
            id="blog-slug"
            value={form.slug}
            onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
            placeholder="judul-artikel-anda"
            className="focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            URL artikel (gunakan huruf kecil dan tanda hubung)
          </p>
        </div>
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="blog-meta-description" className="text-sm font-medium">
            Meta Description
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (form.content) {
                const autoDescription = generateMetaDescription(form.content);
                onFormChange({ ...form, meta_description: autoDescription });
              }
            }}
            disabled={!form.content}
            className="text-xs"
          >
            Auto-generate
          </Button>
        </div>
        <textarea
          id="blog-meta-description"
          value={form.meta_description}
          onChange={(e) => onFormChange({ ...form, meta_description: e.target.value })}
          placeholder="Deskripsi singkat artikel untuk SEO dan preview di media sosial..."
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          maxLength={160}
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <p>
            Deskripsi yang muncul di hasil pencarian dan social media (optimal: 150-160 karakter)
          </p>
          <span className={`font-mono ${form.meta_description.length > 160 ? 'text-destructive' : form.meta_description.length > 150 ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {form.meta_description.length}/160
          </span>
        </div>
      </div>

      {/* SEO Preview Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">SEO Preview</h3>
          <p className="text-xs text-muted-foreground">Lihat bagaimana artikel akan muncul di hasil pencarian</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSEOPreview(!showSEOPreview)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          {showSEOPreview ? 'Sembunyikan' : 'Tampilkan'} Preview
        </Button>
      </div>

      {/* SEO Preview */}
      {showSEOPreview && (
        <SEOPreview
          title={form.title || 'Judul Artikel'}
          description={form.meta_description || 'Deskripsi artikel akan muncul di sini...'}
          keywords={form.title ? `${form.title}, blog kucing, tips kucing, perawatan kucing, Regal Paw` : 'Keywords akan di-generate otomatis...'}
          ogImage={form.coverFile ? URL.createObjectURL(form.coverFile) : form.cover_url}
          canonical={`/blog/${form.slug || 'slug-artikel'}`}
          type="blog"
        />
      )}

      {/* Cover Image */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Gambar Sampul</Label>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {form.coverFile ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(form.coverFile)}
                  alt="Cover preview"
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => onFormChange({ ...form, coverFile: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {form.coverFile.name}
                </div>
              </div>
            ) : form.cover_url ? (
              <div className="relative">
                <img
                  src={form.cover_url}
                  alt="Current cover"
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => onFormChange({ ...form, cover_url: '' })}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Gambar saat ini
                </div>
              </div>
            ) : (
              <div
                className="h-48 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center space-y-3 bg-muted/20 hover:bg-muted/30"
                onClick={handleCoverUpload}
              >
                <FileImage className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Klik untuk upload gambar sampul
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rasio 16:9 direkomendasikan • Maks 5MB • JPG, PNG, WebP
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Kategori</Label>
        <div className="flex flex-wrap gap-2">
          {categoriesLoading ? (
            <div className="text-sm text-muted-foreground">Memuat kategori...</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-muted-foreground">Belum ada kategori</div>
          ) : (
            categories.map((cat) => {
              const selected = (form.categories || []).includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'text-sm px-3 py-1 rounded-full border transition',
                    selected ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/0 border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {cat.name}
                </button>
              );
            })
          )}
        </div>
        <p className="text-xs text-muted-foreground">Pilih satu atau beberapa kategori untuk artikel ini</p>
      </div>

      {/* Content Editor */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Konten Artikel</Label>

        {/* Interactive Help Component */}
        <EditorHelp
          isVisible={showHelp}
          onClose={() => setShowHelp(false)}
        />

        <Card className="border">
          {/* Toolbar - Remove sticky positioning for modal */}
          <TiptapToolbar
            editor={editor}
            onInsertImage={handleImageInsert}
          />

          {/* Editor Content with proper scrolling */}
          <div className="min-h-[400px] max-h-[500px] overflow-y-auto border-t bg-background">
            <EditorContent
              editor={editor}
              className="h-full"
            />
          </div>
        </Card>

        <p className="text-xs text-muted-foreground">
          💡 Tips: Gunakan heading untuk struktur artikel, tambahkan gambar untuk memperkaya konten
        </p>
      </div>
    </div>
  );
}