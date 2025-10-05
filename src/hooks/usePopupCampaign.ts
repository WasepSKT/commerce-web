import { useState } from 'react';

// Hook untuk menggunakan popup campaign
export function usePopupCampaign() {
  const [shouldTrigger, setShouldTrigger] = useState(false);

  const triggerPopup = () => {
    setShouldTrigger(true);
  };

  const resetTrigger = () => {
    setShouldTrigger(false);
  };

  return {
    triggerPopup,
    resetTrigger,
    shouldTrigger
  };
}