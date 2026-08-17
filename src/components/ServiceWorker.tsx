'use client';

import { useEffect } from 'react';

/**
 * Registration is deferred to the load event so it never competes with the
 * first paint or the WebGL context the editor sets up on arrival.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration fails in private windows and on some locked-down
        // configurations. The app is fully functional without it; only the
        // offline guarantee is lost.
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
