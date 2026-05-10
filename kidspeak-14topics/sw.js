/**
 * sw.js — KidSpeak PWA Service Worker
 * Tối ưu cho GitHub Pages + Mobile
 *
 * Chiến lược:
 *  - Core assets: Cache-first (install)
 *  - JS/CSS/JSON: Stale-while-revalidate
 *  - Media (mp3/png/jpg/webp): Cache-first, không bao giờ re-fetch
 *  - Giới hạn cache: 1 GB
 *  - Tải song song: tự động chọn 4 luồng (mobile) hoặc 8 luồng (wifi)
 *  - Cơ chế timeout + retry để tránh treo mãi mãi
 *  - Offline fallback: trả trang offline.html khi mất mạng
 */

const CACHE_NAME = 'kidspeak-v3';
const MAX_CACHE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

// ─── Timeout (ms) ───────────────────────────────────────────────
const TIMEOUT_CORE   = 10_000;  // file cốt lõi (nhỏ)
const TIMEOUT_MEDIA  = 30_000;  // mp3/png (có thể lớn)
const TIMEOUT_RETRY  = 5_000;   // chờ trước khi retry

// ─── Số lần retry tối đa cho mỗi file ───────────────────────────
const MAX_RETRIES = 2;

// ─── File cốt lõi để app khởi động ──────────────────────────────
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './manifest.json',
  './offline.html',
];

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * fetch có timeout. Trả về Response hoặc throw sau `ms` ms.
 * GitHub Pages: không cần no-store vì mỗi deploy đổi URL/hash.
 * Dùng cache:'default' để tận dụng HTTP cache của browser,
 * giảm tải băng thông trên mobile.
 */
function fetchWithTimeout(url, ms = TIMEOUT_MEDIA) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, {
    signal: controller.signal,
    // 'default': dùng HTTP cache của trình duyệt — phù hợp GitHub Pages
    // vì assets có Cache-Control: max-age từ CDN của GitHub
    cache: 'default',
    // Không gửi cookie/auth — GitHub Pages là public
    credentials: 'omit',
  }).finally(() => clearTimeout(timer));
}

/** Gửi message về tất cả tab đang mở */
async function broadcast(msg) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(c => c.postMessage(msg));
}

/** Kiểm tra tổng dung lượng cache, xóa file cũ nếu vượt giới hạn */
async function enforceCacheLimit(cache) {
  const keys = await cache.keys();
  if (keys.length === 0) return;

  // Ước tính nhanh qua Content-Length header (không cần đọc body)
  let total = 0;
  const entries = [];

  for (const req of keys) {
    const res = await cache.match(req);
    if (!res) continue;
    const cl = parseInt(res.headers.get('content-length') || '0', 10);
    // Nếu không có Content-Length, ước tính 500KB (trung bình cho media)
    const size = cl > 0 ? cl : 512 * 1024;
    total += size;
    entries.push({ req, size });
  }

  if (total <= MAX_CACHE_BYTES) return;

  // Xóa từ đầu (file được cache sớm nhất) cho đến khi đủ chỗ
  for (const { req, size } of entries) {
    if (total <= MAX_CACHE_BYTES * 0.9) break; // dừng khi còn 90% giới hạn
    await cache.delete(req);
    total -= size;
    console.log('[SW] Đã xóa khỏi cache:', req.url);
  }
}

// ─── INSTALL ─────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Tải core assets tuần tự để đảm bảo app luôn khởi động được
      // Nếu 1 file lỗi, không block hết — dùng allSettled
      const results = await Promise.allSettled(
        CORE_ASSETS.map(url =>
          fetchWithTimeout(url, TIMEOUT_CORE)
            .then(res => {
              if (res.ok) return cache.put(url, res);
              // Không throw — GitHub Pages trả 200 cho SPA redirects
              console.warn('[SW] Install: bỏ qua', url, res.status);
            })
            .catch(err => console.warn('[SW] Install lỗi:', url, err.message))
        )
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) console.warn(`[SW] Install: ${failed} file core bị lỗi`);
    })
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Xóa cache cũ:', name);
            return caches.delete(name);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ─── FETCH ───────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Chỉ xử lý HTTP/HTTPS, bỏ qua chrome-extension, etc.
  if (!url.protocol.startsWith('http')) return;

  // Bỏ qua các request đến domain khác (analytics, fonts CDN ngoài)
  // GitHub Pages thường serve cùng origin — giữ lại cross-origin nếu cần
  // Nếu muốn cache cross-origin (ví dụ Google Fonts), bỏ dòng này
  // if (url.origin !== self.location.origin) return;

  // ── Media: Cache-first, không bao giờ revalidate (tiết kiệm data mobile)
  if (/\.(mp3|ogg|wav|png|jpg|jpeg|webp|gif|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstMedia(event.request));
    return;
  }

  // ── JS / CSS / JSON: Stale-while-revalidate (luôn dùng bản cache ngay,
  //    cập nhật ngầm để lần sau dùng bản mới hơn)
  if (/\.(js|css|json)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // ── HTML / navigation: Network-first với timeout, fallback về cache
  //    Phù hợp GitHub Pages vì HTML luôn muốn mới nhất
  if (event.request.mode === 'navigate' || /\.html?$/i.test(url.pathname)) {
    event.respondWith(networkFirstNav(event.request));
    return;
  }

  // ── Mặc định: Cache-first cho phần còn lại
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});

/** Cache-first cho media — không tốn data mobile */
async function cacheFirstMedia(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(request.url, TIMEOUT_MEDIA);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline + không có cache → trả 503 rõ ràng thay vì crash
    return new Response('Offline: media không có trong cache', { status: 503 });
  }
}

/** Stale-while-revalidate cho JS/CSS/JSON */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Luôn cập nhật ngầm (không await) để lần sau dùng bản mới
  const fetchPromise = fetchWithTimeout(request.url, TIMEOUT_CORE)
    .then(res => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null); // lỗi mạng không crash SW

  // Trả cache ngay nếu có, không thì chờ mạng
  return cached || (await fetchPromise) ||
    new Response('Offline: file không có trong cache', { status: 503 });
}

/** Network-first cho HTML navigation */
async function networkFirstNav(request) {
  try {
    const response = await fetchWithTimeout(request.url, TIMEOUT_CORE);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()); // update cache ngầm
    }
    return response;
  } catch {
    // Offline → thử cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Không có cache → trang offline
    const offlinePage = await caches.match('./offline.html');
    return offlinePage || new Response(
      '<h1>Bạn đang offline</h1><p>Vui lòng kết nối mạng và thử lại.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ─── MESSAGE: START_CACHING ───────────────────────────────────────
/**
 * Tải song song có kiểm soát:
 * - Tự động chọn số luồng dựa vào effectiveType của mạng
 * - Mỗi file: timeout + retry tối đa MAX_RETRIES lần
 * - Batch báo tiến độ mỗi 2% để giảm IPC overhead
 * - Gửi CACHE_COMPLETE hoặc CACHE_ERROR khi xong
 * - Ngắt toàn bộ nếu nhận STOP_CACHING từ UI
 */
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'START_CACHING') {
    await runCaching(event.data.files || []);
  }

  if (event.data?.type === 'STOP_CACHING') {
    stopRequested = true;
  }
});

let stopRequested = false;

async function runCaching(files) {
  stopRequested = false;

  if (!files.length) {
    await broadcast({ type: 'CACHE_COMPLETE', total: 0, errors: 0 });
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  const queue = [...files];
  let downloaded = 0;
  let errors = 0;
  let lastReportedPct = -1;

  // ── Chọn số luồng song song ────────────────────────────────────
  // effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
  // GitHub Pages CDN xử lý tốt 8 kết nối đồng thời trên 4G
  const conn = (self.navigator || {}).connection || {};
  const etype = conn.effectiveType || '4g';
  const MAX_CONCURRENT =
    etype === '4g'     ? 8 :
    etype === '3g'     ? 4 :
    /* 2g / slow-2g */ 2;

  console.log(`[SW] Bắt đầu cache ${files.length} file, ${MAX_CONCURRENT} luồng (${etype})`);

  /** Tải một file với retry */
  async function downloadOne(url) {
    if (stopRequested) return 'stopped';

    // Đã có trong cache → bỏ qua
    const existing = await cache.match(url);
    if (existing) return 'skipped';

    let lastErr;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (stopRequested) return 'stopped';

      if (attempt > 0) {
        // Chờ trước khi retry, tránh flood server
        await sleep(TIMEOUT_RETRY * attempt);
      }

      try {
        const response = await fetchWithTimeout(url, TIMEOUT_MEDIA);
        if (response.ok) {
          await cache.put(url, response);
          return 'ok';
        }
        // 4xx → không retry (file không tồn tại hoặc lỗi cố định)
        if (response.status >= 400 && response.status < 500) {
          console.warn(`[SW] ${response.status} bỏ qua: ${url}`);
          return 'skipped';
        }
        // 5xx → retry
        lastErr = new Error(`HTTP ${response.status}`);
      } catch (err) {
        // AbortError (timeout) hoặc NetworkError → retry
        lastErr = err;
        console.warn(`[SW] Lỗi lần ${attempt + 1}/${MAX_RETRIES + 1}: ${url} — ${err.message}`);
      }
    }

    console.error(`[SW] Bỏ qua sau ${MAX_RETRIES + 1} lần thất bại: ${url}`);
    return 'error';
  }

  /** Worker: lấy task từ queue đến khi hết */
  async function worker() {
    while (queue.length > 0) {
      if (stopRequested) break;
      const url = queue.shift();
      if (!url) break;

      const result = await downloadOne(url);
      if (result === 'error') errors++;

      downloaded++;

      // Báo tiến độ: chỉ gửi khi tăng ít nhất 2% hoặc là file cuối
      const pct = Math.round((downloaded / files.length) * 100);
      if (pct >= lastReportedPct + 2 || downloaded === files.length) {
        lastReportedPct = pct;
        await broadcast({
          type: 'CACHE_PROGRESS',
          progress: pct,
          downloaded,
          total: files.length,
          errors,
        });
      }
    }
  }

  // ── Khởi chạy N worker song song ─────────────────────────────
  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT, files.length) },
    () => worker()
  );

  await Promise.all(workers);

  // ── Kiểm tra giới hạn dung lượng ────────────────────────────
  await enforceCacheLimit(cache);

  const status = stopRequested ? 'stopped' : (errors === 0 ? 'ok' : 'partial');
  await broadcast({
    type: 'CACHE_COMPLETE',
    status,              // 'ok' | 'partial' | 'stopped'
    total: files.length,
    downloaded,
    errors,
  });

  console.log(`[SW] Cache xong. Status: ${status}, lỗi: ${errors}/${files.length}`);
}

// ─── Utility ──────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
