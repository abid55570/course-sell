// Front-end for the invite video generator: gallery + editor with a live,
// watermarked preview that mirrors the server-side ffmpeg render. Reuses the
// globals from app.js (api, fmtPrice, escapeHtml) and checkout-lib.js (Checkout).

// Client mirror of the server palettes (hex WITH '#'). Refreshed from
// /api/video/palettes in the editor so it always matches the server.
const PALETTES = {
  royal: { bg: '#1a1130', bgTo: '#3b1d5e', text: '#f7f0ff', accent: '#e6c15a' },
  pastel: { bg: '#3a2a3f', bgTo: '#6d4a5f', text: '#fff5fa', accent: '#f4b8cf' },
  emerald: { bg: '#06231d', bgTo: '#0e4a3a', text: '#f0fff8', accent: '#e6c15a' },
  midnight: { bg: '#0b1026', bgTo: '#1b2450', text: '#eef2ff', accent: '#ffd76a' },
  festive: { bg: '#2a0a0a', bgTo: '#6b1a12', text: '#fff4e6', accent: '#ffcf5a' },
  rose: { bg: '#2a0f1c', bgTo: '#5e2440', text: '#fff0f6', accent: '#f7a8c4' },
  teal: { bg: '#04232b', bgTo: '#0a4a52', text: '#eafffb', accent: '#6fe3d2' },
  noir: { bg: '#0a0a0d', bgTo: '#1c1c22', text: '#f4f4f6', accent: '#c9a24a' },
  sunset: { bg: '#2b1206', bgTo: '#6e2a10', text: '#fff3e8', accent: '#ff9e5a' },
  plum: { bg: '#1c0f2e', bgTo: '#4a2170', text: '#f6efff', accent: '#d9b3ff' },
  forest: { bg: '#0c1f12', bgTo: '#1d4227', text: '#eefff2', accent: '#bfe3a0' },
  wine: { bg: '#240810', bgTo: '#5a1024', text: '#ffeef2', accent: '#e2a3b0' },
  sky: { bg: '#0a1a2e', bgTo: '#17406b', text: '#eef6ff', accent: '#7cc4ff' },
};

// Buyer's chosen look for the current editor session.
let editorStyle = { palette: 'royal', accent: null, bg: null };

function hashHex(h) { return h && h[0] !== '#' ? `#${h}` : h; }

// Effective palette = chosen palette + custom accent/bg overrides.
function effectivePalette(template) {
  const base = PALETTES[editorStyle.palette] || PALETTES[(template.preset && template.preset.palette)] || PALETTES.royal;
  const p = { ...base };
  if (editorStyle.accent) p.accent = editorStyle.accent;
  if (editorStyle.bg) { p.bg = editorStyle.bg; p.bgTo = editorStyle.bg; }
  return p;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function dLine(dateIso, time) {
  const d = fmtDate(dateIso);
  return d ? d + (time ? `  |  ${time}` : '') : '';
}

// Mirror of services/video-templates.js mappers so the preview matches output.
const PREVIEW_MAPPERS = {
  elegant_wedding(d, preset) {
    const el = [];
    if (d.quote) el.push({ t: d.quote, r: 'kicker' });
    if (preset.heading) el.push({ t: preset.heading, r: 'kicker' });
    if (d.bride_name) el.push({ t: d.bride_name, r: 'name' });
    el.push({ t: '&', r: 'amp' });
    if (d.groom_name) el.push({ t: d.groom_name, r: 'name' });
    const dl = dLine(d.wedding_date, d.wedding_time);
    if (dl) el.push({ t: dl, r: 'detail' });
    if (d.venue) el.push({ t: d.venue, r: 'detail' });
    if (d.message) el.push({ t: d.message, r: 'message' });
    if (d.hosts) el.push({ t: d.hosts, r: 'small' });
    if (d.rsvp_phone) el.push({ t: `RSVP ${d.rsvp_phone}`, r: 'small' });
    if (d.hashtag) el.push({ t: d.hashtag, r: 'small' });
    return el;
  },
  greeting(d, preset) {
    const el = [];
    el.push({ t: d.greeting_title || preset.heading || "Season's Greetings", r: 'name' });
    if (d.subtitle) el.push({ t: d.subtitle, r: 'detail' });
    if (d.message) el.push({ t: d.message, r: 'message' });
    if (d.greeting_from) el.push({ t: `— ${d.greeting_from}`, r: 'detail' });
    if (d.footer) el.push({ t: d.footer, r: 'small' });
    return el;
  },
  birthday(d, preset) {
    const el = [];
    if (preset.heading) el.push({ t: preset.heading, r: 'kicker' });
    if (d.celebrant) el.push({ t: d.celebrant, r: 'name' });
    if (d.age) el.push({ t: `turning ${d.age}`, r: 'detail' });
    const dl = dLine(d.party_date, d.party_time);
    if (dl) el.push({ t: dl, r: 'detail' });
    if (d.venue) el.push({ t: d.venue, r: 'detail' });
    if (d.message) el.push({ t: d.message, r: 'message' });
    if (d.hashtag) el.push({ t: d.hashtag, r: 'small' });
    return el;
  },
  classic(d, preset) {
    const el = [];
    if (d.quote) el.push({ t: d.quote, r: 'kicker' });
    const label = d.event_label || preset.heading;
    if (label) el.push({ t: label, r: 'kicker' });
    if (d.title1) el.push({ t: d.title1, r: 'name' });
    if (d.title2) { el.push({ t: '&', r: 'amp' }); el.push({ t: d.title2, r: 'name' }); }
    if (d.subtitle) el.push({ t: d.subtitle, r: 'detail' });
    const dl = dLine(d.event_date, d.event_time);
    if (dl) el.push({ t: dl, r: 'detail' });
    if (d.venue) el.push({ t: d.venue, r: 'detail' });
    if (d.message) el.push({ t: d.message, r: 'message' });
    if (d.footer) el.push({ t: d.footer, r: 'small' });
    if (d.hashtag) el.push({ t: d.hashtag, r: 'small' });
    return el;
  },
};

// ---------------- Gallery ----------------
async function loadGeneratorGallery() {
  const grid = document.getElementById('tplGrid');
  if (!grid) return;
  let cats = [];
  let templates = [];
  try {
    [cats, templates] = await Promise.all([
      api.get('/api/video/categories'),
      api.get('/api/video/templates'),
    ]);
  } catch (e) {
    grid.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
    return;
  }
  if (!templates.length) {
    grid.classList.add('hidden');
    document.getElementById('tplEmpty').classList.remove('hidden');
    return;
  }

  const chips = document.getElementById('catChips');
  let active = 'all';
  const render = () => {
    const list = active === 'all' ? templates : templates.filter((t) => t.category_slug === active);
    grid.innerHTML = list.map(templateCard).join('');
  };
  const chipEls = [{ slug: 'all', name: 'All' }, ...cats].map((c) => {
    const b = document.createElement('button');
    b.className = 'chip' + (c.slug === 'all' ? ' active' : '');
    b.textContent = c.icon ? `${c.icon} ${c.name}` : c.name;
    b.onclick = () => {
      active = c.slug;
      chips.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      render();
    };
    return b;
  });
  chipEls.forEach((b) => chips.appendChild(b));
  render();
}

function templateCard(t) {
  const pal = PALETTES[(t.preset && t.preset.palette)] || PALETTES.royal;
  const off = t.discount_percent || 0;
  const thumb = t.has_thumbnail
    ? `<img src="/api/video/templates/${encodeURIComponent(t.slug)}/thumbnail" alt="${escapeHtml(t.name)}" style="width:100%;height:100%;object-fit:cover">`
    : `<div class="tpl-thumb" style="background:linear-gradient(160deg,${pal.bg},${pal.bgTo});width:100%;height:100%">
        <div><div style="font-family:'Great Vibes',cursive;font-size:30px;color:${pal.text}">${escapeHtml(t.name)}</div>
        <div style="color:${pal.accent};margin-top:6px;font-size:12px">${escapeHtml(t.category_name || '')}</div></div>
      </div>`;
  return `
    <a class="card" href="/generator/${encodeURIComponent(t.slug)}">
      <div class="tpl-thumb" style="padding:0">${thumb}</div>
      <div class="body">
        <div class="title">${escapeHtml(t.name)}</div>
        <div class="price-row">
          ${t.price_from ? '<span class="text-muted" style="font-size:12px">from</span>' : ''}
          <span class="price-now">₹${fmtPrice(t.discounted_price)}</span>
          ${Number(t.original_price) > Number(t.discounted_price) ? `<span class="price-was">₹${fmtPrice(t.original_price)}</span>` : ''}
          ${off > 0 ? `<span class="price-off">${off}% OFF</span>` : ''}
        </div>
      </div>
    </a>`;
}

// ---------------- Editor ----------------
function collectFormData() {
  const data = {};
  document.querySelectorAll('#fields [data-key]').forEach((el) => {
    data[el.getAttribute('data-key')] = el.value;
  });
  return data;
}

// Buyer-selected photos (held in memory until pay, then uploaded to the project).
let editorPhotos = [];
let editorPhotoUrls = [];

const CT_ROLE = { heading: 'kicker', normal: 'detail', small: 'small' };

function renderPreview(template, data) {
  const invite = document.getElementById('invite');
  if (!invite) return;
  const pal = effectivePalette(template);
  const mapper = PREVIEW_MAPPERS[template.composition_id] || PREVIEW_MAPPERS.greeting;
  const lines = mapper(data, template.preset || {}).filter((l) => l.t && String(l.t).trim());
  // Buyer-added custom text lines.
  if (Array.isArray(data.custom_texts)) {
    data.custom_texts.forEach((ct) => {
      if (ct && ct.text && String(ct.text).trim()) lines.push({ t: ct.text, r: CT_ROLE[ct.style] || 'detail' });
    });
  }
  invite.style.background = `linear-gradient(160deg, ${pal.bg}, ${pal.bgTo})`;
  invite.style.color = pal.text;
  const photoLayer = editorPhotoUrls.length
    ? `<div class="photo-bg" style="background-image:url('${editorPhotoUrls[0]}')"></div><div class="photo-scrim"></div>`
    : '';
  // Frame preview based on the chosen border style.
  const fr = editorStyle.frame || 'double';
  const bw = fr === 'inset' ? 1 : 2;
  const frameHtml = fr === 'none' ? ''
    : `<div class="frame" style="position:absolute;inset:16px;border:${bw}px solid ${pal.accent};border-radius:4px;opacity:.8;z-index:1"></div>`;
  const inner = lines.map((l) => {
    const color = l.r === 'amp' ? pal.accent : (l.r === 'kicker' ? pal.accent : pal.text);
    return `<div class="${l.r}" style="color:${color}">${escapeHtml(l.t)}</div>`;
  }).join('');
  invite.innerHTML = `${photoLayer}${frameHtml}${inner}<div class="wm">PREVIEW</div>`;
}

function addCustomTextRow(text, style) {
  const host = document.getElementById('customTexts');
  if (!host) return;
  const row = document.createElement('div');
  row.className = 'ctext-row';
  row.innerHTML = `<input type="text" maxlength="120" placeholder="Extra line of text" value="${escapeHtml(text || '')}">
    <select><option value="normal">Normal</option><option value="heading">Heading</option><option value="small">Small</option></select>
    <button type="button" class="btn btn-sm rm" title="Remove">✕</button>`;
  row.querySelector('select').value = style || 'normal';
  host.appendChild(row);
}

function collectCustomTexts() {
  return Array.from(document.querySelectorAll('#customTexts .ctext-row'))
    .map((r) => ({ text: r.querySelector('input').value, style: r.querySelector('select').value }))
    .filter((x) => x.text.trim());
}

function setupPhotoInput(template) {
  const input = document.getElementById('photoInput');
  const thumbs = document.getElementById('photoThumbs');
  if (!input) return;
  input.addEventListener('change', () => {
    const max = planMaxPhotos();
    editorPhotoUrls.forEach((u) => URL.revokeObjectURL(u));
    const picked = Array.from(input.files);
    editorPhotos = picked.slice(0, max);
    editorPhotoUrls = editorPhotos.map((f) => URL.createObjectURL(f));
    thumbs.innerHTML = editorPhotoUrls.map((u) => `<img class="pt" src="${u}" alt="photo">`).join('');
    if (picked.length > max) showAlert(document.getElementById('payAlert'), 'warning', `The ${PLAN_MAP[editorPlan].label} plan includes ${max} photo${max > 1 ? 's' : ''} — kept the first ${max}.`);
    renderPreview(template, fullFormData());
  });
}

async function setupDesign(template) {
  const host = document.getElementById('paletteSwatches');
  if (!host) return;
  editorStyle = { palette: (template.preset && template.preset.palette) || 'royal', accent: null, bg: null, frame: 'double' };

  let palettes;
  try {
    const list = await api.get('/api/video/palettes');
    palettes = list.map((p) => ({ name: p.name, bg: hashHex(p.bg), bgTo: hashHex(p.bgTo), text: hashHex(p.text), accent: hashHex(p.accent), label: p.label }));
    palettes.forEach((p) => { PALETTES[p.name] = { bg: p.bg, bgTo: p.bgTo, text: p.text, accent: p.accent }; });
  } catch (e) {
    palettes = Object.entries(PALETTES).map(([name, p]) => ({ name, ...p, label: name }));
  }

  const accentInput = document.getElementById('styleAccent');
  const bgInput = document.getElementById('styleBg');
  const syncColorInputs = () => {
    const base = PALETTES[editorStyle.palette] || PALETTES.royal;
    accentInput.value = editorStyle.accent || base.accent;
    bgInput.value = editorStyle.bg || base.bg;
  };
  const refresh = () => { renderSwatches(); renderPreview(template, collectFormData()); };
  const renderSwatches = () => {
    host.innerHTML = palettes.map((p) =>
      `<div class="swatch${p.name === editorStyle.palette && !editorStyle.bg ? ' active' : ''}" title="${escapeHtml(p.label || p.name)}" data-pal="${p.name}" style="background:linear-gradient(140deg,${p.bg},${p.bgTo})"></div>`
    ).join('');
    host.querySelectorAll('.swatch').forEach((sw) => sw.addEventListener('click', () => {
      editorStyle.palette = sw.dataset.pal; editorStyle.accent = null; editorStyle.bg = null;
      syncColorInputs(); refresh();
    }));
  };
  accentInput.addEventListener('input', () => { editorStyle.accent = accentInput.value; refresh(); });
  bgInput.addEventListener('input', () => { editorStyle.bg = bgInput.value; refresh(); });
  const frameSel = document.getElementById('styleFrame');
  if (frameSel) {
    frameSel.value = editorStyle.frame;
    frameSel.addEventListener('change', () => { editorStyle.frame = frameSel.value; refresh(); });
  }
  document.getElementById('styleReset').addEventListener('click', () => {
    editorStyle.accent = null; editorStyle.bg = null; syncColorInputs(); refresh();
  });
  syncColorInputs();
  renderSwatches();
}

function currentStylePayload() {
  const style = { palette: editorStyle.palette, frame: editorStyle.frame };
  if (editorStyle.accent) style.accent = editorStyle.accent;
  if (editorStyle.bg) style.bg = editorStyle.bg;
  return style;
}

// Field values + buyer-added custom text lines.
function fullFormData() {
  return { ...collectFormData(), custom_texts: collectCustomTexts() };
}

// ---- Purchase plan (Basic / Standard / Premium) ----
let editorPlan = 'standard';
let PLAN_MAP = {};

async function setupPlans(template) {
  const host = document.getElementById('planCards');
  if (!host) return;
  let plans;
  try { plans = await api.get('/api/video/plans'); } catch (e) { plans = []; }
  PLAN_MAP = {};
  plans.forEach((p) => { PLAN_MAP[p.key] = p; });
  editorPlan = (template.default_plan && PLAN_MAP[template.default_plan]) ? template.default_plan
    : (PLAN_MAP.standard ? 'standard' : (plans[0] && plans[0].key));

  const render = () => {
    host.innerHTML = plans.map((p) => `
      <div class="plan-card${p.key === editorPlan ? ' active' : ''}" data-plan="${p.key}">
        <div class="pname">${escapeHtml(p.label)}</div>
        <div class="pprice">₹${fmtPrice(p.price)}<span class="pwas">₹${fmtPrice(p.original)}</span></div>
        <ul>${p.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
      </div>`).join('');
    host.querySelectorAll('.plan-card').forEach((c) => c.addEventListener('click', () => {
      editorPlan = c.dataset.plan;
      enforcePhotoLimit();
      render();
      updatePriceTag();
      renderPreview(template, fullFormData());
    }));
  };
  render();
  updatePriceTag();
}

function updatePriceTag() {
  const p = PLAN_MAP[editorPlan];
  if (!p) return;
  const tag = document.getElementById('priceTag');
  if (tag) tag.innerHTML = `<span class="now">₹${fmtPrice(p.price)}</span> <span class="was">₹${fmtPrice(p.original)}</span> <span class="price-off">${p.discount_percent}% OFF</span>
    <div class="text-muted" style="font-size:12px;margin-top:2px">${escapeHtml(p.label)} plan · ${escapeHtml(p.resolution)}</div>`;
  const btn = document.getElementById('payBtn');
  if (btn) btn.textContent = `Pay ₹${fmtPrice(p.price)} & generate`;
}

function planMaxPhotos() { return (PLAN_MAP[editorPlan] && PLAN_MAP[editorPlan].maxPhotos) || 5; }

function enforcePhotoLimit() {
  const max = planMaxPhotos();
  if (editorPhotos.length > max) {
    editorPhotoUrls.slice(max).forEach((u) => URL.revokeObjectURL(u));
    editorPhotos = editorPhotos.slice(0, max);
    editorPhotoUrls = editorPhotoUrls.slice(0, max);
    const thumbs = document.getElementById('photoThumbs');
    if (thumbs) thumbs.innerHTML = editorPhotoUrls.map((u) => `<img class="pt" src="${u}" alt="photo">`).join('');
    showAlert(document.getElementById('payAlert'), 'warning', `The ${PLAN_MAP[editorPlan].label} plan includes ${max} photo${max > 1 ? 's' : ''}.`);
  }
}

function fieldControl(f) {
  const key = escapeHtml(f.key);
  const common = `data-key="${key}" id="fld-${key}"`;
  if (f.type === 'textarea') return `<textarea ${common} maxlength="${f.max || 200}"></textarea>`;
  if (f.type === 'select') {
    const opts = (f.options || []).map((o) => {
      const v = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : (o.label || o.value);
      return `<option value="${escapeHtml(v)}">${escapeHtml(label)}</option>`;
    }).join('');
    return `<select ${common}><option value="">Choose…</option>${opts}</select>`;
  }
  const typeMap = { text: 'text', date: 'date', time: 'time', phone: 'tel', color: 'color' };
  const inputType = typeMap[f.type] || 'text';
  const maxAttr = f.max ? `maxlength="${f.max}"` : '';
  return `<input type="${inputType}" ${common} ${maxAttr}>`;
}

function buildFields(template) {
  const groups = {};
  (template.fields_schema || []).forEach((f) => {
    if (f.type === 'events') return; // repeatable events not in Phase-0 UI
    const g = f.group || 'Details';
    (groups[g] = groups[g] || []).push(f);
  });
  const host = document.getElementById('fields');
  host.innerHTML = Object.entries(groups).map(([group, fields]) => `
    <div class="field-group">
      <h4>${escapeHtml(group)}</h4>
      ${fields.map((f) => `
        <div class="field">
          <label>${escapeHtml(f.label || f.key)}${f.required ? ' *' : ''}</label>
          ${fieldControl(f)}
          <div class="err" id="err-${escapeHtml(f.key)}"></div>
        </div>`).join('')}
    </div>`).join('');
}

async function initGeneratorEditor(template) {
  buildFields(template);
  document.getElementById('tplName').textContent = template.name;
  await setupPlans(template);

  const update = () => renderPreview(template, fullFormData());
  document.getElementById('fields').addEventListener('input', update);
  // Custom text lines: add / edit / remove.
  document.getElementById('addTextBtn').addEventListener('click', () => { addCustomTextRow('', 'normal'); update(); });
  const ctHost = document.getElementById('customTexts');
  ctHost.addEventListener('input', update);
  ctHost.addEventListener('change', update);
  ctHost.addEventListener('click', (e) => {
    if (e.target.classList.contains('rm')) { e.target.closest('.ctext-row').remove(); update(); }
  });
  setupPhotoInput(template);
  await setupDesign(template);
  update();

  document.getElementById('buyerForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const alertEl = document.getElementById('payAlert');
    const btn = document.getElementById('payBtn');
    showAlert(alertEl, '', '');
    document.querySelectorAll('.err').forEach((e) => (e.textContent = ''));
    btn.disabled = true; btn.textContent = 'Starting…';
    const reset = () => { btn.disabled = false; btn.textContent = 'Pay & generate video'; };
    const bf = new FormData(ev.target);
    try {
      // 1) Save the customization as a draft project (server validates fields).
      let project;
      try {
        project = await api.post('/api/video/projects', {
          template_slug: template.slug,
          form_data: fullFormData(),
          style: currentStylePayload(),
          plan: editorPlan,
        });
      } catch (e) {
        if (e.fields) {
          Object.entries(e.fields).forEach(([k, msg]) => {
            const el = document.getElementById(`err-${k}`);
            if (el) el.textContent = msg;
          });
          throw new Error('Please fix the highlighted fields.');
        }
        throw e;
      }
      // 2) Upload any selected photos to the draft project.
      if (editorPhotos.length) {
        btn.textContent = 'Uploading photos…';
        const pf = new FormData();
        editorPhotos.forEach((f) => pf.append('photos', f));
        const up = await fetch(`/api/video/projects/${project.public_id}/photos`, {
          method: 'POST', credentials: 'include', body: pf,
        });
        if (!up.ok) throw new Error('Photo upload failed. Please try smaller images (max 12MB each).');
        btn.textContent = 'Starting…';
      }
      // 3) Create the order for this project.
      const order = await api.post('/api/orders', {
        video_project_id: project.public_id,
        buyer_name: bf.get('buyer_name'),
        buyer_email: bf.get('buyer_email'),
        buyer_phone: bf.get('buyer_phone'),
      });
      // 3) Pay via Razorpay, then land on the order page (which polls the render).
      await window.Checkout.payAndVerify(order, {
        onSuccess: () => { location.href = `/order/${order.order_id}`; },
        onError: (e) => { showAlert(alertEl, 'error', e.message); reset(); },
        onDismiss: reset,
      });
    } catch (e) {
      showAlert(alertEl, 'error', e.message);
      reset();
    }
  });
}

// api.post in app.js throws Error(msg) and drops the JSON body. The editor needs
// the per-field errors, so use a small local poster that preserves them.
async function postWithFields(url, body) {
  const res = await fetch(url, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    if (data.fields) err.fields = data.fields;
    throw err;
  }
  return data;
}

async function bootstrapEditor() {
  const root = document.getElementById('editRoot');
  if (!root) return;
  // Override api.post locally so field errors survive (see postWithFields).
  api.post = postWithFields;
  const slug = decodeURIComponent(location.pathname.split('/').pop());
  try {
    const template = await api.get(`/api/video/templates/${slug}`);
    document.title = `${template.name} · Invite Maker`;
    await initGeneratorEditor(template);
  } catch (e) {
    root.innerHTML = `<div class="alert error" style="margin:24px">${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadGeneratorGallery();
  bootstrapEditor();
});
