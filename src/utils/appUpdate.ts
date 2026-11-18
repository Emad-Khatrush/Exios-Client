import { lazy } from 'react';

/* Keeping the app on the latest version without the customer doing anything.
   Each production build has a version (__APP_VERSION__, set by webpack) and publishes it in
   /version.json, which is never cached. The app compares the two:
   - when the customer comes back to the app (from the home screen or another app): a newer version
     reloads at once, unless they are typing in a field (then at their next page change);
   - every 10 minutes while it is open: a newer version reloads at the next page change, so nothing
     is cut off in the middle;
   - a page whose file was removed by a newer deploy (the open app still points at the old one)
     reloads instead of showing a blank page.
   A reload is never repeated within a minute, so a broken deploy can't loop. */

declare const __APP_VERSION__: string;
const CURRENT = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const CHECK_EVERY_MS = 10 * 60 * 1000;
const RELOAD_KEY = 'exios-update-reloaded-at';

let newer = false;

const reloadedRecently = () => {
  try { return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) || 0) < 60 * 1000; } catch { return false; }
};

// True when it reloads
const reload = () => {
  if (reloadedRecently()) return false;
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* reload anyway */ }
  window.location.reload();
  return true;
};

const typing = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

const check = async () => {
  if (CURRENT === 'dev' || newer) return newer;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const { version } = await res.json();
    if (version && version !== CURRENT) newer = true;
  } catch {
    /* offline: try again later */
  }
  return newer;
};

export const startAutoUpdate = () => {
  if (CURRENT === 'dev') return;
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    if ((await check()) && !typing()) reload();
  });
  window.setInterval(() => { if (document.visibilityState === 'visible') check(); }, CHECK_EVERY_MS);
};

// On every page change inside the app: the moment to move to a newer version found earlier
export const updateOnPageChange = () => { if (newer) reload(); };

// React.lazy for a page that reloads the app when its file is gone (removed by a newer deploy)
export const lazyPage = <T extends React.ComponentType<any>>(load: () => Promise<{ default: T }>) =>
  lazy(() => load().catch((error) => {
    if (reload()) return new Promise<{ default: T }>(() => undefined);
    throw error;
  }));
