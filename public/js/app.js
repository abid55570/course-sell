const api = {
  get: (url) => fetch(url, { credentials: 'include' }).then(handle),
  post: (url, body) =>
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(handle),
};

async function handle(res) {
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function fmtPrice(n) {
  return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function showAlert(el, type, msg) {
  if (!el) return;
  el.className = `alert ${type}`;
  el.textContent = msg;
}

async function loadSiteInfo() {
  try {
    const info = await api.get('/api/site-info');
    document.querySelectorAll('#brandName, #brandFooter').forEach((n) => {
      if (n) n.textContent = info.site_name;
    });
    if (document.title.includes('Course Hub')) {
      document.title = document.title.replace('Course Hub', info.site_name);
    }
  } catch (e) { /* ignore */ }
}

function renderCourseCard(c) {
  const off = c.discount_percent || 0;
  const thumb = c.thumbnail
    ? `<img src="${escapeHtml(c.thumbnail)}" alt="${escapeHtml(c.title)}">`
    : `<div class="placeholder">${escapeHtml((c.title || 'C').slice(0,1).toUpperCase())}</div>`;
  return `
    <a class="card" href="/course/${encodeURIComponent(c.slug)}">
      <div class="thumb">${thumb}</div>
      <div class="body">
        <div class="title">${escapeHtml(c.title)}</div>
        <div class="desc">${escapeHtml(c.short_description || '')}</div>
        <div class="meta">
          ${c.category ? `<span class="tag">${escapeHtml(c.category)}</span>` : ''}
          ${c.level ? `<span class="tag">${escapeHtml(c.level)}</span>` : ''}
          ${c.duration ? `<span class="tag">${escapeHtml(c.duration)}</span>` : ''}
        </div>
        <div class="price-row">
          <span class="price-now">₹${fmtPrice(c.discounted_price)}</span>
          ${Number(c.original_price) > Number(c.discounted_price) ? `<span class="price-was">₹${fmtPrice(c.original_price)}</span>` : ''}
          ${off > 0 ? `<span class="price-off">${off}% OFF</span>` : ''}
        </div>
      </div>
    </a>`;
}

// Store sections share the courses table via `kind` (course | product).
async function loadStoreSection(kind, gridId, sectionId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const section = document.getElementById(sectionId);
  try {
    const list = await api.get(`/api/courses?kind=${encodeURIComponent(kind)}`);
    if (!list.length) { if (section) section.classList.add('hidden'); return; }
    grid.innerHTML = list.map(renderCourseCard).join('');
  } catch (e) {
    if (section) section.classList.add('hidden');
  }
}
function loadCourseList() { return loadStoreSection('course', 'coursesGrid', 'courses'); }
function loadProductList() { return loadStoreSection('product', 'productsGrid', 'products'); }

// Invite-landing pricing plans.
async function loadPlans() {
  const grid = document.getElementById('plansGrid');
  if (!grid) return;
  try {
    const plans = await api.get('/api/video/plans');
    grid.innerHTML = plans.map((p) => `
      <div class="plan-tier${p.key === 'standard' ? ' featured' : ''}">
        ${p.key === 'standard' ? '<span class="featured-tag">Most popular</span>' : ''}
        <div class="ptier-name">${escapeHtml(p.label)}</div>
        <div class="ptier-price">₹${fmtPrice(p.price)}<span class="ptier-was">₹${fmtPrice(p.original)}</span></div>
        <div class="text-muted" style="font-size:12px">${p.discount_percent}% OFF · ${escapeHtml(p.resolution)}</div>
        <ul>${p.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        <a href="/generator" class="btn ${p.key === 'standard' ? 'btn-primary' : ''}">Create on ${escapeHtml(p.label)} →</a>
      </div>`).join('');
  } catch (e) {
    grid.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

// Portrait template palettes (mirror of the server catalog) for showcase cards.
const HOME_PALETTES = {
  royal: ['#1a1130', '#3b1d5e'], pastel: ['#3a2a3f', '#6d4a5f'],
  emerald: ['#06231d', '#0e4a3a'], midnight: ['#0b1026', '#1b2450'], festive: ['#2a0a0a', '#6b1a12'],
};
const SHOWCASE_FALLBACK = [
  { name: 'Royal Wedding', kicker: 'Wedding', palette: 'royal' },
  { name: 'Pastel Wedding', kicker: 'Wedding', palette: 'pastel' },
  { name: 'Emerald Wedding', kicker: 'Wedding', palette: 'emerald' },
  { name: 'New Year Gold', kicker: 'New Year', palette: 'midnight' },
  { name: 'Diwali Greeting', kicker: 'Festival', palette: 'festive' },
  { name: 'Birthday Bash', kicker: 'Birthday', palette: 'midnight' },
];

function showcaseCardHtml(name, kicker, palette, href, priceHtml) {
  const [c0, c1] = HOME_PALETTES[palette] || HOME_PALETTES.royal;
  return `
    <a class="card" href="${href}">
      <div class="tpl-thumb" style="background:linear-gradient(160deg,${c0},${c1})">
        <div class="fr"></div>
        <div><div class="tk">${escapeHtml(kicker)}</div><div class="tn">${escapeHtml(name)}</div></div>
      </div>
      <div class="body">
        <div class="title">${escapeHtml(name)}</div>
        ${priceHtml || '<div class="price-row"><span class="tag">Customise →</span></div>'}
      </div>
    </a>`;
}

async function loadHomeShowcase() {
  const grid = document.getElementById('showcaseGrid');
  if (!grid) return;
  try {
    const list = await api.get('/api/video/templates');
    if (list && list.length) {
      grid.innerHTML = list.slice(0, 6).map((t) => {
        const pal = (t.preset && t.preset.palette) || 'royal';
        const price = `<div class="price-row">${t.price_from ? '<span class="text-muted" style="font-size:12px">from</span>' : ''}<span class="price-now">₹${fmtPrice(t.discounted_price)}</span>${Number(t.original_price) > Number(t.discounted_price) ? `<span class="price-was">₹${fmtPrice(t.original_price)}</span>` : ''}</div>`;
        return showcaseCardHtml(t.name, t.category_name || 'Invite', pal, `/generator/${encodeURIComponent(t.slug)}`, price);
      }).join('');
      return;
    }
    throw new Error('empty');
  } catch (e) {
    // Graceful fallback so the section always looks complete.
    grid.innerHTML = SHOWCASE_FALLBACK.map((s) => showcaseCardHtml(s.name, s.kicker, s.palette, '/generator')).join('');
  }
}

async function loadCourseDetail() {
  const root = document.getElementById('courseDetail');
  if (!root) return;
  const slug = decodeURIComponent(location.pathname.split('/').pop());
  try {
    const c = await api.get(`/api/courses/${slug}`);
    document.title = `${c.title} - Course Hub`;
    const off = c.discount_percent || 0;
    root.innerHTML = `
      <div class="course-detail">
        <div>
          <div class="hero-thumb">
            ${c.thumbnail ? `<img src="${escapeHtml(c.thumbnail)}" style="width:100%;height:100%;object-fit:cover">` : `<div class="card .placeholder" style="font-size:80px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(255,255,255,0.4)">${escapeHtml(c.title.slice(0,1).toUpperCase())}</div>`}
          </div>
          <h1 style="margin-top:20px">${escapeHtml(c.title)}</h1>
          <p class="text-muted">${escapeHtml(c.short_description || '')}</p>
          <div class="meta mt-8" style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px">
            ${c.category ? `<span class="tag">${escapeHtml(c.category)}</span>` : ''}
            ${c.level ? `<span class="tag">${escapeHtml(c.level)}</span>` : ''}
            ${c.duration ? `<span class="tag">${escapeHtml(c.duration)}</span>` : ''}
          </div>
          <div class="mt-24" style="white-space:pre-line">${escapeHtml(c.description || '')}</div>
        </div>
        <aside class="buy-card">
          <div class="price-row">
            <span class="price-now">₹${fmtPrice(c.discounted_price)}</span>
            ${Number(c.original_price) > Number(c.discounted_price) ? `<span class="price-was">₹${fmtPrice(c.original_price)}</span>` : ''}
            ${off > 0 ? `<span class="price-off">${off}% OFF</span>` : ''}
          </div>
          <a class="btn btn-primary" style="width:100%" href="/checkout?course=${encodeURIComponent(c.slug)}">Buy now</a>
          <ul>
            <li>Lifetime access</li>
            ${c.pdf_file ? '<li>Downloadable PDF on confirmation</li>' : ''}
            ${c.drive_link ? '<li>Private Google Drive resources</li>' : ''}
            <li>Email support</li>
          </ul>
        </aside>
      </div>
    `;
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

async function initCheckout() {
  const summary = document.getElementById('orderSummary');
  if (!summary) return;
  const params = new URLSearchParams(location.search);
  const slug = params.get('course');
  if (!slug) {
    summary.innerHTML = `<div class="alert error">No course selected. <a href="/">Pick one</a>.</div>`;
    return;
  }
  let course;
  try {
    course = await api.get(`/api/courses/${slug}`);
  } catch (e) {
    summary.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
    return;
  }
  summary.innerHTML = `
    <div><strong>${escapeHtml(course.title)}</strong></div>
    <p class="text-muted" style="margin:6px 0">${escapeHtml(course.short_description || '')}</p>
    <div class="price-row">
      <span class="price-now">₹${fmtPrice(course.discounted_price)}</span>
      ${Number(course.original_price) > Number(course.discounted_price) ? `<span class="price-was">₹${fmtPrice(course.original_price)}</span>` : ''}
    </div>
  `;

  const form = document.getElementById('buyerForm');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const alertEl = document.getElementById('buyerAlert');
    const btn = document.getElementById('payBtn');
    showAlert(alertEl, '', '');
    btn.disabled = true; btn.textContent = 'Starting payment…';
    const reset = () => { btn.disabled = false; btn.textContent = 'Pay & get access'; };
    try {
      const order = await api.post('/api/orders', {
        course_id: course.id,
        buyer_name: fd.get('buyer_name'),
        buyer_email: fd.get('buyer_email'),
        buyer_phone: fd.get('buyer_phone'),
      });
      await window.Checkout.payAndVerify(order, {
        onSuccess: () => {
          document.getElementById('step1').classList.add('hidden');
          document.getElementById('step3').classList.remove('hidden');
          setTimeout(() => { location.href = `/order/${order.order_id}`; }, 1200);
        },
        onError: (e) => { showAlert(alertEl, 'error', e.message); reset(); },
        onDismiss: reset,
      });
    } catch (e) {
      showAlert(alertEl, 'error', e.message);
      reset();
    }
  });
}

let orderPoll = null;

function videoAccessHtml(o) {
  const v = o.video;
  if (o.status !== 'completed') {
    return `<div class="alert warning mt-16">Awaiting payment. We'll email you once it's confirmed.</div>`;
  }
  if (!v) return '';
  if (v.ready) {
    return `<div class="alert success mt-16">
      <strong>Your video is ready 🎬</strong>
      <p style="margin:10px 0 6px">Two versions — HD to keep, and a WhatsApp-optimised one to share.</p>
      <p style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn btn-primary" href="/api/video/projects/${escapeHtml(v.public_id)}/download?variant=hd">Download HD</a>
        <a class="btn" href="/api/video/projects/${escapeHtml(v.public_id)}/download?variant=wa">Download for WhatsApp</a>
      </p>
    </div>`;
  }
  if (v.render_status === 'failed') {
    return `<div class="alert error mt-16">Something went wrong rendering your video. Our team has been notified — please reply to your order email.</div>`;
  }
  return `<div class="alert mt-16" id="renderPending">
    <strong>Payment received ✓</strong>
    <p style="margin:8px 0 0">Your video is being created now. This page will update automatically — usually under a minute.</p>
  </div>`;
}

async function loadOrderPage() {
  const root = document.getElementById('orderBody');
  if (!root) return;
  const orderId = location.pathname.split('/').pop();
  try {
    const o = await api.get(`/api/orders/${orderId}`);
    const statusBadge = `<span class="badge ${o.status}">${o.status}</span>`;
    const isVideo = o.product_type === 'video';
    const titleRow = isVideo
      ? `<p><strong>Product:</strong> ${escapeHtml(o.title || 'Invite video')}</p>`
      : `<p><strong>Course:</strong> ${escapeHtml(o.course_title || '')}</p>`;
    const accessHtml = isVideo
      ? videoAccessHtml(o)
      : (o.status === 'completed'
        ? `<div class="alert success mt-16">
            <strong>Access granted.</strong>
            <ul style="margin:10px 0 0;padding-left:18px">
              ${o.drive_link ? `<li>Drive: <a href="${escapeHtml(o.drive_link)}" target="_blank" rel="noopener">${escapeHtml(o.drive_link)}</a></li>` : ''}
              ${o.pdf_file ? `<li><a href="/api/orders/${escapeHtml(o.order_id)}/pdf">Download PDF</a></li>` : ''}
            </ul>
          </div>`
        : `<div class="alert warning mt-16">Awaiting payment confirmation. We'll email you once verified.</div>`);
    root.innerHTML = `
      <div class="card body" style="padding:22px">
        <p><strong>Order:</strong> ${escapeHtml(o.order_id)} ${statusBadge}</p>
        ${titleRow}
        <p><strong>Amount:</strong> ₹${fmtPrice(o.amount)}</p>
        <p><strong>Buyer:</strong> ${escapeHtml(o.buyer_name)} (${escapeHtml(o.buyer_email)})</p>
        ${accessHtml}
      </div>
    `;

    // Poll while a paid video is still rendering.
    if (isVideo && o.status === 'completed' && o.video && !o.video.ready && o.video.render_status !== 'failed') {
      if (!orderPoll) orderPoll = setInterval(loadOrderPage, 4000);
    } else if (orderPoll) {
      clearInterval(orderPoll); orderPoll = null;
    }
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteInfo();
  loadHomeShowcase();
  loadPlans();
  loadCourseList();
  loadProductList();
  loadCourseDetail();
  initCheckout();
  loadOrderPage();
});
