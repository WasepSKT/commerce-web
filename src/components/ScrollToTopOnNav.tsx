import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global Scroll-to-top on route change.
 * - Smooth scroll by default unless user prefers reduced motion.
 * - After scrolling, attempt to focus the main heading (if present) for accessibility.
 */
export default function ScrollToTopOnNav() {
  const { pathname } = useLocation();
  // Track whether this is the first navigation (initial load)
  const isFirstRef = useRef(true);

  useEffect(() => {
    // Determine user preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If there's a common site header with fixed height, try to account for it.
    // We look for an element with class `site-header` and subtract its height.
    const header = document.querySelector('.site-header') as HTMLElement | null;
    const headerHeight = header ? header.getBoundingClientRect().height : 0;

    // Scroll target: top of the document
    const top = Math.max(0, window.scrollY + (document.documentElement.getBoundingClientRect().top - headerHeight));

    if (prefersReduced) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Focus first meaningful heading to announce content change to SR users
    // We'll try h1, then h2 inside main. Skip focusing on the very first load to
    // avoid an unwanted focus outline when the page is reloaded.
    if (!isFirstRef.current) {
      setTimeout(() => {
        const main = document.querySelector('main') || document.body;
        const heading = (main.querySelector('h1') || main.querySelector('h2')) as HTMLElement | null;
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.style.outline = 'none';
          heading.style.boxShadow = 'none';
          heading.style.border = 'none';
          heading.focus({ preventScroll: true });
        }
      }, 200);
    }

    // After the first navigation, clear the flag
    isFirstRef.current = false;
  }, [pathname]);

  return null;
}
