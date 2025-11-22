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
import ProductModal from '@/components/admin/ProductModal';
import { useAutoSEO } from '@/hooks/useAutoSEO';
import computePriceAfterDiscount from '@/utils/price';

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
    imageFiles: [],
    imagePreviews: [],
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
      // put selected file into first slot
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

    // Build image gallery: combine image_url and image_gallery, max 4 images
    // image_url is the cover (slot 0), then add from image_gallery
    const gallery = Array.isArray(product.image_gallery) ? product.image_gallery.filter(Boolean) as string[] : [];
    const imageGallery: string[] = [];

    // Add image_url as first image (cover) if it exists
    if (product.image_url && product.image_url.trim() !== '') {
      imageGallery.push(product.image_url);
    }

    // Add remaining images from gallery (avoid duplicates)
    for (const g of gallery) {
      if (imageGallery.length >= 4) break;
      if (g && g.trim() !== '' && !imageGallery.includes(g)) {
        imageGallery.push(g);
      }
    }

    // Build previews array (same as imageGallery for display)
    const previews = [...imageGallery];

    // Get image_gallery_paths from product (may not be in Product type, so use type assertion)
    const productWithPaths = product as Product & { image_gallery_paths?: string[] | null };
    const imageGalleryPaths = Array.isArray(productWithPaths.image_gallery_paths)
      ? productWithPaths.image_gallery_paths.filter(Boolean) as string[]
      : [];

    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url || '',
      imageFiles: [],
      imagePreviews: previews,
      // Set imageGallery and imageGalleryPaths so ProductModal can display existing images
      imageGallery: imageGallery,
      imageGalleryPaths: imageGalleryPaths,
      category: product.category,
      stock_quantity: product.stock_quantity.toString(),
      brand: product.brand ?? undefined,
      product_type: product.product_type ?? undefined,
      pet_type: product.pet_type ?? undefined,
      origin_country: product.origin_country ?? undefined,
      expiry_date: product.expiry_date ?? undefined,
      age_category: product.age_category ?? undefined,
      weight_grams: product.weight_grams ?? undefined,
      length_cm: product.length_cm ?? undefined,
      width_cm: product.width_cm ?? undefined,
      height_cm: product.height_cm ?? undefined,
      discount_percent: product.discount_percent ?? undefined,
      sku: product.sku ?? undefined,
      shipping_options: Array.isArray(product.shipping_options) ? product.shipping_options : []
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
                          {product.discount_percent && product.discount_percent > 0 ? (
                            <div className="flex items-baseline space-x-3">
                              <span className="text-sm text-muted-foreground line-through">Rp {product.price.toLocaleString()}</span>
                              <span className="text-sm font-semibold text-danger">Rp {computePriceAfterDiscount({ price: product.price, discount_percent: product.discount_percent }).discounted.toLocaleString()}</span>
                              <Badge className="ml-2" variant="destructive">Diskon {product.discount_percent}%</Badge>
                            </div>
                          ) : (
                            <span className="text-sm font-medium">Rp {product.price.toLocaleString()}</span>
                          )}
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

        <ProductModal
          open={isProductDialogOpen}
          onOpenChange={setIsProductDialogOpen}
          productForm={productForm}
          setProductForm={setProductForm}
          editingProduct={editingProduct}
          onSave={async (form) => {
            // gunakan form yang sudah digabung dari modal
            try {
              if (editingProduct) {
                await updateProduct(editingProduct.id, form);
              } else {
                await createProduct(form);
              }
              setIsProductDialogOpen(false);
              resetForm();
              await loadProducts();
            } catch (e) {
              console.error('Save product error:', e);
            }
          }}
          loading={loading}
          uploading={uploading}
          resetForm={resetForm}
          showSEOPreview={showSEOPreview}
          setShowSEOPreview={setShowSEOPreview}
          handleImageSelect={handleImageSelect}
        />

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