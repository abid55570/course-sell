(function () {
  'use strict';
  const PRODUCT = 'festival';
  const PRICE = 299;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Only let safe CSS colour values through when interpolating template data
  // into style attributes (defence-in-depth against a tampered template row).
  const col = (v, fb) => (typeof v === 'string' && /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+|rgba?\([0-9.,%\s]+\))$/.test(v.trim())) ? v.trim() : (fb || 'transparent');

  // ── festivals ──
  const FESTIVALS = ['Diwali', 'Holi', 'Eid', 'Raksha Bandhan', 'New Year', 'Independence Day', 'Ganesh Chaturthi', 'Navratri', 'Pongal', 'Christmas', 'Generic Sale'];

  // ── sizes ──
  const SIZES = [
    { name: 'Instagram Post (1080×1350)', w: 1080, h: 1350 },
    { name: 'Square (1080×1080)', w: 1080, h: 1080 },
    { name: 'WhatsApp Story (1080×1920)', w: 1080, h: 1920 },
  ];

  // ── theme swatches ──
  const THEMES = [
    { name: 'Diwali Gold', bg: '#2a0a1a', bg2: '#7a1030', accent: '#f7c948', text: '#fff3d6' },
    { name: 'Royal Purple', bg: '#1a0b2e', bg2: '#5b1a8a', accent: '#ffb347', text: '#f3e8ff' },
    { name: 'Holi Splash', bg: '#12123a', bg2: '#e91e63', accent: '#22d3ee', text: '#fff7fb' },
    { name: 'Eid Green', bg: '#04241c', bg2: '#0a6b4a', accent: '#e6c15a', text: '#eafff5' },
    { name: 'Saffron', bg: '#3a1206', bg2: '#c2410c', accent: '#fcd34d', text: '#fff4e6' },
    { name: 'Neon Night', bg: '#050816', bg2: '#1e3a8a', accent: '#22d3ee', text: '#eef6ff' },
    { name: 'Christmas', bg: '#0a2417', bg2: '#9a1717', accent: '#f7c948', text: '#f2fff6' },
    { name: 'Bold Red', bg: '#0b0b12', bg2: '#dc2626', accent: '#facc15', text: '#ffffff' },
  ];
  const MOTIFS = ['diya', 'rangoli', 'crackers', 'moon', 'flowers', 'none'];
  const MOTIF_GLYPH = { diya: '🪔', rangoli: '🌸', crackers: '🎆', moon: '🌙', flowers: '🌼', none: '' };
  const HEADING_FONTS = ['Playfair Display', 'Cinzel', 'Space Grotesk', 'Georgia'];

  // ── FALLBACK templates (identical shape to scripts/tool-data/festival.js) ──
  function brand(extra) { return Object.assign({ shopName: 'Your Shop', phone: '+91 90000 00000', address: 'Shop address, City', tagline: '' }, extra || {}); }
  function thm(t) { return Object.assign({ headingFont: 'Playfair Display', motif: 'diya' }, t); }
  const FALLBACK = [
    { slug: 'diwali-gold-diya', name: 'Diwali Gold Diya', category: 'diwali', is_free: true, sort_order: 1, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Diwali', headline: 'Happy Diwali', offer: 'Flat 40% OFF', subtext: 'On all products this festive season',
        theme: thm({ bg: '#2a0a1a', bg2: '#7a1030', accent: '#f7c948', text: '#fff3d6', headingFont: 'Playfair Display', motif: 'diya' }), brand: brand({ tagline: 'Wishing you light & prosperity' }) } },
    { slug: 'diwali-rangoli-purple', name: 'Diwali Rangoli', category: 'diwali', is_free: true, sort_order: 2, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Diwali', headline: 'Diwali Dhamaka', offer: 'Buy 1 Get 1', subtext: 'Limited period festive offer',
        theme: thm({ bg: '#1a0b2e', bg2: '#5b1a8a', accent: '#ffb347', text: '#f3e8ff', headingFont: 'Cinzel', motif: 'rangoli' }), brand: brand() } },
    { slug: 'holi-splash', name: 'Holi Colour Splash', category: 'holi', is_free: true, sort_order: 3, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Holi', headline: 'Happy Holi', offer: '30% OFF', subtext: 'Add colour to your savings',
        theme: thm({ bg: '#12123a', bg2: '#e91e63', accent: '#22d3ee', text: '#fff7fb', headingFont: 'Space Grotesk', motif: 'flowers' }), brand: brand() } },
    { slug: 'eid-mubarak-green', name: 'Eid Mubarak', category: 'eid', is_free: true, sort_order: 4, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Eid', headline: 'Eid Mubarak', offer: 'Up to 50% OFF', subtext: 'Celebrate with special discounts',
        theme: thm({ bg: '#04241c', bg2: '#0a6b4a', accent: '#e6c15a', text: '#eafff5', headingFont: 'Cinzel', motif: 'moon' }), brand: brand({ tagline: 'Eid greetings to you & family' }) } },
    { slug: 'rakhi-warm', name: 'Raksha Bandhan', category: 'rakshabandhan', sort_order: 5, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Raksha Bandhan', headline: 'Happy Rakhi', offer: 'Flat 25% OFF', subtext: 'Gifts for your loved ones',
        theme: thm({ bg: '#3a1206', bg2: '#c2410c', accent: '#fcd34d', text: '#fff4e6', headingFont: 'Playfair Display', motif: 'flowers' }), brand: brand() } },
    { slug: 'new-year-neon', name: 'New Year Neon', category: 'newyear', sort_order: 6, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'New Year', headline: 'Happy New Year', offer: 'Mega 60% OFF', subtext: 'Start the year with big savings',
        theme: thm({ bg: '#050816', bg2: '#1e3a8a', accent: '#22d3ee', text: '#eef6ff', headingFont: 'Space Grotesk', motif: 'crackers' }), brand: brand({ tagline: 'Cheers to a great year ahead' }) } },
    { slug: 'independence-tricolour', name: 'Independence Day', category: 'independenceday', sort_order: 7, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Independence Day', headline: 'Freedom Sale', offer: '15 August Special', subtext: 'Flat 47% OFF storewide',
        theme: thm({ bg: '#0a2818', bg2: '#c2410c', accent: '#ffffff', text: '#f4fff8', headingFont: 'Cinzel', motif: 'none' }), brand: brand({ tagline: 'Har Ghar Tiranga' }) } },
    { slug: 'ganesh-saffron', name: 'Ganesh Chaturthi', category: 'ganeshchaturthi', sort_order: 8, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Ganesh Chaturthi', headline: 'Ganpati Bappa Morya', offer: 'Festive 35% OFF', subtext: 'Blessed offers for you',
        theme: thm({ bg: '#3a1500', bg2: '#b8460a', accent: '#ffd166', text: '#fff3e0', headingFont: 'Cinzel', motif: 'flowers' }), brand: brand() } },
    { slug: 'christmas-red-green', name: 'Christmas Sale', category: 'christmas', sort_order: 9, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Christmas', headline: 'Merry Christmas', offer: 'Holiday 40% OFF', subtext: 'Season of joy & savings',
        theme: thm({ bg: '#0a2417', bg2: '#9a1717', accent: '#f7c948', text: '#f2fff6', headingFont: 'Playfair Display', motif: 'flowers' }), brand: brand({ tagline: 'Warm wishes this Christmas' }) } },
    { slug: 'generic-sale-bold', name: 'Generic Mega Sale', category: 'sale', sort_order: 10, dimensions: { width: 1080, height: 1350 },
      data: { festival: 'Generic Sale', headline: 'Mega Sale', offer: 'Up to 70% OFF', subtext: 'Everything must go — limited time',
        theme: thm({ bg: '#0b0b12', bg2: '#dc2626', accent: '#facc15', text: '#ffffff', headingFont: 'Space Grotesk', motif: 'none' }), brand: brand() } },
  ];

  // ── state ──
  let templates = [];
  let current = null;
  let doc = null;      // edited poster data
  let logo = null;     // dataURL of shop logo
  let size = { w: 1080, h: 1350 };
  let scale = 0.4;

  const $ = (id) => document.getElementById(id);

  // ── rendering the poster ──
  function buildPoster(d, s, opts) {
    opts = opts || {};
    const W = size.w, H = size.h;
    const t = d.theme || {};
    const br = d.brand || {};
    const px = (n) => (n * s) + 'px';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:relative;width:${px(W)};height:${px(H)};background:radial-gradient(120% 80% at 50% 0%,${t.bg2 || '#7a1030'},${t.bg || '#2a0a1a'} 70%);color:${t.text || '#fff'};font-family:'Inter',sans-serif;overflow:hidden;box-sizing:border-box`;

    // corner accent shapes
    [['top:0;left:0', '0 0 100% 0'], ['top:0;right:0', '0 0 0 100%'], ['bottom:0;left:0', '0 100% 0 0'], ['bottom:0;right:0', '100% 0 0 0']].forEach(([pos, rad]) => {
      const c = document.createElement('div');
      c.style.cssText = `position:absolute;${pos};width:${px(220)};height:${px(220)};background:${t.accent}22;border-radius:${rad.split(' ').map((r) => r === '100%' ? px(220) : '0').join(' ')};pointer-events:none`;
      wrap.appendChild(c);
    });

    // decorative motif band (unicode/emoji) across the top
    const glyph = MOTIF_GLYPH[t.motif] || '';
    if (glyph) {
      const band = document.createElement('div');
      band.style.cssText = `position:absolute;top:${px(28)};left:0;right:0;text-align:center;font-size:${px(44)};letter-spacing:${px(18)};opacity:.9`;
      band.textContent = `${glyph} ${glyph} ${glyph} ${glyph} ${glyph}`;
      wrap.appendChild(band);
      const band2 = document.createElement('div');
      band2.style.cssText = `position:absolute;bottom:${px(H > 1400 ? 300 : 250)};left:0;right:0;text-align:center;font-size:${px(30)};letter-spacing:${px(14)};opacity:.55`;
      band2.textContent = `${glyph} ${glyph} ${glyph}`;
      wrap.appendChild(band2);
    }

    // content stack
    const brandBarH = br.shopName ? (H > 1400 ? 220 : 190) : 0;
    const content = document.createElement('div');
    content.style.cssText = `position:absolute;left:${px(70)};right:${px(70)};top:${px(glyph ? 150 : 110)};bottom:${px(brandBarH + 60)};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:${px(24)}`;

    // festival eyebrow
    const eyebrow = document.createElement('div');
    eyebrow.style.cssText = `font-size:${px(30)};letter-spacing:${px(4)};text-transform:uppercase;color:${t.accent};font-weight:700`;
    eyebrow.textContent = d.festival || '';
    content.appendChild(eyebrow);

    // headline
    const headline = document.createElement('div');
    headline.style.cssText = `font-family:'${t.headingFont || 'Playfair Display'}',serif;font-weight:700;font-size:${px(96)};line-height:1.02;color:${t.text};text-shadow:0 ${px(2)} ${px(18)} rgba(0,0,0,.4)`;
    headline.textContent = d.headline || '';
    content.appendChild(headline);

    // offer badge (accent pill)
    if (d.offer) {
      const badge = document.createElement('div');
      badge.style.cssText = `display:inline-block;background:${t.accent};color:#1a1206;font-weight:800;font-size:${px(58)};padding:${px(18)} ${px(46)};border-radius:${px(999)};box-shadow:0 ${px(8)} ${px(30)} ${t.accent}55;font-family:'Space Grotesk',sans-serif;transform:rotate(-2deg)`;
      badge.textContent = d.offer;
      content.appendChild(badge);
    }

    // subtext
    if (d.subtext) {
      const sub = document.createElement('div');
      sub.style.cssText = `font-size:${px(34)};color:${t.text};opacity:.9;max-width:${px(820)};line-height:1.3`;
      sub.textContent = d.subtext;
      content.appendChild(sub);
    }

    // brand tagline
    if (br.tagline) {
      const tag = document.createElement('div');
      tag.style.cssText = `font-size:${px(28)};color:${t.accent};font-style:italic;opacity:.95`;
      tag.textContent = br.tagline;
      content.appendChild(tag);
    }
    wrap.appendChild(content);

    // ── BOTTOM BRAND BAR (auto-placed logo + name + phone + address) ──
    if (br.shopName) {
      const bar = document.createElement('div');
      bar.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${px(brandBarH)};background:${t.accent};color:#141008;display:flex;align-items:center;gap:${px(24)};padding:0 ${px(50)};box-sizing:border-box`;
      // logo
      const lb = document.createElement('div');
      lb.style.cssText = `width:${px(130)};height:${px(130)};border-radius:${px(18)};background:#ffffff;flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 ${px(3)} ${px(10)} rgba(0,0,0,.25)`;
      if (opts.logo) lb.innerHTML = `<img src="${opts.logo}" style="width:100%;height:100%;object-fit:contain" alt="">`;
      else lb.innerHTML = `<span style="font-size:${px(30)};font-weight:800;color:${t.bg2 || '#7a1030'}">${esc((br.shopName || 'S').trim().charAt(0).toUpperCase())}</span>`;
      bar.appendChild(lb);
      // text block
      const tb = document.createElement('div');
      tb.style.cssText = `flex:1;min-width:0;text-align:left`;
      tb.innerHTML =
        `<div style="font-weight:800;font-size:${px(44)};line-height:1.1;font-family:'Space Grotesk',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(br.shopName)}</div>` +
        (br.phone ? `<div style="font-weight:700;font-size:${px(32)};margin-top:${px(4)}">☎ ${esc(br.phone)}</div>` : '') +
        (br.address ? `<div style="font-size:${px(26)};opacity:.85;margin-top:${px(2)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(br.address)}</div>` : '');
      bar.appendChild(tb);
      wrap.appendChild(bar);
    }

    // watermark for unlicensed export
    if (opts.watermark) {
      const wm = document.createElement('div');
      wm.style.cssText = `position:absolute;inset:0;pointer-events:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;transform:rotate(-30deg);opacity:.16`;
      wm.innerHTML = Array.from({ length: 16 }).map(() => `<span style="font-size:${px(46)};font-weight:800;color:#fff;margin:${px(34)} ${px(26)};white-space:nowrap">PREVIEW · PAY ₹${PRICE}</span>`).join('');
      wrap.appendChild(wm);
    }
    return wrap;
  }

  function renderPreview() {
    if (!doc) return;
    const host = $('docPreview');
    host.innerHTML = '';
    host.appendChild(buildPoster(doc, scale, { logo }));
  }

  function fitPreview() {
    const wrap = $('previewWrap');
    const availW = Math.min(wrap.clientWidth - 48, 560);
    const availH = (window.innerHeight - 120);
    scale = Math.min(availW / size.w, availH / size.h);
    scale = Math.max(0.12, scale);
    renderPreview();
  }
  window.addEventListener('resize', () => { clearTimeout(window._rz); window._rz = setTimeout(fitPreview, 150); });

  // ── form ──
  function renderForm() {
    const t = doc.theme;
    const br = doc.brand || (doc.brand = {});
    const p = $('formPanel');
    let html = '';

    // Content
    html += `<div class="fp-group"><h4>Poster content</h4>
      <div class="ctl-row"><label>Festival</label><select id="festSel">${FESTIVALS.map((f) => `<option ${doc.festival === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></div>
      <label class="fl">Headline</label><input class="fi-full" type="text" id="headlineInp" value="${esc(doc.headline || '')}">
      <label class="fl">Offer text</label><input class="fi-full" type="text" id="offerInp" value="${esc(doc.offer || '')}">
      <label class="fl">Subtext</label><input class="fi-full" type="text" id="subtextInp" value="${esc(doc.subtext || '')}">
    </div>`;

    // Design
    html += `<div class="fp-group"><h4>Design</h4><div class="swatches" id="swatches"></div>
      <div class="ctl-row" style="margin-top:12px"><label>Accent colour</label><input type="color" id="accentPick" value="${t.accent}"></div>
      <div class="ctl-row"><label>Motif</label><select id="motifSel">${MOTIFS.map((m) => `<option value="${m}" ${t.motif === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class="ctl-row"><label>Heading font</label><select id="fontSel">${HEADING_FONTS.map((f) => `<option ${t.headingFont === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
      <div class="ctl-row"><label>Size</label><select id="sizeSel">${SIZES.map((z, i) => `<option value="${i}" ${(size.w === z.w && size.h === z.h) ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select></div>
    </div>`;

    // Brand — the killer auto-placement feature
    html += `<div class="fp-group"><h4>Your brand <span class="badge-auto">auto-placed on every poster</span></h4>
      <label class="fl">Shop name</label><input class="fi-full" type="text" id="shopInp" value="${esc(br.shopName || '')}" placeholder="Your Shop">
      <label class="fl">Phone</label><input class="fi-full" type="text" id="phoneInp" value="${esc(br.phone || '')}" placeholder="+91 90000 00000">
      <label class="fl">Address</label><input class="fi-full" type="text" id="addrInp" value="${esc(br.address || '')}" placeholder="Shop address, City">
      <label class="fl">Tagline (optional)</label><input class="fi-full" type="text" id="tagInp" value="${esc(br.tagline || '')}" placeholder="Wishing you a happy festival">
      <label class="fl">Logo</label>
      <div class="photo-drop" id="logoDrop">${logo ? `<img src="${logo}" alt="">` : 'Click to upload your shop logo'}</div>
      ${logo ? '<button class="add-fld" id="logoRemove" style="margin-top:6px">Remove logo</button>' : ''}
      <input type="file" id="logoInput" accept="image/*" style="display:none">
    </div>`;

    p.innerHTML = html;

    const sw = $('swatches');
    sw.innerHTML = THEMES.map((th, i) => `<div class="sw" data-th="${i}" title="${th.name}" style="background:radial-gradient(120% 90% at 50% 0%,${th.bg2},${th.bg});box-shadow:inset 0 0 0 2px ${th.accent}"></div>`).join('');
    sw.querySelectorAll('.sw').forEach((s) => s.addEventListener('click', () => applyTheme(THEMES[+s.dataset.th])));

    wireForm();
  }

  function wireForm() {
    $('festSel').addEventListener('change', (e) => { doc.festival = e.target.value; renderPreview(); });
    $('headlineInp').addEventListener('input', (e) => { doc.headline = e.target.value; renderPreview(); });
    $('offerInp').addEventListener('input', (e) => { doc.offer = e.target.value; renderPreview(); });
    $('subtextInp').addEventListener('input', (e) => { doc.subtext = e.target.value; renderPreview(); });
    $('accentPick').addEventListener('input', (e) => { doc.theme.accent = e.target.value; renderPreview(); });
    $('motifSel').addEventListener('change', (e) => { doc.theme.motif = e.target.value; renderPreview(); });
    $('fontSel').addEventListener('change', (e) => { doc.theme.headingFont = e.target.value; renderPreview(); });
    $('sizeSel').addEventListener('change', (e) => { const z = SIZES[+e.target.value]; size = { w: z.w, h: z.h }; fitPreview(); });
    $('shopInp').addEventListener('input', (e) => { doc.brand.shopName = e.target.value; renderPreview(); });
    $('phoneInp').addEventListener('input', (e) => { doc.brand.phone = e.target.value; renderPreview(); });
    $('addrInp').addEventListener('input', (e) => { doc.brand.address = e.target.value; renderPreview(); });
    $('tagInp').addEventListener('input', (e) => { doc.brand.tagline = e.target.value; renderPreview(); });
    $('logoDrop').addEventListener('click', () => $('logoInput').click());
    $('logoInput').addEventListener('change', (e) => { if (e.target.files[0]) readLogo(e.target.files[0]); });
    const lr = $('logoRemove'); if (lr) lr.addEventListener('click', () => { logo = null; renderForm(); renderPreview(); });
  }

  function applyTheme(th) {
    Object.assign(doc.theme, { bg: th.bg, bg2: th.bg2, accent: th.accent, text: th.text });
    renderForm(); renderPreview();
  }

  function readLogo(file) {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = () => { logo = r.result; renderForm(); renderPreview(); };
    r.readAsDataURL(file);
  }

  // ── gallery ──
  async function loadGallery(cat) {
    try {
      const url = cat && cat !== 'all' ? `/api/tools/${PRODUCT}/templates?category=${encodeURIComponent(cat)}` : `/api/tools/${PRODUCT}/templates`;
      templates = await ToolKit.api.get(url);
      if (!templates || !templates.length) templates = FALLBACK;
    } catch (e) {
      templates = FALLBACK;
    }
    renderGallery();
  }
  function renderGallery() {
    const licensed = ToolKit.isLicensed();
    $('galleryGrid').innerHTML = templates.map((t) => {
      const th = (t.data && t.data.theme) || {};
      const d = t.data || {};
      const locked = !t.is_free && !licensed;
      const glyph = MOTIF_GLYPH[th.motif] || '🪔';
      return `<div class="gal-card" data-slug="${esc(t.slug)}">
        <div class="gal-thumb" style="background:radial-gradient(120% 90% at 50% 0%,${col(th.bg2, '#7a1030')},${col(th.bg, '#2a0a1a')})">
          <div class="gh" style="color:${col(th.accent, '#e6c15a')}">${glyph} ${glyph} ${glyph}</div>
          <div class="gt" style="color:${col(th.text, '#fff')}">${esc(d.headline || t.name)}</div>
          <div class="go" style="background:${col(th.accent, '#e6c15a')};color:#1a1206">${esc(d.offer || 'OFFER')}</div>
          <div class="gbar" style="background:${col(th.accent, '#e6c15a')};color:#141008">${esc((d.brand && d.brand.shopName) || 'Your Shop')}</div>
        </div>
        <div class="gal-body"><span class="gal-name">${esc(t.name)}</span>${t.is_free ? '<span class="badge-free">FREE</span>' : (locked ? '<span class="badge-pro">PRO</span>' : '')}</div>
      </div>`;
    }).join('');
    $('galleryGrid').querySelectorAll('.gal-card').forEach((c) => c.addEventListener('click', () => pick(c.dataset.slug)));
  }
  async function loadCats() {
    try {
      const cats = await ToolKit.api.get(`/api/tools/${PRODUCT}/categories`);
      if (!cats || !cats.length) return;
      const chips = $('catChips');
      chips.innerHTML = `<button class="chip active" data-c="all">All</button>` + cats.map((c) => `<button class="chip" data-c="${esc(c)}">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('');
      chips.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => { chips.querySelectorAll('.chip').forEach((x) => x.classList.remove('active')); ch.classList.add('active'); loadGallery(ch.dataset.c); }));
    } catch (e) {}
  }
  async function pick(slug) {
    const t = templates.find((x) => x.slug === slug);
    if (!t) return;
    if (!t.is_free && !ToolKit.isLicensed()) return ToolKit.showLicense();
    let data = t.data;
    if (!data) { try { data = (await ToolKit.api.get(`/api/tools/${PRODUCT}/templates/${slug}`)).data; } catch (e) {} }
    current = t;
    // preserve the brand + logo the owner already entered across template switches
    const prevBrand = doc && doc.brand ? doc.brand : null;
    doc = JSON.parse(JSON.stringify(data));
    doc.theme = Object.assign({ headingFont: 'Playfair Display', motif: 'diya' }, doc.theme || {});
    doc.brand = Object.assign({ shopName: 'Your Shop', phone: '+91 90000 00000', address: 'Shop address, City', tagline: '' }, doc.brand || {});
    if (prevBrand && prevBrand.shopName && prevBrand.shopName !== 'Your Shop') doc.brand = Object.assign({}, doc.brand, prevBrand);
    if (t.dimensions && t.dimensions.width) size = { w: t.dimensions.width, h: t.dimensions.height };
    else size = { w: 1080, h: 1350 };
    $('galleryOverlay').classList.remove('open');
    renderForm(); fitPreview();
  }

  // ── export ──
  async function exportImage() {
    if (!doc) return;
    const watermark = !ToolKit.isLicensed();
    const btn = $('exportPng');
    const label = btn.textContent; btn.disabled = true; btn.textContent = 'Rendering…';
    try {
      const canvas = await ToolKit.renderOffscreen(size.w, size.h, (frame) => {
        frame.appendChild(buildPoster(doc, 1, { logo, watermark }));
      });
      ToolKit.downloadCanvas(canvas, `${posterName()}.png`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
  }
  function posterName() {
    const base = (doc.festival || 'festival') + '-' + ((doc.brand && doc.brand.shopName) || 'poster');
    return base.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'festival-poster';
  }

  // ── init ──
  async function init() {
    await ToolKit.init({
      product: PRODUCT,
      onUnlock: () => { updatePill(); renderGallery(); },
    });
    updatePill();
    $('changeDesign').addEventListener('click', () => $('galleryOverlay').classList.add('open'));
    $('galleryClose').addEventListener('click', () => $('galleryOverlay').classList.remove('open'));
    $('btnUnlock').addEventListener('click', () => ToolKit.showLicense());
    $('exportPng').addEventListener('click', () => exportImage());
    await Promise.all([loadGallery(), loadCats()]);
    if (templates[0]) pick((templates.find((t) => t.is_free) || templates[0]).slug);
  }
  function updatePill() {
    const pill = $('licenseStatus'); const btn = $('btnUnlock');
    if (ToolKit.isLicensed()) { pill.innerHTML = '<span style="color:var(--success)">✓ Unlocked</span>'; btn.style.display = 'none'; }
    else { pill.textContent = 'Free preview · watermark on export'; btn.style.display = ''; }
  }

  init();
})();
