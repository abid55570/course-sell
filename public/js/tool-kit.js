// ── ToolKit ────────────────────────────────────────────────────────────────
// Shared client library for the six one-time creator tools. It owns the whole
// license / purchase / recover UX (injects its own modals + styles) and bundles
// the on-demand export helpers (html2canvas, jsPDF, JSZip, CSV). Each tool's own
// script only has to render its canvas and call ToolKit for gating + export.
//
//   await ToolKit.init({ product: 'biodata', onUnlock });
//   if (!ToolKit.isLicensed()) return ToolKit.showLicense();
//   const canvas = await ToolKit.nodeToCanvas(el, { width: 1080, height: 1350 });
//
(function () {
  'use strict';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  async function handle(r) {
    const ct = r.headers.get('content-type') || '';
    const d = ct.includes('json') ? await r.json() : await r.text();
    if (!r.ok) throw new Error((d && d.error) || `Request failed (${r.status})`);
    return d;
  }
  const api = {
    get: (u) => fetch(u, { credentials: 'include' }).then(handle),
    post: (u, b) => fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then(handle),
  };

  const state = {
    product: null,
    course: null,      // { id, title, discounted_price, original_price }
    licensed: false,
    key: '',
    onUnlock: null,
  };

  // ── on-demand script loading ──────────────────────────────────────────────
  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load a required library. Check your connection.'));
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  const CDN = {
    html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  };
  async function ensureHtml2Canvas() { if (!window.html2canvas) await loadScript(CDN.html2canvas); return window.html2canvas; }
  async function ensureJsPDF() { if (!(window.jspdf && window.jspdf.jsPDF)) await loadScript(CDN.jspdf); return window.jspdf.jsPDF; }
  async function ensureJSZip() { if (!window.JSZip) await loadScript(CDN.jszip); return window.JSZip; }

  // ── export helpers ────────────────────────────────────────────────────────
  // Render a detached, full-resolution DOM node to a canvas. The node should be
  // sized at its true pixel dimensions and appended to an offscreen container.
  async function nodeToCanvas(node, opts) {
    const o = opts || {};
    await ensureHtml2Canvas();
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    await new Promise((r) => setTimeout(r, 60));
    return window.html2canvas(node, {
      width: o.width || node.offsetWidth,
      height: o.height || node.offsetHeight,
      scale: o.scale || 1,
      useCORS: true,
      backgroundColor: o.backgroundColor || null,
      logging: false,
    });
  }

  // Build a hidden, fixed-size offscreen host and run `build(host)` inside it,
  // then rasterise. Cleans up afterwards.
  async function renderOffscreen(width, height, build) {
    let host = document.getElementById('tkOffscreen');
    if (!host) {
      host = document.createElement('div');
      host.id = 'tkOffscreen';
      host.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;opacity:0;';
      document.body.appendChild(host);
    }
    const frame = document.createElement('div');
    frame.style.cssText = `width:${width}px;height:${height}px;position:relative;overflow:hidden;`;
    host.innerHTML = '';
    host.appendChild(frame);
    await build(frame);
    const canvas = await nodeToCanvas(frame, { width, height });
    host.innerHTML = '';
    return canvas;
  }

  function downloadDataUrl(url, filename) {
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function downloadCanvas(canvas, filename) { downloadDataUrl(canvas.toDataURL('image/png'), filename); }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // Minimal, forgiving CSV parser (handles quoted fields, commas, newlines).
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQ = false;
    text = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    // Drop fully-empty trailing rows.
    return rows.filter((r) => r.some((x) => String(x).trim() !== ''));
  }
  // CSV → array of objects keyed by header row.
  function csvToObjects(text) {
    const rows = parseCSV(text);
    if (!rows.length) return { headers: [], rows: [] };
    const headers = rows[0].map((h) => String(h).trim());
    const out = rows.slice(1).map((r) => {
      const o = {}; headers.forEach((h, i) => { o[h] = (r[i] != null ? String(r[i]).trim() : ''); });
      return o;
    });
    return { headers, rows: out };
  }

  // ── license / purchase UX ────────────────────────────────────────────────
  function storageKey() { return `${state.product}_license`; }

  function injectStyles() {
    if (document.getElementById('tkStyles')) return;
    const css = `
    .tk-overlay{position:fixed;inset:0;background:rgba(4,7,15,.72);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:1000;padding:18px}
    .tk-overlay.open{display:flex}
    .tk-card{background:var(--surface,#121a30);border:1px solid var(--border,#253352);border-radius:16px;max-width:420px;width:100%;padding:26px;box-shadow:0 24px 70px rgba(2,6,23,.6);position:relative}
    .tk-card h3{margin:0 0 6px;font-family:var(--font-display,inherit)}
    .tk-sub{color:var(--muted,#97a3bd);font-size:14px;margin:0 0 18px}
    .tk-x{position:absolute;top:14px;right:16px;background:none;border:none;color:var(--muted,#97a3bd);font-size:22px;cursor:pointer;line-height:1}
    .tk-input{width:100%;padding:11px 13px;border-radius:10px;border:1px solid var(--border,#253352);background:var(--bg-soft,#0d1224);color:var(--text,#eef2fb);font-size:14px;margin-bottom:11px;font-family:inherit}
    .tk-input:focus{outline:none;border-color:var(--primary,#6d6bff)}
    .tk-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 18px;border-radius:11px;font-weight:600;font-size:14.5px;border:1px solid var(--border,#253352);background:var(--surface-2,#172138);color:var(--text,#eef2fb);cursor:pointer;font-family:inherit}
    .tk-btn.primary{background:linear-gradient(120deg,var(--primary,#6d6bff),var(--primary-2,#9b7bff));border:none;color:#fff}
    .tk-btn.gold{background:linear-gradient(120deg,#e6c15a,#d4a017);border:none;color:#231a00}
    .tk-btn+.tk-btn{margin-top:9px}
    .tk-btn:disabled{opacity:.6;cursor:default}
    .tk-alert{border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px;display:none}
    .tk-alert.show{display:block}
    .tk-alert.error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);color:#fecaca}
    .tk-alert.success{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.4);color:#bbf7d0}
    .tk-or{text-align:center;color:var(--muted,#97a3bd);font-size:12px;margin:14px 0}
    .tk-link{background:none;border:none;color:var(--primary-2,#9b7bff);cursor:pointer;font-size:13px;text-decoration:underline;font-family:inherit}
    .tk-key{background:rgba(109,107,255,.1);border:1px solid var(--border,#253352);border-radius:10px;padding:14px;font-family:monospace;font-size:14px;letter-spacing:1px;word-break:break-all;margin:6px 0 16px;text-align:center}
    .tk-price{font-size:26px;font-weight:800;font-family:var(--font-display,inherit)}
    .tk-mrp{color:var(--muted,#97a3bd);text-decoration:line-through;font-size:15px;margin-left:8px;font-weight:400}
    `;
    const style = document.createElement('style');
    style.id = 'tkStyles'; style.textContent = css;
    document.head.appendChild(style);
  }

  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  let dom = {};
  function injectModals() {
    if (document.getElementById('tkModals')) return;
    injectStyles();
    const wrap = document.createElement('div');
    wrap.id = 'tkModals';
    wrap.innerHTML = `
      <div class="tk-overlay" id="tkLicenseModal"><div class="tk-card">
        <button class="tk-x" data-close>&times;</button>
        <h3 id="tkLicTitle">Unlock everything</h3>
        <p class="tk-sub" id="tkLicSub"></p>
        <div class="tk-alert" id="tkLicAlert"></div>
        <input class="tk-input" id="tkLicInput" placeholder="Paste your license key" autocomplete="off">
        <button class="tk-btn primary" id="tkLicValidate">Unlock with key</button>
        <div class="tk-or">— or —</div>
        <button class="tk-btn gold" id="tkLicBuy">Buy now</button>
        <div style="text-align:center;margin-top:14px">
          <button class="tk-link" id="tkLicRecover">Lost your key? Email it to me</button>
        </div>
      </div></div>

      <div class="tk-overlay" id="tkCheckoutModal"><div class="tk-card">
        <button class="tk-x" data-close>&times;</button>
        <h3>Complete your purchase</h3>
        <p class="tk-sub" id="tkCoName"></p>
        <div class="tk-alert" id="tkCoAlert"></div>
        <input class="tk-input" id="tkBuyName" placeholder="Your name">
        <input class="tk-input" id="tkBuyEmail" type="email" placeholder="Email (your key is sent here)">
        <input class="tk-input" id="tkBuyPhone" placeholder="Phone (optional)">
        <button class="tk-btn primary" id="tkBuySubmit">Pay & get license key</button>
      </div></div>

      <div class="tk-overlay" id="tkRecoverModal"><div class="tk-card">
        <button class="tk-x" data-close>&times;</button>
        <h3>Recover your license</h3>
        <p class="tk-sub">Enter the email you bought with — we'll send your key.</p>
        <div class="tk-alert" id="tkRecAlert"></div>
        <input class="tk-input" id="tkRecEmail" type="email" placeholder="Your email">
        <button class="tk-btn primary" id="tkRecSubmit">Email me my key</button>
      </div></div>`;
    document.body.appendChild(wrap);

    dom = {
      lic: document.getElementById('tkLicenseModal'),
      co: document.getElementById('tkCheckoutModal'),
      rec: document.getElementById('tkRecoverModal'),
    };

    wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('.tk-overlay').classList.remove('open')));
    wrap.querySelectorAll('.tk-overlay').forEach((ov) => ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); }));

    document.getElementById('tkLicValidate').addEventListener('click', onValidate);
    document.getElementById('tkLicInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') onValidate(); });
    document.getElementById('tkLicBuy').addEventListener('click', () => { dom.lic.classList.remove('open'); openCheckout(); });
    document.getElementById('tkLicRecover').addEventListener('click', () => { dom.lic.classList.remove('open'); dom.rec.classList.add('open'); });
    document.getElementById('tkBuySubmit').addEventListener('click', onBuy);
    document.getElementById('tkRecSubmit').addEventListener('click', onRecover);
  }

  function showAlert(id, type, msg) {
    const a = document.getElementById(id);
    a.className = `tk-alert ${type} show`;
    a.textContent = msg;
  }
  function hideAlert(id) { const a = document.getElementById(id); if (a) a.className = 'tk-alert'; }

  function priceStr() {
    const c = state.course || {};
    const d = Number(c.discounted_price) || 0;
    const o = Number(c.original_price) || 0;
    const mrp = o && o > d ? `<span class="tk-mrp">₹${o}</span>` : '';
    return `<span class="tk-price">₹${d}</span>${mrp}`;
  }

  function refreshLicenseCopy() {
    const c = state.course || {};
    document.getElementById('tkLicSub').innerHTML = `${esc(c.short_description || 'One-time purchase. No subscription.')} &nbsp; ${priceStr()}`;
    document.getElementById('tkCoName').innerHTML = `${esc(c.title || '')} &nbsp; ${priceStr()}`;
    document.getElementById('tkBuySubmit').textContent = `Pay ₹${Number(c.discounted_price) || ''} & get license key`;
  }

  async function onValidate() {
    const input = document.getElementById('tkLicInput');
    const key = input.value.trim();
    hideAlert('tkLicAlert');
    if (!key) return showAlert('tkLicAlert', 'error', 'Please paste your license key.');
    try {
      const res = await api.post(`/api/tools/${state.product}/validate-license`, { license_key: key });
      if (res.valid) { setLicensed(key); dom.lic.classList.remove('open'); }
      else showAlert('tkLicAlert', 'error', 'That key is not valid. Check for typos or buy a new one.');
    } catch (e) { showAlert('tkLicAlert', 'error', e.message); }
  }

  async function onRecover() {
    const email = document.getElementById('tkRecEmail').value.trim();
    hideAlert('tkRecAlert');
    if (!email) return showAlert('tkRecAlert', 'error', 'Enter your email.');
    try {
      const res = await api.post(`/api/tools/${state.product}/recover-license`, { email });
      if (res.found) showAlert('tkRecAlert', 'success', 'Sent! Check your inbox for the license key.');
      else showAlert('tkRecAlert', 'error', 'No license found for this email. Try the one you paid with.');
    } catch (e) { showAlert('tkRecAlert', 'error', e.message); }
  }

  async function openCheckout() {
    hideAlert('tkCoAlert');
    if (!state.course) {
      try { state.course = await api.get(`/api/courses/${state.product}`); refreshLicenseCopy(); }
      catch (e) { /* fall through to the guard below */ }
    }
    // Don't open a checkout the buyer can never complete: purchasing needs a
    // published product row. Fail fast with a clear message instead.
    if (!state.course || !state.course.id) {
      showLicense();
      showAlert('tkLicAlert', 'error', 'This tool is temporarily unavailable for purchase. Please try again later.');
      return;
    }
    dom.co.classList.add('open');
  }

  async function onBuy() {
    const name = document.getElementById('tkBuyName').value.trim();
    const email = document.getElementById('tkBuyEmail').value.trim();
    const phone = document.getElementById('tkBuyPhone').value.trim();
    const btn = document.getElementById('tkBuySubmit');
    hideAlert('tkCoAlert');
    if (!name || !email) return showAlert('tkCoAlert', 'error', 'Name and email are required.');
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Starting payment…';
    const reset = () => { btn.disabled = false; btn.textContent = label; };
    try {
      const course = state.course || (await api.get(`/api/courses/${state.product}`));
      state.course = course;
      const order = await api.post('/api/orders', { course_id: course.id, buyer_name: name, buyer_email: email, buyer_phone: phone });
      await window.Checkout.payAndVerify(order, {
        onSuccess: (result) => {
          dom.co.classList.remove('open');
          const key = result && result.license_key;
          if (key) { setLicensed(key); showSuccess(key); }
          else showSuccess(null);
        },
        onError: (e) => { showAlert('tkCoAlert', 'error', e.message); reset(); },
        onDismiss: reset,
      });
    } catch (e) { showAlert('tkCoAlert', 'error', e.message); reset(); }
  }

  function setLicensed(key) {
    state.licensed = true;
    state.key = key;
    try { localStorage.setItem(storageKey(), key); } catch (e) {}
    if (typeof state.onUnlock === 'function') { try { state.onUnlock(key); } catch (e) {} }
  }

  function showSuccess(key) {
    const card = dom.lic.querySelector('.tk-card');
    card.innerHTML = `
      <button class="tk-x" data-close>&times;</button>
      <div style="text-align:center">
        <div style="font-size:46px;margin-bottom:10px">🎉</div>
        <h3 style="margin:0 0 6px">You're all set!</h3>
        <p class="tk-sub">Everything is unlocked. Your license key is also emailed to you.</p>
        ${key ? `<div class="tk-key">${esc(key)}</div>` : ''}
        <button class="tk-btn primary" data-close>Start creating →</button>
      </div>`;
    card.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dom.lic.classList.remove('open')));
    dom.lic.classList.add('open');
  }

  function showLicense() { hideAlert('tkLicAlert'); dom.lic.classList.add('open'); }
  function showCheckout() { openCheckout(); }

  async function init(opts) {
    const o = opts || {};
    state.product = o.product;
    state.onUnlock = o.onUnlock || null;
    injectModals();
    // Load the product row (id + price) for the buy flow / copy.
    try { state.course = await api.get(`/api/courses/${state.product}`); } catch (e) { state.course = null; }
    refreshLicenseCopy();
    // Validate any stored key.
    let key = '';
    try { key = localStorage.getItem(storageKey()) || ''; } catch (e) {}
    if (key) {
      try {
        const res = await api.post(`/api/tools/${state.product}/validate-license`, { license_key: key });
        if (res.valid) { state.licensed = true; state.key = key; }
        else { try { localStorage.removeItem(storageKey()); } catch (e) {} }
      } catch (e) {
        // Fail closed: if the server can't confirm the key (offline / error),
        // keep it locked rather than optimistically unlocking. The stored key
        // remains for a later retry once the network recovers.
      }
    }
    return { licensed: state.licensed };
  }

  window.ToolKit = {
    init,
    esc,
    api,
    isLicensed: () => state.licensed,
    licenseKey: () => state.key,
    product: () => state.product,
    course: () => state.course,
    showLicense,
    showCheckout,
    // export helpers
    loadScript,
    ensureHtml2Canvas,
    ensureJsPDF,
    ensureJSZip,
    nodeToCanvas,
    renderOffscreen,
    downloadCanvas,
    downloadDataUrl,
    downloadBlob,
    parseCSV,
    csvToObjects,
  };
})();
