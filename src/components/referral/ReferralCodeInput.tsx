import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import { REFERRAL_CONFIG, REFERRAL_ERROR_MESSAGES } from '@/constants/referral';

interface ReferralCodeInputProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function ReferralCodeInput({
  onSuccess,
  onError,
  className = ''
}: ReferralCodeInputProps) {
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { handleReferral, isProcessing } = useReferral();
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!referralCode.trim()) {
      onError?.(REFERRAL_ERROR_MESSAGES.INVALID_CODE);
      return;
    }

    if (!profile?.user_id) {
      onError?.(REFERRAL_ERROR_MESSAGES.USER_NOT_FOUND);
      return;
    }

    setIsValidating(true);

    try {
      const success = await handleReferral(referralCode.trim(), profile.user_id);

      if (success) {
        setReferralCode('');
        onSuccess?.();
      } else {
        onError?.(REFERRAL_ERROR_MESSAGES.SYSTEM_ERROR);
      }
    } catch (error) {
      console.error('Referral submission error:', error);
      onError?.(REFERRAL_ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsValidating(false);
    }
  };

  const isDisabled = isProcessing || isValidating || !referralCode.trim();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Masukkan Kode Referral</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Masukkan kode referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              maxLength={REFERRAL_CONFIG.MAX_REFERRAL_CODE_LENGTH}
              disabled={isProcessing || isValidating}
              className="text-center font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kode referral akan memberikan poin kepada yang mengundang
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isDisabled}
          >
            {isProcessing || isValidating ? 'Memproses...' : 'Gunakan Kode Referral'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
