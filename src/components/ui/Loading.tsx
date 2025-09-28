import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LoadingProps {
  className?: string;
  sizeClass?: string; // Tailwind size wrapper like 'w-32 h-32'
  fullscreen?: boolean; // if true show as full screen centered overlay
  lottieSrc?: string | null; // optional override; default to provided reload lottie
  delayMs?: number; // don't show loader until this many ms have passed
  active?: boolean; // whether the loader should be active (mounted + visible lifecycle controlled)
  minVisibleMs?: number; // minimum time (ms) the loader should remain visible once shown
  fadeMs?: number; // fade duration in ms for mount/unmount transitions
}

// Use the raw .lottie file URL (not the /embed/ wrapper) so the webcomponent can fetch it directly
const DEFAULT_LOTTIE = 'https://lottie.host/b210b938-c4bf-4a18-8ceb-9da33109634e/8DDXUaLyi5.lottie';

export default function Loading(props: LoadingProps) {
  const {
    className = '',
    sizeClass = 'w-28 h-28',
    fullscreen = false,
    lottieSrc = null,
    delayMs = 200,
    active = true,
    minVisibleMs = 600,
    // fade duration in ms used for mount/unmount transitions
    fadeMs = 220,
  } = props;

  // fullscreen loaders should appear immediately (no delay) for global loading UX
  const effectiveDelay = fullscreen ? 0 : delayMs;
  const src = lottieSrc ?? DEFAULT_LOTTIE;
  type DotLottiePlayerProps = { src: string; autoplay?: boolean; loop?: boolean; style?: Record<string, string | number> };
  const [LottieComp, setLottieComp] = useState<React.ComponentType<DotLottiePlayerProps> | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!src) return;
    import('@lottiefiles/dotlottie-react')
      .then((mod) => {
        if (!mounted) return;
        const m = mod as unknown as Record<string, unknown>;
        const candidate = m.DotLottieReact ?? m.DotLottiePlayer ?? m.default ?? null;
        if (candidate && typeof candidate === 'function') setLottieComp(() => candidate as React.ComponentType<DotLottiePlayerProps>);
      })
      .catch(() => {
        if (!mounted) return;
        setLottieComp(null);
      });
    return () => { mounted = false; };
  }, [src]);

  useEffect(() => {
    // Debug: log which renderer is available at runtime (helps diagnose top-left rendering)
    if (typeof window !== 'undefined') {
      const ce = (window as Window & { customElements?: CustomElementRegistry }).customElements;
      console.debug('Loading component: LottieComp available?', !!LottieComp, 'dotlottie-wc registered?', !!ce?.get?.('dotlottie-wc'));
    }
  }, [LottieComp]);

  // Track whether a renderer is available (React wrapper or webcomponent)
  const [rendererReady, setRendererReady] = useState<boolean>(false);
  useEffect(() => {
    if (LottieComp) {
      setRendererReady(true);
      return;
    }
    if (typeof window !== 'undefined') {
      const ce = (window as Window & { customElements?: CustomElementRegistry }).customElements;
      if (ce && ce.get && ce.get('dotlottie-wc')) setRendererReady(true);
    }
  }, [LottieComp]);

  // Delay showing the loader to prevent quick flash on fast loads/navigation
  // Also enforce a minimum visible duration once the loader is shown.
  const [show, setShow] = useState<boolean>(false);
  const shownAtRef = React.useRef<number | null>(null);
  const delayTimerRef = React.useRef<number | null>(null);
  const hideTimerRef = React.useRef<number | null>(null);
  const fadeTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    // Clear timers helper
    const clearTimers = () => {
      if (delayTimerRef.current) {
        window.clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    // If active becomes true, schedule show after effectiveDelay
    if (active) {
      if (delayTimerRef.current) window.clearTimeout(delayTimerRef.current);
      // If already shown, keep shown
      if (show) return undefined;
      if (effectiveDelay <= 0) {
        setShow(true);
        shownAtRef.current = Date.now();
        return undefined;
      }
      delayTimerRef.current = window.setTimeout(() => {
        setShow(true);
        shownAtRef.current = Date.now();
        delayTimerRef.current = null;
      }, effectiveDelay);
      return () => clearTimers();
    }

    // active is false: hide immediately if never shown; otherwise ensure minVisibleMs
    if (!active) {
      // If not shown yet, cancel delay and ensure hidden
      if (!show) {
        if (delayTimerRef.current) {
          window.clearTimeout(delayTimerRef.current);
          delayTimerRef.current = null;
        }
        return undefined;
      }

      // shown -> compute elapsed and keep visible until minVisibleMs
      const shownAt = shownAtRef.current ?? 0;
      const elapsed = Date.now() - shownAt;
      if (elapsed >= minVisibleMs) {
        setShow(false);
        shownAtRef.current = null;
        return undefined;
      }

      const remaining = Math.max(0, minVisibleMs - elapsed);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        setShow(false);
        shownAtRef.current = null;
        hideTimerRef.current = null;
      }, remaining);

      return () => clearTimers();
    }

    return undefined;
  }, [active, effectiveDelay, minVisibleMs, show]);

  // Keep the overlay mounted briefly during fade-out so CSS transition can run.
  const [rendered, setRendered] = React.useState<boolean>(show);
  useEffect(() => {
    if (show) {
      // become mounted immediately
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setRendered(true);
      return;
    }

    // not shown: wait for fadeMs before unmounting
    if (rendered) {
      fadeTimerRef.current = window.setTimeout(() => {
        setRendered(false);
        fadeTimerRef.current = null;
      }, fadeMs);
    }

    return () => {
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [show, fadeMs, rendered]);

  const content = (
    <div className={`flex items-center justify-center ${sizeClass} ${className}`} style={{ width: undefined }}>
      {src && LottieComp ? (
        (() => {
          const Comp = LottieComp as React.ComponentType<DotLottiePlayerProps>;
          return <Comp src={src} autoplay loop style={{ width: '100%', height: '100%' }} />;
        })()
      ) : src ? (
        // ensure custom element renders as block and fills its container
        <dotlottie-wc src={src} autoplay loop style={{ display: 'block', width: '100%', height: '100%' }} />
      ) : (
        <div className="w-full h-full border animate-pulse bg-muted/10 rounded-md" />
      )}
    </div>
  );

  if (fullscreen) {
    // Use explicit fixed positioning + flex centering to avoid CSS inheritance issues
    const overlay = (
      <div data-loading-overlay="true" className={`loading-overlay loading-fade ${show ? 'show' : ''}`}>
        <div className="loading-box">
          {content}
          {/* fallback spinner in case renderer isn't ready */}
          {!rendererReady && (
            <div aria-hidden className="loading-spinner-wrap">
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      </div>
    );

    // Only render once the delay has elapsed and we're still visible
    if (!show) return null;

    // Render the overlay into document.body so it's not affected by parent transforms
    if (typeof document !== 'undefined' && document.body) {
      return createPortal(rendered ? overlay : null, document.body);
    }

    return rendered ? overlay : null;
  }

  // For inline loaders respect the delay and active state too
  if (!show) return null;

  return content;
}
