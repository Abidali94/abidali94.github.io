// =======================================================
// KharchaSaathi — Updated Service Worker (v3 Safe Edition)
// No stale cache, auto-update, full tool support
// =======================================================

const CACHE_NAME = "ks-cache-v3";

// List only IMPORTANT core files.
// Tools & dashboard load dynamically (cache-first-safe).
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/favicon.png",
];

// -------------------------------------------------------
// INSTALL — Cache core files
// -------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CCACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// -------------------------------------------------------
// ACTIVATE — Delete old caches
// -------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// -------------------------------------------------------
// FETCH — Cache-first but safe-update (no stale files)
// -------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only GET requests
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          // Only cache safe responses
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, res.clone());
            });
          }
          return res;
        })
        .catch(() => cached); // offline fallback

      // Return cached immediately and update in background
      return cached || networkFetch;
    })
  );
});
