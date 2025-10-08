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
import { Edit, Plus, Trash2, Loader2, Eye, EyeOff, Upload, Image as ImageIcon, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import SEOPreview from '@/components/admin/SEOPreview';
import { useAutoSEO } from '@/hooks/useAutoSEO';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    product: null as Product | null,
    action: 'activate' as 'activate' | 'deactivate'
  });
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [showSEOPreview, setShowSEOPreview] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    imageFile: null,
    imagePreview: '',
    category: 'Dry Food',
    stock_quantity: ''
  });
  const { generateMetaDescription, generateKeywords } = useAutoSEO();

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
      imageFile: null,
      imagePreview: '',
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
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
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
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url,
      imageFile: null,
      imagePreview: product.image_url,
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

  const handleToggleStatus = (product: Product) => {
    setConfirmDialog({
      open: true,
      product,
      action: product.is_active ? 'deactivate' : 'activate'
    });
  };

  const confirmToggleStatus = async () => {
    if (!confirmDialog.product) return;

    setToggleLoading(confirmDialog.product.id);
    try {
      await toggleProductStatus(confirmDialog.product.id, !confirmDialog.product.is_active);
      setConfirmDialog({ open: false, product: null, action: 'activate' });
      await loadProducts();
    } catch (error) {
      console.error('Toggle status error:', error);
    } finally {
      setToggleLoading(null);
    }
  };

  if (loading && products.length === 0) {
    return (
      <AdminLayout>
        <SEOHead
          title="Manajemen Produk - Admin Regal Paw"
          description="Panel admin untuk mengelola produk makanan kucing premium. Tambah, edit, dan hapus produk dengan sistem manajemen gambar terstruktur."
          keywords="admin produk, manajemen produk, Regal Paw, makanan kucing"
          canonical="/admin/products"
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
        title="Manajemen Produk - Admin Regal Paw"
        description="Panel admin untuk mengelola produk makanan kucing premium. Tambah, edit, dan hapus produk dengan sistem manajemen gambar terstruktur."
        keywords="admin produk, manajemen produk, Regal Paw, makanan kucing"
        canonical="/admin/products"
        ogType="website"
        noindex={true}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Product Management</h1>
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
                        <h3 className="font-semibold text-lg text-primary">{product.name}</h3>
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
                      disabled={loading || toggleLoading === product.id}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      {toggleLoading === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : product.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingProduct(product)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modern Product Dialog */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10">
                  {editingProduct ? <Edit className="w-5 h-5 text-brand-primary" /> : <Plus className="w-5 h-5 text-brand-primary" />}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-brand-primary">
                    {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 mt-1">
                    {editingProduct
                      ? 'Perbarui informasi produk dengan detail yang akurat'
                      : 'Tambahkan produk baru dengan informasi lengkap dan gambar berkualitas'
                    }
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                {/* Product Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                    Informasi Dasar
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Nama Produk <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Royal Canin Adult Cat Food"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                        Harga (Rp) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="150000"
                          className="h-11 pl-12"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Deskripsi Produk <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Deskripsi detail tentang produk, manfaat, dan spesifikasinya..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">Berikan deskripsi yang menarik dan informatif untuk customer</p>
                  </div>
                </div>

                {/* Product Categories and Stock */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                    Kategori & Stok
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                        Kategori <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih kategori produk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dry Food">🥘 Dry Food</SelectItem>
                          <SelectItem value="Wet Food">🍲 Wet Food</SelectItem>
                          <SelectItem value="Kitten Food">🐱 Kitten Food</SelectItem>
                          <SelectItem value="Treats">🍪 Treats</SelectItem>
                          <SelectItem value="Accessories">🎾 Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                        Jumlah Stok <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                        placeholder="100"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Image Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                    Gambar Produk
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Upload Gambar <span className="text-red-500">*</span>
                    </Label>

                    <div
                      className="group relative w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-primary/50 transition-colors duration-200 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:from-brand-primary/5 hover:to-brand-secondary/5"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageSelect(file);
                      }}
                    >
                      {productForm.imagePreview ? (
                        <div className="relative p-4">
                          <div className="relative rounded-lg overflow-hidden bg-white shadow-sm border">
                            <img
                              src={productForm.imagePreview}
                              alt="Product Preview"
                              className="w-full h-64 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
                          </div>

                          <div className="absolute top-6 right-6 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
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
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0 shadow-lg"
                              onClick={() => setProductForm(prev => ({
                                ...prev,
                                imageFile: null,
                                imagePreview: ''
                              }))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600">Gambar produk sudah dipilih</p>
                            <p className="text-xs text-gray-500 mt-1">Klik tombol edit untuk mengganti gambar</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8">
                          <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <Upload className="w-8 h-8 text-brand-primary" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-secondary flex items-center justify-center">
                                <ImageIcon className="w-3 h-3 text-white" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-lg font-medium text-gray-900">Upload Gambar Produk</h4>
                              <p className="text-sm text-gray-600 max-w-sm">
                                Drag & drop gambar di sini atau klik tombol di bawah untuk memilih file
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
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
                              className="h-12 px-6 bg-white hover:bg-brand-primary hover:text-white border-2 hover:border-brand-primary transition-all duration-200"
                            >
                              <Upload className="w-5 h-5 mr-2" />
                              Pilih Gambar
                            </Button>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Max 5MB
                              </span>
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                JPG, PNG, WEBP, GIF
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Gambar akan dioptimalkan secara otomatis untuk performa terbaik
                    </p>
                  </div>
                </div>

                {/* SEO Preview Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                        SEO Preview
                      </h3>
                      <p className="text-sm text-gray-600">Lihat bagaimana produk akan muncul di hasil pencarian</p>
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

                  {showSEOPreview && (
                    <SEOPreview
                      title={productForm.name ? `${productForm.name} - ${productForm.category} Premium | Regal Paw` : 'Nama Produk - Kategori Premium | Regal Paw'}
                      description={productForm.description || 'Deskripsi produk akan muncul di sini...'}
                      keywords={productForm.name ? `${productForm.name}, makanan kucing ${productForm.category}, ${productForm.category}, Regal Paw, makanan kucing premium, nutrisi kucing, kesehatan kucing` : 'Keywords akan di-generate otomatis...'}
                      ogImage={productForm.imagePreview || productForm.image_url}
                      canonical={`/product/${productForm.name ? productForm.name.toLowerCase().replace(/\s+/g, '-') : 'nama-produk'}`}
                      type="product"
                    />
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 flex-shrink-0">
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsProductDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1 sm:flex-none h-11 border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200"
                  disabled={loading || uploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>

                <Button
                  type="submit"
                  onClick={handleSaveProduct}
                  disabled={loading || uploading || !productForm.name || !productForm.price || !productForm.description}
                  className="flex-1 sm:flex-none h-11 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">
                        {uploading ? 'Mengupload gambar...' : 'Menyimpan produk...'}
                      </span>
                      <span className="sm:hidden">
                        {uploading ? 'Upload...' : 'Simpan...'}
                      </span>
                    </>
                  ) : (
                    <>
                      {editingProduct ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Perbarui Produk</span>
                          <span className="sm:hidden">Perbarui</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Simpan Produk</span>
                          <span className="sm:hidden">Simpan</span>
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl text-primary">Hapus Produk</AlertDialogTitle>
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

        {/* Status Toggle Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {confirmDialog.action === 'activate' ? (
                  <>
                    <Eye className="h-5 w-5 text-brand-primary" />
                    <span className="text-brand-primary">Aktifkan Produk</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-5 w-5 text-brand-primary" />
                    <span className="text-brand-primary">Non-aktifkan Produk</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <p>
                  {confirmDialog.action === 'activate'
                    ? 'Produk ini akan diaktifkan dan dapat dilihat oleh pelanggan di website.'
                    : 'Produk ini akan dinon-aktifkan dan tidak akan terlihat oleh pelanggan di website.'
                  }
                </p>
                {confirmDialog.product && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-medium text-sm">{confirmDialog.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Status saat ini: <Badge variant={confirmDialog.product.is_active ? 'default' : 'secondary'}>
                        {confirmDialog.product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Harga: Rp {confirmDialog.product.price.toLocaleString()} • Stock: {confirmDialog.product.stock_quantity}
                    </p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, product: null, action: 'activate' })}
                disabled={toggleLoading !== null}
                className="w-full sm:w-auto border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
              >
                Batal
              </Button>
              <Button
                onClick={confirmToggleStatus}
                disabled={toggleLoading !== null}
                className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-90 text-white"
              >
                {toggleLoading !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {confirmDialog.action === 'activate' ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Ya, Aktifkan
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Ya, Non-aktifkan
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