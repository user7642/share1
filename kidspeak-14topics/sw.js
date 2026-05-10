const CACHE_NAME = 'kidspeak-v2'; // Đã đổi sang v2 để kích hoạt cập nhật

// Những file cốt lõi để App khởi động
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  // Buộc Service Worker mới kích hoạt ngay lập tức
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // 1. Chiếm quyền điều khiển các tab đang mở ngay lập tức
  // 2. Tự động xóa các Cache cũ không còn khớp với CACHE_NAME
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Đang dọn dẹp cache cũ:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'START_CACHING') {
    const cache = await caches.open(CACHE_NAME);
    const files = event.data.files;
    let downloaded = 0;
    const batchSize = 15; 

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (url) => {
        try {
          // Kiểm tra xem file đã có trong cache chưa
          const existing = await cache.match(url);
          if (!existing) {
            // Dùng cache: 'no-store' để đảm bảo lấy file mới nhất từ internet, không lấy từ đệm trình duyệt
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
              await cache.put(url, response);
            }
          }
        } catch (e) {
          console.warn("Lỗi tải tài nguyên:", url);
        } finally {
          downloaded++;
        }
      }));

      // Gửi tiến độ về cho app.js hiển thị giao diện tải cho người dùng
      const clientsList = await self.clients.matchAll();
      clientsList.forEach(client => {
        client.postMessage({
          type: 'CACHE_PROGRESS',
          progress: Math.round((downloaded / files.length) * 100)
        });
      });
    }
  }
});

// Chiến lược: Ưu tiên lấy từ Cache để chạy nhanh và offline, nếu không có mới lấy từ Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
