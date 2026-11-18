import { useEffect, useState } from 'react';

/* Installing the site as an app.
   Chrome/Edge (Android, desktop) fire `beforeinstallprompt` once, often before any page that wants
   it has mounted, so it is caught here when the bundle loads and kept until the customer taps
   "install". iPhone has no such event: the customer adds it from Safari's share menu, so the app
   shows them the steps instead. */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent)
  // iPadOS reports itself as a Mac
  || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;
  // Also on the dev server, so notifications can be tried locally: it never caches the dev bundles
  // (they aren't under /assets/) and pages always come from the network first
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
};

// In the installed app only (opened from the home screen), the screen can't be zoomed in or out,
// like a native app: pinching or double-tapping would break the layout. The site in a browser
// tab stays zoomable, for people who need bigger text.
// iPhone ignores user-scalable=no, so pinch is also stopped by its gesture events, and double-tap
// zoom by touch-action. maximum-scale=1 also stops iPhone zooming into a field when it is tapped.
export const lockAppZoom = () => {
  if (!isStandalone()) return;
  const viewport = document.querySelector('meta[name="viewport"]');
  viewport?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  document.documentElement.style.touchAction = 'manipulation';
  // The Google map (and anything marked data-allow-zoom) keeps its own pinch zoom
  const zoomable = (e: Event) => !!(e.target as Element | null)?.closest?.('.gm-style, [data-allow-zoom]');
  const stop = (e: Event) => { if (!zoomable(e)) e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => document.addEventListener(type, stop, { passive: false }));
  // Two fingers on the screen: no pinch
  document.addEventListener('touchmove', (e) => { if ((e as TouchEvent).touches.length > 1) stop(e); }, { passive: false });
  // Installed on a computer: Ctrl + wheel and Ctrl + / - / 0
  window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault(); });
};

// 'prompt': the browser can install it with one tap. 'ios': show the Safari steps.
// null: already installed, or this browser cannot install it.
export type InstallMode = 'prompt' | 'ios' | null;

const currentMode = (): InstallMode => {
  if (isStandalone()) return null;
  if (deferred) return 'prompt';
  if (isIOS()) return 'ios';
  return null;
};

export const useInstallApp = () => {
  const [mode, setMode] = useState<InstallMode>(currentMode);

  useEffect(() => {
    const update = () => setMode(currentMode());
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, []);

  // Opens the browser's own install dialog; true when the customer accepted
  const install = async () => {
    if (!deferred) return false;
    const event = deferred;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // The event can be used once only
    deferred = null;
    notify();
    return outcome === 'accepted';
  };

  return { mode, install };
};
