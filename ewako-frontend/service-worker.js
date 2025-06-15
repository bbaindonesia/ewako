
const CACHE_NAME = 'ewako-royal-cache-v17-dynamic-help'; // Incremented cache name
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon-192.png', 
  '/assets/icon-512.png',
  // Note: Main JS/TSX files are not pre-cached here, they are cached on first fetch.
];

self.addEventListener('install', event => {
  console.log(`[SW ${CACHE_NAME}] Install event`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW ${CACHE_NAME}] Opened cache. Caching initial assets.`);
        // Ensure that requests for pre-cached assets bypass any browser http cache.
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
      .then(() => {
        console.log(`[SW ${CACHE_NAME}] Initial assets cached. Calling skipWaiting().`);
        return self.skipWaiting(); // Force the waiting service worker to become the active service worker.
      })
      .catch(error => {
        console.error(`[SW ${CACHE_NAME}] Failed to cache initial assets:`, error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log(`[SW ${CACHE_NAME}] Activate event`);
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[SW ${CACHE_NAME}] Deleting old cache:`, cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      console.log(`[SW ${CACHE_NAME}] Old caches deleted. Claiming clients.`);
      return self.clients.claim(); // Become the controller for all clients within its scope.
    }).catch(error => {
      console.error(`[SW ${CACHE_NAME}] Activation failed:`, error);
    })
  );
});

self.addEventListener('fetch', event => {
  // console.log(`[SW ${CACHE_NAME}] Fetch event for:`, event.request.url, "Mode:", event.request.mode, "Destination:", event.request.destination);

  // Network first for navigation requests (HTML documents)
  if (event.request.mode === 'navigate' || (event.request.destination === 'document')) {
    console.log(`[SW ${CACHE_NAME}] Handling navigation request (network-first): ${event.request.url}`);
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            console.log(`[SW ${CACHE_NAME}] Navigation request successful from network: ${event.request.url}. Caching.`);
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          } else if (networkResponse) {
            console.log(`[SW ${CACHE_NAME}] Navigation request from network returned non-ok: ${event.request.url}, status: ${networkResponse.status}`);
          } else {
            console.log(`[SW ${CACHE_NAME}] Navigation request from network failed (no response): ${event.request.url}`);
          }
          // If networkResponse is falsy (e.g., offline or network error), it will proceed to .catch
          // If networkResponse is not ok (e.g. 404, 500), we still return it, but we might want to fallback.
          // For true network failure (error thrown), catch block is used.
          return networkResponse || caches.match(event.request); // Fallback to cache if networkResponse is totally falsy
        })
        .catch(error => {
          console.error(`[SW ${CACHE_NAME}] Network fetch failed for navigation request: ${event.request.url}`, error);
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log(`[SW ${CACHE_NAME}] Serving navigation request from cache: ${event.request.url}`);
                return cachedResponse;
              }
              // Fallback to root if specific cached page not found.
              console.log(`[SW ${CACHE_NAME}] Fallback for navigation: ${event.request.url} not in cache, trying / or /index.html`);
              return caches.match('/') 
                     .then(rootMatch => rootMatch || caches.match('/index.html'));
            });
        })
    );
    return;
  }

  // Cache first, then network for other assets (JS, CSS, images etc.)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log(`[SW ${CACHE_NAME}] Serving from cache: ${event.request.url}`);
          return cachedResponse;
        }
        // console.log(`[SW ${CACHE_NAME}] Not in cache, fetching from network: ${event.request.url}`);
        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              // console.log(`[SW ${CACHE_NAME}] Network response not cacheable or not OK for: ${event.request.url}, status: ${networkResponse?.status}`);
              return networkResponse;
            }
            // console.log(`[SW ${CACHE_NAME}] Caching network response for: ${event.request.url}`);
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
          console.error(`[SW ${CACHE_NAME}] Fetch failed for non-navigation: ${event.request.url}`, error);
          // Optionally, provide a fallback for specific asset types if needed
        });
      })
  );
});
