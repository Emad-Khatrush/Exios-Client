/* Exios service worker: makes the site installable and quick to open.
   - Pages: always from the network first, so a deploy reaches customers at once. With no network,
     the last saved page opens instead of the browser's offline error.
   - /assets/: the bundles have a content hash in their name and never change, so they are served
     from the cache once saved.
   - Anything else (the API, Google, Firebase) is left to the browser untouched. */
const SHELL = 'exios-shell-v1';
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
