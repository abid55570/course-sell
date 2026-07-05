(function () {
  'use strict';
  const PRODUCT = 'qrmenu';
  const PRICE = 699;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STORE_KEY = 'qrmenu_menu'; // { public_id, edit_token }

  const HEADING_FONTS = ['Poppins', 'Playfair Display', 'Space Grotesk', 'Cinzel', 'Georgia'];

  // Theme swatches (mirror seed data themes).
  const THEMES = [
    { name: 'Cafe Warm', bg: '#fdf6ee', bg2: '#f6e7d3', accent: '#b06a2c', text: '#4a382a', cardBg: '#fffdf9', headingFont: 'Poppins' },
    { name: 'Restaurant Dark', bg: '#14110f', bg2: '#221b16', accent: '#d4a017', text: '#f3ead9', cardBg: '#1e1813', headingFont: 'Playfair Display' },
    { name: 'Bakery Pastel', bg: '#fdf3f6', bg2: '#f8e0ea', accent: '#d6608a', text: '#5c3a48', cardBg: '#fffbfc', headingFont: 'Poppins' },
    { name: 'Bar Neon', bg: '#0b0f1a', bg2: '#111a2e', accent: '#2ee6c4', text: '#e6f6f2', cardBg: '#111827', headingFont: 'Space Grotesk' },
    { name: 'Minimal Clean', bg: '#ffffff', bg2: '#f2f2f2', accent: '#111111', text: '#2a2a2a', cardBg: '#ffffff', headingFont: 'Space Grotesk' },
  ];

  // ── FALLBACK templates — IDENTICAL shape to scripts/tool-data/qrmenu.js. The
  // editor must work fully from this alone if the templates API throws.
  const CAFE_CATS = [
    { name: 'Coffee', items: [
      { name: 'Cappuccino', price: '120', veg: true, desc: 'Rich espresso with steamed milk foam' },
      { name: 'Cold Brew', price: '150', veg: true, desc: 'Slow-steeped, smooth & bold' },
      { name: 'Cafe Mocha', price: '160', veg: true, desc: 'Espresso, chocolate & milk' },
    ] },
    { name: 'Bites', items: [
      { name: 'Veg Sandwich', price: '110', veg: true, desc: 'Grilled with garden veggies' },
      { name: 'Chicken Panini', price: '180', veg: false, desc: 'Pressed with smoky chicken' },
    ] },
  ];
  const RESTO_CATS = [
    { name: 'Starters', items: [
      { name: 'Paneer Tikka', price: '220', veg: true, desc: 'Char-grilled cottage cheese' },
      { name: 'Chicken 65', price: '260', veg: false, desc: 'Spicy South-Indian fry' },
      { name: 'Veg Manchurian', price: '180', veg: true, desc: 'Crispy balls in tangy sauce' },
    ] },
    { name: 'Main Course', items: [
      { name: 'Butter Chicken', price: '340', veg: false, desc: 'Creamy tomato gravy' },
      { name: 'Dal Makhani', price: '240', veg: true, desc: 'Slow-cooked black lentils' },
      { name: 'Paneer Butter Masala', price: '280', veg: true, desc: 'Rich makhani gravy' },
    ] },
    { name: 'Breads', items: [
      { name: 'Butter Naan', price: '50', veg: true, desc: 'Tandoor-baked, buttered' },
      { name: 'Garlic Roti', price: '45', veg: true, desc: 'Whole-wheat with garlic' },
    ] },
  ];
  const BAKERY_CATS = [
    { name: 'Cakes', items: [
      { name: 'Choco Truffle Slice', price: '140', veg: true, desc: 'Dark chocolate ganache' },
      { name: 'Red Velvet Slice', price: '150', veg: true, desc: 'Cream-cheese frosting' },
    ] },
    { name: 'Breads & Bakes', items: [
      { name: 'Butter Croissant', price: '90', veg: true, desc: 'Flaky, all-butter layers' },
      { name: 'Cheese Garlic Bread', price: '120', veg: true, desc: 'Fresh from the oven' },
    ] },
  ];
  const BAR_CATS = [
    { name: 'Cocktails', items: [
      { name: 'Mojito', price: '320', veg: true, desc: 'Mint, lime & soda' },
      { name: 'Long Island', price: '450', veg: true, desc: 'The house classic' },
    ] },
    { name: 'Small Plates', items: [
      { name: 'Peri Peri Fries', price: '180', veg: true, desc: 'Loaded & spicy' },
      { name: 'Chicken Wings', price: '290', veg: false, desc: 'Smoky BBQ glaze' },
    ] },
  ];
  const MINIMAL_CATS = [
    { name: 'Menu', items: [
      { name: 'House Special', price: '250', veg: true, desc: 'Chef pick of the day' },
      { name: 'Soup of the Day', price: '150', veg: true, desc: 'Ask your server' },
      { name: 'Grilled Chicken Bowl', price: '320', veg: false, desc: 'Greens, grains & protein' },
    ] },
  ];
  function menu(theme, tagline, categories) {
    return { theme: Object.assign({ headingFont: 'Poppins' }, theme), tagline, currency: 'Rs', categories: JSON.parse(JSON.stringify(categories)) };
  }
  const FALLBACK = [
    { slug: 'cafe-warm', name: 'Cafe Warm', category: 'cafe', is_free: true, sort_order: 1,
      description: 'Warm cream & caramel tones for cafes and coffee shops',
      data: menu(THEMES[0], 'Freshly brewed, every day', CAFE_CATS) },
    { slug: 'restaurant-dark', name: 'Restaurant Dark', category: 'restaurant', is_free: true, sort_order: 2,
      description: 'Elegant dark theme with gold accents for fine dining',
      data: menu(THEMES[1], 'Authentic flavours, freshly cooked', RESTO_CATS) },
    { slug: 'bakery-pastel', name: 'Bakery Pastel', category: 'bakery', is_free: true, sort_order: 3,
      description: 'Soft pink pastel palette for bakeries and dessert bars',
      data: menu(THEMES[2], 'Baked fresh with love', BAKERY_CATS) },
    { slug: 'bar-neon', name: 'Bar Neon', category: 'bar', sort_order: 4,
      description: 'Moody dark bar theme with neon cyan glow',
      data: menu(THEMES[3], 'Sip, snack & unwind', BAR_CATS) },
    { slug: 'minimal-clean', name: 'Minimal Clean', category: 'minimal', sort_order: 5,
      description: 'Understated black-on-white for a modern, clean look',
      data: menu(THEMES[4], 'Simple. Fresh. Good.', MINIMAL_CATS) },
  ];

  // ── state ──
  let templates = [];
  let doc = null;        // live menu payload { theme, tagline, currency, categories }
  let shopName = 'My Cafe';

  const $ = (id) => document.getElementById(id);

  // ── preview (phone frame) ──
  function renderPreview() {
    if (!doc) return;
    const t = doc.theme || {};
    const cur = doc.currency || 'Rs';
    const scr = $('menuScreen');
    scr.style.background = `linear-gradient(170deg, ${t.bg || '#fff'}, ${t.bg2 || '#eee'})`;
    scr.style.color = t.text || '#222';

    let html = '';
    html += `<div class="mv-head">
      <div class="mv-shop" style="font-family:'${t.headingFont || 'Poppins'}',sans-serif;color:${t.accent}">${esc(shopName || 'My Shop')}</div>
      ${doc.tagline ? `<div class="mv-tag">${esc(doc.tagline)}</div>` : ''}
    </div>`;

    (doc.categories || []).forEach((cat) => {
      html += `<div class="mv-cat">
        <div class="mv-cat-name" style="font-family:'${t.headingFont || 'Poppins'}',sans-serif;color:${t.accent};border-color:${t.accent}55">${esc(cat.name || 'Category')}</div>`;
      (cat.items || []).forEach((it) => {
        const dot = it.veg ? '#16a34a' : '#dc2626';
        html += `<div class="mv-item" style="background:${t.cardBg || 'transparent'}">
          <span class="mv-dot" style="border-color:${dot}"><i style="background:${dot}"></i></span>
          <div class="mv-item-main">
            <div class="mv-item-top"><span class="mv-item-name">${esc(it.name || 'Item')}</span><span class="mv-item-price" style="color:${t.accent}">${esc(cur)} ${esc(it.price || '')}</span></div>
            ${it.desc ? `<div class="mv-item-desc">${esc(it.desc)}</div>` : ''}
          </div>
        </div>`;
      });
      if (!(cat.items || []).length) html += `<div class="mv-empty">No items yet</div>`;
      html += `</div>`;
    });
    if (!(doc.categories || []).length) html += `<div class="mv-empty" style="margin-top:30px">Add a category to start your menu</div>`;

    scr.innerHTML = html;
  }

  // ── form (left panel) ──
  function renderForm() {
    const t = doc.theme;
    const p = $('formPanel');
    let html = '';

    // Shop identity
    html += `<div class="fp-group"><h4>Your shop</h4>
      <div class="ctl-col"><label>Shop name</label><input type="text" id="shopInp" value="${esc(shopName)}" placeholder="e.g. Sunrise Cafe"></div>
      <div class="ctl-col"><label>Tagline</label><input type="text" id="tagInp" value="${esc(doc.tagline || '')}" placeholder="Fresh & tasty"></div>
      <div class="ctl-row"><label>Currency</label><input type="text" id="curInp" value="${esc(doc.currency || 'Rs')}" style="width:80px" maxlength="4"></div>
    </div>`;

    // Design
    html += `<div class="fp-group"><h4>Theme</h4><div class="swatches" id="swatches"></div>
      <div class="ctl-row" style="margin-top:12px"><label>Accent colour</label><input type="color" id="accentPick" value="${t.accent}"></div>
      <div class="ctl-row"><label>Heading font</label><select id="fontSel">${HEADING_FONTS.map((f) => `<option ${t.headingFont === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
    </div>`;

    // Categories builder
    (doc.categories || []).forEach((cat, ci) => {
      html += `<div class="fp-group cat-block">
        <div class="sec-head"><input type="text" class="catName" data-ci="${ci}" value="${esc(cat.name)}" placeholder="Category name"><button class="del" data-delcat="${ci}" title="Remove category">🗑</button></div>`;
      (cat.items || []).forEach((it, ii) => {
        html += `<div class="item-row">
          <div class="item-line1">
            <input type="text" class="iname" data-ci="${ci}" data-ii="${ii}" value="${esc(it.name)}" placeholder="Item name">
            <input type="text" class="iprice" data-ci="${ci}" data-ii="${ii}" value="${esc(it.price)}" placeholder="Price">
            <button class="del" data-delitem="${ci}.${ii}" title="Remove item">✕</button>
          </div>
          <div class="item-line2">
            <input type="text" class="idesc" data-ci="${ci}" data-ii="${ii}" value="${esc(it.desc || '')}" placeholder="Short description (optional)">
            <label class="veg-toggle"><input type="checkbox" class="iveg" data-ci="${ci}" data-ii="${ii}" ${it.veg ? 'checked' : ''}> Veg</label>
          </div>
        </div>`;
      });
      html += `<button class="add-fld" data-additem="${ci}">+ Add item</button></div>`;
    });
    html += `<button class="add-fld" id="addCat" style="margin-bottom:24px">+ Add category</button>`;

    p.innerHTML = html;

    // swatches
    const sw = $('swatches');
    sw.innerHTML = THEMES.map((th, i) => `<div class="sw" data-th="${i}" title="${th.name}" style="background:linear-gradient(135deg,${th.bg},${th.bg2});box-shadow:inset 0 0 0 2px ${th.accent}"></div>`).join('');
    sw.querySelectorAll('.sw').forEach((s) => s.addEventListener('click', () => applyTheme(THEMES[+s.dataset.th])));

    wireForm();
  }

  function wireForm() {
    $('shopInp').addEventListener('input', (e) => { shopName = e.target.value; renderPreview(); });
    $('tagInp').addEventListener('input', (e) => { doc.tagline = e.target.value; renderPreview(); });
    $('curInp').addEventListener('input', (e) => { doc.currency = e.target.value; renderPreview(); });
    $('accentPick').addEventListener('input', (e) => { doc.theme.accent = e.target.value; renderPreview(); });
    $('fontSel').addEventListener('change', (e) => { doc.theme.headingFont = e.target.value; renderPreview(); });

    document.querySelectorAll('.catName').forEach((i) => i.addEventListener('input', () => { doc.categories[+i.dataset.ci].name = i.value; renderPreview(); }));
    document.querySelectorAll('.iname').forEach((i) => i.addEventListener('input', () => { doc.categories[+i.dataset.ci].items[+i.dataset.ii].name = i.value; renderPreview(); }));
    document.querySelectorAll('.iprice').forEach((i) => i.addEventListener('input', () => { doc.categories[+i.dataset.ci].items[+i.dataset.ii].price = i.value; renderPreview(); }));
    document.querySelectorAll('.idesc').forEach((i) => i.addEventListener('input', () => { doc.categories[+i.dataset.ci].items[+i.dataset.ii].desc = i.value; renderPreview(); }));
    document.querySelectorAll('.iveg').forEach((i) => i.addEventListener('change', () => { doc.categories[+i.dataset.ci].items[+i.dataset.ii].veg = i.checked; renderPreview(); }));

    document.querySelectorAll('[data-delitem]').forEach((b) => b.addEventListener('click', () => { const [ci, ii] = b.dataset.delitem.split('.').map(Number); doc.categories[ci].items.splice(ii, 1); renderForm(); renderPreview(); }));
    document.querySelectorAll('[data-additem]').forEach((b) => b.addEventListener('click', () => { doc.categories[+b.dataset.additem].items.push({ name: 'New item', price: '', veg: true, desc: '' }); renderForm(); renderPreview(); }));
    document.querySelectorAll('[data-delcat]').forEach((b) => b.addEventListener('click', () => { doc.categories.splice(+b.dataset.delcat, 1); renderForm(); renderPreview(); }));
    $('addCat').addEventListener('click', () => { doc.categories.push({ name: 'New Category', items: [{ name: 'New item', price: '', veg: true, desc: '' }] }); renderForm(); renderPreview(); });
  }

  function applyTheme(th) {
    Object.assign(doc.theme, { bg: th.bg, bg2: th.bg2, accent: th.accent, text: th.text, cardBg: th.cardBg, headingFont: th.headingFont });
    renderForm(); renderPreview();
  }

  // ── gallery ──
  async function loadGallery(cat) {
    try {
      const url = cat && cat !== 'all' ? `/api/tools/${PRODUCT}/templates?category=${encodeURIComponent(cat)}` : `/api/tools/${PRODUCT}/templates`;
      templates = await ToolKit.api.get(url);
      if (!Array.isArray(templates) || !templates.length) templates = FALLBACK;
    } catch (e) {
      templates = FALLBACK;
    }
    renderGallery();
  }
  function renderGallery() {
    $('galleryGrid').innerHTML = templates.map((t) => {
      const th = (t.data && t.data.theme) || {};
      return `<div class="gal-card" data-slug="${esc(t.slug)}">
        <div class="gal-thumb" style="background:linear-gradient(160deg,${th.bg || '#fff'},${th.bg2 || '#eee'});color:${th.text || '#333'}">
          <div class="gt" style="color:${th.accent}">${esc(t.name)}</div>
          <div class="gr" style="background:${th.accent}44"></div>
          <div class="gr" style="width:80%;background:${th.accent}22"></div>
          <div class="gr" style="width:65%;background:${th.accent}22"></div>
          <div class="gr" style="width:75%;background:${th.accent}22"></div>
        </div>
        <div class="gal-body"><span class="gal-name">${esc(t.name)}</span>${t.is_free ? '<span class="badge-free">FREE</span>' : ''}</div>
      </div>`;
    }).join('');
    $('galleryGrid').querySelectorAll('.gal-card').forEach((c) => c.addEventListener('click', () => pick(c.dataset.slug)));
  }
  async function loadCats() {
    try {
      const cats = await ToolKit.api.get(`/api/tools/${PRODUCT}/categories`);
      if (!Array.isArray(cats) || !cats.length) return;
      const chips = $('catChips');
      chips.innerHTML = `<button class="chip active" data-c="all">All</button>` + cats.map((c) => `<button class="chip" data-c="${esc(c)}">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('');
      chips.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => { chips.querySelectorAll('.chip').forEach((x) => x.classList.remove('active')); ch.classList.add('active'); loadGallery(ch.dataset.c); }));
    } catch (e) { /* categories are optional */ }
  }
  async function pick(slug) {
    const t = templates.find((x) => x.slug === slug);
    if (!t) return;
    let data = t.data;
    if (!data) { try { data = (await ToolKit.api.get(`/api/tools/${PRODUCT}/templates/${slug}`)).data; } catch (e) {} }
    if (!data) return;
    doc = JSON.parse(JSON.stringify(data));
    doc.theme = Object.assign({ headingFont: 'Poppins', currency: 'Rs' }, doc.theme || {});
    doc.categories = doc.categories || [];
    doc.currency = doc.currency || 'Rs';
    $('galleryOverlay').classList.remove('open');
    renderForm(); renderPreview();
  }

  // ── publish flow ──
  function storedMenu() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveMenu(pid, token) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ public_id: pid, edit_token: token })); } catch (e) {}
  }

  async function publish() {
    if (!doc) return;
    if (!ToolKit.isLicensed()) return ToolKit.showLicense();

    const btn = $('btnPublish');
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Publishing…';
    const alertBox = $('pubAlert');
    alertBox.className = 'pub-alert';

    const body = { license_key: ToolKit.licenseKey(), shop_name: shopName || 'My Shop', data: doc };
    const prev = storedMenu();
    if (prev && prev.public_id && prev.edit_token) { body.public_id = prev.public_id; body.edit_token = prev.edit_token; }

    try {
      const res = await ToolKit.api.post(`/api/tools/${PRODUCT}/publish`, body);
      saveMenu(res.public_id, res.edit_token);
      showSuccess(res);
    } catch (e) {
      alertBox.className = 'pub-alert error show';
      alertBox.textContent = e.message || 'Could not publish. Please try again.';
    }
    btn.disabled = false; btn.textContent = label;
  }

  function showSuccess(res) {
    const panel = $('publishSuccess');
    panel.innerHTML = `
      <div class="ps-check">✓ Your menu is live!</div>
      <img class="ps-qr" src="${esc(res.qr)}" alt="Menu QR code">
      <div class="ps-url-row">
        <input type="text" id="psUrl" readonly value="${esc(res.url)}">
        <button class="btn btn-sm" id="psCopy">Copy</button>
      </div>
      <div class="ps-actions">
        <button class="btn btn-sm" id="psDownload">Download QR (PNG)</button>
        <a class="btn btn-sm btn-primary" href="${esc(res.url)}" target="_blank" rel="noopener">Open menu →</a>
      </div>
      <p class="ps-note">Print this QR for your tables. Re-publishing your edits updates the <strong>same QR</strong> — no reprinting needed.</p>`;
    panel.classList.add('open');
    $('psCopy').addEventListener('click', () => {
      const inp = $('psUrl'); inp.select();
      const done = () => { const b = $('psCopy'); b.textContent = 'Copied!'; setTimeout(() => { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(res.url).then(done).catch(() => { document.execCommand('copy'); done(); });
      else { document.execCommand('copy'); done(); }
    });
    $('psDownload').addEventListener('click', () => ToolKit.downloadDataUrl(res.qr, 'menu-qr.png'));
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ── init ──
  async function init() {
    await ToolKit.init({
      product: PRODUCT,
      onUnlock: () => { updatePill(); },
    });
    updatePill();
    $('changeDesign').addEventListener('click', () => $('galleryOverlay').classList.add('open'));
    $('galleryClose').addEventListener('click', () => $('galleryOverlay').classList.remove('open'));
    $('btnUnlock').addEventListener('click', () => ToolKit.showLicense());
    $('btnPublish').addEventListener('click', publish);

    await Promise.all([loadGallery(), loadCats()]);
    pick(templates[0].slug); // open the first theme by default
  }

  function updatePill() {
    const pill = $('licenseStatus'); const btn = $('btnUnlock');
    if (ToolKit.isLicensed()) { pill.innerHTML = '<span style="color:var(--success)">✓ Unlocked — you can publish</span>'; btn.style.display = 'none'; }
    else { pill.textContent = 'Free preview · pay once to publish'; btn.style.display = ''; }
  }

  init();
})();
