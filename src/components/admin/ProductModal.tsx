import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Plus, Loader2, Upload, Image as ImageIcon, X, Eye } from 'lucide-react';
import SEOPreview from '@/components/admin/SEOPreview';
import { ProductForm, Product } from '@/hooks/useProductCRUD';
import { ProductImageManager } from '@/utils/imageManagement';

// Additional small spec fields could be optional on ProductForm; we'll manage them locally in the modal

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productForm: ProductForm;
  setProductForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  editingProduct: Product | null;
  onSave: (form: ProductForm) => Promise<void>;
  loading: boolean;
  uploading: boolean;
  resetForm: () => void;
  showSEOPreview: boolean;
  setShowSEOPreview: (v: boolean) => void;
  handleImageSelect: (file?: File | null) => void;
};

export default function ProductModal({
  open,
  onOpenChange,
  productForm,
  setProductForm,
  editingProduct,
  onSave,
  loading,
  uploading,
  resetForm,
  showSEOPreview,
  setShowSEOPreview,
  handleImageSelect
}: Props) {
  // local specs state
  const [brand, setBrand] = React.useState('');
  const [productType, setProductType] = React.useState('');
  const [petType, setPetType] = React.useState('');
  const [originCountry, setOriginCountry] = React.useState('');
  const [expiryDate, setExpiryDate] = React.useState('');
  const [ageCategory, setAgeCategory] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [lengthVal, setLengthVal] = React.useState('');
  const [widthVal, setWidthVal] = React.useState('');
  const [heightVal, setHeightVal] = React.useState('');
  const [discountPercent, setDiscountPercent] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [shippingOptions, setShippingOptions] = React.useState<string[]>([]);

  // Sync local spec state when editingProduct or productForm changes
  React.useEffect(() => {
    if (editingProduct) {
      setBrand(editingProduct.brand ?? '');
      setProductType(editingProduct.product_type ?? '');
      setPetType(editingProduct.pet_type ?? '');
      setOriginCountry(editingProduct.origin_country ?? '');
      setExpiryDate(editingProduct.expiry_date ?? '');
      setAgeCategory(editingProduct.age_category ?? '');
      setWeight(editingProduct.weight_grams != null ? String(editingProduct.weight_grams) : '');
      setLengthVal(editingProduct.length_cm != null ? String(editingProduct.length_cm) : '');
      setWidthVal(editingProduct.width_cm != null ? String(editingProduct.width_cm) : '');
      setHeightVal(editingProduct.height_cm != null ? String(editingProduct.height_cm) : '');
      setDiscountPercent(editingProduct.discount_percent != null ? String(editingProduct.discount_percent) : '');
      setSku(editingProduct.sku ?? '');
      setShippingOptions(Array.isArray(editingProduct.shipping_options) ? (editingProduct.shipping_options as string[]) : []);
    } else {
      // reset when creating new
      setBrand(''); setProductType(''); setPetType(''); setOriginCountry(''); setExpiryDate(''); setAgeCategory(''); setWeight(''); setLengthVal(''); setWidthVal(''); setHeightVal(''); setDiscountPercent(''); setSku(''); setShippingOptions([]);
    }
  }, [editingProduct]);

  // helper to toggle shipping option
  const toggleShipping = (opt: string) => {
    setShippingOptions(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
  };
  // Local state to track fixed 4 slots (0-3) for images
  // This ensures each slot maintains its position and doesn't shift
  const [imageSlots, setImageSlots] = React.useState<{
    files: (File | undefined)[];
    previews: (string | undefined)[];
    gallery: (string | undefined)[];
    galleryPaths: (string | undefined)[];
  }>({
    files: [undefined, undefined, undefined, undefined],
    previews: [undefined, undefined, undefined, undefined],
    gallery: [undefined, undefined, undefined, undefined],
    galleryPaths: [undefined, undefined, undefined, undefined]
  });

  // Cleanup blob URLs when modal closes
  React.useEffect(() => {
    if (!open) {
      // Cleanup all blob URLs when modal closes
      setImageSlots((prev) => {
        prev.previews.forEach((preview) => {
          if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
          }
        });
        return prev; // Return unchanged to avoid state update
      });
    }
  }, [open]);

  // Track if we've initialized slots for this modal session
  const initializedRef = React.useRef(false);

  // Sync imageSlots with productForm when modal opens or editing product changes
  // Only initialize once when modal opens, then let imageSlots be the source of truth
  React.useEffect(() => {
    // Reset initialization flag when modal closes
    if (!open) {
      initializedRef.current = false;
      return;
    }

    // Only initialize once when modal opens
    if (initializedRef.current) return;

    // When editing: use imageGallery from productForm (populated by handleEdit)
    if (editingProduct) {
      const gallery = Array.isArray(productForm.imageGallery) ? productForm.imageGallery.filter(Boolean) : [];
      const galleryPaths = Array.isArray(productForm.imageGalleryPaths) ? productForm.imageGalleryPaths.filter(Boolean) : [];
      const previews = Array.isArray(productForm.imagePreviews) ? productForm.imagePreviews.filter(Boolean) : [];

      // Initialize fixed 4 slots
      const newSlots = {
        files: [undefined, undefined, undefined, undefined] as (File | undefined)[],
        previews: [undefined, undefined, undefined, undefined] as (string | undefined)[],
        gallery: [undefined, undefined, undefined, undefined] as (string | undefined)[],
        galleryPaths: [undefined, undefined, undefined, undefined] as (string | undefined)[]
      };

      // Map gallery URLs to slots sequentially (preserves order, max 4)
      gallery.forEach((url, idx) => {
        if (idx < 4 && url && url.trim() !== '') {
          newSlots.gallery[idx] = url;
          // Use preview if available, otherwise use gallery URL
          newSlots.previews[idx] = previews[idx] || url;
          // Map corresponding path if available
          if (idx < galleryPaths.length && galleryPaths[idx]) {
            newSlots.galleryPaths[idx] = galleryPaths[idx];
          }
        }
      });

      setImageSlots(newSlots);
      initializedRef.current = true;
    } else {
      // Reset slots when creating new product
      const resetSlots = {
        files: [undefined, undefined, undefined, undefined] as (File | undefined)[],
        previews: [undefined, undefined, undefined, undefined] as (string | undefined)[],
        gallery: [undefined, undefined, undefined, undefined] as (string | undefined)[],
        galleryPaths: [undefined, undefined, undefined, undefined] as (string | undefined)[]
      };

      setImageSlots(resetSlots);
      initializedRef.current = true;
    }
  }, [editingProduct, open, productForm.imageGallery, productForm.imageGalleryPaths, productForm.imagePreviews]);

  // Helper to select a file for a specific slot (slot position is fixed 0-3)
  const selectFileForSlot = (idx: number) => {
    if (idx < 0 || idx >= 4) return; // Ensure valid slot index

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const v = ProductImageManager.validateImageFile(file);
      if (!v.valid) return alert(v.error);

      const previewUrl = URL.createObjectURL(file);

      // Update local slot state and productForm simultaneously
      setImageSlots(prev => {
        // Clean up old blob URL if exists to prevent memory leak
        if (prev.previews[idx] && prev.previews[idx]?.startsWith('blob:')) {
          URL.revokeObjectURL(prev.previews[idx]!);
        }

        const newSlots = {
          files: [...prev.files],
          previews: [...prev.previews],
          gallery: [...prev.gallery],
          galleryPaths: [...prev.galleryPaths]
        };

        // Set new file and blob preview
        newSlots.files[idx] = file;
        newSlots.previews[idx] = previewUrl;

        // Clear gallery URL at this slot since we're replacing with new file
        // (gallery will be updated after upload)
        newSlots.gallery[idx] = undefined;
        newSlots.galleryPaths[idx] = undefined;

        // Update productForm with filtered arrays (for backward compatibility)
        setProductForm(prevForm => ({
          ...prevForm,
          imageFiles: newSlots.files.filter((f): f is File => f !== undefined),
          imagePreviews: newSlots.previews.filter((p): p is string => p !== undefined),
          imageGallery: newSlots.gallery.filter((g): g is string => g !== undefined && g !== null),
          imageGalleryPaths: newSlots.galleryPaths.filter((p): p is string => p !== undefined && p !== null && p.trim() !== '')
        }));

        return newSlots;
      });
    };
    input.click();
  };

  // Remove slot at specific index (only clears that slot, doesn't shift others)
  const removeSlot = (idx: number) => {
    if (idx < 0 || idx >= 4) return; // Ensure valid slot index

    // Update local slot state and productForm simultaneously
    setImageSlots(prev => {
      // Cleanup blob URL if exists
      if (prev.previews[idx] && prev.previews[idx]?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.previews[idx]!);
      }

      const newSlots = {
        files: [...prev.files],
        previews: [...prev.previews],
        gallery: [...prev.gallery],
        galleryPaths: [...prev.galleryPaths]
      };

      // Clear only this specific slot
      newSlots.files[idx] = undefined;
      newSlots.previews[idx] = undefined;
      newSlots.gallery[idx] = undefined;
      newSlots.galleryPaths[idx] = undefined;

      // Update productForm with filtered arrays (use newSlots, not prev)
      setProductForm(prevForm => ({
        ...prevForm,
        imageFiles: newSlots.files.filter((f): f is File => f !== undefined),
        imagePreviews: newSlots.previews.filter((p): p is string => p !== undefined),
        imageGallery: newSlots.gallery.filter((g): g is string => g !== undefined && g !== null),
        imageGalleryPaths: newSlots.galleryPaths.filter((p): p is string => p !== undefined && p !== null && p.trim() !== '')
      }));

      return newSlots;
    });
  };
  // Derived placeholder for product type based on category/petType
  const derivedProductTypePlaceholder = React.useMemo(() => {
    if (productForm.category && productForm.category.toLowerCase().includes('makanan')) {
      return petType === 'Kucing' ? 'Contoh: Basah, Kering, Grain-free' : 'Contoh: Basah, Kering';
    }
    return 'Contoh: Aksesoris, Mainan, Perawatan';
  }, [productForm.category, petType]);

  // Description validation
  const DESCRIPTION_MIN = 50;
  const DESCRIPTION_MAX = 4500;
  const descriptionLength = productForm.description ? productForm.description.length : 0;
  const descriptionValid = descriptionLength >= DESCRIPTION_MIN && descriptionLength <= DESCRIPTION_MAX;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {/* Professional Image Upload Section (moved to top) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                Gambar Produk
              </h3>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Foto Produk (Max 4 gambar, 2MB tiap gambar) — rasio 1:1
                </Label>

                <div className="mt-2 grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    // Use imageSlots for display to maintain fixed slot positions
                    // Priority: preview (for new files) > gallery URL (for existing images)
                    const slotPreview = imageSlots.previews[idx] || imageSlots.gallery[idx];
                    const hasImage = slotPreview !== undefined && slotPreview !== null && slotPreview.trim() !== '';

                    return (
                      <div key={idx} className="flex flex-col items-stretch">
                        <div className="relative w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-white">
                          {hasImage ? (
                            <>
                              <img
                                src={slotPreview}
                                className="w-full h-full object-cover"
                                alt={`preview-${idx}`}
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <div className="absolute top-2 right-2 flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeSlot(idx)}
                                  className="bg-white/90 hover:bg-white"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-2 text-sm text-muted-foreground">
                              <div>Tambah Foto</div>
                              <div className="mt-2">
                                <Button size="sm" variant="outline" onClick={() => selectFileForSlot(idx)}>
                                  <Upload className="w-4 h-4 mr-2" /> Pilih
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">Max 2MB • JPG/PNG/WEBP/GIF</div>
                            </div>
                          )}
                        </div>
                        <div className="text-center text-xs text-muted-foreground mt-2">
                          {idx === 0 && 'Tambah Foto Produk (Cover)'}
                          {idx === 1 && 'Tambah Foto Produk (Varian)'}
                          {idx === 2 && 'Tambah Foto Produk (Ukuran)'}
                          {idx === 3 && 'Tambah Foto Produk (Detail)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">Gambar akan dioptimalkan, disimpan terstruktur, dan ditampilkan dengan rasio 1:1.</p>
              </div>
            </div>

            {/* Product Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                Informasi Dasar
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2 lg:col-span-2">
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
                  rows={6}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Berikan deskripsi yang menarik dan informatif untuk customer</p>
                  <p className={`text-xs ${descriptionLength < DESCRIPTION_MIN || descriptionLength > DESCRIPTION_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {descriptionLength}/{DESCRIPTION_MAX}
                  </p>
                </div>
              </div>
            </div>

            {/* duplicate image section removed */}

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
                    onValueChange={(value) => {
                      // reset dependent fields when category changes
                      setProductForm(prev => ({ ...prev, category: value }));
                      setProductType('');
                      setPetType('');
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Pilih kategori produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Makanan Hewan">Makanan Hewan</SelectItem>
                      <SelectItem value="Kebutuhan Dasar">Kebutuhan Dasar</SelectItem>
                      <SelectItem value="Perawatan & Kesehatan">Perawatan & Kesehatan</SelectItem>
                      <SelectItem value="Aksesoris">Aksesoris</SelectItem>
                      <SelectItem value="Camilan & Treats">Camilan & Treats</SelectItem>
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

              {/* 'Jenis Hewan' under category removed — use the field in Spesifikasi Produk instead */}
            </div>

            {/* Specifications & Sales Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary">Spesifikasi Produk</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Merk</Label>
                  <Input value={brand} onChange={e => setBrand(e.target.value)} />
                </div>
                <div>
                  <Label>Jenis Produk</Label>
                  <Select value={productType} onValueChange={(v) => setProductType(v)}>
                    {/* Reduce left padding so placeholder doesn't appear too indented */}
                    <SelectTrigger className="h-11 pl-2 pr-3"><SelectValue placeholder={derivedProductTypePlaceholder} /></SelectTrigger>
                    <SelectContent>
                      {productForm.category && productForm.category.toLowerCase().includes('makanan') ? (
                        <>
                          <SelectItem value="Basah">Basah</SelectItem>
                          <SelectItem value="Kering">Kering</SelectItem>
                          <SelectItem value="Grain-free">Grain-free</SelectItem>
                          <SelectItem value="Treats">Treats</SelectItem>
                        </>
                      ) : productForm.category && productForm.category.toLowerCase().includes('kebutuhan') ? (
                        <>
                          <SelectItem value="Kandang">Kandang</SelectItem>
                          <SelectItem value="Keranjang">Keranjang</SelectItem>
                          <SelectItem value="Mainan">Mainan</SelectItem>
                          <SelectItem value="Tempat Makan">Tempat Makan</SelectItem>
                        </>
                      ) : productForm.category && productForm.category.toLowerCase().includes('perawatan') ? (
                        <>
                          <SelectItem value="Sampo">Sampo</SelectItem>
                          <SelectItem value="Vitamin">Vitamin</SelectItem>
                          <SelectItem value="Obat-obatan">Obat-obatan</SelectItem>
                          <SelectItem value="Peralatan Perawatan">Peralatan Perawatan</SelectItem>
                        </>
                      ) : productForm.category && productForm.category.toLowerCase().includes('aksesoris') ? (
                        <>
                          <SelectItem value="Tali">Tali</SelectItem>
                          <SelectItem value="Kalung">Kalung</SelectItem>
                          <SelectItem value="Baju">Baju</SelectItem>
                          <SelectItem value="Grooming">Grooming</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Umum">Umum</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Jenis Hewan</Label>
                  <div className="flex gap-2">
                    <Select value={petType} onValueChange={(v) => setPetType(v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Pilih hewan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kucing">Kucing</SelectItem>
                        <SelectItem value="Anjing">Anjing</SelectItem>
                        <SelectItem value="Burung">Burung</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Negara Asal</Label>
                  <Input value={originCountry} onChange={e => setOriginCountry(e.target.value)} />
                </div>
                <div>
                  <Label>Tanggal Kadaluarsa</Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="h-11 cursor-pointer"
                    title={expiryDate ? `Kadaluarsa: ${expiryDate}` : 'Klik untuk pilih tanggal kadaluarsa'}
                  />
                </div>
                <div>
                  <Label>Usia</Label>
                  <Select value={ageCategory} onValueChange={(v) => setAgeCategory(v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Pilih usia" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Anak">Anak-anak</SelectItem>
                      <SelectItem value="Dewasa">Dewasa</SelectItem>
                      <SelectItem value="Semua">Semua usia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h3 className="text-lg font-medium text-primary">Informasi Penjualan</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Harga (Rp)</Label>
                  <Input type="number" value={productForm.price} onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))} />
                </div>
                <div>
                  <Label>Diskon (%)</Label>
                  <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} />
                </div>
                <div>
                  <Label>Harga Setelah Diskon</Label>
                  <Input value={productForm.price && discountPercent ? String(Math.round(Number(productForm.price) * (1 - Number(discountPercent) / 100))) : ''} readOnly />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))} />
                </div>
              </div>

              <h3 className="text-lg font-medium text-primary">Detail Paket</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Berat (gr)</Label>
                  <Input value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div>
                  <Label>Panjang (cm)</Label>
                  <Input value={lengthVal} onChange={e => setLengthVal(e.target.value)} />
                </div>
                <div>
                  <Label>Lebar (cm)</Label>
                  <Input value={widthVal} onChange={e => setWidthVal(e.target.value)} />
                </div>
                <div>
                  <Label>Tinggi (cm)</Label>
                  <Input value={heightVal} onChange={e => setHeightVal(e.target.value)} />
                </div>
              </div>

              <h3 className="text-lg font-medium text-primary">Jasa Kirim</h3>
              <div className="flex gap-3">
                {['Reguler', 'Economy', 'Cargo', 'Instan'].map(opt => (
                  <Button key={opt} variant={shippingOptions.includes(opt) ? 'default' : 'outline'} onClick={() => toggleShipping(opt)}>{opt}</Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>SKU Induk</Label>
                <Input value={sku} onChange={e => setSku(e.target.value)} />
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
                  ogImage={(productForm.imagePreviews && productForm.imagePreviews[0]) || productForm.image_url}
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
                onOpenChange(false);
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
              onClick={async () => {
                // Prepare arrays from imageSlots (fixed 4 slots)
                // This ensures each file/gallery item is in the correct slot position
                const imageFilesWithSlots: (File | undefined)[] = imageSlots.files;
                const imagePreviewsWithSlots: (string | undefined)[] = imageSlots.previews;
                const imageGalleryWithSlots: (string | undefined)[] = imageSlots.gallery;
                const imageGalleryPathsWithSlots: (string | undefined)[] = imageSlots.galleryPaths;

                // Build arrays with slot information preserved
                // For files: create array with slot index info
                const filesWithSlotInfo: { file: File; slotIndex: number }[] = [];
                const previewsWithSlotInfo: { preview: string; slotIndex: number }[] = [];

                for (let i = 0; i < 4; i++) {
                  if (imageFilesWithSlots[i] !== undefined) {
                    filesWithSlotInfo.push({ file: imageFilesWithSlots[i]!, slotIndex: i });
                  }
                  if (imagePreviewsWithSlots[i] !== undefined && imagePreviewsWithSlots[i]?.trim() !== '') {
                    previewsWithSlotInfo.push({ preview: imagePreviewsWithSlots[i]!, slotIndex: i });
                  }
                }

                // Build final gallery preserving slot positions
                const finalGallery: (string | undefined)[] = [];
                const finalPaths: (string | undefined)[] = [];

                for (let i = 0; i < 4; i++) {
                  const hasFile = imageFilesWithSlots[i] !== undefined;
                  const hasGallery = imageGalleryWithSlots[i] !== undefined && imageGalleryWithSlots[i]?.trim() !== '';

                  if (hasFile) {
                    // New file: will be uploaded, gallery URL will be set after upload
                    // For now, keep existing gallery URL if any, or use preview as placeholder
                    finalGallery[i] = imageGalleryWithSlots[i] || imagePreviewsWithSlots[i];
                  } else if (hasGallery) {
                    // Existing image: use gallery URL
                    finalGallery[i] = imageGalleryWithSlots[i];
                    if (imageGalleryPathsWithSlots[i]) {
                      finalPaths[i] = imageGalleryPathsWithSlots[i];
                    }
                  }
                }

                // Build meta with slot information
                const metaWithSlots = {
                  ...(productForm.meta || {}),
                  _imageFileSlots: filesWithSlotInfo.map(item => item.slotIndex), // Slot indices for each file
                  _imagePreviewSlots: previewsWithSlotInfo.map(item => item.slotIndex), // Slot indices for each preview
                };

                const merged: ProductForm = {
                  ...productForm,
                  // Send files and previews in order, but we'll use slot info to map correctly
                  imageFiles: filesWithSlotInfo.map(item => item.file),
                  imagePreviews: previewsWithSlotInfo.map(item => item.preview),
                  // Send gallery with slot positions preserved (use index as slot indicator)
                  imageGallery: finalGallery.filter((g): g is string => g !== undefined && g !== null),
                  imageGalleryPaths: finalPaths.filter((p): p is string => p !== undefined && p !== null && p.trim() !== ''),
                  // Add slot mapping info to meta for useProductCRUD to use
                  meta: metaWithSlots,
                  brand,
                  product_type: productType || productForm.product_type,
                  pet_type: petType || productForm.pet_type,
                  origin_country: originCountry || productForm.origin_country,
                  expiry_date: expiryDate || productForm.expiry_date,
                  age_category: ageCategory || productForm.age_category,
                  weight_grams: weight ? Number(weight) : (productForm.weight_grams ?? undefined),
                  length_cm: lengthVal ? Number(lengthVal) : (productForm.length_cm ?? undefined),
                  width_cm: widthVal ? Number(widthVal) : (productForm.width_cm ?? undefined),
                  height_cm: heightVal ? Number(heightVal) : (productForm.height_cm ?? undefined),
                  discount_percent: discountPercent ? Number(discountPercent) : (productForm.discount_percent ?? undefined),
                  sku: sku || productForm.sku,
                  shipping_options: shippingOptions.length ? shippingOptions : (productForm.shipping_options ?? [])
                };
                await onSave(merged);
              }}
              disabled={
                loading ||
                uploading ||
                !productForm.name ||
                !productForm.price ||
                !productForm.description ||
                (!descriptionValid && !editingProduct)
              }
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
  );
}
