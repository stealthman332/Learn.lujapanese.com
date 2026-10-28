/* ==========================================================================
   MASU · JLC — Service Worker
   Strategy:
     • App shell (HTML, JS, CSS, manifest) → Cache-First
     • Data files (JSON)                   → Stale-While-Revalidate
     • Fonts (Google Fonts)                → Cache-First (long-lived)
     • Everything else                     → Network-First
   ========================================================================== */

const CACHE_NAME = "masu-v1";
const BASE = new URL(self.registration?.scope || self.location.href).pathname.replace(/\/$/, "");
const SHELL_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/app.js`,
  `${BASE}/app.css`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
];

/* ---- Install: pre-cache the app shell ----------------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

/* ---- Activate: clean old caches ----------------------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ---- Fetch: routing by request type ------------------------------------- */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Google Fonts → Cache-First (they never change once fetched)
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Data JSON files → Stale-While-Revalidate
  if (url.pathname.includes("/data/") && url.pathname.endsWith(".json")) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // App shell assets → Cache-First
  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Everything else → Network-First with cache fallback
  event.respondWith(networkFirst(event.request));
});

/* ---- Strategies --------------------------------------------------------- */

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}
