(function () {
  'use strict';
  const PRODUCT = 'biodata';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = 1240, H = 1754; // A4 portrait, intrinsic px

  const THEMES = [
    { name: 'Ivory Gold', bg: '#fffdf6', bg2: '#f7edd4', accent: '#a5842f', text: '#5b4a2a', heading: '#7a5c1c' },
    { name: 'Rose', bg: '#fdf5f7', bg2: '#f6dfe8', accent: '#b3567a', text: '#6b2f45', heading: '#8a2f52' },
    { name: 'Royal Blue', bg: '#f3f7ff', bg2: '#dde8fb', accent: '#3a5bbf', text: '#2f3f6b', heading: '#243a7a' },
    { name: 'Sandal', bg: '#f6f8ef', bg2: '#e6efd6', accent: '#5c8a2f', text: '#3f4a2a', heading: '#3d5c1c' },
    { name: 'Maroon', bg: '#fdf3f1', bg2: '#f3d9d2', accent: '#9a3b2e', text: '#5a2a22', heading: '#7a271c' },
    { name: 'Peach', bg: '#fff6f0', bg2: '#fbe1cf', accent: '#c56a2c', text: '#63432a', heading: '#8a4a1c' },
    { name: 'Lavender', bg: '#f7f5fd', bg2: '#e6dff8', accent: '#6d4fb3', text: '#3f3364', heading: '#4a2f8a' },
    { name: 'Classic White', bg: '#ffffff', bg2: '#f1f1f1', accent: '#333333', text: '#2a2a2a', heading: '#111111' },
  ];
  const ORNAMENTS = { lotus: '❁', diamond: '◆', floral: '✿', star: '✦', none: '' };
  const HEADING_FONTS = ['Playfair Display', 'Cinzel', 'Space Grotesk', 'Georgia'];

  const FALLBACK = [{
    slug: 'traditional-gold', name: 'Traditional Gold', category: 'traditional', is_free: true,
    data: {
      title: 'Marriage Biodata',
      theme: Object.assign({ headingFont: 'Playfair Display', ornament: 'lotus', deity: '॥ श्री गणेशाय नमः ॥', showDeity: true }, THEMES[0]),
      showPhoto: true,
      sections: [
        { title: 'Personal Details', fields: [
          { label: 'Full Name', value: 'Your Name' }, { label: 'Date of Birth', value: '01 Jan 1996' },
          { label: 'Time of Birth', value: '10:30 AM' }, { label: 'Place of Birth', value: 'City' },
          { label: 'Height', value: "5' 8\"" }, { label: 'Blood Group', value: 'O+' },
          { label: 'Complexion', value: 'Fair' }, { label: 'Education', value: 'B.Tech' },
          { label: 'Occupation', value: 'Software Engineer' }, { label: 'Income', value: '₹12 LPA' } ] },
        { title: 'Family Details', fields: [
          { label: "Father's Name", value: 'Mr. Father Name' }, { label: "Father's Occupation", value: 'Business' },
          { label: "Mother's Name", value: 'Mrs. Mother Name' }, { label: "Mother's Occupation", value: 'Homemaker' },
          { label: 'Siblings', value: '1 Brother, 1 Sister' }, { label: 'Native Place', value: 'City, State' } ] },
        { title: 'Horoscope', fields: [
          { label: 'Rashi', value: 'Simha' }, { label: 'Nakshatra', value: 'Magha' },
          { label: 'Gotra', value: 'Kashyap' }, { label: 'Manglik', value: 'No' } ] },
        { title: 'Contact Details', fields: [
          { label: 'Contact Person', value: 'Father' }, { label: 'Phone', value: '+91 90000 00000' },
          { label: 'Address', value: 'Full postal address' } ] },
      ],
    },
  }];

  // ── state ──
  let templates = [];
  let current = null;
  let doc = null;      // editedDoc
  let photo = null;    // dataURL
  let scale = 0.32;

  const $ = (id) => document.getElementById(id);

  // ── rendering the document ──
  function buildDoc(d, s, opts) {
    opts = opts || {};
    const t = d.theme || {};
    const px = (n) => (n * s) + 'px';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:relative;width:${px(W)};min-height:${px(H)};background:linear-gradient(160deg,${t.bg || '#fff'},${t.bg2 || '#eee'});color:${t.text || '#333'};font-family:'${t.bodyFont || 'Inter'}',sans-serif;padding:${px(70)};box-sizing:border-box;overflow:hidden`;

    // ornamental frame
    const frame = document.createElement('div');
    frame.style.cssText = `position:absolute;inset:${px(26)};border:${px(2)} solid ${t.accent};border-radius:${px(6)};pointer-events:none`;
    wrap.appendChild(frame);
    const frame2 = document.createElement('div');
    frame2.style.cssText = `position:absolute;inset:${px(33)};border:${px(1)} solid ${t.accent}66;border-radius:${px(4)};pointer-events:none`;
    wrap.appendChild(frame2);

    const orn = ORNAMENTS[t.ornament] || '';
    // header
    const head = document.createElement('div');
    head.style.cssText = `text-align:center;margin-bottom:${px(18)}`;
    if (t.showDeity && t.deity) {
      head.innerHTML += `<div style="font-family:'Noto Serif Devanagari','Tiro Devanagari Hindi',serif;font-size:${px(26)};color:${t.accent};margin-bottom:${px(10)}">${esc(t.deity)}</div>`;
    }
    if (orn) head.innerHTML += `<div style="color:${t.accent};font-size:${px(22)};letter-spacing:${px(8)}">${orn} ${orn} ${orn}</div>`;
    head.innerHTML += `<div style="font-family:'${t.headingFont || 'Playfair Display'}',serif;font-weight:700;font-size:${px(46)};color:${t.heading};margin-top:${px(8)}">${esc(d.title || 'Marriage Biodata')}</div>`;
    head.innerHTML += `<div style="height:${px(3)};width:${px(160)};background:${t.accent};margin:${px(12)} auto 0;border-radius:${px(2)}"></div>`;
    wrap.appendChild(head);

    // photo
    if (d.showPhoto) {
      const pbox = document.createElement('div');
      pbox.style.cssText = `width:${px(240)};height:${px(300)};margin:0 auto ${px(20)};border:${px(3)} solid ${t.accent};border-radius:${px(8)};overflow:hidden;background:#ffffff88;display:flex;align-items:center;justify-content:center;color:${t.accent}99;font-size:${px(14)}`;
      if (opts.photo) pbox.innerHTML = `<img src="${opts.photo}" style="width:100%;height:100%;object-fit:cover" alt="">`;
      else pbox.textContent = 'Photo';
      wrap.appendChild(pbox);
    }

    // sections
    (d.sections || []).forEach((sec) => {
      const sc = document.createElement('div');
      sc.style.cssText = `margin-bottom:${px(20)}`;
      sc.innerHTML = `<div style="display:flex;align-items:center;gap:${px(10)};margin-bottom:${px(10)}">
        <span style="font-family:'${t.headingFont || 'Playfair Display'}',serif;font-weight:700;font-size:${px(24)};color:${t.heading}">${esc(sec.title)}</span>
        <span style="flex:1;height:${px(1)};background:${t.accent}55"></span></div>`;
      const rows = document.createElement('div');
      (sec.fields || []).forEach((f) => {
        const r = document.createElement('div');
        r.style.cssText = `display:grid;grid-template-columns:38% 62%;gap:${px(8)};padding:${px(5)} 0;font-size:${px(19)};line-height:1.35`;
        r.innerHTML = `<div style="font-weight:600;color:${t.heading}">${esc(f.label)}</div><div style="color:${t.text}">: ${esc(f.value)}</div>`;
        rows.appendChild(r);
      });
      sc.appendChild(rows);
      wrap.appendChild(sc);
    });

    // footer ornament
    if (orn) {
      const foot = document.createElement('div');
      foot.style.cssText = `text-align:center;color:${t.accent};font-size:${px(20)};margin-top:${px(10)}`;
      foot.textContent = `${orn} ${orn} ${orn}`;
      wrap.appendChild(foot);
    }

    if (opts.watermark) {
      const wm = document.createElement('div');
      wm.style.cssText = `position:absolute;inset:0;pointer-events:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;transform:rotate(-30deg);opacity:.14`;
      wm.innerHTML = Array.from({ length: 12 }).map(() => `<span style="font-size:${px(40)};font-weight:800;color:#000;margin:${px(30)} ${px(24)}">PREVIEW · PAY ₹59</span>`).join('');
      wrap.appendChild(wm);
    }
    return wrap;
  }

  function renderPreview() {
    if (!doc) return;
    const host = $('docPreview');
    host.innerHTML = '';
    host.appendChild(buildDoc(doc, scale, { photo }));
  }

  function fitPreview() {
    const wrap = $('previewWrap');
    const avail = Math.min(wrap.clientWidth - 48, 640);
    scale = Math.max(0.18, avail / W);
    renderPreview();
  }
  window.addEventListener('resize', () => { clearTimeout(window._rz); window._rz = setTimeout(fitPreview, 150); });

  // ── form ──
  function renderForm() {
    const t = doc.theme;
    const p = $('formPanel');
    let html = '';

    // Design
    html += `<div class="fp-group"><h4>Design</h4><div class="swatches" id="swatches"></div>
      <div class="ctl-row" style="margin-top:12px"><label>Accent colour</label><input type="color" id="accentPick" value="${t.accent}"></div>
      <div class="ctl-row"><label>Ornament</label><select id="ornSel">${Object.keys(ORNAMENTS).map((o) => `<option value="${o}" ${t.ornament === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
      <div class="ctl-row"><label>Heading font</label><select id="fontSel">${HEADING_FONTS.map((f) => `<option ${t.headingFont === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
    </div>`;

    // Header
    html += `<div class="fp-group"><h4>Header</h4>
      <div class="ctl-row"><label>Title</label><input type="text" id="titleInp" value="${esc(doc.title || '')}"></div>
      <div class="ctl-row"><label>Show deity line</label><input type="checkbox" id="deityChk" ${t.showDeity ? 'checked' : ''}></div>
      <div class="ctl-row"><label>Deity text</label><input type="text" id="deityInp" value="${esc(t.deity || '')}"></div>
      <div class="ctl-row"><label>Show photo</label><input type="checkbox" id="photoChk" ${doc.showPhoto ? 'checked' : ''}></div>
      <div class="photo-drop" id="photoDrop">${photo ? `<img src="${photo}" alt="">` : 'Click to upload your photo'}</div>
      ${photo ? '<button class="add-fld" id="photoRemove" style="margin-top:6px">Remove photo</button>' : ''}
      <input type="file" id="photoInput" accept="image/*" style="display:none">
    </div>`;

    // Sections
    (doc.sections || []).forEach((sec, si) => {
      html += `<div class="fp-group"><div class="sec-head"><input type="text" class="secTitle" data-si="${si}" value="${esc(sec.title)}"><button class="del" data-delsec="${si}" title="Remove section">🗑</button></div>`;
      (sec.fields || []).forEach((f, fi) => {
        html += `<div class="fld"><input type="text" class="flabel" data-si="${si}" data-fi="${fi}" value="${esc(f.label)}"><input type="text" class="fvalue" data-si="${si}" data-fi="${fi}" value="${esc(f.value)}"><button class="del" data-delf="${si}.${fi}">✕</button></div>`;
      });
      html += `<button class="add-fld" data-addf="${si}">+ Add field</button></div>`;
    });
    html += `<button class="add-fld" id="addSection" style="margin-bottom:24px">+ Add section</button>`;
    p.innerHTML = html;

    // swatches
    const sw = $('swatches');
    sw.innerHTML = THEMES.map((th, i) => `<div class="sw" data-th="${i}" title="${th.name}" style="background:linear-gradient(135deg,${th.bg},${th.bg2});box-shadow:inset 0 0 0 2px ${th.accent}"></div>`).join('');
    sw.querySelectorAll('.sw').forEach((s) => s.addEventListener('click', () => applyTheme(THEMES[+s.dataset.th])));

    wireForm();
  }

  function wireForm() {
    $('accentPick').addEventListener('input', (e) => { doc.theme.accent = e.target.value; renderPreview(); });
    $('ornSel').addEventListener('change', (e) => { doc.theme.ornament = e.target.value; renderPreview(); });
    $('fontSel').addEventListener('change', (e) => { doc.theme.headingFont = e.target.value; renderPreview(); });
    $('titleInp').addEventListener('input', (e) => { doc.title = e.target.value; renderPreview(); });
    $('deityChk').addEventListener('change', (e) => { doc.theme.showDeity = e.target.checked; renderPreview(); });
    $('deityInp').addEventListener('input', (e) => { doc.theme.deity = e.target.value; renderPreview(); });
    $('photoChk').addEventListener('change', (e) => { doc.showPhoto = e.target.checked; renderPreview(); });
    $('photoDrop').addEventListener('click', () => $('photoInput').click());
    $('photoInput').addEventListener('change', (e) => { if (e.target.files[0]) readPhoto(e.target.files[0]); });
    const pr = $('photoRemove'); if (pr) pr.addEventListener('click', () => { photo = null; renderForm(); renderPreview(); });

    document.querySelectorAll('.secTitle').forEach((i) => i.addEventListener('input', () => { doc.sections[+i.dataset.si].title = i.value; renderPreview(); }));
    document.querySelectorAll('.flabel').forEach((i) => i.addEventListener('input', () => { doc.sections[+i.dataset.si].fields[+i.dataset.fi].label = i.value; renderPreview(); }));
    document.querySelectorAll('.fvalue').forEach((i) => i.addEventListener('input', () => { doc.sections[+i.dataset.si].fields[+i.dataset.fi].value = i.value; renderPreview(); }));
    document.querySelectorAll('[data-delf]').forEach((b) => b.addEventListener('click', () => { const [si, fi] = b.dataset.delf.split('.').map(Number); doc.sections[si].fields.splice(fi, 1); renderForm(); renderPreview(); }));
    document.querySelectorAll('[data-addf]').forEach((b) => b.addEventListener('click', () => { doc.sections[+b.dataset.addf].fields.push({ label: 'New field', value: '' }); renderForm(); renderPreview(); }));
    document.querySelectorAll('[data-delsec]').forEach((b) => b.addEventListener('click', () => { doc.sections.splice(+b.dataset.delsec, 1); renderForm(); renderPreview(); }));
    $('addSection').addEventListener('click', () => { doc.sections.push({ title: 'New Section', fields: [{ label: 'Label', value: '' }] }); renderForm(); renderPreview(); });
  }

  function applyTheme(th) {
    Object.assign(doc.theme, { bg: th.bg, bg2: th.bg2, accent: th.accent, text: th.text, heading: th.heading });
    renderForm(); renderPreview();
  }

  function readPhoto(file) {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = () => { photo = r.result; renderForm(); renderPreview(); };
    r.readAsDataURL(file);
  }

  // ── gallery ──
  async function loadGallery(cat) {
    const grid = $('galleryGrid');
    try {
      const url = cat && cat !== 'all' ? `/api/tools/${PRODUCT}/templates?category=${encodeURIComponent(cat)}` : `/api/tools/${PRODUCT}/templates`;
      templates = await ToolKit.api.get(url);
      if (!templates.length) templates = FALLBACK;
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
        <div class="gal-thumb" style="background:linear-gradient(160deg,${th.bg || '#fff'},${th.bg2 || '#eee'})">
          ${th.showDeity ? `<div class="gh" style="color:${th.accent}">${esc(th.deity || '')}</div>` : ''}
          <div class="gt" style="color:${th.heading}">${esc((t.data && t.data.title) || t.name)}</div>
          <div class="gr" style="background:${th.accent}33"></div><div class="gr" style="width:70%;background:${th.accent}22"></div>
          <div class="gr" style="width:85%;background:${th.accent}22"></div><div class="gr" style="width:60%;background:${th.accent}22"></div>
        </div>
        <div class="gal-body"><span class="gal-name">${esc(t.name)}</span>${t.is_free ? '<span class="badge-free">FREE</span>' : (locked ? '<span class="badge-pro">PRO</span>' : '')}</div>
      </div>`;
    }).join('');
    $('galleryGrid').querySelectorAll('.gal-card').forEach((c) => c.addEventListener('click', () => pick(c.dataset.slug)));
  }
  async function loadCats() {
    try {
      const cats = await ToolKit.api.get(`/api/tools/${PRODUCT}/categories`);
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
    // fetch full template if the list didn't include data (it does here, but be safe)
    if (!data) { try { data = (await ToolKit.api.get(`/api/tools/${PRODUCT}/templates/${slug}`)).data; } catch (e) {} }
    current = t;
    doc = JSON.parse(JSON.stringify(data));
    doc.theme = Object.assign({ headingFont: 'Playfair Display', ornament: 'lotus', bodyFont: 'Inter' }, doc.theme || {});
    $('galleryOverlay').classList.remove('open');
    renderForm(); fitPreview();
  }

  // ── export ──
  async function exportImage(type) {
    if (!doc) return;
    const watermark = !ToolKit.isLicensed();
    const btn = type === 'pdf' ? $('exportPdf') : $('exportPng');
    const label = btn.textContent; btn.disabled = true; btn.textContent = 'Rendering…';
    try {
      // measure full-res height by building at scale 1 first
      const canvas = await ToolKit.renderOffscreen(W, measureHeight(), (frame) => {
        frame.style.height = 'auto';
        frame.appendChild(buildDoc(doc, 1, { photo, watermark }));
      });
      const name = (docName() || 'biodata');
      if (type === 'pdf') {
        const jsPDF = await ToolKit.ensureJsPDF();
        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = (canvas.height / canvas.width) * pw;
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pw, Math.min(ph, pdf.internal.pageSize.getHeight()));
        pdf.save(`${name}.pdf`);
      } else {
        ToolKit.downloadCanvas(canvas, `${name}.png`);
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
  }
  function measureHeight() {
    // build a temporary full-res node to measure natural height
    const probe = buildDoc(doc, 1, { photo });
    probe.style.cssText += ';position:absolute;left:-99999px;top:0;min-height:0';
    document.body.appendChild(probe);
    const h = Math.max(H, probe.scrollHeight);
    probe.remove();
    return h;
  }
  function docName() {
    const s = (doc.sections || [])[0];
    const nameField = s && (s.fields || []).find((f) => /name/i.test(f.label));
    return (nameField && nameField.value ? nameField.value : 'biodata').replace(/[^a-z0-9]+/gi, '_');
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
    $('exportPng').addEventListener('click', () => exportImage('png'));
    $('exportPdf').addEventListener('click', () => exportImage('pdf'));
    await Promise.all([loadGallery(), loadCats()]);
    pick((templates.find((t) => t.is_free) || templates[0]).slug); // open a free design by default
  }
  function updatePill() {
    const pill = $('licenseStatus'); const btn = $('btnUnlock');
    if (ToolKit.isLicensed()) { pill.innerHTML = '<span style="color:var(--success)">✓ Unlocked</span>'; btn.style.display = 'none'; }
    else { pill.textContent = 'Free preview · watermark on export'; btn.style.display = ''; }
  }

  init();
})();
