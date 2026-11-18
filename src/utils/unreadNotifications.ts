import { useEffect, useState } from 'react';
import api from '../api';

/* How many notifications the customer has not seen, shared by everything that shows it (the bell on
   the home page, "الإشعارات" in the menu and the side panel, the dot on the "القائمة" tab), so they
   always agree. Asked from the API at most once a minute, and set to 0 the moment the
   notifications page is opened. */

let count = 0;
let fetchedAt = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<(n: number) => void>();
const FRESH_MS = 60 * 1000;

const set = (n: number) => {
  count = Math.max(0, n);
  listeners.forEach((fn) => fn(count));
};

export const refreshUnread = (force = false) => {
  if (inFlight || (!force && Date.now() - fetchedAt < FRESH_MS)) return inFlight || Promise.resolve();
  fetchedAt = Date.now();
  inFlight = api.getUnreadNotifications()
    .then((res: any) => { if (typeof res?.data?.unread === 'number') set(res.data.unread); })
    .catch(() => undefined)
    .finally(() => { inFlight = null; });
  return inFlight;
};

// The page was opened: nothing is unread any more
export const clearUnread = () => {
  fetchedAt = Date.now();
  set(0);
};

// The count, kept fresh as the customer moves around (pass the page's address)
export const useUnreadNotifications = (pathname?: string) => {
  const [n, setN] = useState(count);
  useEffect(() => {
    listeners.add(setN);
    setN(count);
    return () => { listeners.delete(setN); };
  }, []);
  useEffect(() => { refreshUnread(); }, [pathname]);
  return n;
};

// "3", or "99+" past 99
export const unreadText = (n: number) => (n > 99 ? '99+' : String(n));
