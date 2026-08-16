/* Minimal service worker for the GitHub Pages static copy.
 *
 * Stale-while-revalidate: serve the cached copy instantly, refresh the cache
 * from the network in the background, and fall back to the cache when offline
 * (students on the bus). Never intercept cross-origin requests (Google Fonts,
 * GA, the API server) — those pass straight through.
 *
 * Deploys keep the PREVIOUS cache around (caches.match searches all caches),
 * so a page that was already open on the old build can still load its old
 * hashed assets after the new build rolls out — no mid-session 404s.
 */
const CACHE = 'tals-cache-v3';
const KEEP_CACHES = 2; // current + the previous build's cache

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        const ours = keys.filter((k) => k.startsWith('tals-cache-')).sort();
        const doomed = ours.slice(0, Math.max(0, ours.length - KEEP_CACHES));
        return Promise.all(doomed.map((k) => caches.delete(k)));
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});