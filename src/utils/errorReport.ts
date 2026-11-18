import { getApps } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

/* Errors customers run into, reported to Firebase Analytics as "exception" events (Firebase console →
   Analytics → Events → exception), so a broken page is known without a customer having to say so.
   Never throws, and the same error is sent once per visit, at most 20 in all, so a loop can't flood it. */

declare const __APP_VERSION__: string;
const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const sent = new Set<string>();
const MAX = 20;

export const reportError = (error: unknown, fatal: boolean, where = '') => {
  try {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const key = `${where}|${message}`;
    if (sent.has(key) || sent.size >= MAX) return;
    sent.add(key);
    if (VERSION === 'dev') {
      // eslint-disable-next-line no-console
      console.error('[exios] error report', { where, fatal, error });
      return;
    }
    if (!getApps().length) return;
    logEvent(getAnalytics(), 'exception', {
      description: message.slice(0, 150),
      fatal,
      page: window.location.pathname.slice(0, 100),
      where: where.slice(0, 100),
      app_version: VERSION,
    });
  } catch {
    /* reporting must never break the app */
  }
};

// Errors no component caught (an event handler, a promise nobody waited on): reported, not shown
export const watchUncaughtErrors = () => {
  window.addEventListener('error', (event) => {
    // A script or image that failed to load comes here too, without an error object: not a crash
    if (!event.error) return;
    reportError(event.error, false, 'window.error');
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    // A failed request already shows its own message on the page
    if (reason && typeof reason === 'object' && 'isAxiosError' in reason) return;
    reportError(reason, false, 'unhandledrejection');
  });
};
