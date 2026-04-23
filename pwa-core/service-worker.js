// service-worker.js - Trình quản lý ngoại tuyến cho PWA Flag Core

// Biến phiên bản duy nhất (Cập nhật số này để làm mới toàn bộ App Shell)
const APP_VERSION = '1.1.3'; 
const CACHE_NAME = `flag-core-v${APP_VERSION}`;

// Danh sách các tệp "xương sống" (App Shell) - ĐÃ CẬP NHẬT PATH
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
  '/manifest.webmanifest'
];

// 1. INSTALL: Tải bộ khung vào cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`📡 SW: Đang đóng gói phiên bản ${APP_VERSION}`);
      // Sử dụng {cache: 'reload'} để tránh lấy lại bản cache cũ của trình duyệt
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); 
});

// 2. ACTIVATE: Dọn dẹp các bản cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith('flag-core-v') && name !== CACHE_NAME) {
            console.log(`🧹 SW: Đang dọn dẹp cache cũ: ${name}`);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Chiến lược Network First (Ưu tiên cập nhật mới nhất)
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Nếu lấy được file mới từ mạng, lưu vào cache rồi trả về
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Mất mạng: Tìm trong cache
        return caches.match(event.request);
      })
  );
});
