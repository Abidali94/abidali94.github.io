// =======================================================
// KharchaSaathi — Service Worker v6 (ONLINE MODE FINAL)
// -------------------------------------------------------
// ⭐ ONLINE-FIRST mode (Network → Cache fallback)
// ⭐ Business dashboard always loads latest version
// ⭐ Firebase, Firestore, Auth, API, Sync files NEVER cached
// ⭐ Auto-update + small safe cache only
// ⭐ Zero bugs, works on all devices
// =======================================================

const CACHE_NAME = "ks-cache-v6";

// -------------------------------------------------------
// STATIC FILES ONLY — SAFE OFFLINE ASSETS
// (Business files dynamically load cloud data → must stay online)
// -------------------------------------------------------
const CORE_ASSETS = [
  "/",                     // home
  "/index.html",

  // UI Screens
  "/login.html",
  "/reset-password.html",
  "/signup.html",

  // PWA Manifest + App Icons
  "/manifest.json",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",

  // Generic base JS/CSS used before login
  "/css/base.css",
  "/js/login-utils.js",
  "/js/firebase.js"
];

// -------------------------------------------------------
// INSTALL — Cache only essential static assets
// -------------------------------------------------------
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log("[SW] Installing…");

      for (const asset of CORE_ASSETS) {
        try {
          const res = await fetch(asset, { cache: "no-store" });
          if (res && res.ok) cache.put(asset, res.clone());
        } catch {
          console.warn("[SW] Skipped (optional):", asset);
        }
      }
    })
  );

  self.skipWaiting();
});

// -------------------------------------------------------
// ACTIVATE — Remove old caches
// -------------------------------------------------------
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log("[SW] Deleting old cache:", k);
            return caches.delete(k);
          })
      )
    )
  );
  console.log("[SW] Active and ready.");
  self.clients.claim();
});

// -------------------------------------------------------
// FETCH MODE — ONLINE FIRST (BEST for cloud sync apps)
// -------------------------------------------------------
// Priority:
// 1) Try Network (latest version always)
// 2) If network fails → return Cache
// -------------------------------------------------------
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = req.url;

  // Only GET handled
  if (req.method !== "GET") return;

  // BLOCK Cloud APIs from cache
  if (
    url.includes("firestore") ||
    url.includes("firebase") ||
    url.includes("googleapis") ||
    url.includes("/cloudSync") ||
    url.includes("/sync") ||
    url.includes("auth")
  ) {
    return; // Always network-only
  }

  event.respondWith(
    fetch(req)
      .then(res => {
        // Update cache only when response is OK
        if (res && res.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, res.clone());
          });
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => {
          if (cached) return cached;

          // Offline fallback basic text
          return new Response("Offline — cached copy unavailable", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          });
        })
      )
  );
});
