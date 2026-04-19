const CACHE_NAME = 'kidspeak-v1';

// Những file cốt lõi để App khởi động được (phải dùng addAll ở đây)
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  // Buộc SW mới kích hoạt ngay lập tức
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Chiếm quyền điều khiển các tab đang mở ngay lập tức
  event.waitUntil(clients.claim());
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'START_CACHING') {
    const cache = await caches.open(CACHE_NAME);
    const files = event.data.files;
    let downloaded = 0;
    const batchSize = 15; // Tăng nhẹ lên 15 để hút băng thông mạnh hơn

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (url) => {
        try {
          // Kiểm tra xem file đã có trong cache chưa để tránh tải lại phí băng thông
          const existing = await cache.match(url);
          if (!existing) {
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
              await cache.put(url, response);
            }
          }
        } catch (e) {
          console.warn("Lỗi tải file:", url);
        } finally {
          downloaded++;
        }
      }));

      // Gửi tiến độ về cho app.js
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

// Chiến lược: Ưu tiên Cache, nếu không có mới lấy từ Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
