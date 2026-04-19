const CACHE_NAME = 'kidspeak-v1';

// Các file hệ thống cần thiết để App khởi động
const coreAssets = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(coreAssets))
  );
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'START_CACHING') {
    const cache = await caches.open(CACHE_NAME);
    const files = event.data.files;
    let downloaded = 0;

    // Hút băng thông bằng cách tải song song tất cả các file trong data.js
    await Promise.all(files.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (e) {
        console.warn("Không thể tải file:", url);
      } finally {
        downloaded++;
        // Gửi phần trăm tiến độ về cho giao diện app.js
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_PROGRESS',
            progress: Math.round((downloaded / files.length) * 100)
          });
        });
      }
    }));
  }
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
