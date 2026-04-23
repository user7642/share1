// service-worker.js - Trình quản lý ngoại tuyến vạn năng (Local & GitHub)

const APP_VERSION = '1.1.5'; 
const CACHE_NAME = `flag-core-v${APP_VERSION}`;

// Tự động xác định thư mục gốc (Base Path) của Service Worker
// Ví dụ: Tại local là "/" nhưng tại GitHub là "/share1/pwa-core/"
const BASE = self.registration.scope;

// Danh sách tài nguyên dùng ĐƯỜNG DẪN TƯƠNG ĐỐI (Không có dấu / ở đầu)
const ASSETS_TO_CACHE = [
  '',               // Đại diện cho trang chủ (index.html)
  'index.html',
  'install.html',
  'assets/css/style.css',
  'assets/js/main.js',
  'assets/js/data.js',
  'assets/js/storage-manager.js',
  'assets/js/opfs-worker.js',
  'manifest.json',
  'site.webmanifest',
  'favicon.ico'
];

// 1. INSTALL: Cộng BASE vào từng file để nạp chính xác vị trí
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`📡 SW: Đang đóng gói v${APP_VERSION} tại ${BASE}`);
      // Tạo danh sách đường dẫn đầy đủ dựa trên môi trường hiện tại
      const fullPaths = ASSETS_TO_CACHE.map(path => `${BASE}${path}`);
      return cache.addAll(fullPaths);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Dọn dẹp cache cũ
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

// 3. FETCH: Chiến lược Stale-While-Revalidate thông minh
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. BỎ QUA MEDIA (Để OPFS xử lý riêng)
  if (url.pathname.includes('/assets/media/')) return;

  // B. XỬ LÝ APP SHELL
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      // Trả về cache ngay (nếu có) để đạt tốc độ tức thì, cập nhật ngầm sau
      return cachedResponse || fetchPromise;
    }).catch(() => {
      // FALLBACK: Khi mất mạng hoàn toàn, trả về trang chủ dự phòng
      if (event.request.mode === 'navigate') {
        return caches.match(`${BASE}index.html`);
      }
    })
  );
});
