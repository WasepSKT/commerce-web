import { ExternalLink, ShoppingBag, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getMarketplaceLinks } from '@/utils/maintenance';

interface MarketplaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
}

export function MarketplaceModal({
  open,
  onOpenChange,
  productName,
}: MarketplaceModalProps) {
  const { shopee, tiktok } = getMarketplaceLinks();

  const handleMarketplaceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  const handleClose = () => {
    // Use setTimeout to ensure the close happens after any pending card clicks
    setTimeout(() => {
      onOpenChange(false);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        onInteractOutside={(e) => {
          e.stopPropagation();
        }}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-50"
          type="button"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-50 rounded-full p-4">
              <ShoppingBag className="h-12 w-12 text-purple-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Belanja di Marketplace
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {productName ? (
              <>Pilih marketplace untuk membeli <strong>{productName}</strong></>
            ) : (
              'Pilih marketplace favorit Anda untuk berbelanja'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4" onClick={(e) => e.stopPropagation()}>
          {/* Shopee Button */}
          <Button
            onClick={() => handleMarketplaceClick(shopee)}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg"
            size="lg"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            Belanja di Shopee
            <ExternalLink className="ml-auto h-5 w-5" />
          </Button>

          {/* TikTok Shop Button */}
          <Button
            onClick={() => handleMarketplaceClick(tiktok)}
            className="w-full h-14 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-semibold text-lg"
            size="lg"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
            </svg>
            Belanja di TikTok Shop
            <ExternalLink className="ml-auto h-5 w-5" />
          </Button>

          {/* Cancel Button */}
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
