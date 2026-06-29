const CACHE_NAME = 'gizmo-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js'
];

// App ကို Install လုပ်သည့်အခါ ဖိုင်များကို မှတ်သားထားခြင်း
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// နောက်တစ်ကြိမ် App ဖွင့်သည့်အခါ မှတ်ထားသည့် ဖိုင်များကို ချက်ချင်းပြန်ပြခြင်း
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});