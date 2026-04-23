// service-worker.js — FINAL CLEAN (production-safe)

const APP_VERSION = '1.2.1';
const CACHE_NAME = `flag-core-v${APP_VERSION}`;
const APP_SCOPE = self.registration.scope;

function resolveInScope(path) {
  return new URL(path, APP_SCOPE).href;
}

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/main.js',
  './assets/js/data.js',
  './assets/js/storage-manager.js',
  './assets/js/opfs-worker.js',
  './manifest.webmanifest',
  './favicon.ico'
].map(resolveInScope);

// ================= INSTALL =================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`📦 SW: Cache v${APP_VERSION}`);
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// ================= ACTIVATE =================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('flag-core-v') && key !== CACHE_NAME) {
            console.log(`🗑️ Delete old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// ================= FETCH =================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // A. bỏ qua media (OPFS xử lý)
  if (url.pathname.includes('/assets/media/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {

      const fetchPromise = fetch(request)
        .then((networkResponse) => {

          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Fallback theo scope để chạy đúng trên GitHub Pages subpath
          if (request.mode === 'navigate') {
            return caches.match(resolveInScope('./index.html'));
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
