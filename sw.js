const CACHE_NAME = 'gizmo-app-v5';
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json'
];

// App Install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Cache addAll non-critical failure:', err);
      });
    })
  );
});

// Activate & Clean Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Network First with Cache Fallback for GET requests
self.addEventListener('fetch', event => {
  // Ignore non-GET, Google Apps Script, and extension requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('script.google.com') ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // type === 'basic' ကန့်သတ်ချက်ကို ဖြုတ်ပြီး Opaque response (status 0) ကိုပါ လက်ခံပေးရန်
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});