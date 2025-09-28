import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ImageUploader from './ImageUploader';

interface Product {
  id?: string;
  name?: string;
  description?: string;
  price?: number | string;
  image_url?: string;
  category?: string;
  stock_quantity?: number | string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Product | null;
  onSave: (data: Product) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function ProductDialog({ open, onOpenChange, initial, onSave, onDelete }: Props) {
  const [form, setForm] = useState(() => ({
    name: '',
    description: '',
    price: '',
    image_url: '',
    imageFile: null as File | null,
    imagePreview: '',
    category: 'Dry Food',
    stock_quantity: ''
  }));

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        description: initial.description || '',
        price: String(initial.price || ''),
        image_url: initial.image_url || '',
        imageFile: null,
        imagePreview: initial.image_url || '',
        category: initial.category || 'Dry Food',
        stock_quantity: String(initial.stock_quantity || '')
      });
    } else {
      setForm((f) => ({ ...f, imageFile: null }));
    }
  }, [initial]);

  const handleImage = (file?: File | null) => {
    if (!file) return setForm((p) => ({ ...p, imageFile: null, imagePreview: '' }));
    setForm((p) => ({ ...p, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const handleSubmit = async () => {
    await onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          {initial ? 'Edit Produk' : 'Tambah Produk'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          <DialogDescription>Lengkapi informasi produk di bawah ini.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div>
              <Label>Nama Produk</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>

            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Harga</Label>
                <Input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
              <div>
                <Label>Stok</Label>
                <Input value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue>{form.category}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dry Food">Dry Food</SelectItem>
                  <SelectItem value="Wet Food">Wet Food</SelectItem>
                  <SelectItem value="Supplement">Supplement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <ImageUploader
              value={form.imageFile}
              previewUrl={form.imagePreview}
              onChange={(file, preview) => setForm((p) => ({ ...p, imageFile: file, imagePreview: preview || '' }))}
            />

            <div className="mt-2 w-full text-xs text-muted-foreground text-center">Jika tidak mengganti gambar, biarkan kosong.</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit}>{initial ? 'Update Produk' : 'Tambah Produk'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
