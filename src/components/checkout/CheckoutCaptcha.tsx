interface CheckoutCaptchaProps {
  sitekey?: string | null;
  containerRef: React.RefObject<HTMLDivElement> | unknown;
}

export default function CheckoutCaptcha({ sitekey, containerRef }: CheckoutCaptchaProps) {
  if (!sitekey) return null;
  return (
    <div className="w-full mt-2">
      <div ref={containerRef as React.RefObject<HTMLDivElement>} className="w-full" />
    </div>
  );
}


