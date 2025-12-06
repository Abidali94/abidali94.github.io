// =======================================================
// KharchaSaathi — Service Worker v5 (Ultra Stable)
// -------------------------------------------------------
// ✔ CCACHE_NAME bug removed
// ✔ Essential assets cached only
// ✔ Auto-update
// ✔ Firebase/API never cached
// ✔ Offline fallback
// =======================================================

const CACHE_NAME = "ks-cache-v5";

// -------------------------------------------------------
// REAL icons (auto-safe approach)
// Because users may have different favicon path.
// We check both paths, whichever exists will cache.
// -------------------------------------------------------
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",             // Primary
  "/icons/icon-192.png",      // PWA icon
  "/icons/icon-512.png"       // PWA icon
];

// -------------------------------------------------------
// INSTALL — Cache essential static assets
// -------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("[SW] Installing…");

      for (const asset of CORE_ASSETS) {
        try {
          const res = await fetch(asset, { cache: "no-store" });
          if (res && res.ok) cache.put(asset, res.clone());
        } catch (err) {
          console.warn("[SW] Asset missing (ignored):", asset);
        }
      }
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
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log("[SW] Removing old cache:", key);
          return caches.delete(key);
        })
      )
    )
  );
  console.log("[SW] Activated. Old caches removed.");
  self.clients.claim();
});

// -------------------------------------------------------
// FETCH — Cache-first, background refresh
// -------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only GET requests handled
  if (req.method !== "GET") return;

  const url = req.url;

  // NEVER cache firebase or dynamic APIs
  if (
    url.includes("firestore") ||
    url.includes("firebase") ||
    url.includes("googleapis") ||
    url.includes("/account") ||
    url.includes("/sync")
  ) {
    return; // must hit network only
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, res.clone());
            });
          }
          return res;
        })
        .catch(() => {
          // If offline & no cache → fallback message
          if (cached) return cached;
          return new Response("Offline — no cached copy available", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        });

      return cached || networkFetch;
    })
  );
});
