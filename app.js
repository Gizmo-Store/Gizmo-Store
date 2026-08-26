/* ──────────────────────────────────────────────
   Optimized App Logic & Performance-Engineered Rendering
────────────────────────────────────────────── */

const fallbackImg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 viewBox=%270 0 300 300%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27transparent%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-weight=%27bold%27 font-size=%2722%27 fill=%27%239ca3af%27%3ENo Image%3C/text%3E%3C/svg%3E";

let allProducts = [];
let filteredProducts = [];
let displayLimit = 8;
const PER_PAGE = 8;
let orderProd = '';
let searchTimeout;

// Cached DOM Elements for Performance
let fabUpEl = null;

const esc = (t) => (t || '').toString().replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function normalizePhone(p) {
  if (!p) return '';
  let s = p.toString().replace(/[-.\s+]/g, '');
  if (s.startsWith('959')) return '09' + s.substring(3);
  if (s.startsWith('9509')) return '09' + s.substring(4);
  if (s.startsWith('9') && s.length > 8) return '0' + s;
  return s;
}

/* ──────────────────────────────────────────────
   Slider Initialization
────────────────────────────────────────────── */
let globalSliderInterval; // အပြင်ဘက်သို့ ထုတ်လိုက်ပါသည်

function initSlider() {
  const track = document.getElementById('sliderTrack');
  if (!track) return;
  
  // 🌟 အဟောင်းများကို ရှင်းလင်းခြင်း (Timer များနှင့် Clone များ ရောထွေးမှုမဖြစ်စေရန်)
  clearInterval(globalSliderInterval);
  const oldClones = track.querySelectorAll('#first-clone, #last-clone');
  oldClones.forEach(c => c.remove());
  
  const slides = document.querySelectorAll('.slider-track .slide');
  const dotsContainer = document.getElementById('sliderDots');
  const totalOriginalSlides = slides.length;

  if(dotsContainer) dotsContainer.innerHTML = ''; // Dot အဟောင်းများ ရှင်းလင်းရန်
  track.style.transform = 'translateX(0%)'; // နေရာပြန်ချရန်

  if (totalOriginalSlides <= 1) return; // ပုံ ၁ ပုံတည်းဆိုလျှင် မရွေ့စေရန်ရပ်မည်

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[totalOriginalSlides - 1].cloneNode(true);
  firstClone.id = 'first-clone';
  lastClone.id = 'last-clone';
  
  const firstImg = firstClone.querySelector('img');
  const lastImg = lastClone.querySelector('img');
  if (firstImg) firstImg.removeAttribute('loading');
  if (lastImg) lastImg.removeAttribute('loading');
  
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  
  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);

  let currentSlide = 1; 
  let isTransitioning = false; 
  let transitionTimeout;

  track.style.transform = `translateX(-${currentSlide * 100}%)`;

  for (let i = 0; i < totalOriginalSlides; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.setAttribute('tabindex', '0'); 
    dot.setAttribute('role', 'button');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    
    dot.addEventListener('click', () => { if(!isTransitioning) goToSlide(i + 1); });
    dot.addEventListener('keydown', (e) => { 
      if (e.key === 'Enter' && !isTransitioning) goToSlide(i + 1); 
    });

    dotsContainer.appendChild(dot);
  }
  const dots = document.querySelectorAll('.slider-dots .dot');

  function updateDots() {
    dots.forEach(d => d.classList.remove('active'));
    let activeIndex = currentSlide - 1;
    if (currentSlide === 0) activeIndex = totalOriginalSlides - 1;
    if (currentSlide === totalOriginalSlides + 1) activeIndex = 0;
    if (dots[activeIndex]) dots[activeIndex].classList.add('active');
  }

  function goToSlide(index) {
    if (isTransitioning || currentSlide === index) return;
    currentSlide = index;
    isTransitioning = true;
    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    updateDots();
    resetInterval();

    clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
      if (isTransitioning) handleBoundary();
    }, 550);
  }

  function handleBoundary() {
    isTransitioning = false;
    if (track.children[currentSlide] && track.children[currentSlide].id === 'first-clone') {
      track.style.transition = 'none';
      currentSlide = 1; 
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    if (track.children[currentSlide] && track.children[currentSlide].id === 'last-clone') {
      track.style.transition = 'none';
      currentSlide = totalOriginalSlides; 
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    updateDots();
  }

  let startX = 0;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    clearInterval(globalSliderInterval); 
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    let endX = e.changedTouches[0].clientX;
    let diff = startX - endX;
    
    if (diff > 40) { 
      if(!isTransitioning) goToSlide(currentSlide + 1);
    } else if (diff < -40) { 
      if(!isTransitioning) goToSlide(currentSlide - 1);
    } else {
      resetInterval(); 
    }
  });

  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  if (prevBtn) prevBtn.addEventListener('click', () => { if(!isTransitioning) goToSlide(currentSlide - 1); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if(!isTransitioning) goToSlide(currentSlide + 1); });

  track.addEventListener('transitionend', handleBoundary);

  function resetInterval() {
    clearInterval(globalSliderInterval);
    globalSliderInterval = setInterval(() => {
      const hero = document.getElementById('mainSlider');
      if (hero && hero.style.display !== 'none' && !document.hidden) {
        goToSlide(currentSlide + 1);
      }
    }, 3500);
  }

  resetInterval();
  
  let resizeTimer;
  let lastWidth = window.innerWidth;

  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return; 
    lastWidth = window.innerWidth;
    
    clearTimeout(resizeTimer);
    track.style.transition = 'none';
    
    resizeTimer = setTimeout(() => {
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      isTransitioning = false;
    }, 50);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fabUpEl = document.getElementById('fabUp');
  // initSlider() ကို ဤနေရာတွင် မခေါ်တော့ပါ။ API မှ Slider ပုံများရောက်လာမှ ခေါ်ပါမည်။
  fetchProducts();
  
  const isDark = document.body.classList.contains('dark');
  const ft = document.getElementById('fabTheme');
  if(ft) ft.textContent = isDark ? '☀️' : '🌙';

  document.getElementById('productGrid').addEventListener('click', (e) => {
    const cardEl = e.target.closest('.prd-card');
    if (!cardEl) return;
    
    if (e.target.closest('.c-btn-info') || e.target.classList.contains('c-btn-info')) {
      viewDetails(cardEl);
    } else if (e.target.closest('.c-btn-buy') || e.target.classList.contains('c-btn-buy')) {
      openContact(cardEl.dataset.title);
    }
  });
});

function applyDark(on){
  document.body.classList.toggle('dark', on);
  const ft = document.getElementById('fabTheme');
  if(ft) ft.textContent = on ? '☀️' : '🌙';
}

function toggleDark(){
  const on = !document.body.classList.contains('dark');
  applyDark(on);
  localStorage.setItem('gz_dark', on ? '1' : '0');
}

function toast(msg, ok=false){
  const a = document.getElementById('toast-area');
  const el = document.createElement('div');
  el.className = 'tp';
  el.innerHTML = `${ok ? '✅' : '⚠️'} ${esc(msg)}`;
  a.appendChild(el);
  requestAnimationFrame(() => setTimeout(() => el.classList.add('show'), 10));
  setTimeout(() => { 
    el.classList.remove('show'); 
    setTimeout(() => el.remove(), 360);
  }, 3200);
}

/* ──────────────────────────────────────────────
   Data Fetching & Rendering Engine
────────────────────────────────────────────── */

// Object အတွင်းရှိ Key များကို A-Z စီပေးသော Function (Deep Sort အတွက်)
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  return Object.keys(obj).sort().reduce((result, key) => {
    result[key] = sortObjectKeys(obj[key]);
    return result;
  }, {});
}

async function fetchProducts() {
  const cache = localStorage.getItem('gz_cache_v2');
  let hasOldData = false;
  let cachedProductsStr = "";
  let cachedSlidersStr = "";

  const renderInitialData = () => {
    const currentSearch = document.getElementById('searchBar').value.toLowerCase().trim();
    if (currentSearch) {
      applyFilter(currentSearch, false);
    } else {
      const activeTab = document.querySelector('.chip.on');
      const brand = activeTab ? activeTab.id.replace('tab-', '') : 'all';
      applyFilter(brand, true);
    }
  };

  // ၁။ Cache ကို စစ်ဆေးခြင်း
  if (cache) {
    try {
      const cachedData = JSON.parse(cache);
      const now = Date.now();
      const CACHE_EXPIRY = 15 * 60 * 1000; 

      if (cachedData && Array.isArray(cachedData.products) && cachedData.products.length > 0) {
        allProducts = cachedData.products;
        // 🌟 Cache ထဲက Data ကို စီပြီးမှ စာသားပြောင်းမှတ်မည် (နောက်ပိုင်း နှိုင်းယှဉ်ရန်)
        cachedProductsStr = JSON.stringify(sortObjectKeys(cachedData.products)); 
        
        if (Array.isArray(cachedData.sliders) && cachedData.sliders.length > 0) {
          cachedSlidersStr = JSON.stringify(sortObjectKeys(cachedData.sliders));
          renderSliders(cachedData.sliders);
        } else {
          initSlider(); 
        }
        renderInitialData(); 
        hasOldData = true;

        if (cachedData.timestamp && (now - cachedData.timestamp < CACHE_EXPIRY)) {
          console.log("15 မိနစ် မပြည့်သေးပါ။ အဟောင်းကိုသာ ဆက်သုံးပါမည်။");
          return; 
        }
      }
    } catch (e) { console.error('Cache read error', e); }
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
    const { getFirestore, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

    const firebaseConfig = {
      apiKey: "AIzaSyCIGOmt8zpPatkBO4GRqXPBV6YJX8Yqu3I",
      authDomain: "gizmo-attendance.firebaseapp.com",
      databaseURL: "https://gizmo-attendance-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "gizmo-attendance",
      storageBucket: "gizmo-attendance.firebasestorage.app",
      messagingSenderId: "7806025755",
      appId: "1:7806025755:web:ed43f9d95ced51f75878be"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // ၂။ Data သစ်ဆွဲယူခြင်း 
    const prodSnapshot = await getDocs(collection(db, "products"));
    const newProducts = [];
    prodSnapshot.forEach((doc) => { newProducts.push(doc.data()); });
    newProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    const sliderSnapshot = await getDocs(collection(db, "sliders"));
    const newSliders = [];
    sliderSnapshot.forEach((doc) => { newSliders.push(doc.data()); });
    newSliders.sort((a, b) => (a.desktop || '').localeCompare(b.desktop || ''));
    
    if (newProducts.length > 0) {
      // 🌟 အသစ်ရလာသော Data များကိုလည်း စီပြီးမှ စာသားပြောင်းမည်
      const newProductsStr = JSON.stringify(sortObjectKeys(newProducts));
      const newSlidersStr = JSON.stringify(sortObjectKeys(newSliders));

      // ၃။ သေချာစွာ နှိုင်းယှဉ်ခြင်း
      if (newProductsStr !== cachedProductsStr || newSlidersStr !== cachedSlidersStr) {
        console.log("Data အသစ်တွေ့ရှိပါသည်။ UI ကို Refresh လုပ်ပါမည်။");
        localStorage.setItem('gz_cache_v2', JSON.stringify({
          timestamp: Date.now(),
          products: newProducts,
          sliders: newSliders
        }));
        
        allProducts = newProducts;
        if (newSlidersStr !== cachedSlidersStr && newSliders.length > 0) {
          renderSliders(newSliders);
        }
        renderInitialData(); 
      } else {
        console.log("အဟောင်းနှင့် အသစ် တူညီနေပါသည်။ Refresh လုပ်မည်မဟုတ်ပါ။");
        localStorage.setItem('gz_cache_v2', JSON.stringify({
          timestamp: Date.now(),
          products: newProducts,
          sliders: newSliders
        }));
      }
    }
  } catch (e) {
    console.error('Firebase Error:', e);
    if (!hasOldData) {
      document.getElementById('productGrid').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 40px; margin-bottom: 12px;">📶</div>
          <h3 style="margin-bottom: 8px; color: var(--c-text);">Connection Failed</h3>
          <p style="color: var(--c-muted); font-size: 14px;">
            Unable to load products. Please try again.<br>
            <button type="button" onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; border-radius: 50px; background: var(--c-surf2); border: 1px solid var(--c-border); cursor: pointer; color:var(--c-text);">Try Again</button>
          </p>
        </div>`;
    }
  }
}

// 🌟 Slider များကို HTML ထဲသို့ ဖြည့်သွင်းပေးမည့် Function
function renderSliders(slidersData) {
  const track = document.getElementById('sliderTrack');
  if (!track) return;
  
  // 🌟 Timer များကို အရင်ရပ်ပစ်မည်
  clearInterval(globalSliderInterval);
  
  // 🌟 Track အတွင်းရှိ အရာအားလုံးကို အကြွင်းမဲ့ ရှင်းလင်းမည်
  while (track.firstChild) {
      track.removeChild(track.firstChild);
  }
  // Track နေရာကို မူလအတိုင်း ပြန်ထားမည်
  track.style.transition = 'none';
  track.style.transform = 'translateX(0%)';
  
  slidersData.forEach((slide, index) => {
    const desktopImg = slide.desktop ? esc(slide.desktop) : fallbackImg;
    const mobileImg = slide.mobile ? esc(slide.mobile) : desktopImg;
    
    const picture = document.createElement('picture');
    picture.className = 'slide';
    picture.innerHTML = `
      <source media="(min-width: 1024px)" srcset="${desktopImg}">
      <img src="${mobileImg}" alt="Promo ${index + 1}" fetchpriority="${index === 0 ? 'high' : 'auto'}" width="800" height="450" draggable="false">
    `;
    track.appendChild(picture);
  });

  // အသစ်ထည့်ပြီးမှသာ ပြန်စမည်
  setTimeout(() => {
    initSlider();
  }, 50);
}

function setTab(brand, el){
  document.getElementById('searchBar').value = '';
  document.getElementById('clearBtn').style.display = 'none';
  
  const hero = document.getElementById('mainSlider');
  if (hero) hero.style.display = 'block'; 
  
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  if (el) el.classList.add('on');
  
  applyFilter(brand, true);
}

function applyFilter(q, isBrand){
  const cleanQ = q.replace(/\s+/g, ''); 
  
  filteredProducts = allProducts.filter(item => {
    const brandStr = (item.brand || '').toLowerCase().trim();
    const titleStr = (item.title || '').toLowerCase();
    const titleNoSpace = titleStr.replace(/\s+/g, '');
    
    if (isBrand) {
      return q === 'all' || brandStr === q; 
    } else {
      return titleNoSpace.includes(cleanQ) || brandStr.includes(q);
    }
  });
  
  displayLimit = PER_PAGE;
  renderGrid(false); // Full render on filter change
}

// PERFORMANCE OPTIMIZATION: Incremental Append on loadMore
function renderGrid(appendOnly = false) {
  const g = document.getElementById('productGrid');
  
  if (!appendOnly) {
    g.innerHTML = '';
  }
  
  const fragment = document.createDocumentFragment();
  const startIndex = appendOnly ? displayLimit - PER_PAGE : 0;
  const itemsToShow = filteredProducts.slice(startIndex, displayLimit);
  
  itemsToShow.forEach((item) => {
    const title = esc(item.title);
    const price = esc(item.price);
    const desc = esc(item.desc);
    const imgSrc = item.img ? esc(item.img) : fallbackImg;
    
    const el = document.createElement('div');
    el.className = 'prd-card';
    el.dataset.title = item.title || '';
    el.dataset.price = item.price || '';
    el.dataset.desc = item.desc || '';
    
    el.innerHTML = `
      <div class="card-thumb">
        <img loading="lazy" decoding="async" src="${imgSrc}" alt="${title}" width="200" height="200"
          onerror="this.onerror=null; this.src='${fallbackImg}'"
          onclick="viewImg(this.src)"
          role="button" tabindex="0" aria-label="Zoom image"
          onkeydown="if(event.key==='Enter'||event.key===' ') viewImg(this.src)">
      </div>
      <div class="card-body">
        <div class="card-brand">${esc(item.brand)}</div>
        <div class="card-name">${title}</div>
        <div class="card-price">${price}</div>
        <div class="card-btns">
          <button type="button" class="c-btn-info" aria-label="View Details">Detail</button>
          <button type="button" class="c-btn-buy" aria-label="Shop Now">Shop Now</button>
        </div>
      </div>`;
      
    fragment.appendChild(el);
  });

  g.appendChild(fragment);

  document.getElementById('lm-wrap').style.display = filteredProducts.length > displayLimit ? 'block' : 'none';
  document.getElementById('emptyState').style.display = filteredProducts.length === 0 ? 'block' : 'none';
  const cnt = document.getElementById('prod-count');
  cnt.textContent = filteredProducts.length ? `: Showing ${Math.min(displayLimit, filteredProducts.length)} of ${filteredProducts.length}` : '';
}

function loadMore(){
  displayLimit += PER_PAGE;
  renderGrid(true); // Append new items only!
}

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { onSearch(); }, 350); 
}

function onSearch(){
  const q = document.getElementById('searchBar').value.toLowerCase().trim();
  const hero = document.getElementById('mainSlider');
  document.getElementById('clearBtn').style.display = q ? 'block' : 'none';
  
  if (!q) { 
    clearSearch();
    return; 
  }
  
  if (hero) hero.style.display = 'none'; 
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  
  applyFilter(q, false);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function clearSearch(){
  clearTimeout(searchTimeout);
  const searchInput = document.getElementById('searchBar');
  searchInput.value = '';
  document.getElementById('clearBtn').style.display = 'none';
  
  const hero = document.getElementById('mainSlider');
  if (hero) hero.style.display = 'block'; 
  
  const activeTab = document.querySelector('.chip.on');
  if (activeTab) {
    const brand = activeTab.id.replace('tab-', '');
    applyFilter(brand, true);
  } else {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
    const allTab = document.getElementById('tab-all');
    if (allTab) allTab.classList.add('on');
    applyFilter('all', true);
  }
}

/* ──────────────────────────────────────────────
   Modals & Interaction Engine
────────────────────────────────────────────── */
function openMod(id) {
  const currentlyOpen = document.querySelector('.modal.open');
  if (currentlyOpen) {
    currentlyOpen.classList.remove('open');
    history.replaceState({ modal: id }, '');
  } else {
    history.pushState({ modal: id }, '');
  }
  document.getElementById(id).classList.add('open');
  document.body.classList.add('locked');

  if (id === 'track-modal') {
    setTimeout(() => {
      const trackInp = document.getElementById('trackInp');
      if (trackInp) trackInp.focus();
    }, 100);
  }
}

function closeMod(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  document.body.classList.remove('locked');
  if (history.state && history.state.modal === id) {
    history.back();
  }
  
  if (id === 'track-modal') {
    const trackInput = document.getElementById('trackInp');
    if (trackInput) trackInput.value = '';
  }
}

window.addEventListener('popstate', () => {
  const openModals = document.querySelectorAll('.modal.open');
  if (openModals.length > 0) {
    openModals.forEach(m => m.classList.remove('open'));
    document.body.classList.remove('locked');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal.open');
    if (openModal) closeMod(openModal.id);
  }
});

function viewImg(src){
  const imgEl = document.getElementById('modal-img');
  imgEl.src = src;
  // မူလပုံစံအတိုင်း ပြန်ဖြစ်စေရန် inline style များကို ရှင်းလင်းခြင်း
  imgEl.style.maxWidth = '';
  imgEl.style.maxHeight = '';
  imgEl.style.cursor = 'default';
  openMod('img-modal');
}

function viewDetails(cardEl){
  document.getElementById('d-name').innerText = cardEl.dataset.title || '';
  document.getElementById('d-price').innerText = cardEl.dataset.price || '';
  document.getElementById('d-desc').innerText = cardEl.dataset.desc || '';
  
  document.getElementById('d-buy').onclick = () => { openContact(cardEl.dataset.title); };
  openMod('details-modal');
}

function openContact(title){
  orderProd = title || '';
  openMod('contact-modal');
}

function doPlatform(p){
  const textMsg = orderProd ? 'Hi, I want to inquire about: ' + orderProd : 'Hi, I would like to inquire about your products.';
  if (p === 'messenger') {
    window.open('https://m.me/1UdKJrfqfP', '_blank', 'noopener,noreferrer');
  } else if (p === 'telegram') {
    window.open('https://t.me/GizmoMDY1?text=' + encodeURIComponent(textMsg), '_blank', 'noopener,noreferrer');
  }
  closeMod('contact-modal');
}

async function doTrack(){
  const raw = document.getElementById('trackInp').value.trim();
  const clean = normalizePhone(raw); 
  
  if (!clean || clean.length < 8) { 
    toast('ဖုန်းနံပါတ် မှန်ကန်မှုမရှိပါ။ ပြန်လည်စစ်ဆေးပေးပါ။'); 
    return; 
  }

  if (!navigator.onLine) {
    toast('အင်တာနက် ချိတ်ဆက်မှု မရှိပါ။ Data သို့မဟုတ် Wi-Fi ကို ဖွင့်ပါ။');
    return;
  }

  const trackBtn = document.querySelector('#track-modal .btn-primary');
  const originalText = trackBtn.innerText;
  trackBtn.innerText = 'Searching...';
  trackBtn.disabled = true;

  try {
    const API_URL = 'https://script.google.com/macros/s/AKfycbz659VRQoUdRfXIEg0denAkFZ-0bYjXIUl5Aoq7YFAXuhZXf4j7lr4Z1apDP8Bqckf_/exec';
    const response = await fetch(`${API_URL}?phone=${clean}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Server မှ Data ပုံစံမှားယွင်းနေပါသည်။');
    }
    
    const rows = Array.isArray(data) ? data : (data?.tracking || []);
    
    if (!rows.length) { 
      toast('ပါဆယ်စာရင်း မတွေ့ရှိပါ။ ဖုန်းနံပါတ် မှားယွင်းနေနိုင်ပါသည်။'); 
      return; 
    }

    let maskedPhone = clean;
    if(clean.length >= 8) {
      maskedPhone = clean.substring(0, 4) + '****' + clean.substring(clean.length - 3);
    }

    document.getElementById('res-name').innerText = rows[0].name || 'Customer';
    document.getElementById('res-phone').innerText = maskedPhone; 

    document.getElementById('parcels-wrap').innerHTML = rows.map(r => {
      let statusRaw = (r.status || 's1').toString().trim().toLowerCase();
      if (['1', '2', '3', '4'].includes(statusRaw)) statusRaw = 's' + statusRaw;
      
      const type = ['s', 'c', 't'].includes(statusRaw[0]) ? statusRaw[0] : 's';
      const step = parseInt(statusRaw.substring(1)) || 1;
      
      const lbl = type === 's' ? 'Singapore' : type === 'c' ? 'China' : 'Thailand';
      const originFlag = type === 's' ? 'https://i.ibb.co/pj2H93Mh/Singapore.png' 
                       : type === 'c' ? 'https://i.ibb.co/9HPFdxVC/Flag-China.webp' 
                       : 'https://i.ibb.co/DPgNbPkW/Thailand.jpg';

      const dot = (n) => {
        const cls = (n >= 4 && step >= 4) ? 'f' : (step === n) ? 'a' : (step > n) ? 'd' : '';
        const chk = (n >= 4 && step >= 4) ? '✔' : '';
        return `<div class="tl-dot ${cls}">${chk}</div>`;
      };
      
      const line = (n) => {
        const cls = (step === n) ? 'm' : (step > n) ? 'd' : '';
        return `<div class="tl-line ${cls}"></div>`;
      };
      
      return `<div class="p-item">
        <div class="p-item-hdr">
          <div><div class="p-title">📦 ${esc(r.product || 'Unknown Product')}</div></div>
          <div class="p-date">📅 ${esc((r.date || '').toString().split('T')[0] || 'N/A')}</div>
        </div>
        <div class="tl-row">
          <div class="tl-col">
            <img class="tl-flag" src="${originFlag}" alt="${esc(lbl)}" loading="lazy">
            <div class="tl-mid">${dot(1)}${line(1)}</div>
            <div class="tl-lbl">${esc(lbl)}</div>
          </div>
          <div class="tl-col">
            <img class="tl-flag" src="https://i.ibb.co/xSk6RCb7/Untitled-design.jpg" alt="Warehouse" loading="lazy">
            <div class="tl-mid">${dot(2)}${line(2)}</div>
            <div class="tl-lbl">Warehouse</div>
          </div>
          <div class="tl-col">
            <img class="tl-flag" src="https://i.ibb.co/xqF8WDR1/Myanmar.webp" alt="Myanmar" loading="lazy">
            <div class="tl-mid">${dot(3)}${line(3)}</div>
            <div class="tl-lbl">Myanmar</div>
          </div>
          <div class="tl-col">
            <img class="tl-flag" style="border-radius:5px" src="https://res.cloudinary.com/dfuyt9ycz/image/upload/v1782898025/gizmo_log_t2uhrk.jpg" alt="Gizmo" loading="lazy">
            <div class="tl-mid">${dot(4)}</div>
            <div class="tl-lbl">Gizmo</div>
          </div>
        </div>
      </div>`;
    }).join('');

    // Track Modal ကို User က ကြိုပိတ်မသွားဘဲ ဖွင့်ထားဆဲဖြစ်မှသာ Result Modal ကို ပြပေးပါမည်
    if (document.getElementById('track-modal').classList.contains('open')) {
      closeMod('track-modal');
      
      setTimeout(() => {
        openMod('result-modal'); // Modal ကို အရင်ဖွင့်ပါမည်
        
        // 🌟 Modal ပွင့်လာပြီး (Render ဖြစ်ပြီး) မှသာ Scroll ကို အပေါ်ဆုံးသို့ တင်ပေးရပါမည်
        document.getElementById('parcels-wrap').scrollTop = 0;
        const resModalCard = document.querySelector('#result-modal .modal-card');
        if (resModalCard) resModalCard.scrollTop = 0;
      }, 300);
    }

  } catch (error) {
    const msg = error.message.includes('Server') ? error.message : 'ချိတ်ဆက်မှု ပြတ်တောက်သွားပါသည်။ ခေတ္တစောင့်ပြီး ပြန်စမ်းကြည့်ပါ။';
    toast(msg);
  } finally {
    trackBtn.innerText = originalText;
    trackBtn.disabled = false;
  }
}

// PERFORMANCE OPTIMIZATION: Cached DOM Query on Scroll
let isScrolling = false;
window.addEventListener('scroll', () => {
  if (!isScrolling) {
    window.requestAnimationFrame(() => {
      const btn = fabUpEl || document.getElementById('fabUp');
      if (btn) btn.classList.toggle('show', window.scrollY > 280);
      isScrolling = false;
    });
    isScrolling = true;
  }
}, { passive: true });

window.addEventListener('touchstart', (e) => {
  const searchBar = document.getElementById('searchBar');
  if (document.activeElement === searchBar && e.target !== searchBar) {
    searchBar.blur();
  }
}, { passive: true });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
             // Auto-reload အစား User ကို Refresh လုပ်ရန်သာ အသိပေးပါမည်
             toast('New update available! Refresh the page to apply.', true);
          }
        });
      });
    }).catch(err => console.log('SW registration failed:', err));
  });
}