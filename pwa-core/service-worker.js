// service-worker.js — FINAL CLEAN (production-safe)

const APP_VERSION = '1.2.1';
const CACHE_NAME = `flag-core-v${APP_VERSION}`;

// ✔ dùng path nhất quán (không ./)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/install.html',

  '/assets/css/style.css',

  '/assets/js/main.js',
  '/assets/js/data.js',
  '/assets/js/storage-manager.js',
  '/assets/js/opfs-worker.js',

  '/manifest.webmanifest',
  '/favicon.ico'
];

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
          // ✔ fallback chuẩn
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
