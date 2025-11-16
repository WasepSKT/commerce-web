import React from 'react';

interface CheckoutCaptchaProps {
  sitekey?: string | null;
  containerRef: React.RefObject<HTMLDivElement> | unknown;
  onVerified?: (verified: boolean) => void;
}

export default function CheckoutCaptcha({ sitekey, containerRef, onVerified }: CheckoutCaptchaProps) {
  if (!sitekey) return null;

  // Listen for Turnstile success event
  React.useEffect(() => {
    if (!onVerified) return;

    // Set up global callback for Turnstile
    const win = window as any;
    const callbackName = 'onTurnstileSuccess';

    win[callbackName] = (token: string) => {
      // Captcha verified successfully - do not log token for security
      onVerified(true);
    };

    return () => {
      delete win[callbackName];
    };
  }, [onVerified]);

  return (
    <div className="w-full mt-2">
      <div ref={containerRef as React.RefObject<HTMLDivElement>} className="w-full" />
    </div>
  );
}


