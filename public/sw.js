/* Exios service worker: makes the site installable and quick to open.
   - Pages: always from the network first, so a deploy reaches customers at once. With no network,
     the last saved page opens instead of the browser's offline error.
   - /assets/: the bundles have a content hash in their name and never change, so they are served
     from the cache once saved.
   - Anything else (the API, Google, Firebase) is left to the browser untouched.
   - Push: shows the notifications the API sends through Firebase, and a tap opens the page. */
const SHELL = 'exios-shell-v2';
const ASSETS = 'exios-assets-v1';
const MAX_ASSETS = 150;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(['/', '/icon-192.png', '/icon-512.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Old bundles from earlier deploys pile up; keep only the newest ones
const trim = async () => {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((k) => cache.delete(k)));
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL).then((cache) => cache.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(ASSETS).then((cache) => cache.put(request, copy)).then(trim);
        }
        return res;
      })),
    );
  }
});

// The API sends data-only messages ({ title, body, url, tag }), so they look the same everywhere
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = {}; }
  const data = payload.data || payload.notification || payload;
  const title = data.title || 'Exios';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/home' },
  }));
});

// A tap opens the page: in the app's open window when there is one, otherwise a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/home', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
    if (open) {
      await open.focus();
      if ('navigate' in open) return open.navigate(target);
      return undefined;
    }
    return self.clients.openWindow(target);
  })());
});
