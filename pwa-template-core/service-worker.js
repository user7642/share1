// service-worker.js - Trình quản lý ngoại tuyến cho PWA Flag Core
const CACHE_NAME = 'pwa-flag-core-v1';

// Danh sách các tệp "xương sống" cần để hiển thị giao diện
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/data.js',
  '/manifest.json'
];

// 1. Sự kiện INSTALL: Tải và lưu các tệp tĩnh vào Cache Storage
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📡 SW: Đang lưu trữ bộ khung giao diện vào Cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Kích hoạt ngay lập tức
});

// 2. Sự kiện ACTIVATE: Dọn dẹp các cache cũ nếu có cập nhật phiên bản
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('🧹 SW: Đang xóa cache cũ:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Sự kiện FETCH: Chặn các yêu cầu mạng để phục vụ từ Cache nếu mất mạng
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu lấy tệp tĩnh (không xử lý âm thanh trong OPFS)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Trả về file từ cache nếu có, nếu không thì đi lấy từ mạng
      return response || fetch(event.request).catch(() => {
        // Nếu cả cache và mạng đều không có (ví dụ đang offline)
        console.warn('📴 Bạn đang ngoại tuyến và tệp này chưa được lưu.');
      });
    })
  );
});
