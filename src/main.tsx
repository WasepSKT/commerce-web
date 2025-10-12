import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initLiteAnimations } from './lib/animations';
import { startOrderExpiryChecker } from './lib/orderExpiry';
// AOS will be optionally used if installed; import CSS so it's available when package exists
import 'aos/dist/aos.css';
import AOS from 'aos';

// Initialize lightweight animations for elements with data-anim attributes.
const animController = initLiteAnimations({ selector: '[data-anim]', stagger: 40 });

// Initialize AOS if available. Respect user motion preferences by disabling when reduced-motion is set.
if (typeof window !== 'undefined') {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && AOS && typeof AOS.init === 'function') {
    // Use a slightly longer duration for smoother entrances. Keep `once: true` so
    // sections animate only the first time they enter the viewport.
    AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, mirror: false });
  }
}

// Dynamically load dotlottie webcomponent only on supported browsers to avoid runtime errors
if (typeof window !== 'undefined' && 'customElements' in window && 'fetch' in window) {
  // inject module script from unpkg at runtime; this avoids TypeScript trying to resolve package types
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.1/dist/dotlottie-wc.js';
  script.onload = () => {
    if (String(import.meta.env.VITE_ENABLE_DEBUG_LOGS).toLowerCase() === 'true') console.log('dotlottie loaded');
  };
  script.onerror = (err) => {
    if (String(import.meta.env.VITE_ENABLE_DEBUG_LOGS).toLowerCase() === 'true') console.warn('dotlottie failed to load', err);
  };
  document.head.appendChild(script);
}

// Start the order expiry checker
startOrderExpiryChecker();

// Register service worker for PWA (optional, gated by env)
const ENABLE_PWA = String(import.meta.env.VITE_ENABLE_PWA ?? 'false').toLowerCase() === 'true';
if (ENABLE_PWA && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        if (String(import.meta.env.VITE_ENABLE_DEBUG_LOGS).toLowerCase() === 'true') console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        if (String(import.meta.env.VITE_ENABLE_DEBUG_LOGS).toLowerCase() === 'true') console.log('SW registration failed: ', registrationError);
      });
  });
}
// If PWA disabled, proactively unregister any existing service workers and clear old caches
if (!ENABLE_PWA && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    regs.forEach((r) => r.unregister());
    if (String(import.meta.env.VITE_ENABLE_DEBUG_LOGS).toLowerCase() === 'true') console.log('Unregistered existing service workers');
  }).catch(() => {});
  // Best-effort cache cleanup for our app caches to avoid stale CSS/JS
  const cacheStorage: CacheStorage | undefined = (typeof window !== 'undefined' && 'caches' in window)
    ? (window as unknown as { caches?: CacheStorage }).caches
    : undefined;
  cacheStorage?.keys()?.then((keys) => {
    keys.forEach((k) => {
      if (/regal-paw/i.test(k)) {
        cacheStorage.delete(k).catch(() => {});
      }
    });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);

// Export controller so other modules can re-run after route changes if needed
export { animController };
