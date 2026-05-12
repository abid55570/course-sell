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

async function loadCourseList() {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;
  try {
    const list = await api.get('/api/courses');
    if (!list.length) {
      document.getElementById('coursesEmpty').classList.remove('hidden');
      return;
    }
    grid.innerHTML = list.map(renderCourseCard).join('');
  } catch (e) {
    grid.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
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

  let createdOrder = null;

  document.getElementById('buyerForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const alertEl = document.getElementById('buyerAlert');
    showAlert(alertEl, '', '');
    try {
      const out = await api.post('/api/orders', {
        course_id: course.id,
        buyer_name: fd.get('buyer_name'),
        buyer_email: fd.get('buyer_email'),
        buyer_phone: fd.get('buyer_phone'),
      });
      createdOrder = out;
      document.getElementById('step1').classList.add('hidden');
      const step2 = document.getElementById('step2');
      step2.classList.remove('hidden');
      document.getElementById('qrWrap').innerHTML = `<img src="${out.upi.qr}" alt="UPI QR">`;
      document.getElementById('upiLink').href = out.upi.link;
      document.getElementById('upiId').textContent = out.upi.upi_id || '';
      document.getElementById('upiAmount').textContent = fmtPrice(out.amount);
      document.getElementById('upiOrderId').textContent = out.order_id;
    } catch (e) {
      showAlert(alertEl, 'error', e.message);
    }
  });

  document.getElementById('txnForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!createdOrder) return;
    const fd = new FormData(ev.target);
    const alertEl = document.getElementById('txnAlert');
    showAlert(alertEl, '', '');
    try {
      await api.post(`/api/orders/${createdOrder.order_id}/submit-txn`, {
        upi_txn_ref: fd.get('upi_txn_ref'),
        notes: fd.get('notes'),
      });
      document.getElementById('step2').classList.add('hidden');
      document.getElementById('step3').classList.remove('hidden');
      document.getElementById('orderTrackLink').href = `/order/${createdOrder.order_id}`;
    } catch (e) {
      showAlert(alertEl, 'error', e.message);
    }
  });
}

async function loadOrderPage() {
  const root = document.getElementById('orderBody');
  if (!root) return;
  const orderId = location.pathname.split('/').pop();
  try {
    const o = await api.get(`/api/orders/${orderId}`);
    const statusBadge = `<span class="badge ${o.status}">${o.status}</span>`;
    const accessHtml = o.status === 'completed'
      ? `<div class="alert success mt-16">
          <strong>Access granted.</strong>
          <ul style="margin:10px 0 0;padding-left:18px">
            ${o.drive_link ? `<li>Drive: <a href="${escapeHtml(o.drive_link)}" target="_blank" rel="noopener">${escapeHtml(o.drive_link)}</a></li>` : ''}
            ${o.pdf_file ? `<li><a href="/api/orders/${escapeHtml(o.order_id)}/pdf">Download PDF</a></li>` : ''}
          </ul>
        </div>`
      : `<div class="alert warning mt-16">Awaiting payment confirmation. We'll email you once verified.</div>`;
    root.innerHTML = `
      <div class="card body" style="padding:22px">
        <p><strong>Order:</strong> ${escapeHtml(o.order_id)} ${statusBadge}</p>
        <p><strong>Course:</strong> ${escapeHtml(o.course_title)}</p>
        <p><strong>Amount:</strong> ₹${fmtPrice(o.amount)}</p>
        <p><strong>Buyer:</strong> ${escapeHtml(o.buyer_name)} (${escapeHtml(o.buyer_email)})</p>
        ${accessHtml}
      </div>
    `;
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteInfo();
  loadCourseList();
  loadCourseDetail();
  initCheckout();
  loadOrderPage();
});
