import React from 'react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface Props {
  title?: string;
  description?: string;
  cta?: { label: string; onClick: () => void } | null;
  iconOnly?: boolean;
  lottieSrc?: string | null;
}

export default function EmptyState({
  title = 'Tidak ada data',
  description = 'Belum ada item untuk ditampilkan.',
  cta = null,
  iconOnly = false,
  lottieSrc = null,
}: Props) {
  // dynamically load the dotlottie player on the client to avoid static import/type issues
  const [LottieComp, setLottieComp] = useState<React.ComponentType<unknown> | null>(null);
  useEffect(() => {
    let mounted = true;
    if (!lottieSrc) return;
    import('@lottiefiles/dotlottie-react')
      .then((mod) => {
        if (!mounted) return;
        // package exports may vary across versions; try common named exports then default
        const m = mod as unknown as Record<string, unknown>;
        const candidate = m.DotLottieReact ?? m.DotLottiePlayer ?? m.default ?? null;
        if (candidate && typeof candidate === 'function') {
          setLottieComp(() => candidate as React.ComponentType<unknown>);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setLottieComp(null);
      });
    return () => { mounted = false; };
  }, [lottieSrc]);

  const renderAnimation = (sizeClass = 'w-29 h-auto') => (
    <div className={`flex items-center justify-center ${sizeClass}`}>
      {lottieSrc && LottieComp ? (
        (() => {
          type DotLottiePlayerProps = { src: string; autoplay?: boolean; loop?: boolean; style?: Record<string, string | number> };
          const Comp = LottieComp as React.ComponentType<DotLottiePlayerProps>;
          return <Comp src={lottieSrc} autoplay loop style={{ width: '100%', height: '100%' }} />;
        })()
      ) : lottieSrc ? (
        // Fallback to webcomponent if dynamic react wrapper isn't available.
        // The `dotlottie-wc` script can be added to `index.html` as provided by the user.
        // We render the element directly; TypeScript accepts it thanks to the JSX declaration file.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <dotlottie-wc src={lottieSrc} autoplay loop style={{ width: '100%', height: '100%' }} />
      ) : (
        <div className="w-full h-full relative">
          <div className="absolute -left-2 -top-2 w-14 h-14 rounded-full bg-muted/20" />
          <div className="absolute right-0 bottom-0 w-16 h-16 rounded-full bg-muted/30" />
          <div className="absolute w-10 h-2 bg-muted/40 rounded-full bottom-3 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );

  if (iconOnly) {
    return (
      <div className="flex items-center justify-center p-4">
        {renderAnimation('w-24 h-24')}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted/30 p-4 bg-card/50">
      {renderAnimation()}

      <div className="text-center">
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>
      </div>

      {cta ? (
        <div>
          <Button onClick={cta.onClick}>{cta.label}</Button>
        </div>
      ) : null}
    </div>
  );
}
