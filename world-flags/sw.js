const CACHE_NAME = 'hoc-co-v1';
// Chỉ cache các file khung (core)
const coreAssets = [
  '/',
  'index.html',
  'css/style.css',
  'js/data.js',
  'js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(coreAssets))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Trả về file từ cache nếu có, nếu không thì tải từ mạng
      return response || fetch(e.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Chỉ lưu vào cache các file audio và svg khi người dùng thực sự sử dụng
          if (e.request.url.includes('.mp3') || e.request.url.includes('.svg')) {
            cache.put(e.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    })
  );
});
