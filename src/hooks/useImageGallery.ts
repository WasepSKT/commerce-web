import { useState, useRef, useEffect, useMemo } from 'react';

export const useImageGallery = (imageUrl: string, imageGallery?: string[]) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mainIndex, setMainIndex] = useState(0);
  const [lensVisible, setLensVisible] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  
  // Track previous gallery to detect actual product changes (not just cache busting)
  const previousGalleryRef = useRef<string>('');

  const ZOOM = 2;

  // Build gallery with cover image first - use useMemo to make it reactive
  const gallery = useMemo(() => {
    const galleryRaw = Array.isArray(imageGallery) ? imageGallery.slice() : [];
    const g = galleryRaw.filter(Boolean);
    if (imageUrl && imageUrl.trim() !== '') {
      // Remove cache busting params for comparison (everything after ?)
      const cleanImageUrl = imageUrl.split('?')[0];
      const idx = g.findIndex(url => {
        const cleanUrl = url.split('?')[0];
        return cleanUrl === cleanImageUrl;
      });
      if (idx !== -1) g.splice(idx, 1);
      g.unshift(imageUrl);
    }
    return g.length > 0 ? g : (imageUrl && imageUrl.trim() !== '' ? [imageUrl] : []); // Ensure at least one image if imageUrl exists
  }, [imageUrl, imageGallery]);

  // Create a stable hash of gallery URLs (without cache busting params) to detect actual changes
  const galleryHash = useMemo(() => {
    if (gallery.length === 0) return '';
    // Remove cache busting params and sort for stable comparison
    const cleanUrls = gallery.map(url => {
      const clean = url.split('?')[0];
      // Also remove any hash fragments
      return clean.split('#')[0];
    }).filter(Boolean).sort().join('|');
    return cleanUrls;
  }, [gallery]);

  // Reset index only when gallery actually changes (different product), not on cache busting
  useEffect(() => {
    // Only reset if this is a different product (different gallery URLs)
    // Skip reset on initial mount (when previousGalleryRef is empty)
    if (previousGalleryRef.current !== '' && previousGalleryRef.current !== galleryHash) {
      setMainIndex(0);
    }
    // Update ref after checking, so we track the current gallery
    previousGalleryRef.current = galleryHash;
  }, [galleryHash]);

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
