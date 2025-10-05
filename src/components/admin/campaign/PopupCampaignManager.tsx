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
import { Plus, Upload, Edit, Trash2, Eye, EyeOff, MessageSquare, X, Calendar, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PopupCampaign {
  id: string;
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_url?: string;
  display_type: 'image' | 'text' | 'mixed';
  show_frequency: 'once' | 'daily' | 'weekly' | 'always';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export function PopupCampaignManager() {
  const [popupCampaigns, setPopupCampaigns] = useState<PopupCampaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupCampaign | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PopupCampaign | null>(null);
  const [previewPopup, setPreviewPopup] = useState<PopupCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupForm, setPopupForm] = useState({
    title: '',
    description: '',
    image_url: '',
    button_text: '',
    button_url: '',
    display_type: 'mixed' as 'image' | 'text' | 'mixed',
    show_frequency: 'once' as 'once' | 'daily' | 'weekly' | 'always',
    is_active: true,
    start_date: '',
    end_date: '',
    imageFile: null as File | null,
    imagePreview: ''
  });

  // Mock data for development
  useEffect(() => {
    const mockData: PopupCampaign[] = [
      {
        id: '1',
        title: 'Welcome Discount!',
        description: 'Dapatkan diskon 20% untuk pembelian pertama Anda!',
        image_url: '/placeholder.svg',
        button_text: 'Claim Discount',
        button_url: '/products?discount=welcome20',
        display_type: 'mixed',
        show_frequency: 'once',
        is_active: true,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        created_at: '2024-01-01'
      },
      {
        id: '2',
        title: 'Flash Sale Alert!',
        description: 'Flash sale 50% OFF hanya hari ini! Jangan sampai terlewat.',
        image_url: '/placeholder.svg',
        button_text: 'Shop Now',
        button_url: '/products/flash-sale',
        display_type: 'mixed',
        show_frequency: 'daily',
        is_active: false,
        start_date: '2024-01-15',
        end_date: '2024-01-15',
        created_at: '2024-01-14'
      }
    ];
    setPopupCampaigns(mockData);
  }, []);

  const resetForm = () => {
    setPopupForm({
      title: '',
      description: '',
      image_url: '',
      button_text: '',
      button_url: '',
      display_type: 'mixed',
      show_frequency: 'once',
      is_active: true,
      start_date: '',
      end_date: '',
      imageFile: null,
      imagePreview: ''
    });
    setEditingPopup(null);
  };

  const handleImageSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setPopupForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    }));
  };

  const handleEdit = (popup: PopupCampaign) => {
    setEditingPopup(popup);
    setPopupForm({
      title: popup.title,
      description: popup.description,
      image_url: popup.image_url,
      button_text: popup.button_text,
      button_url: popup.button_url || '',
      display_type: popup.display_type,
      show_frequency: popup.show_frequency,
      is_active: popup.is_active,
      start_date: popup.start_date || '',
      end_date: popup.end_date || '',
      imageFile: null,
      imagePreview: popup.image_url
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual save logic
      console.log('Saving popup campaign:', popupForm);

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
      // TODO: Implement actual delete logic
      console.log('Deleting popup campaign:', deleteConfirm.id);

      setPopupCampaigns(prev => prev.filter(popup => popup.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (popup: PopupCampaign) => {
    try {
      // TODO: Implement actual toggle logic
      setPopupCampaigns(prev =>
        prev.map(p =>
          p.id === popup.id
            ? { ...p, is_active: !p.is_active }
            : p
        )
      );
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const activePopups = popupCampaigns.filter(p => p.is_active);

  return (
    <div className="space-y-6">
      {/* Stats & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{popupCampaigns.length}</span> pop-up campaign
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">{activePopups.length}</span> aktif
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
              Tambah Pop-up
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Popup Campaigns Grid */}
      <div className="grid gap-4">
        {popupCampaigns.map(popup => (
          <Card key={popup.id} className={cn(
            "transition-all duration-200",
            popup.is_active ? "ring-2 ring-brand-primary/20" : "opacity-75"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Image Preview */}
                <div className="relative flex-shrink-0">
                  <img
                    src={popup.image_url}
                    alt={popup.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  {!popup.is_active && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <EyeOff className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{popup.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{popup.description}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={popup.is_active ? "default" : "secondary"} className="text-xs">
                          {popup.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {popup.display_type === 'mixed' ? 'Gambar + Teks' :
                            popup.display_type === 'image' ? 'Gambar Saja' : 'Teks Saja'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {popup.show_frequency === 'once' ? 'Sekali' :
                            popup.show_frequency === 'daily' ? 'Harian' :
                              popup.show_frequency === 'weekly' ? 'Mingguan' : 'Selalu'}
                        </Badge>
                      </div>

                      {popup.button_text && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                          <span className="px-2 py-1 bg-brand-primary text-white rounded text-xs">
                            {popup.button_text}
                          </span>
                          {popup.button_url && (
                            <span className="text-brand-primary truncate">{popup.button_url}</span>
                          )}
                        </div>
                      )}

                      {(popup.start_date || popup.end_date) && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {popup.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Mulai: {new Date(popup.start_date).toLocaleDateString('id-ID')}</span>
                            </div>
                          )}
                          {popup.end_date && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Berakhir: {new Date(popup.end_date).toLocaleDateString('id-ID')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPopup(popup)}
                    className="h-8 w-8 p-0"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(popup)}
                    className="h-8 w-8 p-0"
                    title={popup.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {popup.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(popup)}
                    className="h-8 w-8 p-0"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(popup)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {popupCampaigns.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Belum Ada Pop-up Campaign</p>
            <p className="text-sm">Tambahkan pop-up promosi untuk dashboard login</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-brand-primary">
              {editingPopup ? 'Edit Pop-up Campaign' : 'Tambah Pop-up Campaign'}
            </DialogTitle>
            <DialogDescription>
              {editingPopup
                ? 'Perbarui informasi pop-up campaign'
                : 'Buat pop-up promosi untuk dashboard login'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Pop-up <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={popupForm.title}
                  onChange={(e) => setPopupForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Welcome Discount!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_type">Tipe Tampilan <span className="text-red-500">*</span></Label>
                <Select
                  value={popupForm.display_type}
                  onValueChange={(value: 'image' | 'text' | 'mixed') => setPopupForm(prev => ({ ...prev, display_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Gambar + Teks</SelectItem>
                    <SelectItem value="image">Gambar Saja</SelectItem>
                    <SelectItem value="text">Teks Saja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={popupForm.description}
                onChange={(e) => setPopupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Pesan menarik untuk pop-up..."
                rows={3}
              />
            </div>

            {/* Image Upload (if display_type includes image) */}
            {(popupForm.display_type === 'image' || popupForm.display_type === 'mixed') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gambar Pop-up <span className="text-red-500">*</span></Label>
                <div className="space-y-4">
                  {popupForm.imagePreview ? (
                    <div className="relative">
                      <img
                        src={popupForm.imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setPopupForm(prev => ({
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
                      <p className="text-sm text-gray-600">Klik untuk upload gambar pop-up</p>
                      <p className="text-xs text-gray-500 mt-1">Rekomendasi: 800x600px • Max 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Button Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button_text">Teks Button <span className="text-red-500">*</span></Label>
                <Input
                  id="button_text"
                  value={popupForm.button_text}
                  onChange={(e) => setPopupForm(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Contoh: Claim Discount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_url">URL Button (Opsional)</Label>
                <Input
                  id="button_url"
                  value={popupForm.button_url}
                  onChange={(e) => setPopupForm(prev => ({ ...prev, button_url: e.target.value }))}
                  placeholder="/products atau https://example.com"
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="show_frequency">Frekuensi Tampil <span className="text-red-500">*</span></Label>
                <Select
                  value={popupForm.show_frequency}
                  onValueChange={(value: 'once' | 'daily' | 'weekly' | 'always') => setPopupForm(prev => ({ ...prev, show_frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Sekali Saja</SelectItem>
                    <SelectItem value="daily">Setiap Hari</SelectItem>
                    <SelectItem value="weekly">Setiap Minggu</SelectItem>
                    <SelectItem value="always">Selalu Muncul</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="is_active"
                  checked={popupForm.is_active}
                  onCheckedChange={(checked) => setPopupForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Aktifkan setelah disimpan</Label>
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Tanggal Mulai (Opsional)</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={popupForm.start_date}
                  onChange={(e) => setPopupForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Tanggal Berakhir (Opsional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={popupForm.end_date}
                  onChange={(e) => setPopupForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !popupForm.title || !popupForm.description || !popupForm.button_text}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              {loading ? 'Menyimpan...' : (editingPopup ? 'Perbarui' : 'Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPopup} onOpenChange={() => setPreviewPopup(null)}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            {previewPopup && (
              <>
                {(previewPopup.display_type === 'image' || previewPopup.display_type === 'mixed') && (
                  <img
                    src={previewPopup.image_url}
                    alt={previewPopup.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-brand-primary">{previewPopup.title}</h3>
                  <p className="text-gray-600">{previewPopup.description}</p>

                  <div className="flex gap-2 justify-center">
                    <Button className="bg-brand-primary hover:bg-brand-primary/90">
                      {previewPopup.button_text}
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewPopup(null)}>
                      Tutup
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pop-up Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Pop-up "{deleteConfirm?.title}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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