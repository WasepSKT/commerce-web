import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useProductCRUD, ProductForm, Product } from '@/hooks/useProductCRUD';
import { ProductImageManager } from '@/utils/imageManagement';
import { TableSkeleton, HeaderSkeleton } from '@/components/ui/AdminSkeleton';
import SEOHead from '@/components/seo/SEOHead';
import { generateBreadcrumbStructuredData } from '@/utils/seoData';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    imageFiles: [],
    imagePreviews: [],
    category: 'Dry Food',
    stock_quantity: ''
  });

  // Enhanced CRUD hook
  const {
    loading,
    uploading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus
  } = useProductCRUD();

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, [fetchProducts]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      imageFiles: [],
      imagePreviews: [],
      category: 'Dry Food',
      stock_quantity: ''
    });
    setEditingProduct(null);
  };

  const handleImageSelect = (file?: File | null) => {
    if (!file) return;

    // Validate file
    const validation = ProductImageManager.validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setProductForm((prev) => ({
      ...prev,
      imageFiles: [file, ...(prev.imageFiles || []).slice(1)].slice(0, 4),
      imagePreviews: [URL.createObjectURL(file), ...(prev.imagePreviews || []).slice(1)].slice(0, 4),
    }));
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
      } else {
        await createProduct(productForm);
      }

      setIsProductDialogOpen(false);
      resetForm();
      await loadProducts();
    } catch (error) {
      console.error('Save product error:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const previews = product.image_url ? [product.image_url] : [];
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url,
      imageFiles: [],
      imagePreviews: previews,
      category: product.category,
      stock_quantity: product.stock_quantity.toString()
    });
    setIsProductDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Delete product error:', error);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await toggleProductStatus(product.id, !product.is_active);
      await loadProducts();
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  if (loading && products.length === 0) {
    return (
      <AdminLayout>
        <SEOHead
          title="Manajemen Produk Enhanced - Admin Regal Paw"
          description="Panel admin untuk mengelola produk makanan kucing premium. Tambah, edit, dan hapus produk dengan sistem manajemen gambar terstruktur."
          keywords="admin produk enhanced, manajemen produk, Regal Paw, makanan kucing"
          canonical="/admin/products-enhanced"
          ogType="website"
          noindex={true}
        />
        <div className="space-y-6">
          <HeaderSkeleton />
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <TableSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SEOHead
        title="Manajemen Produk Enhanced - Admin Regal Paw"
        description="Panel admin untuk mengelola produk makanan kucing premium. Tambah, edit, dan hapus produk dengan sistem manajemen gambar terstruktur."
        keywords="admin produk enhanced, manajemen produk, Regal Paw, makanan kucing"
        canonical="/admin/products-enhanced"
        ogType="website"
        noindex={true}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">
              Kelola produk dengan sistem manajemen gambar terstruktur
            </p>
          </div>
          <Button onClick={() => setIsProductDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>

        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">{product.category}</Badge>
                          <span className="text-sm font-medium">
                            Rp {product.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Stock: {product.stock_quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(product)}
                      disabled={loading}
                    >
                      {product.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingProduct(product)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Product Dialog */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Perbarui informasi produk dengan manajemen gambar terstruktur'
                  : 'Tambahkan produk baru dengan sistem manajemen gambar yang robust'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Masukkan nama produk"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Harga</Label>
                  <Input
                    id="price"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Masukkan harga"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan deskripsi produk"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={productForm.category}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dry Food">Dry Food</SelectItem>
                      <SelectItem value="Wet Food">Wet Food</SelectItem>
                      <SelectItem value="Kitten Food">Kitten Food</SelectItem>
                      <SelectItem value="Treats">Treats</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    placeholder="Masukkan jumlah stok"
                  />
                </div>
              </div>

              <div>
                <Label>Gambar Produk</Label>
                <div className="mt-2">
                  <div
                    className="w-full rounded-lg border-dashed border-2 p-6 flex flex-col items-center justify-center space-y-4 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                  >
                    {(productForm.imagePreviews && productForm.imagePreviews[0]) ? (
                      <div className="relative w-full max-w-md">
                        <img
                          src={productForm.imagePreviews[0]}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setProductForm(prev => ({
                            ...prev,
                            imageFiles: [],
                            imagePreviews: []
                          }))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="text-sm text-muted-foreground mb-4">
                          Drag & drop gambar di sini atau klik untuk memilih
                        </div>
                        <Button
                          type="button"
                          variant="outline"
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
                          Pilih Gambar
                        </Button>
                        <div className="text-xs text-muted-foreground mt-2">
                          Max 5MB • JPG, PNG, WEBP, GIF
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsProductDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={loading || uploading}
              >
                {loading || uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploading ? 'Uploading...' : 'Menyimpan...'}
                  </>
                ) : (
                  editingProduct ? 'Perbarui' : 'Simpan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus produk "{deletingProduct?.name}"?
                Tindakan ini akan menghapus produk dan semua gambar terkait secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
