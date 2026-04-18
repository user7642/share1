const CACHE_STATIC = "static-v2";
const CACHE_DYNAMIC = "dynamic-v2";
const MAX_ITEMS = 200;

// =======================
// INSTALL
// =======================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/css/style.css",
        "/js/app.js",
        "/js/data.js",
        "/manifest.json"
      ]);
    })
  );
});

// =======================
// ACTIVATE
// =======================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// =======================
// LIMIT CACHE
// =======================
async function limitCacheSize(name, maxItems) {
  const cache = await caches.open(name);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(name, maxItems);
  }
}

// =======================
// FETCH
// =======================
self.addEventListener("fetch", event => {
  const req = event.request;

  // 👉 IMAGE + AUDIO
  if (req.url.includes("/img/") || req.url.includes("/audio/")) {
    event.respondWith(
      caches.match(req).then(res => {
        return res || fetch(req).then(fetchRes => {
          return caches.open(CACHE_DYNAMIC).then(cache => {
            cache.put(req, fetchRes.clone());
            limitCacheSize(CACHE_DYNAMIC, MAX_ITEMS);
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // 👉 HTML / JS / CSS
  event.respondWith(
    fetch(req)
      .then(res => {
        return caches.open(CACHE_STATIC).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      })
      .catch(() => caches.match(req))
  );
});
