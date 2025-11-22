import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export const useImageGallery = (imageUrl: string, imageGallery?: string[]) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mainIndex, setMainIndex] = useState(0);
  const [lensVisible, setLensVisible] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  
  // Track previous gallery hash to detect actual product changes (not just cache busting)
  const previousGalleryHashRef = useRef<string>('');
  // Track if this is the first mount
  const isFirstMountRef = useRef(true);
  // Track if user manually changed the index (to prevent reset)
  // Use timestamp to track recent user interaction
  const lastUserInteractionRef = useRef<number>(0);

  const ZOOM = 2;

  // Helper to clean URL (remove cache busting params and hash fragments)
  const cleanUrl = useCallback((url: string) => {
    return url.split('?')[0].split('#')[0];
  }, []);

  // Build gallery with cover image first - use useMemo to make it reactive
  const gallery = useMemo(() => {
    const galleryRaw = Array.isArray(imageGallery) ? imageGallery.slice() : [];
    const g = galleryRaw.filter(Boolean);
    if (imageUrl && imageUrl.trim() !== '') {
      // Remove cache busting params for comparison (everything after ?)
      const cleanImageUrl = cleanUrl(imageUrl);
      const idx = g.findIndex(url => {
        const cleanUrlStr = cleanUrl(url);
        return cleanUrlStr === cleanImageUrl;
      });
      if (idx !== -1) g.splice(idx, 1);
      g.unshift(imageUrl);
    }
    return g.length > 0 ? g : (imageUrl && imageUrl.trim() !== '' ? [imageUrl] : []); // Ensure at least one image if imageUrl exists
  }, [imageUrl, imageGallery, cleanUrl]);

  // Create a stable hash of gallery URLs (without cache busting params) to detect actual changes
  // This hash should only change when the actual product changes, not when cache busting params change
  // Calculate hash from original input URLs (imageUrl and imageGallery) to ensure stability
  const galleryHash = useMemo(() => {
    const allUrls: string[] = [];
    
    // Add imageUrl if exists (clean URL without cache busting)
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      const clean = cleanUrl(imageUrl);
      if (clean && clean.length > 0 && !allUrls.includes(clean)) {
        allUrls.push(clean);
      }
    }
    
    // Add imageGallery URLs if exists (clean URLs without cache busting)
    if (Array.isArray(imageGallery) && imageGallery.length > 0) {
      imageGallery.forEach(url => {
        if (url && typeof url === 'string' && url.trim() !== '') {
          const clean = cleanUrl(url);
          // Avoid duplicates
          if (clean && clean.length > 0 && !allUrls.includes(clean)) {
            allUrls.push(clean);
          }
        }
      });
    }
    
    // Sort and join for stable hash (always same order for same URLs)
    // This ensures hash is stable even if array reference changes
    return allUrls.sort().join('|');
  }, [imageUrl, imageGallery, cleanUrl]);

  // Reset index only when gallery actually changes (different product), not on cache busting or user selection
  useEffect(() => {
    // On first mount, just set the hash without resetting
    if (isFirstMountRef.current) {
      previousGalleryHashRef.current = galleryHash;
      isFirstMountRef.current = false;
      return;
    }

    // Only reset if this is a different product (different gallery URLs)
    // This should NOT happen when user clicks thumbnail (that only changes mainIndex, not galleryHash)
    // Don't reset if user has manually changed the index recently (within last 1000ms to be safe)
    if (previousGalleryHashRef.current !== '' && previousGalleryHashRef.current !== galleryHash) {
      const timeSinceLastInteraction = Date.now() - lastUserInteractionRef.current;
      // Only reset if user hasn't manually changed index recently (within 1000ms)
      // This prevents reset when user clicks thumbnail
      // The delay ensures that user interaction completes before we check
      if (timeSinceLastInteraction > 1000) {
        setMainIndex(0);
      }
    }
    // Always update ref to track current gallery (even if we don't reset)
    previousGalleryHashRef.current = galleryHash;
  }, [galleryHash]);

  // Wrapper for setMainIndex that tracks user interaction
  const setMainIndexWithTracking = useCallback((index: number) => {
    lastUserInteractionRef.current = Date.now();
    setMainIndex(index);
  }, []);

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
    setMainIndex: setMainIndexWithTracking,
    lensVisible,
    setLensVisible,
    bgPos,
    ZOOM,
    gallery,
    handleMouseMove,
    hasMultipleImages,
  };
};
