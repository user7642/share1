const CACHE_NAME = 'app-v1';

// ⚠️ chỉ cache file core (NHẸ) — KHÔNG cache audio/img ở đây
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// INSTALL
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('[SW] Activated');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH (chiến lược chuẩn)
self.addEventListener('fetch', event => {
  const req = event.request;

  // ❗ Audio + Image → network first (không preload)
  if (
    req.url.includes('/audio/') ||
    req.url.includes('/img/')
  ) {
    event.respondWith(
      fetch(req)
        .then(res => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, res.clone());
            return res;
          });
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Core → cache first
  event.respondWith(
    caches.match(req).then(res => {
      return res || fetch(req);
    })
  );
});
