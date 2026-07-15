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
  // 🔒 Security: Google API (Products & Tracking) များကို Service Worker မှ လုံးဝ Cache မလုပ်ရန် တားမြစ်ခြင်း (Data အမှားများ မပေါ်စေရန်)
  if (event.request.url.includes('script.google.com')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // ⚡ Cache ထဲတွင် ရှိပါက ချက်ချင်း ပြန်ပြပေးမည် (စောင့်စရာမလို)
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // အောင်မြင်သော (Status 200) Basic Request ဖြစ်မှသာ Cache ထဲသို့ အသစ်ထပ်ထည့်မည်
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => {
        // အင်တာနက် ပြတ်တောက်နေပါက လျစ်လျူရှုမည်
      });
      
      // Cache မရှိမှသာ Network ကို စောင့်မည်
      return cachedResponse || fetchPromise;
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