import { useEffect, useRef } from 'react';

/**
 * Run an effect after a debounce delay when dependencies change.
 * Keeps the API simple: pass an effect callback and dependency array.
 */
export default function useDebouncedEffect(effect: () => void | (() => void), deps: readonly unknown[], delay = 350) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      effect();
    }, delay) as unknown as number;

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // Intentionally omitting effect from deps; caller controls it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
