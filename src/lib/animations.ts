// Lightweight animation initializer
// Usage: add data-anim="fade" to elements to auto-apply `fade-in` class when they enter the DOM.
// This is intentionally minimal: CSS handles the animation; this script only adds the class with a tiny stagger.

export function initLiteAnimations(opts: { selector?: string; stagger?: number } = {}) {
  const selector = opts.selector ?? '[data-anim]';
  const stagger = opts.stagger ?? 60; // ms

  function apply() {
    const els = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    els.forEach((el, i) => {
      const type = el.dataset.anim ?? 'fade';
      if (type === 'fade') {
        // Avoid re-adding
        if (!el.classList.contains('fade-in')) {
          setTimeout(() => el.classList.add('fade-in'), i * stagger);
        }
      }
    });
  }

  // Apply on DOMContentLoaded and on subsequent calls
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  // Expose a small API for manual re-run (e.g., after client-side route change)
  return { run: apply };
}
