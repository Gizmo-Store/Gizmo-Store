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

// 🌐 Optimized Fetch Strategy (Stale-While-Revalidate for Lightning Speed)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // 🔒 ၁။ Google API နှင့် Google Analytics/Tag Manager များကို Cache လုံးဝ မလုပ်ဘဲ Network မှသာ တိုက်ရိုက်ယူမည်
  if (url.includes('script.google.com') || url.includes('googletagmanager.com') || url.includes('google-analytics.com')) {
    return; 
  }

  // ⚡ ၂။ App Shell (HTML, CSS, JS) အတွက် Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // နောက်ကွယ်မှ Network ကို တိတ်တဆိတ် ခေါ်ပြီး Cache ကို အသစ်ပြင်ဆင်ခြင်း (Background Revalidation)
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // အောင်မြင်သော Basic Request ဖြစ်မှသာ Cache ထဲသို့ အသစ်ထပ်ထည့်မည်
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => {
        // Offline ဖြစ်နေပါက Error မပြဘဲ တိတ်တဆိတ် လျစ်လျူရှုမည်
      });

      // Cache ထဲတွင် ရှိပါက ချက်ချင်းပြန်ပြပေးမည် (စောင့်စရာမလိုပါ)။ Cache မရှိမှသာ Network ကို စောင့်မည်။
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