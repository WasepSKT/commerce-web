import { Badge } from '@/components/ui/badge';
import { useImageGallery } from '@/hooks/useImageGallery';

interface ProductImageGalleryProps {
  imageUrl: string;
  imageGallery?: string[];
  productName: string;
  discountPercent?: number;
  isOutOfStock: boolean;
}

export const ProductImageGallery = ({
  imageUrl,
  imageGallery,
  productName,
  discountPercent,
  isOutOfStock
}: ProductImageGalleryProps) => {
  const {
    imgRef,
    containerRef,
    mainIndex,
    setMainIndex,
    lensVisible,
    setLensVisible,
    bgPos,
    ZOOM,
    gallery,
    handleMouseMove,
    hasMultipleImages,
  } = useImageGallery(imageUrl, imageGallery);

  const clampedIndex = Math.min(Math.max(mainIndex, 0), Math.max(gallery.length - 1, 0));
  const mainImage = gallery[clampedIndex] ?? 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=600';

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-lg">
        <div
          ref={containerRef}
          className="w-full aspect-square bg-gray-100 relative overflow-hidden rounded-lg"
          style={{ cursor: 'zoom-in' }}
          onMouseEnter={() => setLensVisible(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setLensVisible(false)}
        >
          <img
            ref={imgRef}
            src={mainImage}
            alt={productName}
            className="w-full h-full object-cover transform-gpu"
            style={{
              transformOrigin: `${bgPos.x}% ${bgPos.y}%`,
              transform: lensVisible ? `scale(${ZOOM})` : 'none',
              transition: 'transform 0.08s linear',
            }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=600';
            }}
          />

          {/* Discount Badge */}
          {discountPercent && discountPercent > 0 && (
            <div className="absolute top-3 right-3 z-20">
              <span className="inline-block bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-md shadow-lg">
                Diskon {discountPercent}%
              </span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none rounded-lg">
              <Badge variant="destructive" className="text-lg p-2">Stok Habis</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails - Only show if there are multiple images */}
      {hasMultipleImages && (
        <div className="flex items-center gap-3">
          {gallery.slice(0, 4).map((src, i) => {
            const selected = i === clampedIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setMainIndex(i)}
                className={`w-20 h-20 rounded-md overflow-hidden border ${selected
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-gray-200 hover:border-primary/60'
                  } transition-colors`}
              >
                <img
                  src={src}
                  alt={`thumb-${i}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
