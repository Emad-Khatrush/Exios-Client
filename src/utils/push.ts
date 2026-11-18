import { getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import api from '../api';
import { isIOS, isStandalone } from './installApp';

/* Phone notifications (shipment moved on, ready for pickup…), sent by the API through Firebase
   Cloud Messaging and shown by the app's service worker (public/sw.js).
   Needs REACT_APP_FIREBASE_VAPID_KEY (Firebase console → Project settings → Cloud Messaging →
   Web Push certificates). Without it the feature stays hidden. */

declare const process: { env: { [key: string]: string | undefined } };

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
// The token this device registered, so logout can unregister it without asking Firebase again
const TOKEN_KEY = 'exios-push-token';

const storage = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (v: string) => { try { localStorage.setItem(TOKEN_KEY, v); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

// 'ask': can be turned on now. 'on': already allowed. 'blocked': the customer said no in the
// browser. 'install-first': iPhone, which only allows it once the app is on the home screen.
// null: this browser or build can't do it.
export type PushState = 'ask' | 'on' | 'blocked' | 'install-first' | null;

export const pushState = async (): Promise<PushState> => {
  if (!VAPID_KEY || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return isIOS() && !isStandalone() && VAPID_KEY ? 'install-first' : null;
  }
  if (isIOS() && !isStandalone()) return 'install-first';
  try {
    if (!(await isSupported())) return null;
  } catch {
    return null;
  }
  // The service worker registers once the page has loaded, which on a first visit is after this
  // runs: wait for it a little instead of deciding it isn't there
  const ready = await Promise.race([
    navigator.serviceWorker.ready.then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 8000)),
  ]);
  if (!ready) return null;
  if (Notification.permission === 'granted') return 'on';
  if (Notification.permission === 'denied') return 'blocked';
  return 'ask';
};

// Gets this device's token and tells the API it belongs to the logged-in customer
const register = async () => {
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(getApp()), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) return false;
  await api.savePushToken(token);
  storage.set(token);
  return true;
};

// From a tap on "turn on": asks the browser, then registers. True when notifications are on.
export const enablePush = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  return register();
};

// On each visit when already allowed: tokens can change, and the customer may have logged in
// on this device as someone else since
export const syncPush = async () => {
  try {
    if ((await pushState()) === 'on') await register();
  } catch {
    /* a failed refresh only means no notifications until the next visit */
  }
};

// Before logging out: this device stops getting this customer's notifications
export const unregisterPush = async () => {
  const token = storage.get();
  if (!token) return;
  storage.clear();
  try {
    await Promise.race([api.removePushToken(token), new Promise((resolve) => setTimeout(resolve, 2000))]);
  } catch {
    /* logging out must not wait on this */
  }
};
