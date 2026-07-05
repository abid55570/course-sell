(function () {
  'use strict';
  const PRODUCT = 'idcard';
  const PRICE = 149;
  const FREE_CAP = 3;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = 638, H = 1013; // CR80 portrait, intrinsic px

  // ── FALLBACK templates (IDENTICAL shape to scripts/tool-data/idcard.js) ──
  const DIM = { width: W, height: H };
  const SCHOOL_FIELDS = [
    { key: 'name', label: 'Name' }, { key: 'id', label: 'ID No' },
    { key: 'class', label: 'Class' }, { key: 'blood', label: 'Blood Group' },
  ];
  const CORP_FIELDS = [
    { key: 'name', label: 'Name' }, { key: 'id', label: 'Emp ID' },
    { key: 'dept', label: 'Department' }, { key: 'blood', label: 'Blood Group' },
  ];
  const COLLEGE_FIELDS = [
    { key: 'name', label: 'Name' }, { key: 'id', label: 'Roll No' },
    { key: 'course', label: 'Course' }, { key: 'blood', label: 'Blood Group' },
  ];
  const EVENT_FIELDS = [
    { key: 'name', label: 'Name' }, { key: 'id', label: 'Pass No' },
    { key: 'role', label: 'Access' }, { key: 'org', label: 'Company' },
  ];
  const GYM_FIELDS = [
    { key: 'name', label: 'Member' }, { key: 'id', label: 'Member ID' },
    { key: 'plan', label: 'Plan' }, { key: 'blood', label: 'Blood Group' },
  ];
  const FALLBACK = [
    {
      slug: 'school-blue', name: 'School Blue', category: 'school', is_free: true, sort_order: 1,
      description: 'Classic school ID with photo, blue header band and blood group.',
      dimensions: DIM,
      data: {
        theme: { bg: '#f4f8ff', accent: '#1e5bd6', text: '#1f2a44', headingFont: 'Space Grotesk', band: '#1e5bd6' },
        org: 'Greenfield Public School',
        footer: 'If found, please return to the school office.',
        fields: SCHOOL_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'corporate-black', name: 'Corporate Black', category: 'corporate', is_free: true, sort_order: 2,
      description: 'Sleek black corporate badge for staff & employees.',
      dimensions: DIM,
      data: {
        theme: { bg: '#f5f6f8', accent: '#111418', text: '#1a1d22', headingFont: 'Space Grotesk', band: '#111418' },
        org: 'Acme Corporation Pvt. Ltd.',
        footer: 'Property of Acme Corp. Return to HR if found.',
        fields: CORP_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'college-green', name: 'College Green', category: 'college', is_free: true, sort_order: 3,
      description: 'Fresh green college ID with roll number and course.',
      dimensions: DIM,
      data: {
        theme: { bg: '#f2fbf5', accent: '#178a55', text: '#123528', headingFont: 'Space Grotesk', band: '#178a55' },
        org: 'St. Xaviers College of Arts & Science',
        footer: 'If found, please return to the college office.',
        fields: COLLEGE_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'event-pass', name: 'Event Pass', category: 'event', sort_order: 4,
      description: 'Bold conference / event access pass with role band.',
      dimensions: DIM,
      data: {
        theme: { bg: '#0f1120', accent: '#7c5cff', text: '#eef1fb', headingFont: 'Space Grotesk', band: '#7c5cff' },
        org: 'TechConf 2026',
        footer: 'This pass is non-transferable. Carry a valid ID.',
        fields: EVENT_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'gym-membership', name: 'Gym Membership', category: 'gym', sort_order: 5,
      description: 'Energetic membership card for gyms & fitness studios.',
      dimensions: DIM,
      data: {
        theme: { bg: '#fff5f2', accent: '#e2452c', text: '#3a1a12', headingFont: 'Space Grotesk', band: '#e2452c' },
        org: 'PowerHouse Fitness Studio',
        footer: 'Membership card. Non-transferable.',
        fields: GYM_FIELDS, showPhoto: true, showLogo: true,
      },
    },
  ];

  // ── state ──
  let templates = [];
  let current = null;   // picked template
  let cfg = null;       // editable config: { theme, org, footer, fields:[{key,label,on}], showPhoto, showLogo }
  let logo = null;      // dataURL
  let rows = [];        // recipients: array of objects keyed by field key (+ optional photo)
  let scale = 0.5;

  const $ = (id) => document.getElementById(id);

  // ── build a single card DOM at scale `s` ──
  function buildCard(row, s, opts) {
    opts = opts || {};
    const t = cfg.theme || {};
    const px = (n) => (n * s) + 'px';
    const activeFields = (cfg.fields || []).filter((f) => f.on !== false);

    const card = document.createElement('div');
    card.style.cssText = `position:relative;width:${px(W)};height:${px(H)};background:${t.bg || '#fff'};color:${t.text || '#222'};font-family:'Inter',sans-serif;overflow:hidden;box-sizing:border-box;border:${px(2)} solid ${t.accent}`;

    // header band
    const band = document.createElement('div');
    band.style.cssText = `background:${t.band || t.accent};color:#fff;padding:${px(26)} ${px(22)};display:flex;align-items:center;gap:${px(14)};min-height:${px(120)};box-sizing:border-box`;
    let bandHtml = '';
    if (cfg.showLogo) {
      bandHtml += `<div style="width:${px(74)};height:${px(74)};border-radius:${px(10)};background:#ffffff22;flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;border:${px(1)} solid #ffffff44">`;
      bandHtml += opts.logo ? `<img src="${esc(opts.logo)}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:contain" alt="">` : `<span style="font-size:${px(12)};color:#ffffffcc">LOGO</span>`;
      bandHtml += `</div>`;
    }
    bandHtml += `<div style="flex:1;min-width:0"><div style="font-family:'${t.headingFont || 'Space Grotesk'}',sans-serif;font-weight:700;font-size:${px(28)};line-height:1.12;word-break:break-word">${esc(cfg.org || '')}</div></div>`;
    band.innerHTML = bandHtml;
    card.appendChild(band);

    // photo
    if (cfg.showPhoto) {
      const pbox = document.createElement('div');
      pbox.style.cssText = `width:${px(230)};height:${px(288)};margin:${px(28)} auto ${px(20)};border:${px(3)} solid ${t.accent};border-radius:${px(10)};overflow:hidden;background:#ffffff;display:flex;align-items:center;justify-content:center;color:${t.accent}99;font-size:${px(16)}`;
      if (opts.photo) pbox.innerHTML = `<img src="${esc(opts.photo)}" style="width:100%;height:100%;object-fit:cover" crossorigin="anonymous" alt="">`;
      else pbox.textContent = 'Photo';
      card.appendChild(pbox);
    }

    // name headline (first field, usually name)
    const nameField = activeFields[0];
    if (nameField) {
      const nameEl = document.createElement('div');
      nameEl.style.cssText = `text-align:center;font-family:'${t.headingFont || 'Space Grotesk'}',sans-serif;font-weight:700;font-size:${px(34)};color:${t.accent};padding:0 ${px(20)};margin-bottom:${px(6)};word-break:break-word`;
      nameEl.textContent = (row && row[nameField.key]) || nameField.label;
      card.appendChild(nameEl);
    }

    // field rows (skip the first which is the headline)
    const list = document.createElement('div');
    list.style.cssText = `padding:${px(14)} ${px(30)} ${px(10)}`;
    activeFields.slice(1).forEach((f) => {
      const r = document.createElement('div');
      r.style.cssText = `display:grid;grid-template-columns:44% 56%;gap:${px(6)};padding:${px(7)} 0;font-size:${px(20)};line-height:1.3;border-bottom:${px(1)} solid ${t.accent}22`;
      const val = (row && row[f.key] != null && row[f.key] !== '') ? row[f.key] : '—';
      r.innerHTML = `<div style="font-weight:700;color:${t.text}">${esc(f.label)}</div><div style="color:${t.text}">: ${esc(val)}</div>`;
      list.appendChild(r);
    });
    card.appendChild(list);

    // footer band (absolute bottom)
    if (cfg.footer) {
      const foot = document.createElement('div');
      foot.style.cssText = `position:absolute;left:0;right:0;bottom:0;background:${t.band || t.accent};color:#fff;font-size:${px(15)};text-align:center;padding:${px(12)} ${px(16)};box-sizing:border-box;line-height:1.3`;
      foot.textContent = cfg.footer;
      card.appendChild(foot);
    }

    if (opts.watermark) {
      const wm = document.createElement('div');
      wm.style.cssText = `position:absolute;inset:0;pointer-events:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;transform:rotate(-32deg);opacity:.16`;
      wm.innerHTML = Array.from({ length: 10 }).map(() => `<span style="font-size:${px(30)};font-weight:800;color:#000;margin:${px(22)} ${px(16)};white-space:nowrap">PREVIEW · PAY ₹${PRICE}</span>`).join('');
      card.appendChild(wm);
    }
    return card;
  }

  // ── preview (first card) ──
  function firstRow() {
    if (rows.length) return rows[0];
    // sample row from field defaults
    const sample = {};
    (cfg.fields || []).forEach((f) => { sample[f.key] = f.label; });
    return sample;
  }
  function renderPreview() {
    if (!cfg) return;
    const host = $('cardPreview');
    host.innerHTML = '';
    const r = firstRow();
    host.appendChild(buildCard(r, scale, { logo, photo: r && r.photo }));
  }
  function fitPreview() {
    const wrap = $('previewWrap');
    if (!wrap) return;
    const avail = Math.min(wrap.clientWidth - 48, 420);
    scale = Math.max(0.3, avail / W);
    renderPreview();
  }
  window.addEventListener('resize', () => { clearTimeout(window._rz); window._rz = setTimeout(fitPreview, 150); });

  // ── form ──
  function renderForm() {
    const t = cfg.theme;
    const p = $('formPanel');
    let html = '';

    html += `<div class="fp-group"><h4>Template</h4>
      <button class="add-fld" id="changeDesign">Change template</button></div>`;

    html += `<div class="fp-group"><h4>Organisation</h4>
      <div class="ctl-col"><label>Organisation name</label><input type="text" id="orgInp" value="${esc(cfg.org || '')}"></div>
      <div class="ctl-col"><label>Footer text</label><input type="text" id="footInp" value="${esc(cfg.footer || '')}"></div>
      <div class="ctl-row" style="margin-top:8px"><label>Accent colour</label><input type="color" id="accentPick" value="${t.accent}"></div>
    </div>`;

    html += `<div class="fp-group"><h4>Logo</h4>
      <div class="ctl-row"><label>Show logo</label><input type="checkbox" id="logoChk" ${cfg.showLogo ? 'checked' : ''}></div>
      <div class="photo-drop" id="logoDrop">${logo ? `<img src="${logo}" alt="">` : 'Click to upload a logo'}</div>
      ${logo ? '<button class="add-fld" id="logoRemove" style="margin-top:6px">Remove logo</button>' : ''}
      <input type="file" id="logoInput" accept="image/*" style="display:none">
    </div>`;

    html += `<div class="fp-group"><h4>Card fields</h4>
      <div class="ctl-row"><label>Show photo box</label><input type="checkbox" id="photoChk" ${cfg.showPhoto ? 'checked' : ''}></div>`;
    (cfg.fields || []).forEach((f, i) => {
      html += `<div class="fldrow"><input type="checkbox" class="fchk" data-i="${i}" ${f.on !== false ? 'checked' : ''}>
        <input type="text" class="flabel" data-i="${i}" value="${esc(f.label)}">
        <span class="fkey">${esc(f.key)}</span></div>`;
    });
    html += `</div>`;

    // recipients
    html += `<div class="fp-group"><h4>Recipients <span id="rowCount" class="count">${rows.length}</span></h4>
      <div class="upload-box" id="csvBox">Upload CSV (columns: ${(cfg.fields || []).map((f) => esc(f.key)).join(', ')}${(cfg.fields || []).length ? ', photo' : ''})</div>
      <input type="file" id="csvInput" accept=".csv,text/csv" style="display:none">
      <button class="add-fld" id="addRow" style="margin-top:6px">+ Add a row manually</button>
      ${rows.length ? '<button class="add-fld" id="clearRows" style="margin-top:6px">Clear all recipients</button>' : ''}
      <div id="rowsTable" style="margin-top:10px"></div>
    </div>`;

    p.innerHTML = html;
    renderRowsTable();
    wireForm();
  }

  function renderRowsTable() {
    const host = $('rowsTable');
    if (!host) return;
    if (!rows.length) { host.innerHTML = '<div class="hint">No recipients yet. The preview shows sample data. Upload a CSV or add a row.</div>'; return; }
    const keys = (cfg.fields || []).filter((f) => f.on !== false).map((f) => f.key);
    let html = '';
    rows.slice(0, 30).forEach((r, ri) => {
      html += `<div class="rrow"><span class="ridx">${ri + 1}</span>`;
      keys.forEach((k) => {
        html += `<input type="text" class="rcell" data-ri="${ri}" data-k="${esc(k)}" value="${esc(r[k] || '')}" placeholder="${esc(k)}">`;
      });
      html += `<button class="del" data-delrow="${ri}" title="Remove">✕</button></div>`;
    });
    if (rows.length > 30) html += `<div class="hint">…and ${rows.length - 30} more (all included in export).</div>`;
    host.innerHTML = html;
    host.querySelectorAll('.rcell').forEach((i) => i.addEventListener('input', () => {
      rows[+i.dataset.ri][i.dataset.k] = i.value;
      if (+i.dataset.ri === 0) renderPreview();
    }));
    host.querySelectorAll('[data-delrow]').forEach((b) => b.addEventListener('click', () => {
      rows.splice(+b.dataset.delrow, 1); renderForm(); renderPreview();
    }));
  }

  function wireForm() {
    $('changeDesign').addEventListener('click', () => $('galleryOverlay').classList.add('open'));
    $('orgInp').addEventListener('input', (e) => { cfg.org = e.target.value; renderPreview(); });
    $('footInp').addEventListener('input', (e) => { cfg.footer = e.target.value; renderPreview(); });
    $('accentPick').addEventListener('input', (e) => { cfg.theme.accent = e.target.value; cfg.theme.band = e.target.value; renderPreview(); });
    $('logoChk').addEventListener('change', (e) => { cfg.showLogo = e.target.checked; renderPreview(); });
    $('logoDrop').addEventListener('click', () => $('logoInput').click());
    $('logoInput').addEventListener('change', (e) => { if (e.target.files[0]) readLogo(e.target.files[0]); });
    const lr = $('logoRemove'); if (lr) lr.addEventListener('click', () => { logo = null; renderForm(); renderPreview(); });
    $('photoChk').addEventListener('change', (e) => { cfg.showPhoto = e.target.checked; renderPreview(); });

    document.querySelectorAll('.fchk').forEach((c) => c.addEventListener('change', () => { cfg.fields[+c.dataset.i].on = c.checked; renderForm(); renderPreview(); }));
    document.querySelectorAll('.flabel').forEach((i) => i.addEventListener('input', () => { cfg.fields[+i.dataset.i].label = i.value; renderPreview(); }));

    $('csvBox').addEventListener('click', () => $('csvInput').click());
    $('csvInput').addEventListener('change', (e) => { if (e.target.files[0]) readCSV(e.target.files[0]); });
    $('addRow').addEventListener('click', () => {
      const blank = {};
      (cfg.fields || []).forEach((f) => { blank[f.key] = ''; });
      rows.push(blank); renderForm(); renderPreview();
    });
    const cr = $('clearRows'); if (cr) cr.addEventListener('click', () => { rows = []; renderForm(); renderPreview(); });
  }

  function readLogo(file) {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = () => { logo = r.result; renderForm(); renderPreview(); };
    r.readAsDataURL(file);
  }

  function readCSV(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = ToolKit.csvToObjects(r.result);
        const keys = (cfg.fields || []).map((f) => f.key);
        rows = parsed.rows.map((o) => {
          const out = {};
          keys.forEach((k) => { out[k] = o[k] != null ? o[k] : ''; });
          if (o.photo) out.photo = o.photo;
          return out;
        });
        renderForm(); renderPreview();
      } catch (e) { alert('Could not read that CSV: ' + e.message); }
    };
    r.readAsText(file);
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
      const locked = !t.is_free && !licensed;
      return `<div class="gal-card" data-slug="${esc(t.slug)}">
        <div class="gal-thumb" style="background:${th.bg || '#fff'}">
          <div class="gt-band" style="background:${th.band || th.accent}"><span>${esc((t.data && t.data.org) || t.name)}</span></div>
          <div class="gt-photo" style="border-color:${th.accent}"></div>
          <div class="gt-name" style="color:${th.accent}">${esc(t.name)}</div>
          <div class="gr" style="background:${th.accent}33"></div><div class="gr" style="width:70%;background:${th.accent}22"></div>
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
    if (!data) return;
    current = t;
    const d = JSON.parse(JSON.stringify(data));
    cfg = {
      theme: Object.assign({ headingFont: 'Space Grotesk' }, d.theme || {}),
      org: d.org || '',
      footer: d.footer || '',
      fields: (d.fields || []).map((f) => ({ key: f.key, label: f.label, on: true })),
      showPhoto: d.showPhoto !== false,
      showLogo: d.showLogo !== false,
    };
    $('galleryOverlay').classList.remove('open');
    renderForm(); fitPreview();
  }

  // ── export ──
  function safeName() {
    return String(cfg.org || 'idcards').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'idcards';
  }

  // Render one card full-res to a canvas.
  function renderCardCanvas(row, watermark) {
    return ToolKit.renderOffscreen(W, H, (frame) => {
      frame.appendChild(buildCard(row, 1, { logo, photo: row && row.photo, watermark }));
    });
  }

  async function exportSinglePng() {
    if (!cfg) return;
    const btn = $('exportPng'); const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Rendering…';
    try {
      const watermark = !ToolKit.isLicensed();
      const canvas = await renderCardCanvas(firstRow(), watermark);
      ToolKit.downloadCanvas(canvas, `${safeName()}_card.png`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
  }

  async function exportSheet() {
    if (!cfg) return;
    const licensed = ToolKit.isLicensed();

    // recipients to render (fall back to a single sample card)
    let data = rows.length ? rows.slice() : [firstRow()];

    if (!licensed && data.length > FREE_CAP) {
      // capped free tier: keep first N, and route unlicensed users to unlock
      ToolKit.showLicense();
      return;
    }
    const watermark = !licensed;

    const btn = $('exportPdf'); const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Rendering…';
    try {
      const jsPDF = await ToolKit.ensureJsPDF();
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 22;
      const gap = 12;
      const cols = 3;
      const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
      const cardH = cardW * (H / W);
      const rowsPerPage = Math.max(1, Math.floor((pageH - margin * 2 + gap) / (cardH + gap)));
      const perPage = cols * rowsPerPage;

      let placed = 0;
      const skipped = [];
      for (let i = 0; i < data.length; i++) {
        // A single bad remote photo (non-CORS URL taints the canvas) must not
        // abort the whole sheet — render each card in its own try/catch.
        let canvas;
        try {
          canvas = await renderCardCanvas(data[i], watermark);
        } catch (cardErr) {
          skipped.push((data[i] && (data[i].name || data[i][Object.keys(data[i])[0]])) || `#${i + 1}`);
          continue;
        }
        const posOnPage = placed % perPage;
        if (placed > 0 && posOnPage === 0) pdf.addPage();
        const col = posOnPage % cols;
        const rowIdx = Math.floor(posOnPage / cols);
        const x = margin + col * (cardW + gap);
        const y = margin + rowIdx * (cardH + gap);
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', x, y, cardW, cardH);
        placed++;
      }
      if (!placed) throw new Error('No cards could be rendered. If you used photo URLs, make sure they are publicly accessible (CORS-enabled) or upload images directly.');
      pdf.save(`${safeName()}_sheet.pdf`);
      if (skipped.length) alert(`${skipped.length} card(s) were skipped because their photo could not be loaded (needs a CORS-enabled/public image URL): ${skipped.slice(0, 5).join(', ')}${skipped.length > 5 ? '…' : ''}`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
  }

  // ── init ──
  function updatePill() {
    const pill = $('licenseStatus'); const btn = $('btnUnlock');
    if (ToolKit.isLicensed()) { pill.innerHTML = '<span style="color:var(--success)">✓ Unlocked · unlimited cards</span>'; if (btn) btn.style.display = 'none'; }
    else { pill.textContent = `Free: ${FREE_CAP} cards · watermark`; if (btn) btn.style.display = ''; }
  }

  async function init() {
    await ToolKit.init({
      product: PRODUCT,
      onUnlock: () => { updatePill(); renderGallery(); },
    });
    updatePill();
    $('galleryClose').addEventListener('click', () => $('galleryOverlay').classList.remove('open'));
    $('btnUnlock').addEventListener('click', () => ToolKit.showLicense());
    $('exportPng').addEventListener('click', () => exportSinglePng());
    $('exportPdf').addEventListener('click', () => exportSheet());
    await Promise.all([loadGallery(), loadCats()]);
    // Open with a FREE template so an unlicensed visitor isn't hit with the
    // paywall (and a blank editor) on first load if a PRO template sorts first.
    if (templates && templates.length) {
      const first = templates.find((t) => t.is_free) || templates[0];
      pick(first.slug);
    }
  }

  init();
})();
