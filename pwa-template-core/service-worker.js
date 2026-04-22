// service-worker.js - Trình quản lý ngoại tuyến cho PWA Flag Core

// Biến phiên bản duy nhất (Cập nhật số này để làm mới toàn bộ App Shell)
const APP_VERSION = '1.0.5'; 
const CACHE_NAME = `flag-core-v${APP_VERSION}`;

// Danh sách các tệp "xương sống" (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/data.js',
  '/manifest.json'
];

// 1. INSTALL: Tải bộ khung vào cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`📡 SW: Đang đóng gói phiên bản ${APP_VERSION}`);
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
          // Nếu tìm thấy cache cũ (bắt đầu bằng flag-core-v) mà không phải bản hiện tại thì xóa
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
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Có mạng: Cập nhật cache và hiển thị ngay
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // Mất mạng: Dùng bản lưu gần nhất trong cache
        return caches.match(event.request);
      })
  );
});
