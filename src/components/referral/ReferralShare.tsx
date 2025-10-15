import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Check, Users, Gift } from 'lucide-react';
import { REFERRAL_CONFIG } from '@/constants/referral';

interface ReferralShareProps {
  referralCode: string;
  referralUrl?: string;
  className?: string;
}

export default function ReferralShare({
  referralCode,
  referralUrl,
  className = ''
}: ReferralShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullReferralUrl = referralUrl || `${baseUrl}/signup?ref=${referralCode}`;

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      toast({
        title: 'Berhasil disalin!',
        description: type === 'code' ? 'Kode referral disalin ke clipboard' : 'Link referral disalin ke clipboard'
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menyalin',
        description: 'Tidak dapat menyalin ke clipboard'
      });
    }
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bergabung dengan Regal Paw!',
          text: `Gunakan kode referral saya: ${referralCode}`,
          url: fullReferralUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      copyToClipboard(fullReferralUrl, 'url');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Bagikan Referral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code */}
        <div>
          <label className="text-sm font-medium mb-2 block">Kode Referral Anda</label>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(referralCode, 'code')}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Referral URL */}
        <div>
          <label className="text-sm font-medium mb-2 block">Link Referral</label>
          <div className="flex gap-2">
            <Input
              value={fullReferralUrl}
              readOnly
              className="text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(fullReferralUrl, 'url')}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button
          onClick={shareViaWebAPI}
          className="w-full"
          size="lg"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Bagikan Referral
        </Button>

        {/* Benefits Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Manfaat Referral
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-primary" />
              <span>Dapatkan poin untuk setiap teman yang berhasil diundang</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-3 w-3 text-primary" />
              <span>Teman yang diundang tidak mendapat poin, hanya Anda yang mendapat poin</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground">
          <p className="mb-2 font-medium">Cara menggunakan:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Bagikan kode referral atau link di atas</li>
            <li>Teman mendaftar menggunakan kode/link Anda</li>
            <li>Anda mendapat poin referral</li>
            <li>Teman yang diundang tidak mendapat poin</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
