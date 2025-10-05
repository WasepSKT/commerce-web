import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Upload, Edit, Trash2, Eye, EyeOff, PanelLeft, X, AlignLeft, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { campaignService, FixedBanner } from '@/services/campaignService';



export function FixedBannerManager() {
  const [fixedBanners, setFixedBanners] = useState<FixedBanner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<FixedBanner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FixedBanner | null>(null);
  const [loading, setLoading] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    position: 'left' as 'left' | 'right',
    is_active: true,
    imageFile: null as File | null,
    imagePreview: ''
  });

  // Fetch fixed banners from DB
  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const banners = await campaignService.getFixedBanners();
        setFixedBanners(banners);
      } catch (err) {
        console.error('Gagal mengambil data fixed banner:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const resetForm = () => {
    setBannerForm({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      position: 'left',
      is_active: true,
      imageFile: null,
      imagePreview: ''
    });
    setEditingBanner(null);
  };

  const handleImageSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setBannerForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    }));
  };

  const handleEdit = (banner: FixedBanner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.name,
      description: '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: banner.position,
      is_active: banner.is_active,
      imageFile: null,
      imagePreview: banner.image_url
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingBanner) {
        // Update existing
        await campaignService.updateFixedBanner(
          editingBanner.id,
          {
            name: bannerForm.title,
            image_url: bannerForm.image_url,
            link_url: bannerForm.link_url,
            position: bannerForm.position,
            is_active: bannerForm.is_active
          },
          bannerForm.imageFile || undefined
        );
      } else {
        // Create new
        await campaignService.createFixedBanner(
          {
            name: bannerForm.title,
            image_url: bannerForm.image_url,
            link_url: bannerForm.link_url,
            position: bannerForm.position,
            is_active: bannerForm.is_active
          },
          bannerForm.imageFile || undefined
        );
      }
      // Refresh banners
      const banners = await campaignService.getFixedBanners();
      setFixedBanners(banners);
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
      await campaignService.deleteFixedBanner(deleteConfirm.id);
      const banners = await campaignService.getFixedBanners();
      setFixedBanners(banners);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (banner: FixedBanner) => {
    setLoading(true);
    try {
      await campaignService.updateFixedBanner(
        banner.id,
        { is_active: !banner.is_active }
      );
      const banners = await campaignService.getFixedBanners();
      setFixedBanners(banners);
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  const leftBanners = fixedBanners.filter(b => b.position === 'left');
  const rightBanners = fixedBanners.filter(b => b.position === 'right');
  const activeBanners = fixedBanners.filter(b => b.is_active);

  return (
    <div className="space-y-6">
      {/* Stats & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{fixedBanners.length}</span> banner total
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">{activeBanners.length}</span> aktif
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <AlignLeft className="w-4 h-4" />
              <span>{leftBanners.length} kiri</span>
            </div>
            <div className="flex items-center gap-1">
              <AlignRight className="w-4 h-4" />
              <span>{rightBanners.length} kanan</span>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Banner
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Banners by Position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Banners */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <AlignLeft className="w-5 h-5 text-brand-primary" />
            <h3 className="font-semibold text-gray-900">Banner Kiri ({leftBanners.length})</h3>
          </div>

          {leftBanners.map(banner => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={handleEdit}
              onDelete={setDeleteConfirm}
              onToggle={toggleActive}
            />
          ))}

          {leftBanners.length === 0 && (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <PanelLeft className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Belum ada banner kiri</p>
            </div>
          )}
        </div>

        {/* Right Banners */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <AlignRight className="w-5 h-5 text-brand-primary" />
            <h3 className="font-semibold text-gray-900">Banner Kanan ({rightBanners.length})</h3>
          </div>

          {rightBanners.map(banner => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={handleEdit}
              onDelete={setDeleteConfirm}
              onToggle={toggleActive}
            />
          ))}

          {rightBanners.length === 0 && (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <PanelLeft className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Belum ada banner kanan</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-primary">
              {editingBanner ? 'Edit Fixed Banner' : 'Tambah Fixed Banner'}
            </DialogTitle>
            <DialogDescription>
              {editingBanner
                ? 'Perbarui informasi banner tetap'
                : 'Tambahkan banner tetap untuk sisi blog post'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gambar Banner <span className="text-red-500">*</span></Label>
              <div className="space-y-4">
                {bannerForm.imagePreview ? (
                  <div className="relative">
                    <img
                      src={bannerForm.imagePreview}
                      alt="Preview"
                      className="w-[250px] h-[600px] object-cover rounded-lg border border-gray-200 mx-auto"
                      style={{ maxWidth: '100%', height: 'auto', aspectRatio: '250/600' }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setBannerForm(prev => ({
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
                    <p className="text-sm text-gray-600">Klik untuk upload gambar banner</p>
                    <p className="text-xs text-gray-500 mt-1 font-semibold text-brand-primary">Ukuran WAJIB: 250x600px (vertikal) • Maksimal 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Banner <span className="text-red-500">*</span></Label>
                <div className="text-xs text-gray-500 mb-1">Gambar banner harus berukuran <span className="font-semibold">250x600px</span> agar tampil optimal di blog.</div>
                <Input
                  id="title"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Premium Cat Food"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Posisi Banner <span className="text-red-500">*</span></Label>
                <div className="text-xs text-gray-500 mb-1">Pilih sisi blog tempat banner akan ditampilkan. <span className="font-semibold">Kiri</span> untuk sidebar kiri, <span className="font-semibold">Kanan</span> untuk sidebar kanan.</div>
                <Select
                  value={bannerForm.position}
                  onValueChange={(value: 'left' | 'right') => setBannerForm(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">
                      <div className="flex items-center gap-2">
                        <AlignLeft className="w-4 h-4" />
                        Sisi Kiri Blog
                      </div>
                    </SelectItem>
                    <SelectItem value="right">
                      <div className="flex items-center gap-2">
                        <AlignRight className="w-4 h-4" />
                        Sisi Kanan Blog
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi <span className="text-red-500">*</span></Label>
              {/* No description field in backend, remove or replace with other info if needed */}
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_url">Link URL (Opsional)</Label>
              <Input
                id="link_url"
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="/products atau https://example.com"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={bannerForm.is_active}
                onCheckedChange={(checked) => setBannerForm(prev => ({ ...prev, is_active: checked }))}
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
              disabled={loading || !bannerForm.title}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              {loading ? 'Menyimpan...' : (editingBanner ? 'Perbarui' : 'Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Fixed Banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Banner "{deleteConfirm?.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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

// Banner Card Component
interface BannerCardProps {
  banner: FixedBanner;
  onEdit: (banner: FixedBanner) => void;
  onDelete: (banner: FixedBanner) => void;
  onToggle: (banner: FixedBanner) => void;
}

function BannerCard({ banner, onEdit, onDelete, onToggle }: BannerCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200",
      banner.is_active ? "ring-2 ring-brand-primary/20" : "opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Image Preview */}
          <div className="relative flex-shrink-0">
            <img
              src={banner.image_url}
              alt={banner.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            {!banner.is_active && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <EyeOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 truncate">{banner.name}</h4>
                {/* No description field in backend, remove or replace with other info if needed */}
                {banner.link_url && (
                  <p className="text-xs text-brand-primary mt-1 truncate">{banner.link_url}</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={banner.is_active ? "default" : "secondary"} className="text-xs">
                    {banner.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {banner.position === 'left' ? 'Kiri' : 'Kanan'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(banner)}
              className="h-7 w-7 p-0"
            >
              {banner.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(banner)}
              className="h-7 w-7 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(banner)}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}