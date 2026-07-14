const CACHE_NAME = 'gizmo-app-v2';
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'app.js'
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

// 🌐 Network-First & Security Logic
self.addEventListener('fetch', event => {
  // 🔒 Security & Method Check: GET request မဟုတ်လျှင် (သို့) Google API ဖြစ်လျှင် Cache မလုပ်ရန် တားမြစ်ခြင်း
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return; 
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Status 200 ဖြစ်မှသာ Cache ထဲထည့်မည် (Error Pages နှင့် Opaque Data များ ဖုန်း Storage မပြည့်စေရန်)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => {
        // အင်တာနက် မရှိတော့မှသာ ဖုန်းထဲတွင် မှတ်ထားသော (Offline) Cache ကို ပြန်သုံးမည်
        return caches.match(event.request);
      })
  );
});

// 🧹 App version အသစ်တင်တိုင်း Cache အဟောင်းများကို ရှင်းလင်းပေးခြင်း (ဖုန်း Storage မပြည့်စေရန်)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // နာမည်မတူတဲ့ Cache အဟောင်းမှန်သမျှ ဖျက်ပစ်မည်
          }
        })
      );
    })
  );
});