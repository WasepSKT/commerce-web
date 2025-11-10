import { useState, useRef, useEffect } from 'react';

export const useImageGallery = (imageUrl: string, imageGallery?: string[]) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mainIndex, setMainIndex] = useState(0);
  const [lensVisible, setLensVisible] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });

  const ZOOM = 2;

  // Build gallery with cover image first
  const buildGallery = () => {
    const galleryRaw = Array.isArray(imageGallery) ? imageGallery.slice() : [];
    const g = galleryRaw.filter(Boolean);
    if (imageUrl) {
      const idx = g.indexOf(imageUrl);
      if (idx !== -1) g.splice(idx, 1);
      g.unshift(imageUrl);
    }
    return g.length > 0 ? g : [imageUrl]; // Ensure at least one image
  };

  const gallery = buildGallery();

  // Reset index when product changes
  useEffect(() => {
    setMainIndex(0);
  }, [imageUrl, imageGallery]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;
    
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = Math.max(0, Math.min(x, rect.width));
    const cy = Math.max(0, Math.min(y, rect.height));
    const px = (cx / rect.width) * 100;
    const py = (cy / rect.height) * 100;
    
    setBgPos({ x: px, y: py });
    setLensVisible(true);
  };

  const hasMultipleImages = gallery.length > 1;

  return {
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
  };
};
