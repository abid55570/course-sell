(function () {
  'use strict';
  const PRODUCT = 'certificate';
  const PRICE = 149;
  const W = 1414, H = 1000; // landscape certificate, intrinsic px
  const FREE_CAP = 3;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const HEADING_FONTS = ['Playfair Display', 'Cinzel', 'Space Grotesk', 'Georgia'];

  // ── FALLBACK templates (identical shape to scripts/tool-data/certificate.js) ──
  function tpl(theme, extra) {
    return Object.assign({
      title: 'Certificate of Completion',
      intro: 'This certificate is proudly presented to',
      subline: 'for successfully completing {{course}}',
      fields: { course: 'Web Development Bootcamp', date: '2026', signatory: 'Program Director', org: 'Your Organization' },
      showLogo: true,
      showSeal: true,
    }, extra || {}, { theme });
  }
  const FALLBACK = [
    { slug: 'classic-gold', name: 'Classic Gold', category: 'classic', is_free: true, sort_order: 1,
      description: 'Timeless ivory & gold with ornate double border and seal',
      dimensions: { width: W, height: H },
      data: tpl({ bg: '#fffdf5', bg2: '#f7edcf', border: '#b08d2f', accent: '#a5842f', text: '#5b4a2a', headingFont: 'Playfair Display' }) },
    { slug: 'elegant-blue', name: 'Elegant Blue', category: 'classic', is_free: true, sort_order: 2,
      description: 'Soft blue tones with a refined, professional frame',
      dimensions: { width: W, height: H },
      data: tpl({ bg: '#f5f9ff', bg2: '#dde9fb', border: '#3a5bbf', accent: '#3a5bbf', text: '#2f3f6b', headingFont: 'Cinzel' }) },
    { slug: 'modern-minimal', name: 'Modern Minimal', category: 'modern', is_free: true, sort_order: 3,
      description: 'Clean monochrome, thin border, contemporary type',
      dimensions: { width: W, height: H },
      data: tpl({ bg: '#ffffff', bg2: '#f2f2f2', border: '#222222', accent: '#111111', text: '#2a2a2a', headingFont: 'Space Grotesk' }, { showSeal: false }) },
    { slug: 'formal-navy', name: 'Formal Navy', category: 'classic', sort_order: 4,
      description: 'Deep navy with gold accents for official awards',
      dimensions: { width: W, height: H },
      data: tpl({ bg: '#f4f6fb', bg2: '#dfe4f0', border: '#1e2a4a', accent: '#c9a227', text: '#25304f', headingFont: 'Cinzel' }) },
    { slug: 'achievement-purple', name: 'Achievement Purple', category: 'modern', sort_order: 5,
      description: 'Elegant lavender with a celebratory feel',
      dimensions: { width: W, height: H },
      data: tpl({ bg: '#f8f5fd', bg2: '#e7ddf8', border: '#6d4fb3', accent: '#6d4fb3', text: '#3f3364', headingFont: 'Playfair Display' }) },
    { slug: 'corporate-teal', name: 'Corporate Teal', category: 'modern', sort_order: 6,
      description: 'Fresh teal, crisp lines — great for training batches',
      dimensions: { width: W, height: H },
      data: tpl({ bg: '#f2fbfa', bg2: '#d3efec', border: '#0f7c72', accent: '#0f7c72', text: '#204a46', headingFont: 'Space Grotesk' }) },
  ];

  // ── state ──
  let templates = [];
  let current = null;
  let doc = null;          // edited template data
  let logo = null;         // dataURL
  let recipients = [];     // [{ name, course?, date? }]
  let scale = 0.42;

  const $ = (id) => document.getElementById(id);

  // ── placeholder substitution ──
  function fillPlaceholders(str, rec) {
    const f = (doc && doc.fields) || {};
    const map = {
      name: rec.name || '',
      course: rec.course || f.course || '',
      date: rec.date || f.date || '',
    };
    return String(str == null ? '' : str).replace(/\{\{\s*(name|course|date)\s*\}\}/g, (_, k) => map[k]);
  }

  // ── build one certificate ──
  function buildCert(d, rec, s, opts) {
    opts = opts || {};
    const t = d.theme || {};
    const px = (n) => (n * s) + 'px';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:relative;width:${px(W)};height:${px(H)};background:linear-gradient(135deg,${t.bg || '#fff'},${t.bg2 || '#eee'});color:${t.text || '#333'};font-family:'Inter',sans-serif;box-sizing:border-box;overflow:hidden`;

    // ornate double border
    const b1 = document.createElement('div');
    b1.style.cssText = `position:absolute;inset:${px(30)};border:${px(4)} solid ${t.border || t.accent};border-radius:${px(4)};pointer-events:none`;
    wrap.appendChild(b1);
    const b2 = document.createElement('div');
    b2.style.cssText = `position:absolute;inset:${px(44)};border:${px(1.5)} solid ${t.accent}99;border-radius:${px(3)};pointer-events:none`;
    wrap.appendChild(b2);
    // corner flourishes
    ['top left', 'top right', 'bottom left', 'bottom right'].forEach((pos) => {
      const [v, h] = pos.split(' ');
      const c = document.createElement('div');
      c.style.cssText = `position:absolute;${v}:${px(52)};${h}:${px(52)};color:${t.accent};font-size:${px(30)};line-height:1;pointer-events:none`;
      c.textContent = '❦';
      wrap.appendChild(c);
    });

    // content column
    const col = document.createElement('div');
    col.style.cssText = `position:absolute;inset:${px(70)};display:flex;flex-direction:column;align-items:center;text-align:center;padding:${px(20)} ${px(40)}`;
    wrap.appendChild(col);

    // logo / org
    if (d.showLogo) {
      const lb = document.createElement('div');
      lb.style.cssText = `height:${px(72)};margin-bottom:${px(8)};display:flex;align-items:center;justify-content:center`;
      if (opts.logo) lb.innerHTML = `<img src="${esc(opts.logo)}" style="max-height:${px(72)};max-width:${px(260)};object-fit:contain" alt="">`;
      else lb.innerHTML = `<span style="font-family:'${t.headingFont || 'Playfair Display'}',serif;font-weight:700;font-size:${px(24)};color:${t.accent};letter-spacing:.04em">${esc((d.fields && d.fields.org) || '')}</span>`;
      col.appendChild(lb);
    }

    // title
    const title = document.createElement('div');
    title.style.cssText = `font-family:'${t.headingFont || 'Playfair Display'}',serif;font-weight:700;font-size:${px(58)};color:${t.accent};letter-spacing:${px(2)};margin-top:${px(6)}`;
    title.textContent = fillPlaceholders(d.title || 'Certificate', rec);
    col.appendChild(title);
    const rule = document.createElement('div');
    rule.style.cssText = `height:${px(3)};width:${px(220)};background:${t.accent};margin:${px(14)} auto ${px(22)};border-radius:${px(2)}`;
    col.appendChild(rule);

    // intro
    const intro = document.createElement('div');
    intro.style.cssText = `font-size:${px(22)};color:${t.text};letter-spacing:${px(0.5)}`;
    intro.textContent = fillPlaceholders(d.intro || '', rec);
    col.appendChild(intro);

    // recipient name
    const name = document.createElement('div');
    name.style.cssText = `font-family:'${t.headingFont || 'Playfair Display'}',serif;font-weight:700;font-size:${px(52)};color:${t.text};margin:${px(16)} 0 ${px(10)};border-bottom:${px(2)} solid ${t.accent}66;padding:0 ${px(24)} ${px(10)}`;
    name.textContent = rec.name || 'Recipient Name';
    col.appendChild(name);

    // subline
    const sub = document.createElement('div');
    sub.style.cssText = `font-size:${px(24)};color:${t.text};max-width:${px(900)};line-height:1.4;margin-top:${px(6)}`;
    sub.textContent = fillPlaceholders(d.subline || '', rec);
    col.appendChild(sub);

    // spacer
    const spacer = document.createElement('div');
    spacer.style.cssText = 'flex:1';
    col.appendChild(spacer);

    // footer: signatory | seal | date
    const foot = document.createElement('div');
    foot.style.cssText = `width:100%;display:flex;align-items:flex-end;justify-content:space-between;gap:${px(20)}`;

    const sig = document.createElement('div');
    sig.style.cssText = `text-align:center;min-width:${px(240)}`;
    sig.innerHTML = `<div style="height:${px(2)};background:${t.text}88;margin-bottom:${px(8)}"></div><div style="font-weight:700;font-size:${px(20)};color:${t.text}">${esc((d.fields && d.fields.signatory) || '')}</div><div style="font-size:${px(15)};color:${t.text}99">Signature</div>`;
    foot.appendChild(sig);

    if (d.showSeal) {
      const seal = document.createElement('div');
      seal.style.cssText = `width:${px(110)};height:${px(110)};border-radius:50%;border:${px(3)} solid ${t.accent};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${t.accent};box-shadow:0 0 0 ${px(4)} ${t.accent}22 inset;flex:none`;
      seal.innerHTML = `<div style="font-size:${px(28)}">★</div><div style="font-family:'${t.headingFont || 'Cinzel'}',serif;font-size:${px(12)};font-weight:700;letter-spacing:${px(1)}">OFFICIAL</div><div style="font-size:${px(10)};letter-spacing:${px(1)}">SEAL</div>`;
      foot.appendChild(seal);
    } else {
      const gap = document.createElement('div'); gap.style.cssText = `width:${px(110)}`; foot.appendChild(gap);
    }

    const dt = document.createElement('div');
    dt.style.cssText = `text-align:center;min-width:${px(240)}`;
    const dateVal = fillPlaceholders('{{date}}', rec) || (d.fields && d.fields.date) || '';
    dt.innerHTML = `<div style="height:${px(2)};background:${t.text}88;margin-bottom:${px(8)}"></div><div style="font-weight:700;font-size:${px(20)};color:${t.text}">${esc(dateVal)}</div><div style="font-size:${px(15)};color:${t.text}99">Date</div>`;
    foot.appendChild(dt);

    col.appendChild(foot);

    if (opts.watermark) {
      const wm = document.createElement('div');
      wm.style.cssText = `position:absolute;inset:0;pointer-events:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;transform:rotate(-28deg);opacity:.16`;
      wm.innerHTML = Array.from({ length: 10 }).map(() => `<span style="font-size:${px(46)};font-weight:800;color:#000;margin:${px(28)} ${px(26)};white-space:nowrap">PREVIEW · PAY ₹${PRICE}</span>`).join('');
      wrap.appendChild(wm);
    }
    return wrap;
  }

  // ── preview (first recipient) ──
  function firstRecipient() {
    if (recipients.length) return recipients[0];
    const f = (doc && doc.fields) || {};
    return { name: 'Recipient Name', course: f.course || '', date: f.date || '' };
  }
  function renderPreview() {
    if (!doc) return;
    const host = $('certPreview');
    host.innerHTML = '';
    host.appendChild(buildCert(doc, firstRecipient(), scale, { logo }));
  }
  function fitPreview() {
    const wrap = $('previewWrap');
    if (!wrap) return;
    const avail = Math.min(wrap.clientWidth - 48, 860);
    scale = Math.max(0.16, avail / W);
    renderPreview();
  }
  window.addEventListener('resize', () => { clearTimeout(window._rz); window._rz = setTimeout(fitPreview, 150); });

  // ── form ──
  function renderForm() {
    const t = doc.theme;
    const f = doc.fields || (doc.fields = {});
    const p = $('formPanel');
    let html = '';

    // Design
    html += `<div class="fp-group"><h4>Design</h4>
      <div class="ctl-row"><label>Accent colour</label><input type="color" id="accentPick" value="${t.accent}"></div>
      <div class="ctl-row"><label>Border colour</label><input type="color" id="borderPick" value="${t.border || t.accent}"></div>
      <div class="ctl-row"><label>Heading font</label><select id="fontSel">${HEADING_FONTS.map((x) => `<option ${t.headingFont === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    </div>`;

    // Text
    html += `<div class="fp-group"><h4>Certificate text</h4>
      <div class="ctl-col"><label>Title</label><input type="text" id="titleInp" value="${esc(doc.title || '')}"></div>
      <div class="ctl-col"><label>Intro line</label><input type="text" id="introInp" value="${esc(doc.intro || '')}"></div>
      <div class="ctl-col"><label>Sub line <span class="hint">use {{course}}, {{date}}</span></label><input type="text" id="sublineInp" value="${esc(doc.subline || '')}"></div>
    </div>`;

    // Details
    html += `<div class="fp-group"><h4>Details</h4>
      <div class="ctl-col"><label>Organization</label><input type="text" id="orgInp" value="${esc(f.org || '')}"></div>
      <div class="ctl-col"><label>Default course</label><input type="text" id="courseInp" value="${esc(f.course || '')}"></div>
      <div class="ctl-col"><label>Default date</label><input type="text" id="dateInp" value="${esc(f.date || '')}"></div>
      <div class="ctl-col"><label>Signatory</label><input type="text" id="sigInp" value="${esc(f.signatory || '')}"></div>
    </div>`;

    // Logo & seal
    html += `<div class="fp-group"><h4>Logo &amp; seal</h4>
      <div class="ctl-row"><label>Show logo / org</label><input type="checkbox" id="logoChk" ${doc.showLogo ? 'checked' : ''}></div>
      <div class="photo-drop" id="logoDrop">${logo ? `<img src="${esc(logo)}" alt="">` : 'Click to upload org logo'}</div>
      ${logo ? '<button class="add-fld" id="logoRemove" style="margin-top:6px">Remove logo</button>' : ''}
      <input type="file" id="logoInput" accept="image/*" style="display:none">
      <div class="ctl-row" style="margin-top:10px"><label>Show seal</label><input type="checkbox" id="sealChk" ${doc.showSeal ? 'checked' : ''}></div>
    </div>`;

    p.innerHTML = html;
    wireForm();
  }

  function wireForm() {
    const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
    on('accentPick', 'input', (e) => { doc.theme.accent = e.target.value; renderPreview(); });
    on('borderPick', 'input', (e) => { doc.theme.border = e.target.value; renderPreview(); });
    on('fontSel', 'change', (e) => { doc.theme.headingFont = e.target.value; renderPreview(); });
    on('titleInp', 'input', (e) => { doc.title = e.target.value; renderPreview(); });
    on('introInp', 'input', (e) => { doc.intro = e.target.value; renderPreview(); });
    on('sublineInp', 'input', (e) => { doc.subline = e.target.value; renderPreview(); });
    on('orgInp', 'input', (e) => { doc.fields.org = e.target.value; renderPreview(); });
    on('courseInp', 'input', (e) => { doc.fields.course = e.target.value; renderPreview(); });
    on('dateInp', 'input', (e) => { doc.fields.date = e.target.value; renderPreview(); });
    on('sigInp', 'input', (e) => { doc.fields.signatory = e.target.value; renderPreview(); });
    on('logoChk', 'change', (e) => { doc.showLogo = e.target.checked; renderPreview(); });
    on('sealChk', 'change', (e) => { doc.showSeal = e.target.checked; renderPreview(); });
    on('logoDrop', 'click', () => $('logoInput').click());
    on('logoInput', 'change', (e) => { if (e.target.files[0]) readLogo(e.target.files[0]); });
    on('logoRemove', 'click', () => { logo = null; renderForm(); renderPreview(); });
  }

  function readLogo(file) {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = () => { logo = r.result; renderForm(); renderPreview(); };
    r.readAsDataURL(file);
  }

  // ── recipients ──
  function parseNames() {
    const text = $('namesInput').value || '';
    recipients = text.split('\n').map((l) => l.trim()).filter(Boolean).map((n) => ({ name: n }));
    updateRecipients();
  }
  function updateRecipients() {
    const n = recipients.length;
    const licensed = ToolKit.isLicensed();
    $('recipCount').textContent = n === 1 ? '1 recipient' : `${n} recipients`;
    const notice = $('capNotice');
    if (!licensed && n > FREE_CAP) {
      notice.style.display = '';
      notice.innerHTML = `Free preview exports the first <b>${FREE_CAP}</b> of ${n} (watermarked). <button class="link-btn" id="capUnlock">Unlock all for ₹${PRICE} →</button>`;
      const b = $('capUnlock'); if (b) b.addEventListener('click', () => ToolKit.showLicense());
    } else {
      notice.style.display = 'none';
    }
    renderPreview();
  }
  function handleCSV(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const { headers, rows } = ToolKit.csvToObjects(r.result);
        const lower = headers.map((h) => h.toLowerCase());
        const nameIdx = lower.indexOf('name');
        const courseIdx = lower.indexOf('course');
        const dateIdx = lower.indexOf('date');
        // Headerless file (no recognised columns): treat EVERY row as a name,
        // including the first — csvToObjects would otherwise eat row 0 as a header.
        if (nameIdx < 0 && courseIdx < 0 && dateIdx < 0) {
          const raw = ToolKit.parseCSV(r.result);
          const flat = raw.map((cols) => ({ name: String(cols[0] || '').trim() })).filter((x) => x.name);
          if (!flat.length) { alert('No usable rows found. Add a "name" column, or paste one name per line.'); return; }
          recipients = flat;
          $('namesInput').value = flat.map((r2) => r2.name).join('\n');
          updateRecipients();
          return;
        }
        const key = (i) => (i >= 0 ? headers[i] : null);
        const out = rows.map((row) => {
          const rec = {};
          rec.name = nameIdx >= 0 ? row[key(nameIdx)] : (row[headers[0]] || '');
          if (courseIdx >= 0) rec.course = row[key(courseIdx)];
          if (dateIdx >= 0) rec.date = row[key(dateIdx)];
          return rec;
        }).filter((rec) => rec.name);
        if (!out.length) { alert('No usable rows found. Make sure your CSV has a "name" column.'); return; }
        recipients = out;
        // reflect into the textarea (names only) so the count is visible
        $('namesInput').value = out.map((r2) => r2.name).join('\n');
        $('csvNote').textContent = `Loaded ${out.length} from CSV` + (courseIdx >= 0 ? ' · course column used' : '') + (dateIdx >= 0 ? ' · date column used' : '');
        updateRecipients();
      } catch (e) {
        alert('Could not read that CSV: ' + e.message);
      }
    };
    r.readAsText(file);
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
    const licensed = ToolKit.isLicensed();
    $('galleryGrid').innerHTML = templates.map((t) => {
      const th = (t.data && t.data.theme) || {};
      const locked = !t.is_free && !licensed;
      const d = t.data || {};
      return `<div class="gal-card" data-slug="${esc(t.slug)}">
        <div class="gal-thumb" style="background:linear-gradient(135deg,${th.bg || '#fff'},${th.bg2 || '#eee'})">
          <div class="gt-frame" style="border-color:${th.border || th.accent}">
            <div class="gt-title" style="color:${th.accent}">${esc(d.title || 'Certificate')}</div>
            <div class="gt-rule" style="background:${th.accent}"></div>
            <div class="gt-name" style="color:${th.text}">${esc((d.fields && d.fields.org) || 'Recipient')}</div>
            <div class="gr" style="background:${th.accent}33"></div><div class="gr" style="width:60%;background:${th.accent}22"></div>
          </div>
        </div>
        <div class="gal-body"><span class="gal-name">${esc(t.name)}</span>${t.is_free ? '<span class="badge-free">FREE</span>' : (locked ? '<span class="badge-pro">PRO</span>' : '')}</div>
      </div>`;
    }).join('');
    $('galleryGrid').querySelectorAll('.gal-card').forEach((c) => c.addEventListener('click', () => pick(c.dataset.slug)));
  }
  async function loadCats() {
    try {
      const cats = await ToolKit.api.get(`/api/tools/${PRODUCT}/categories`);
      if (!Array.isArray(cats) || !cats.length) throw new Error('empty');
      const chips = $('catChips');
      chips.innerHTML = `<button class="chip active" data-c="all">All</button>` + cats.map((c) => `<button class="chip" data-c="${esc(c)}">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('');
      chips.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => { chips.querySelectorAll('.chip').forEach((x) => x.classList.remove('active')); ch.classList.add('active'); loadGallery(ch.dataset.c); }));
    } catch (e) {
      // fallback categories from FALLBACK data
      const cats = Array.from(new Set(FALLBACK.map((t) => t.category)));
      const chips = $('catChips');
      chips.innerHTML = `<button class="chip active" data-c="all">All</button>` + cats.map((c) => `<button class="chip" data-c="${esc(c)}">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('');
      chips.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => { chips.querySelectorAll('.chip').forEach((x) => x.classList.remove('active')); ch.classList.add('active'); loadGalleryLocal(ch.dataset.c); }));
    }
  }
  function loadGalleryLocal(cat) {
    templates = (cat && cat !== 'all') ? FALLBACK.filter((t) => t.category === cat) : FALLBACK;
    renderGallery();
  }
  async function pick(slug) {
    const t = templates.find((x) => x.slug === slug);
    if (!t) return;
    if (!t.is_free && !ToolKit.isLicensed()) return ToolKit.showLicense();
    let data = t.data;
    if (!data) { try { data = (await ToolKit.api.get(`/api/tools/${PRODUCT}/templates/${slug}`)).data; } catch (e) {} }
    current = t;
    doc = JSON.parse(JSON.stringify(data));
    doc.fields = Object.assign({ course: '', date: '', signatory: '', org: '' }, doc.fields || {});
    $('galleryOverlay').classList.remove('open');
    renderForm(); fitPreview();
  }

  // ── export ──
  function safeName(s) { return String(s || 'certificate').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'certificate'; }

  function exportList() {
    // returns { list, watermark, capped }
    const licensed = ToolKit.isLicensed();
    let list = recipients.length ? recipients.slice() : [firstRecipient()];
    let capped = false;
    if (!licensed && list.length > FREE_CAP) { list = list.slice(0, FREE_CAP); capped = true; }
    return { list, watermark: !licensed, capped };
  }

  async function certCanvas(rec, watermark) {
    return ToolKit.renderOffscreen(W, H, (frame) => {
      frame.appendChild(buildCert(doc, rec, 1, { logo, watermark }));
    });
  }

  async function exportCombinedPDF() {
    if (!doc) return;
    const { list, watermark, capped } = exportList();
    if (capped) { ToolKit.showLicense(); }
    const btn = $('exportPdf'); const label = btn.textContent; btn.disabled = true;
    try {
      const jsPDF = await ToolKit.ensureJsPDF();
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < list.length; i++) {
        btn.textContent = `Rendering ${i + 1}/${list.length}…`;
        const canvas = await certCanvas(list[i], watermark);
        if (i > 0) pdf.addPage('a4', 'landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph);
      }
      pdf.save(`certificates_${list.length}.pdf`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
  }

  async function exportZIP() {
    if (!doc) return;
    const { list, watermark, capped } = exportList();
    if (capped) { ToolKit.showLicense(); }
    const btn = $('exportZip'); const label = btn.textContent; btn.disabled = true;
    try {
      const jsPDF = await ToolKit.ensureJsPDF();
      const JSZip = await ToolKit.ensureJSZip();
      const zip = new JSZip();
      const used = {};
      for (let i = 0; i < list.length; i++) {
        btn.textContent = `Rendering ${i + 1}/${list.length}…`;
        const rec = list[i];
        const canvas = await certCanvas(rec, watermark);
        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph);
        let base = safeName(rec.name);
        if (used[base]) { used[base]++; base = `${base}_${used[base]}`; } else { used[base] = 1; }
        zip.file(`${base}.pdf`, pdf.output('arraybuffer'));
      }
      btn.textContent = 'Zipping…';
      const blob = await zip.generateAsync({ type: 'blob' });
      ToolKit.downloadBlob(blob, `certificates_${list.length}.zip`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
  }

  // ── init ──
  async function init() {
    await ToolKit.init({
      product: PRODUCT,
      onUnlock: () => { updatePill(); renderGallery(); updateRecipients(); },
    });
    updatePill();
    $('changeDesign').addEventListener('click', () => $('galleryOverlay').classList.add('open'));
    $('galleryClose').addEventListener('click', () => $('galleryOverlay').classList.remove('open'));
    $('btnUnlock').addEventListener('click', () => ToolKit.showLicense());
    $('exportPdf').addEventListener('click', exportCombinedPDF);
    $('exportZip').addEventListener('click', exportZIP);
    $('namesInput').addEventListener('input', parseNames);
    $('csvDrop').addEventListener('click', () => $('csvInput').click());
    $('csvInput').addEventListener('change', (e) => { if (e.target.files[0]) handleCSV(e.target.files[0]); });

    await Promise.all([loadGallery(), loadCats()]);
    if (templates[0]) pick((templates.find((t) => t.is_free) || templates[0]).slug);
    updateRecipients();
  }
  function updatePill() {
    const pill = $('licenseStatus'); const btn = $('btnUnlock');
    if (ToolKit.isLicensed()) { pill.innerHTML = '<span style="color:var(--success)">✓ Unlocked · unlimited</span>'; btn.style.display = 'none'; }
    else { pill.textContent = `Free: ${FREE_CAP} watermarked`; btn.style.display = ''; }
  }

  init();
})();
