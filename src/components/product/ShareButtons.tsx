import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WhatsAppLogo from '@/assets/img/WhatsApp_logo-color-vertical.svg';
import InstagramLogo from '@/assets/img/Instagram-Gradient-Logo-PNG.png';
import TiktokIcon from '@/assets/img/Tiktok_icon.svg';

interface ShareButtonsProps {
  productId: string;
  name: string;
  description: string;
}

export const ShareButtons = ({ productId, name, description }: ShareButtonsProps) => {
  const { toast } = useToast();

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/product/${productId}`
    : `/product/${productId}`;
  const shortDesc = description.slice(0, 120);
  const shareText = `${name}${shortDesc ? ' - ' + shortDesc : ''}\n${productUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast({ title: 'Link disalin', description: 'Tautan produk telah disalin ke clipboard.' });
    } catch {
      window.prompt('Salin tautan ini:', productUrl);
    }
  };

  const shareWeb = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: shortDesc, url: productUrl });
        return;
      } catch {
        // User cancelled
      }
    }
    await copyLink();
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareIG = async () => {
    await shareWeb();
    toast({
      title: 'Bagikan ke Instagram',
      description: 'Link disalin. Buka Instagram dan tempelkan tautan di Story/DM.'
    });
  };

  const shareTikTok = async () => {
    await shareWeb();
    toast({
      title: 'Bagikan ke TikTok',
      description: 'Link disalin. Buka TikTok dan tempelkan tautan di DM atau bio.'
    });
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={shareWhatsApp}
        aria-label="Bagikan ke WhatsApp"
        className="px-2 py-1 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200"
      >
        <img src={WhatsAppLogo} alt="WhatsApp" className="h-5 w-5 object-contain" />
      </button>
      <button
        type="button"
        onClick={shareIG}
        aria-label="Bagikan ke Instagram"
        className="px-2 py-1 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200"
      >
        <img src={InstagramLogo} alt="Instagram" className="h-5 w-5 object-contain" />
      </button>
      <button
        type="button"
        onClick={shareTikTok}
        aria-label="Bagikan ke TikTok"
        className="px-2 py-1 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200"
      >
        <img src={TiktokIcon} alt="TikTok" className="h-5 w-5 object-contain" />
      </button>
      <button
        type="button"
        onClick={shareWeb}
        aria-label="Share"
        className="ml-auto px-3 py-2 rounded border text-sm bg-white hover:bg-primary/5 border-gray-200"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
};


