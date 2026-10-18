/* Cache only this app's static shell. Never cache Google API requests. */
const APP_PREFIX = 'super-opr-' + self.registration.scope;
const CACHE_NAME = APP_PREFIX + 'mario-v2-bulk-audio';
const FILES = [
  './', './index.html', './offline.html', './pwa.js', './bulk-opr.js', './game-audio.js', './mario-edition.css', './manifest.webmanifest',
  './assets/tailwind.js', './assets/fonts.css', './assets/fontawesome.css',
  './assets/font-0.ttf', './assets/font-1.ttf', './assets/font-2.ttf', './assets/font-3.ttf',
  './assets/webfonts/fa-solid-900.woff2', './assets/webfonts/fa-regular-400.woff2', './assets/webfonts/fa-brands-400.woff2',
  './assets/header-mario-opr.png', './assets/lencana-sekolah.png', './assets/lencana-pixel.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
const STATIC_URLS = new Set(FILES.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(APP_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.href.startsWith(scope.href)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok && STATIC_URLS.has(url.href)) await cache.put(request, response.clone());
        if (response.ok) return response;
      } catch (_) {}
      return (await cache.match(request)) || (await cache.match(new URL('./index.html', scope))) || (await cache.match(new URL('./offline.html', scope)));
    })());
    return;
  }
  if (!STATIC_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  })());
});
