const api = {
  async req(method, url, body, isForm) {
    const opts = { method, credentials: 'include' };
    if (body) {
      if (isForm) opts.body = body;
      else {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(url, opts);
    if (res.status === 401) { location.href = '/admin'; return; }
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw new Error((data && data.error) || `Failed (${res.status})`);
    return data;
  },
  get: (url) => api.req('GET', url),
  post: (url, body) => api.req('POST', url, body),
  put: (url, body) => api.req('PUT', url, body),
  del: (url) => api.req('DELETE', url),
  postForm: (url, fd) => api.req('POST', url, fd, true),
  putForm: (url, fd) => api.req('PUT', url, fd, true),
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtPrice(n) { return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(s) { return s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleString() : ''; }
function pct(orig, disc) {
  const o = Number(orig) || 0, d = Number(disc) || 0;
  if (o > 0 && d < o) return Math.round(((o - d) / o) * 100);
  return 0;
}

const TABS = ['overview', 'courses', 'orders', 'transactions'];
const TAB_TITLES = { overview: 'Overview', courses: 'Courses', orders: 'Orders', transactions: 'Transactions' };

function activateTab(name) {
  TABS.forEach((t) => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== name);
    const a = document.querySelector(`.admin-nav a[data-tab="${t}"]`);
    if (a) a.classList.toggle('active', t === name);
  });
  document.getElementById('tabTitle').textContent = TAB_TITLES[name];
  if (name === 'overview') loadStats();
  if (name === 'courses') loadCourses();
  if (name === 'orders') loadOrders();
  if (name === 'transactions') loadTransactions();
}

async function loadStats() {
  try {
    const s = await api.get('/api/admin/stats');
    document.getElementById('stats').innerHTML = `
      <div class="stat"><div class="label">Courses</div><div class="value">${s.courses}</div></div>
      <div class="stat"><div class="label">Orders</div><div class="value">${s.orders}</div></div>
      <div class="stat"><div class="label">Pending</div><div class="value">${s.pending_orders}</div></div>
      <div class="stat"><div class="label">Submitted</div><div class="value">${s.submitted_orders ?? 0}</div></div>
      <div class="stat"><div class="label">Completed</div><div class="value">${s.completed_orders}</div></div>
      <div class="stat"><div class="label">Revenue</div><div class="value">₹${fmtPrice(s.revenue)}</div></div>
    `;
  } catch (e) {
    document.getElementById('stats').innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadCourses() {
  const root = document.getElementById('coursesTable');
  try {
    const rows = await api.get('/api/admin/courses');
    if (!rows.length) {
      root.innerHTML = `<div class="alert">No courses yet. Create one to get started.</div>`;
      return;
    }
    root.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Title</th><th>Price</th><th>Discount</th><th>Status</th><th>Resources</th><th></th>
        </tr></thead>
        <tbody>
          ${rows.map((c) => {
            const off = pct(c.original_price, c.discounted_price);
            return `
              <tr>
                <td>
                  <div><strong>${escapeHtml(c.title)}</strong></div>
                  <div class="text-muted" style="font-size:12px">/${escapeHtml(c.slug)}</div>
                </td>
                <td>
                  <div>₹${fmtPrice(c.discounted_price)}</div>
                  <div class="text-muted" style="text-decoration:line-through;font-size:12px">₹${fmtPrice(c.original_price)}</div>
                </td>
                <td>${off}%</td>
                <td>${c.is_published ? '<span class="badge completed">Published</span>' : '<span class="badge cancelled">Draft</span>'}</td>
                <td>
                  ${c.pdf_file ? '<span class="tag">PDF</span> ' : ''}
                  ${c.drive_link ? '<span class="tag">Drive</span>' : ''}
                </td>
                <td>
                  <button class="btn btn-sm" data-edit="${c.id}">Edit</button>
                  <button class="btn btn-sm btn-danger" data-del="${c.id}">Delete</button>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
    root.querySelectorAll('button[data-edit]').forEach((b) =>
      b.addEventListener('click', () => openCourseModal(b.dataset.edit))
    );
    root.querySelectorAll('button[data-del]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm('Delete this course? This cannot be undone.')) return;
        try { await api.del(`/api/admin/courses/${b.dataset.del}`); loadCourses(); }
        catch (e) { alert(e.message); }
      })
    );
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

function openCourseModal(id) {
  const root = document.getElementById('modalRoot');
  const isEdit = !!id;
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <h3>${isEdit ? 'Edit course' : 'New course'}</h3>
        <form id="courseForm" class="form" enctype="multipart/form-data">
          <div class="row-2">
            <div>
              <label>Title</label>
              <input name="title" required>
            </div>
            <div>
              <label>Category</label>
              <input name="category" placeholder="e.g. Programming">
            </div>
          </div>
          <div>
            <label>Short description</label>
            <input name="short_description">
          </div>
          <div>
            <label>Full description</label>
            <textarea name="description"></textarea>
          </div>
          <div class="row-2">
            <div>
              <label>Level</label>
              <input name="level" placeholder="e.g. Beginner">
            </div>
            <div>
              <label>Duration</label>
              <input name="duration" placeholder="e.g. 12 hours">
            </div>
          </div>
          <div class="row-2">
            <div>
              <label>Original price (₹)</label>
              <input name="original_price" type="number" min="0" step="1" required>
            </div>
            <div>
              <label>Discounted price (₹)</label>
              <input name="discounted_price" type="number" min="0" step="1" required>
            </div>
          </div>
          <div id="discountPreview" class="text-muted" style="font-size:13px"></div>
          <div>
            <label>Google Drive link</label>
            <input name="drive_link" placeholder="https://drive.google.com/...">
          </div>
          <div class="row-2">
            <div>
              <label>Thumbnail (image)</label>
              <input name="thumbnail" type="file" accept="image/*">
            </div>
            <div>
              <label>PDF file</label>
              <input name="pdf" type="file" accept="application/pdf">
            </div>
          </div>
          <div>
            <label>
              <input type="checkbox" name="is_published" checked> Published (visible to learners)
            </label>
          </div>

          <hr style="border-color:var(--border);margin:8px 0">
          <h4 style="margin:0">Confirmation email</h4>
          <p class="text-muted" style="margin:0;font-size:13px">Choose what gets sent to the buyer when their payment is approved.</p>
          <div>
            <label>
              <input type="checkbox" name="send_pdf_in_email" checked> Include PDF download link
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" name="send_drive_in_email" checked> Include Google Drive link
            </label>
          </div>
          <div>
            <label>Custom email template (optional, HTML)</label>
            <textarea name="email_template_html" placeholder="Leave blank for the default template. Placeholders: {{buyer_name}}, {{course_title}}, {{order_id}}, {{drive_link}}, {{pdf_url}}, {{amount}}, {{resources_block}}" style="min-height:140px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px"></textarea>
          </div>
          <div id="modalAlert"></div>
          <div class="modal-actions">
            <button type="button" class="btn" id="closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save changes' : 'Create course'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const close = () => (root.innerHTML = '');
  document.getElementById('closeModal').addEventListener('click', close);
  root.firstElementChild.addEventListener('click', (e) => { if (e.target === root.firstElementChild) close(); });

  const form = document.getElementById('courseForm');
  const orig = form.original_price;
  const disc = form.discounted_price;
  const preview = document.getElementById('discountPreview');
  const updatePreview = () => {
    const p = pct(orig.value, disc.value);
    preview.textContent = p > 0 ? `Discount: ${p}% off` : 'No discount applied';
  };
  orig.addEventListener('input', updatePreview);
  disc.addEventListener('input', updatePreview);

  if (isEdit) {
    api.get(`/api/admin/courses/${id}`).then((c) => {
      form.title.value = c.title || '';
      form.category.value = c.category || '';
      form.short_description.value = c.short_description || '';
      form.description.value = c.description || '';
      form.level.value = c.level || '';
      form.duration.value = c.duration || '';
      form.original_price.value = c.original_price || 0;
      form.discounted_price.value = c.discounted_price || 0;
      form.drive_link.value = c.drive_link || '';
      form.is_published.checked = !!c.is_published;
      form.send_pdf_in_email.checked = c.send_pdf_in_email !== 0;
      form.send_drive_in_email.checked = c.send_drive_in_email !== 0;
      form.email_template_html.value = c.email_template_html || '';
      updatePreview();
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    fd.set('is_published', form.is_published.checked ? 'true' : 'false');
    fd.set('send_pdf_in_email', form.send_pdf_in_email.checked ? 'true' : 'false');
    fd.set('send_drive_in_email', form.send_drive_in_email.checked ? 'true' : 'false');
    if (fd.get('thumbnail') && fd.get('thumbnail').size === 0) fd.delete('thumbnail');
    if (fd.get('pdf') && fd.get('pdf').size === 0) fd.delete('pdf');
    const alertEl = document.getElementById('modalAlert');
    alertEl.className = ''; alertEl.textContent = '';
    try {
      if (isEdit) await api.putForm(`/api/admin/courses/${id}`, fd);
      else await api.postForm('/api/admin/courses', fd);
      close();
      loadCourses();
      loadStats();
    } catch (e) {
      alertEl.className = 'alert error';
      alertEl.textContent = e.message;
    }
  });
}

async function loadOrders() {
  const root = document.getElementById('ordersTable');
  try {
    const rows = await api.get('/api/admin/orders');
    if (!rows.length) { root.innerHTML = `<div class="alert">No orders yet.</div>`; return; }
    root.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Order</th><th>Course</th><th>Buyer</th><th>Amount</th><th>UPI Ref</th><th>Status</th><th>When</th><th></th>
        </tr></thead>
        <tbody>
          ${rows.map((o) => `
            <tr>
              <td><code>${escapeHtml(o.order_id)}</code></td>
              <td>${escapeHtml(o.course_title)}</td>
              <td>
                <div>${escapeHtml(o.buyer_name)}</div>
                <div class="text-muted" style="font-size:12px">${escapeHtml(o.buyer_email)}</div>
              </td>
              <td>₹${fmtPrice(o.amount)}</td>
              <td><code>${escapeHtml(o.upi_txn_ref || '-')}</code></td>
              <td><span class="badge ${o.status}">${o.status}</span></td>
              <td class="text-muted" style="font-size:12px">${fmtDate(o.created_at)}</td>
              <td>
                ${o.status !== 'completed' ? `<button class="btn btn-sm btn-success" data-confirm="${o.order_id}">Confirm</button>` : ''}
                ${o.status !== 'cancelled' && o.status !== 'completed' ? `<button class="btn btn-sm btn-danger" data-cancel="${o.order_id}">Cancel</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    root.querySelectorAll('button[data-confirm]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm('Confirm payment? This sends the customer their course access email.')) return;
        try { await api.post(`/api/admin/orders/${b.dataset.confirm}/confirm`, {}); loadOrders(); loadStats(); }
        catch (e) { alert(e.message); }
      })
    );
    root.querySelectorAll('button[data-cancel]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm('Cancel this order?')) return;
        try { await api.post(`/api/admin/orders/${b.dataset.cancel}/cancel`, {}); loadOrders(); loadStats(); }
        catch (e) { alert(e.message); }
      })
    );
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadTransactions() {
  const root = document.getElementById('transactionsTable');
  try {
    const rows = await api.get('/api/admin/transactions');
    if (!rows.length) { root.innerHTML = `<div class="alert">No transactions yet.</div>`; return; }
    root.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>When</th><th>Order</th><th>Event</th><th>Actor</th><th>Amount</th><th>UPI Ref</th><th>Detail</th>
        </tr></thead>
        <tbody>
          ${rows.map((t) => `
            <tr>
              <td class="text-muted" style="font-size:12px">${fmtDate(t.created_at)}</td>
              <td><code>${escapeHtml(t.order_id)}</code></td>
              <td><span class="badge ${t.event === 'completed' ? 'completed' : t.event === 'cancelled' ? 'cancelled' : 'submitted'}">${escapeHtml(t.event)}</span></td>
              <td>${escapeHtml(t.actor || '-')}</td>
              <td>${t.amount != null ? '₹' + fmtPrice(t.amount) : '-'}</td>
              <td><code>${escapeHtml(t.upi_txn_ref || '-')}</code></td>
              <td class="text-muted" style="font-size:12px">${escapeHtml(t.detail || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

async function init() {
  try {
    const me = await api.get('/api/auth/me');
    if (!me) return;
    document.getElementById('adminEmail').textContent = me.admin?.email || '';
  } catch (e) {
    location.href = '/admin';
    return;
  }
  document.querySelectorAll('.admin-nav a[data-tab]').forEach((a) => {
    a.addEventListener('click', () => activateTab(a.dataset.tab));
  });
  document.querySelectorAll('[data-tab-link]').forEach((el) => {
    el.addEventListener('click', () => activateTab(el.dataset.tabLink));
  });
  document.getElementById('addCourseBtn')?.addEventListener('click', () => openCourseModal(null));
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await api.post('/api/auth/logout', {}); location.href = '/admin';
  });
  activateTab('overview');
}

document.addEventListener('DOMContentLoaded', init);
