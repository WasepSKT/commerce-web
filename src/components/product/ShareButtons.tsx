import { useCallback } from 'react';
import { Share2 } from 'lucide-react';
import WhatsAppLogo from '@/assets/img/WhatsApp_logo-color-vertical.svg';
import InstagramLogo from '@/assets/img/Instagram-Gradient-Logo-PNG.png';
import TiktokIcon from '@/assets/img/Tiktok_icon.svg';
import { useToast } from '@/hooks/use-toast';

interface Props {
  productId: string;
  name: string;
  description?: string;
}

export function ShareButtons({ productId, name, description }: Props) {
  const { toast } = useToast();

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/product/${productId}`
    : `/product/${productId}`;

  const shortDesc = description ? description.slice(0, 120) : '';
  const shareText = `${name}${shortDesc ? ' - ' + shortDesc : ''}\n${productUrl}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast({ title: 'Link disalin', description: 'Tautan produk telah disalin ke clipboard.' });
    } catch (_err) {
      window.prompt('Salin tautan ini:', productUrl);
    }
  }, [productUrl, toast]);

  const shareWeb = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: shortDesc, url: productUrl });
      } catch (_e) {
        // user cancelled or error; ignore
      }
      return;
    }
    await copyLink();
  }, [name, shortDesc, productUrl, copyLink]);

  const shareWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  }, [shareText]);

  const shareToIG = useCallback(async () => {
    if (navigator.share) {
      await shareWeb();
      return;
    }
    await copyLink();
    toast({ title: 'Bagikan ke Instagram', description: 'Link disalin. Buka Instagram dan tempelkan tautan di Story/DM.' });
  }, [shareWeb, copyLink, toast]);

  const shareToTikTok = useCallback(async () => {
    if (navigator.share) {
      await shareWeb();
      return;
    }
    await copyLink();
    toast({ title: 'Bagikan ke TikTok', description: 'Link disalin. Buka TikTok dan tempelkan tautan di DM atau bio.' });
  }, [shareWeb, copyLink, toast]);

  return (
    <div className="mt-3 flex items-center gap-2">
      <button type="button" onClick={shareWhatsApp} aria-label="Bagikan ke WhatsApp" className="px-2 py-1 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200">
        <img src={WhatsAppLogo} alt="WhatsApp" className="h-5 w-5 object-contain" />
      </button>
      <button type="button" onClick={shareToIG} aria-label="Bagikan ke Instagram" className="px-2 py-1 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200">
        <img src={InstagramLogo} alt="Instagram" className="h-5 w-5 object-contain" />
      </button>
      <button type="button" onClick={shareToTikTok} aria-label="Bagikan ke TikTok" className="px-2 py-1 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200">
        <img src={TiktokIcon} alt="TikTok" className="h-5 w-5 object-contain" />
      </button>
      <button type="button" onClick={shareWeb} aria-label="Share" className="ml-auto px-3 py-2 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200">
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}


