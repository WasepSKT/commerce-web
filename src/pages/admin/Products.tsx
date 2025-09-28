import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import ProductDialog from '@/components/admin/ProductDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

type DialogResult = {
  name?: string;
  description?: string;
  price?: number | string;
  image_url?: string;
  imageFile?: File | null;
  imagePreview?: string;
  category?: string;
  stock_quantity?: number | string;
};

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    imageFile: null as File | null,
    imagePreview: '',
    category: 'Dry Food',
    stock_quantity: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      imageFile: null,
      imagePreview: '',
      category: 'Dry Food',
      stock_quantity: ''
    });
    setEditingProduct(null);
  };

  const handleImageSelect = (file?: File | null) => {
    if (!file) return;
    setProductForm((prev) => ({ ...prev, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const handleSaveProduct = async (formArg?: typeof productForm) => {
    const formToUse = formArg ?? productForm;
    try {
      // upload image if file selected
      let imageUrl = formToUse.image_url;
      if (formToUse.imageFile) {
        const file = formToUse.imageFile;
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(data.path);
        imageUrl = publicData.publicUrl;
      }

      const payload = {
        name: formToUse.name,
        description: formToUse.description,
        price: Number(formToUse.price) || 0,
        image_url: imageUrl,
        category: formToUse.category,
        stock_quantity: Number(formToUse.stock_quantity) || 0,
      };

      if (editingProduct) {
        // update
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        toast({ title: 'Produk berhasil diperbarui' });
      } else {
        // insert
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast({ title: 'Produk berhasil ditambahkan' });
      }

      setIsProductDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: unknown) {
      let message = 'Gagal menyimpan produk';
      if (typeof err === 'object' && err && 'message' in err) message = String((err as { message?: string }).message);
      toast({ variant: 'destructive', title: 'Error', description: message });
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url,
      imageFile: null,
      imagePreview: p.image_url,
      category: p.category,
      stock_quantity: String(p.stock_quantity)
    });
    setIsProductDialogOpen(true);
  };

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Gagal menghapus produk' });
    } else {
      toast({ title: 'Produk dihapus' });
      setDeletingProduct(null);
      fetchProducts();
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Product Management</h1>
        <p className="text-sm md:text-base text-muted-foreground">Tambah, edit, dan hapus produk</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kelola Produk</CardTitle>
              <CardDescription>Tambah, edit, atau hapus produk</CardDescription>
            </div>
            <ProductDialog
              open={isProductDialogOpen}
              onOpenChange={(v) => { setIsProductDialogOpen(v); if (!v) resetForm(); }}
              initial={editingProduct}
              onSave={async (data: DialogResult) => {
                // Map incoming data to the productForm shape (strings for inputs)
                const mapped = {
                  name: data.name ?? '',
                  description: data.description ?? '',
                  price: data.price != null ? String(data.price) : '',
                  image_url: data.image_url ?? '',
                  imageFile: data.imageFile ?? null,
                  imagePreview: data.imagePreview ?? (data.image_url ?? ''),
                  category: data.category ?? 'Dry Food',
                  stock_quantity: data.stock_quantity != null ? String(data.stock_quantity) : ''
                };
                setProductForm(mapped);
                await handleSaveProduct(mapped);
              }}
              onDelete={async (id: string) => { await handleDelete(id); }}
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-3 py-2 text-left">Gambar</th>
                  <th className="px-3 py-2 text-left">Nama</th>
                  <th className="px-3 py-2 text-left">Harga</th>
                  <th className="px-3 py-2 text-left">Stok</th>
                  <th className="px-3 py-2 text-left">Kategori</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-12 w-12 rounded object-cover bg-muted"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium">{product.name}</div>
                    </td>
                    <td className="px-3 py-2 align-top">{formatPrice(product.price)}</td>
                    <td className="px-3 py-2 align-top">{product.stock_quantity}</td>
                    <td className="px-3 py-2 align-top"><Badge variant="outline">{product.category}</Badge></td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingProduct(product)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <AlertDialog open={!!deletingProduct} onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>Produk yang dihapus tidak dapat dikembalikan. Lanjutkan?</AlertDialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingProduct && void handleDelete(deletingProduct.id)}>Hapus</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </AdminLayout>
  );
}


