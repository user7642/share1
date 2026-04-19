const CACHE_NAME = 'hoc-co-v1';

// Các file khung bắt buộc phải có để chạy giao diện
const coreAssets = [
  './',
  'index.html',
  'css/style.css',
  'js/data.js',
  'js/app.js',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(coreAssets))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Trả về từ cache nếu có, nếu không thì fetch từ mạng và lưu vào cache luôn
      return response || fetch(e.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Lưu tất cả các tài nguyên âm thanh và hình ảnh vào cache để dùng offline
          if (e.request.url.includes('.mp3') || e.request.url.includes('.svg')) {
            cache.put(e.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    })
  );
});
