// service-worker.js - Trình quản lý ngoại tuyến tối ưu

const APP_VERSION = '1.1.4'; // Tăng phiên bản khi thay đổi App Shell
const CACHE_NAME = `flag-core-v${APP_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/install.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/data.js',
  '/assets/js/storage-manager.js',
  '/assets/js/opfs-worker.js',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.ico'
];

// 1. INSTALL: Lưu App Shell vào Cache Storage
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`📡 SW: Đang đóng gói App Shell v${APP_VERSION}`);
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Xóa cache cũ ngay lập tức
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith('flag-core-v') && name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Chiến lược thông minh
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. BỎ QUA CÁC YÊU CẦU MEDIA (Để OPFS xử lý)
  // Không lưu Audio/Image nặng vào Cache Storage để tránh tràn bộ nhớ trình duyệt
  if (url.pathname.includes('/assets/media/')) {
    return; 
  }

  // B. CHIẾN LƯỢC CHO APP SHELL (Stale-While-Revalidate)
  // Ưu tiên tốc độ (Cache) nhưng vẫn cập nhật ngầm (Network)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cập nhật lại Cache nếu fetch thành công
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      // Trả về bản cache ngay lập tức nếu có, nếu không thì đợi fetch
      return cachedResponse || fetchPromise;
    }).catch(() => {
        // FALLBACK: Nếu là trang HTML và mất mạng hoàn toàn
        if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
        }
    })
  );
});
