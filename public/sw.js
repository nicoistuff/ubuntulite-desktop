// Ubuntu 26.04 Browser Desktop — offline service worker.
// Safe strategy: network-first for pages (fresh content when online),
// cache-first only for same-origin static assets. Bump CACHE_VERSION on
// every release so old caches are dropped on activate.
const CACHE_VERSION = 'ubuntu-desktop-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

self.addEventListener('install', (event) => {
  // Take over immediately; no stale-while-waiting window.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: try the network first so updates ship immediately;
  // fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put('./', fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(PAGE_CACHE);
          const cached = await cache.match('./');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets (hashed filenames): cache-first, they never change.
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});
