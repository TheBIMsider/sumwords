/*
 * Sumwords service worker: makes the game work offline after one online visit.
 * Strategy: network first, cache fallback, for same-origin GET requests under
 * this worker's scope. Keep CACHE_NAME equal to 'sumwords-v' + GAME_VERSION in
 * game.js (checked by tests/pwa.test.js). Bump it on every release.
 */

const CACHE_NAME = 'sumwords-v1.3.0';

// Files the game needs, relative to this worker's folder (the scope).
const PRECACHE_PATHS = [
  './',
  'index.html',
  'styles.css',
  'questions.js',
  'game.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'Sumwords_Logo.png',
];

self.addEventListener('install', (event) => {
  // 'reload' skips the browser's HTTP cache so a release always pre-caches fresh files
  const requests = PRECACHE_PATHS.map((path) =>
    new Request(new URL(path, self.registration.scope).href, { cache: 'reload' })
  );
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(requests))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('sumwords-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // Requests with this combination (seen with DevTools open) failed with
  // ERR_CACHE_MISS when refetched here, so leave them to the browser.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.href.startsWith(self.registration.scope)) return;

  event.respondWith(networkFirst(request));
});

/**
 * Try the network and refresh the cache. If the network fails, serve the
 * cached copy (ignoring any query string). Only OK responses are cached, so
 * a 404 never replaces a good copy.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}
