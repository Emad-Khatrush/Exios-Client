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
  // Not on the dev server: a cached bundle there would hide the change being worked on
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
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
