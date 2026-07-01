/* ──────────────────────────────────────────────
   Optimized App Logic & Data-Driven Rendering
────────────────────────────────────────────── */

// 🌙 Light/Dark Mode နှင့် အလိုအလျောက် လိုက်ဖက်မည့် Transparent Fallback Image
const fallbackImg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 viewBox=%270 0 300 300%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27transparent%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-weight=%27bold%27 font-size=%2722%27 fill=%27%239ca3af%27%3ENo Image%3C/text%3E%3C/svg%3E";

// State Management
let allProducts = [];
let filteredProducts = [];
let trackingData = [];
let displayLimit = 8;
const PER_PAGE = 8;
let orderProd = '';
let searchTimeout;

// Secure Escaping
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
function initSlider() {
  const track = document.getElementById('sliderTrack');
  if (!track) return;
  const slides = document.querySelectorAll('.slider-track .slide');
  const dotsContainer = document.getElementById('sliderDots');
  const totalOriginalSlides = slides.length;

  if (totalOriginalSlides <= 1) return;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[totalOriginalSlides - 1].cloneNode(true);
  firstClone.id = 'first-clone';
  lastClone.id = 'last-clone';
  
  // Clone လုပ်ထားသောပုံများ ချက်ချင်းပေါ်စေရန် Lazy Loading ကို ဖယ်ရှားခြင်း
  firstClone.removeAttribute('loading');
  lastClone.removeAttribute('loading');
  
  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);

  let currentSlide = 1; 
  let sliderInterval;
  let isTransitioning = false; 
  let transitionTimeout; // Added: Fail-safe timeout

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

    // FIXED: Fail-safe unlocker if browser cancels the transition
    clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
      if (isTransitioning) {
        handleBoundary();
      }
    }, 550); // 50ms buffer after the 0.5s transition
  }

  // FIXED: Extracted boundary check to a reusable function
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
  }

  let startX = 0;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    clearInterval(sliderInterval); 
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
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
      // Document (Browser Tab) ပွင့်နေမှသာ Slide ကို ရွှေ့ပါမယ်
      const hero = document.getElementById('mainSlider');
      if (hero && hero.style.display !== 'none' && !document.hidden) {
        goToSlide(currentSlide + 1);
      }
    }, 3500);
  }

  resetInterval();
  
  let resizeTimer;
let lastWidth = window.innerWidth; // Add this line

window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return; 
  lastWidth = window.innerWidth;
  
  clearTimeout(resizeTimer);
  // Transition ကို ချက်ချင်း ပိတ်လိုက်ပါ
  const track = document.getElementById('sliderTrack');
  track.style.transition = 'none';
  
  resizeTimer = setTimeout(() => {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    isTransitioning = false;
  }, 50); // အချိန်ကို 150 မှ 50 သို့ လျှော့ချပါ
});
}

document.addEventListener('DOMContentLoaded', () => {
  initSlider(); 
  fetchProducts();
  
  // Theme Toggle Button ပုံစံ မှန်ကန်စေရန်
  const isDark = document.body.classList.contains('dark');
  const ft = document.getElementById('fabTheme');
  if(ft) ft.textContent = isDark ? '☀️' : '🌙';
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
async function fetchProducts() {
  const URL = 'https://script.google.com/macros/s/AKfycbz659VRQoUdRfXIEg0denAkFZ-0bYjXIUl5Aoq7YFAXuhZXf4j7lr4Z1apDP8Bqckf_/exec';

  // Cache နာမည်ကို ပြောင်းထားပါသည် (Cache အဟောင်းများ ရှင်းရန်)
  const cache = localStorage.getItem('gz_cache_v2');
  let useCache = false;

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

  if (cache) {
    try {
      const cachedData = JSON.parse(cache);
      const now = Date.now();
      // Cache သက်တမ်းကို ၃ နာရီအစား ၃ မိနစ်သို့ လျှော့ချ
      const CACHE_EXPIRY = 3 * 60 * 1000; 

      if (cachedData.timestamp && (now - cachedData.timestamp < CACHE_EXPIRY)) {
        if (cachedData.products) {
          allProducts = cachedData.products;
          renderInitialData(); 
          useCache = true;
          
          //  Pro UX (Stale-While-Revalidate): Data အဟောင်းကို ချက်ချင်းပြထားသော်လည်း၊ နောက်ကွယ်မှ Data အသစ်ကို တိတ်တဆိတ် ထပ်ယူထားမည်။
          fetch(URL).then(res => res.json()).then(newData => {
            if (newData.products && newData.products.length > 0) {
              localStorage.setItem('gz_cache_v2', JSON.stringify({
                timestamp: Date.now(),
                products: newData.products
              }));
              allProducts = newData.products;
              
              // 🚀 Pro UX: Customer ဖတ်နေသော နေရာမပျက်စေဘဲ ဈေးနှုန်းနှင့် ပစ္စည်းအသစ်များကိုသာ တိတ်တဆိတ် Update လုပ်ပေးမည်
              const currentQ = document.getElementById('searchBar').value.toLowerCase().trim();
              const activeTab = document.querySelector('.chip.on');
              const brand = activeTab ? activeTab.id.replace('tab-', '') : 'all';
              
              filteredProducts = allProducts.filter(item => {
                const brandStr = (item.brand || '').toLowerCase().trim();
                const titleStr = (item.title || '').toLowerCase();
                if (currentQ) {
                  return titleStr.replace(/\s+/g, '').includes(currentQ.replace(/\s+/g, '')) || brandStr.includes(currentQ);
                } else {
                  return brand === 'all' || brandStr === brand; 
                }
              });
              renderGrid(); // မျက်နှာပြင်ပေါ်ရှိ စာရင်းကို အသစ်ပြောင်းမည်
            }
          }).catch(() => {}); // Error မပြဘဲ ကျော်သွားမည်
        }
      } else {
        localStorage.removeItem('gz_cache_v2'); 
      }
    } catch (e) { console.error('Cache error', e); }
  }

  if (!useCache) {
    try {
      const response = await fetch(URL);
      const data = await response.json();

      data.timestamp = Date.now();
      localStorage.setItem('gz_cache_v2', JSON.stringify({
        timestamp: data.timestamp,
        products: data.products
      }));

      allProducts = Array.isArray(data.products) ? data.products : [];
      renderInitialData(); 

    } catch (e) {
      if (!allProducts.length) {
        document.getElementById('productGrid').innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 40px; margin-bottom: 12px;">📶</div>
            <h3 style="margin-bottom: 8px; color: var(--c-text);">Connection Failed</h3>
            <p style="color: var(--c-muted); font-size: 14px;">
              Please check your internet connection.<br>
              <button type="button" onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; border-radius: 50px; background: var(--c-surf2); border: 1px solid var(--c-border); cursor: pointer; color:var(--c-text);">Try Again</button>
            </p>
          </div>`;
      }
    }
  }
}

function setTab(brand, el){
  document.getElementById('searchBar').value = '';
  document.getElementById('clearBtn').style.display = 'none';
  
  const hero = document.getElementById('mainSlider');
  if (hero) hero.style.display = 'block'; 
  
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  if (el) el.classList.add('on');
  
  applyFilter(brand, true);

  // 🌟 Category ပြောင်းလိုက်တိုင်း Product စာရင်း၏ ထိပ်ဆုံးသို့ အလိုအလျောက် Scroll ဆွဲတင်ပေးရန် (UX)
  const secHead = document.querySelector('.sec-head');
  if(secHead && window.scrollY > secHead.offsetTop) {
    window.scrollTo({ top: secHead.offsetTop - 70, behavior: 'smooth' });
  }
}

function applyFilter(q, isBrand){
  // ဤနေရာတွင် ရှိနေသော Early Return (if return) ကို ဖယ်ရှားထားပါသည်
  
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
  renderGrid();
}

function renderGrid() {
  const g = document.getElementById('productGrid');
  g.innerHTML = '';
  
  // အသစ်ပေါင်းထည့်ထားသော Fragment (Memory ထဲမှာ အရင်ဆောက်ရန်)
  const fragment = document.createDocumentFragment();
  const itemsToShow = filteredProducts.slice(0, displayLimit);
  
  itemsToShow.forEach((item) => {
    const title = esc(item.title);
    const price = esc(item.price);
    const desc = esc(item.desc);
    
    const imgSrc = item.img ? esc(item.img) : fallbackImg;
    
    const el = document.createElement('div');
    el.className = 'prd-card';
    el.dataset.title = title;
    el.dataset.price = price;
    el.dataset.desc = desc;
    
    el.innerHTML = `
      <div class="card-thumb">
        <img loading="lazy" src="${imgSrc}" alt="${title}" width="200" height="200"
          onerror="this.onerror=null; this.src='${fallbackImg}'"
          onclick="viewImg(this.src)"
          role="button" tabindex="0" aria-label="Zoom image"
          onkeydown="if(event.key==='Enter') viewImg(this.src)">
      </div>
      <div class="card-body">
        <div class="card-brand">${esc(item.brand)}</div>
        <div class="card-name">${title}</div>
        <div class="card-price">${price}</div>
        <div class="card-btns">
          <button type="button" class="c-btn-info" onclick="viewDetails(this.closest('.prd-card'))" aria-label="View Details">Detail</button>
          <button type="button" class="c-btn-buy" onclick="openContact(this.closest('.prd-card').dataset.title)" aria-label="Shop Now">Shop Now</button>
        </div>
      </div>`;
      
    // Browser UI ကို တိုက်ရိုက်မပို့ဘဲ Fragment ထဲကို အရင်ထည့်ပါ
    fragment.appendChild(el);
  });

  // Fragment ကိုမှ UI ပေါ်ကို တစ်ခါတည်း အပြီးထည့်လိုက်ပါ
  g.appendChild(fragment);

  document.getElementById('lm-wrap').style.display = filteredProducts.length > displayLimit ? 'block' : 'none';
  document.getElementById('emptyState').style.display = filteredProducts.length === 0 ? 'block' : 'none';
  const cnt = document.getElementById('prod-count');
  cnt.textContent = filteredProducts.length ? `: Showing ${Math.min(displayLimit, filteredProducts.length)} of ${filteredProducts.length}` : '';
}
function loadMore(){
  displayLimit += PER_PAGE;
  renderGrid();
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
}

function clearSearch(){
  clearTimeout(searchTimeout); // နောက်ကွယ်က ရှာဖွေနေမှုကို ချက်ချင်းရပ်ပစ်ရန်
  const searchInput = document.getElementById('searchBar');
  searchInput.value = '';
  document.getElementById('clearBtn').style.display = 'none';
  
  searchInput.blur(); // Dismisses Keyboard on Mobile
  
  const hero = document.getElementById('mainSlider');
  if (hero) hero.style.display = 'block'; 
  
  const activeTab = document.querySelector('.chip.on');
  if (activeTab) {
    const brand = activeTab.id.replace('tab-', '');
    applyFilter(brand, true);
  } else {
    setTab('all', document.getElementById('tab-all'));
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

  // ⌨️ Track Modal ပွင့်လာပါက Keyboard အသင့်ပွင့်လာစေရန် အလိုအလျောက် Focus လုပ်ပေးခြင်း
  if (id === 'track-modal') {
    setTimeout(() => {
      const trackInp = document.getElementById('trackInp');
      if (trackInp) trackInp.focus();
    }, 100);
  }
}

function closeMod(id) {
  document.getElementById(id).classList.remove('open');
  document.body.classList.remove('locked');
  if (history.state && history.state.modal === id) {
    history.back();
  }
  
  // Professional Form Reset: Track Modal ပိတ်လိုက်တိုင်း ဖုန်းနံပါတ်ဟောင်းကို ဖျက်ပေးရန်
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


// ⌨️ Esc Key နှိပ်လျှင် ပွင့်နေသော Modal ကို အလိုအလျောက်ပိတ်စေရန်
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal.open');
    if (openModal) closeMod(openModal.id);
  }
});

function viewImg(src){
  document.getElementById('modal-img').src = src;
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
  const tgQuery = orderProd ? '?text=' + encodeURIComponent('Hi, I want to inquire about: ' + orderProd) : '';
  if (p === 'messenger') {
    window.open('https://m.me/100067458529116', '_blank', 'noopener,noreferrer');
  } else if (p === 'phone') {
    window.location.href = 'tel:+959957399906';
  } else if (p === 'telegram') {
    window.open('https://t.me/GizmoMDY1' + tgQuery, '_blank', 'noopener,noreferrer');
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

  // 🌐 အင်တာနက် ပိတ်ထားချိန် Track လုပ်မိပါက ချက်ချင်း သတိပေးရန်
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
    
    // HTTP Status Ok မဖြစ်ရင် Error တန်းပြရန် စစ်ဆေးခြင်း
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // JSON အစစ်ဟုတ်မဟုတ် စစ်ဆေးပြီးမှ လက်ခံရန် (HTML Error Pages များကြောင့် Crash မဖြစ်စေရန်)
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Server မှ Data ပုံစံမှားယွင်းနေပါသည်။');
    }
    const rows = data.tracking || [];
    
    if (!rows.length) { 
      toast('ပါဆယ်စာရင်း မတွေ့ရှိပါ။ ဖုန်းနံပါတ် မှားယွင်းနေနိုင်ပါသည်။'); 
      trackBtn.innerText = originalText;
      trackBtn.disabled = false;
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

    closeMod('track-modal');
    setTimeout(() => openMod('result-modal'), 300);

  } catch (error) {
    // Server မှ ပေးပို့သော Error (သို့မဟုတ်) အင်တာနက် ချိတ်ဆက်မှု Error ကို ခွဲခြားပြသရန်
    const msg = error.message.includes('Server') ? error.message : 'ချိတ်ဆက်မှု ပြတ်တောက်သွားပါသည်။ ခေတ္တစောင့်ပြီး ပြန်စမ်းကြည့်ပါ။';
    toast(msg);
  } finally {
    trackBtn.innerText = originalText;
    trackBtn.disabled = false;
  }
}

window.addEventListener('scroll', () => {
  document.getElementById('fabUp').classList.toggle('show', window.scrollY > 280);
  
  // ဖုန်းဖြင့် Scroll ဆွဲပါက ပွင့်နေသော Search Keyboard ကို အလိုအလျောက် ပိတ်ပေးရန်
  if (document.activeElement && document.activeElement.id === 'searchBar') {
    document.activeElement.blur();
  }
}, { passive: true });

/* ──────────────────────────────────────────────
   PWA Service Worker Registration
────────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registered successfully.');
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}