export const getProductUrl = (productId: string): string => {
  return typeof window !== 'undefined' 
    ? `${window.location.origin}/product/${productId}` 
    : `/product/${productId}`;
};

export const getShareText = (productName: string, description: string, productUrl: string): string => {
  const shortDesc = description ? description.slice(0, 120) : '';
  return `${productName}${shortDesc ? ' - ' + shortDesc : ''}\n${productUrl}`;
};

export const copyToClipboard = async (text: string, onSuccess: () => void): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    onSuccess();
  } catch {
    window.prompt('Salin tautan ini:', text);
  }
};

export const shareViaWeb = async (title: string, text: string, url: string, fallback: () => Promise<void>): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch {
      // User cancelled or error
    }
  }
  await fallback();
};

export const shareWhatsApp = (text: string): void => {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};
