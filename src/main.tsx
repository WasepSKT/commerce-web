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

// Start the order expiry checker
startOrderExpiryChecker();

createRoot(document.getElementById("root")!).render(<App />);

// Export controller so other modules can re-run after route changes if needed
export { animController };
