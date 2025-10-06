import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Database } from '@/types/supabase';

type PopupCampaign = Database['public']['Tables']['popup_campaigns']['Row'];

interface PopupCampaignDisplayProps {
  onDashboardLogin?: boolean;
}

export function PopupCampaignDisplay({ onDashboardLogin = false }: PopupCampaignDisplayProps) {
  const [popup, setPopup] = useState<PopupCampaign | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchActivePopup = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('popup_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching popup campaign:', error);
        return;
      }

      if (data) {
        const shouldShow = checkShouldShow(data);
        if (shouldShow) {
          setPopup(data);
          // Show popup after delay
          setTimeout(() => {
            setShowPopup(true);
          }, (data.delay_seconds || 3) * 1000);
        }
      }
    } catch (error) {
      console.error('Exception in fetchActivePopup:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (onDashboardLogin) {
      fetchActivePopup();
    }
  }, [onDashboardLogin, fetchActivePopup]);

  const checkShouldShow = (campaign: PopupCampaign): boolean => {
    const storageKey = `popup_campaign_${campaign.id}`;
    const lastShown = localStorage.getItem(storageKey);

    switch (campaign.show_frequency) {
      case 'always': {
        return true;
      }

      case 'once': {
        return !lastShown;
      }

      case 'daily': {
        if (!lastShown) return true;
        const lastShownDate = new Date(lastShown);
        const today = new Date();
        const isNewDay = lastShownDate.toDateString() !== today.toDateString();
        return isNewDay;
      }

      default: {
        return false;
      }
    }
  };

  const markAsShown = (campaign: PopupCampaign) => {
    const storageKey = `popup_campaign_${campaign.id}`;
    localStorage.setItem(storageKey, new Date().toISOString());
  };

  const handleClose = () => {
    if (popup) {
      markAsShown(popup);
    }
    setShowPopup(false);
  };

  const handleButtonClick = () => {
    if (popup?.button_url) {
      window.open(popup.button_url, '_blank', 'noopener,noreferrer');
    }
    handleClose();
  };

  if (loading || !popup) {
    return null;
  }

  return (
    <Dialog open={showPopup} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md mx-auto">
        {/* Custom close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-brand-primary">
            {popup.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {popup.image_url && (
            <div className="w-full">
              <img
                src={popup.image_url}
                alt={popup.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <DialogDescription className="text-center text-base leading-relaxed">
            {popup.content}
          </DialogDescription>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Tutup
          </Button>

          {popup.button_text && popup.button_url && (
            <Button
              onClick={handleButtonClick}
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90"
            >
              {popup.button_text}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

