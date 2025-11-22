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

  // Make the Turnstile widget adopt the full width of its wrapper.
  // We still observe for resize/mutations to re-apply sizing when the
  // widget is mounted or the container changes size.
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let mountedEl: HTMLElement | null = (containerRef as React.RefObject<HTMLDivElement>)?.current as HTMLElement | null;

    const applyFullWidth = () => {
      if (!mountedEl) mountedEl = (containerRef as React.RefObject<HTMLDivElement>)?.current as HTMLElement | null;
      if (!mountedEl) return;

      // Allow the widget to stretch to 100% of its container.
      mountedEl.style.width = '100%';
      mountedEl.style.maxWidth = '100%';
      mountedEl.style.transform = '';
      mountedEl.style.transformOrigin = '';
      mountedEl.style.display = 'block';
    };

    // Initial attempt
    applyFullWidth();

    // Observe wrapper size changes to re-apply sizing rules
    const ro = new ResizeObserver(() => applyFullWidth());
    ro.observe(wrapper);

    // Observe DOM mutations in case the widget is injected after load
    const mo = new MutationObserver(() => applyFullWidth());
    mo.observe(wrapper, { childList: true, subtree: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [containerRef]);

  return (
    <div className="w-full mt-2" ref={wrapperRef}>
      <div className="w-full">
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className="w-full"
          aria-hidden={sitekey ? 'false' : 'true'}
        />
      </div>
    </div>
  );
}


