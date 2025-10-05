import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Upload, Edit, Trash2, Eye, EyeOff, GripVertical, X, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import { campaignService, HeroSliderItem } from '@/services/campaignService';



const MAX_SLIDER_IMAGES = 5;

export function ImageSliderManager() {
  const [sliderImages, setSliderImages] = useState<HeroSliderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroSliderItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HeroSliderItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageForm, setImageForm] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    button_text: '',
    is_active: true,
    imageFile: null as File | null,
    imagePreview: ''
  });

  // Fetch slider images from DB
  useEffect(() => {
    const fetchSliderImages = async () => {
      setLoading(true);
      try {
        const images = await campaignService.getHeroSliderItems();
        setSliderImages(images);
      } catch (err) {
        console.error('Gagal mengambil data slider hero:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSliderImages();
  }, []);

  const resetForm = () => {
    setImageForm({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      button_text: '',
      is_active: true,
      imageFile: null,
      imagePreview: ''
    });
    setEditingImage(null);
  };

  const handleImageSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setImageForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    }));
  };

  const handleEdit = (image: HeroSliderItem) => {
    setEditingImage(image);
    setImageForm({
      title: image.title,
      description: image.subtitle || '',
      image_url: image.image_url,
      link_url: image.link_url || '',
      button_text: image.button_text || '',
      is_active: image.is_active,
      imageFile: null,
      imagePreview: image.image_url
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingImage) {
        // Update existing
        await campaignService.updateHeroSliderItem(
          editingImage.id,
          {
            title: imageForm.title,
            subtitle: imageForm.description,
            image_url: imageForm.image_url,
            link_url: imageForm.link_url,
            button_text: imageForm.button_text,
            is_active: imageForm.is_active
          },
          imageForm.imageFile || undefined
        );
      } else {
        // Create new
        await campaignService.createHeroSliderItem(
          {
            title: imageForm.title,
            subtitle: imageForm.description,
            image_url: imageForm.image_url,
            link_url: imageForm.link_url,
            button_text: imageForm.button_text,
            is_active: imageForm.is_active,
            order_index: sliderImages.length // add to end
          },
          imageForm.imageFile || undefined
        );
      }
      // Refresh images
      const images = await campaignService.getHeroSliderItems();
      setSliderImages(images);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      await campaignService.deleteHeroSliderItem(deleteConfirm.id);
      const images = await campaignService.getHeroSliderItems();
      setSliderImages(images);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (image: HeroSliderItem) => {
    setLoading(true);
    try {
      await campaignService.updateHeroSliderItem(
        image.id,
        { is_active: !image.is_active }
      );
      const images = await campaignService.getHeroSliderItems();
      setSliderImages(images);
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAddMore = sliderImages.length < MAX_SLIDER_IMAGES;
  const activeCount = sliderImages.filter(img => img.is_active).length;

  return (
    <div className="space-y-6">
      {/* Stats & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{sliderImages.length}/{MAX_SLIDER_IMAGES}</span> gambar total
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">{activeCount}</span> aktif
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              disabled={!canAddMore}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Gambar
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Images Grid */}
      <div className="grid gap-4">
        {sliderImages.map((image, index) => (
          <Card key={image.id} className={cn(
            "transition-all duration-200",
            image.is_active ? "ring-2 ring-brand-primary/20" : "opacity-75"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <div className="flex items-center text-gray-400 cursor-move">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Image Preview */}
                <div className="relative">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  {!image.is_active && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <EyeOff className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 truncate">{image.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{image.subtitle}</p>
                      {image.link_url && (
                        <p className="text-xs text-brand-primary mt-1 truncate">{image.link_url}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant={image.is_active ? "default" : "secondary"} className="text-xs">
                        {image.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(image)}
                    className="h-8 w-8 p-0"
                  >
                    {image.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(image)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(image)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sliderImages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Images className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Belum Ada Gambar Slider</p>
            <p className="text-sm">Tambahkan gambar untuk hero carousel produk</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-primary">
              {editingImage ? 'Edit Gambar Slider' : 'Tambah Gambar Slider'}
            </DialogTitle>
            <DialogDescription>
              {editingImage
                ? 'Perbarui informasi gambar slider'
                : 'Tambahkan gambar baru untuk hero carousel'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-2 md:px-0">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gambar <span className="text-red-500">*</span></Label>
              <div className="space-y-4">
                {imageForm.imagePreview ? (
                  <div className="relative">
                    <img
                      src={imageForm.imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setImageForm(prev => ({
                        ...prev,
                        imageFile: null,
                        imagePreview: ''
                      }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageSelect(file);
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600">Klik untuk upload gambar</p>
                    <p className="text-xs text-gray-500 mt-1">Max 5MB • JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={imageForm.title}
                  onChange={(e) => setImageForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Summer Sale 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_url">Link URL (Opsional)</Label>
                <Input
                  id="link_url"
                  value={imageForm.link_url}
                  onChange={(e) => setImageForm(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="/products atau https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_text">Teks Tombol (Opsional)</Label>
                <Input
                  id="button_text"
                  value={imageForm.button_text}
                  onChange={(e) => setImageForm(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Contoh: Lihat Promo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={imageForm.description}
                onChange={(e) => setImageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi menarik untuk slider..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={imageForm.is_active}
                onCheckedChange={(checked) => setImageForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Aktifkan setelah disimpan</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !imageForm.title || !imageForm.description}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              {loading ? 'Menyimpan...' : (editingImage ? 'Perbarui' : 'Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Gambar Slider?</AlertDialogTitle>
            <AlertDialogDescription>
              Gambar "{deleteConfirm?.title}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}