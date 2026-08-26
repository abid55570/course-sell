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

const TABS = ['overview', 'catalog', 'courses', 'products', 'templates', 'orders', 'transactions'];
const TAB_TITLES = { overview: 'Overview', catalog: 'Catalogue', courses: 'Courses (legacy)', products: 'Products', templates: 'Video Templates', orders: 'Orders', transactions: 'Transactions' };

function activateTab(name) {
  TABS.forEach((t) => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== name);
    const a = document.querySelector(`.admin-nav a[data-tab="${t}"]`);
    if (a) a.classList.toggle('active', t === name);
  });
  document.getElementById('tabTitle').textContent = TAB_TITLES[name];
  if (name === 'overview') loadStats();
  if (name === 'catalog') loadCatalog();
  if (name === 'courses') loadCourses();
  if (name === 'products') loadProducts();
  if (name === 'templates') loadVideoTemplates();
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

// Courses and products share the same table via `kind`.
async function loadStoreAdmin(kind, rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;
  const noun = kind === 'product' ? 'product' : 'course';
  try {
    const rows = await api.get(`/api/admin/courses?kind=${kind}`);
    if (!rows.length) {
      root.innerHTML = `<div class="alert">No ${noun}s yet. Create one to get started.</div>`;
      return;
    }
    root.innerHTML = `
      <table class="table">
        <thead><tr><th>Title</th><th>Price</th><th>Discount</th><th>Status</th><th>Resources</th><th></th></tr></thead>
        <tbody>
          ${rows.map((c) => {
            const off = pct(c.original_price, c.discounted_price);
            return `
              <tr>
                <td><div><strong>${escapeHtml(c.title)}</strong></div><div class="text-muted" style="font-size:12px">/${escapeHtml(c.slug)}</div></td>
                <td><div>₹${fmtPrice(c.discounted_price)}</div><div class="text-muted" style="text-decoration:line-through;font-size:12px">₹${fmtPrice(c.original_price)}</div></td>
                <td>${off}%</td>
                <td>${c.is_published ? '<span class="badge completed">Published</span>' : '<span class="badge cancelled">Draft</span>'}</td>
                <td>${c.pdf_file ? '<span class="tag">PDF</span> ' : ''}${c.drive_link ? '<span class="tag">Drive</span>' : ''}</td>
                <td><button class="btn btn-sm" data-edit="${c.id}">Edit</button> <button class="btn btn-sm btn-danger" data-del="${c.id}">Delete</button></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    root.querySelectorAll('button[data-edit]').forEach((b) =>
      b.addEventListener('click', () => openCourseModal(b.dataset.edit, kind))
    );
    root.querySelectorAll('button[data-del]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm(`Delete this ${noun}? This cannot be undone.`)) return;
        try { await api.del(`/api/admin/courses/${b.dataset.del}`); loadStoreAdmin(kind, rootId); loadStats(); }
        catch (e) { alert(e.message); }
      })
    );
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}
function loadCourses() { return loadStoreAdmin('course', 'coursesTable'); }
function loadProducts() { return loadStoreAdmin('product', 'productsTable'); }

function openCourseModal(id, kind) {
  const root = document.getElementById('modalRoot');
  const isEdit = !!id;
  const noun = kind === 'product' ? 'product' : 'course';
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <h3>${isEdit ? 'Edit' : 'New'} ${noun}</h3>
        <form id="courseForm" class="form" enctype="multipart/form-data">
          <div class="row-2">
            <div>
              <label>Type</label>
              <select name="kind"><option value="course">Course</option><option value="product">Product</option></select>
            </div>
            <div>
              <label>Category</label>
              <input name="category" placeholder="e.g. Programming">
            </div>
          </div>
          <div>
            <label>Title</label>
            <input name="title" required>
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
  form.kind.value = kind === 'product' ? 'product' : 'course';
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
      form.kind.value = c.kind || 'course';
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
      loadProducts();
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
          <th>Order</th><th>Product</th><th>Buyer</th><th>Amount</th><th>Payment ID</th><th>Status</th><th>When</th><th></th>
        </tr></thead>
        <tbody>
          ${rows.map((o) => {
            const isVideo = o.product_type === 'video';
            const title = o.course_title || o.template_name || '-';
            const typeTag = isVideo
              ? `<span class="tag">Video${o.render_status ? ` · ${escapeHtml(o.render_status)}` : ''}</span>`
              : '<span class="tag">Course</span>';
            return `
            <tr>
              <td><code>${escapeHtml(o.order_id)}</code></td>
              <td>${escapeHtml(title)}<div style="margin-top:3px">${typeTag}</div></td>
              <td>
                <div>${escapeHtml(o.buyer_name)}</div>
                <div class="text-muted" style="font-size:12px">${escapeHtml(o.buyer_email)}</div>
              </td>
              <td>₹${fmtPrice(o.amount)}</td>
              <td><code style="font-size:11px">${escapeHtml(o.razorpay_payment_id || '-')}</code></td>
              <td><span class="badge ${o.status}">${o.status}</span></td>
              <td class="text-muted" style="font-size:12px">${fmtDate(o.created_at)}</td>
              <td>
                ${o.status !== 'completed' ? `<button class="btn btn-sm btn-success" data-confirm="${o.order_id}">Confirm</button>` : ''}
                ${o.status !== 'cancelled' && o.status !== 'completed' ? `<button class="btn btn-sm btn-danger" data-cancel="${o.order_id}">Cancel</button>` : ''}
              </td>
            </tr>`;
          }).join('')}
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

// ---- Video templates ----
const COMPOSITIONS = ['elegant_wedding', 'greeting', 'birthday'];
const PALETTE_NAMES = ['royal', 'pastel', 'emerald', 'midnight', 'festive'];
const DEFAULT_SCHEMAS = {
  elegant_wedding: [
    { key: 'bride_name', label: "Bride's name", type: 'text', required: true, max: 30, group: 'Couple' },
    { key: 'groom_name', label: "Groom's name", type: 'text', required: true, max: 30, group: 'Couple' },
    { key: 'wedding_date', label: 'Wedding date', type: 'date', required: true, group: 'When & where' },
    { key: 'wedding_time', label: 'Time', type: 'time', group: 'When & where' },
    { key: 'venue', label: 'Venue', type: 'textarea', max: 160, group: 'When & where' },
    { key: 'message', label: 'Invitation message', type: 'textarea', max: 160, group: 'Message' },
  ],
  greeting: [
    { key: 'greeting_from', label: 'From (your / business name)', type: 'text', required: true, max: 40 },
    { key: 'message', label: 'Greeting message', type: 'textarea', max: 160 },
  ],
  birthday: [
    { key: 'celebrant', label: 'Name', type: 'text', required: true, max: 30 },
    { key: 'age', label: 'Turning (age)', type: 'text', max: 4 },
    { key: 'party_date', label: 'Party date', type: 'date' },
    { key: 'party_time', label: 'Time', type: 'time' },
    { key: 'venue', label: 'Venue', type: 'textarea', max: 160 },
    { key: 'message', label: 'Message', type: 'textarea', max: 160 },
  ],
};
let CATEGORY_CACHE = [];

async function loadVideoTemplates() {
  const root = document.getElementById('templatesTable');
  try {
    const [rows, cats] = await Promise.all([
      api.get('/api/admin/video/templates'),
      api.get('/api/admin/video/categories'),
    ]);
    CATEGORY_CACHE = cats;
    const catName = (id) => (cats.find((c) => c.id === id) || {}).name || '-';
    if (!rows.length) {
      root.innerHTML = `<div class="alert">No templates yet. Run <code>npm run seed:video</code> or click “New template”.</div>`;
      return;
    }
    root.innerHTML = `
      <table class="table">
        <thead><tr><th>Name</th><th>Category</th><th>Style</th><th>Price</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${rows.map((t) => `
            <tr>
              <td><strong>${escapeHtml(t.name)}</strong><div class="text-muted" style="font-size:12px">/${escapeHtml(t.slug)}</div></td>
              <td>${escapeHtml(catName(t.category_id))}</td>
              <td><span class="tag">${escapeHtml(t.composition_id)}</span> <span class="tag">${escapeHtml((t.preset && t.preset.palette) || '')}</span></td>
              <td>₹${fmtPrice(t.discounted_price)} <span class="text-muted" style="text-decoration:line-through;font-size:12px">₹${fmtPrice(t.original_price)}</span></td>
              <td>${t.is_published ? '<span class="badge completed">Published</span>' : '<span class="badge cancelled">Draft</span>'}</td>
              <td>
                <button class="btn btn-sm" data-edit-tpl="${t.id}">Edit</button>
                <button class="btn btn-sm btn-danger" data-del-tpl="${t.id}">Delete</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
    root.querySelectorAll('button[data-edit-tpl]').forEach((b) =>
      b.addEventListener('click', () => openTemplateModal(b.dataset.editTpl)));
    root.querySelectorAll('button[data-del-tpl]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm('Delete this template?')) return;
        try { await api.del(`/api/admin/video/templates/${b.dataset.delTpl}`); loadVideoTemplates(); }
        catch (e) { alert(e.message); }
      }));
  } catch (e) {
    root.innerHTML = `<div class="alert error">${escapeHtml(e.message)}</div>`;
  }
}

async function addCategory() {
  const name = prompt('New category name (e.g. Anniversary):');
  if (!name) return;
  try { await api.post('/api/admin/video/categories', { name }); loadVideoTemplates(); }
  catch (e) { alert(e.message); }
}

function openTemplateModal(id) {
  const root = document.getElementById('modalRoot');
  const isEdit = !!id;
  const catOptions = CATEGORY_CACHE.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <h3>${isEdit ? 'Edit template' : 'New template'}</h3>
        <form id="tplForm" class="form" enctype="multipart/form-data">
          <div class="row-2">
            <div><label>Name</label><input name="name" required></div>
            <div><label>Category</label><select name="category_id"><option value="">— none —</option>${catOptions}</select></div>
          </div>
          <div class="row-2">
            <div><label>Composition</label><select name="composition_id">${COMPOSITIONS.map((c) => `<option value="${c}">${c}</option>`).join('')}</select></div>
            <div><label>Palette</label><select name="palette">${PALETTE_NAMES.map((p) => `<option value="${p}">${p}</option>`).join('')}</select></div>
          </div>
          <div><label>Heading line (shown above the names)</label><input name="heading" placeholder="e.g. Together with their families"></div>
          <div class="row-2">
            <div><label>Duration (seconds)</label><input name="duration_seconds" type="number" min="6" max="60" value="20"></div>
            <div><label>Thumbnail (optional)</label><input name="thumbnail" type="file" accept="image/*"></div>
          </div>
          <div><label>Price tier (from .env — VIDEO_PRICE_LOW/MID/HIGH)</label>
            <select name="price_tier">
              <option value="high">High (weddings)</option>
              <option value="mid">Mid</option>
              <option value="low">Low (greetings)</option>
              <option value="">Custom — use the prices below</option>
            </select>
          </div>
          <div class="row-2">
            <div><label>Custom original price (₹)</label><input name="original_price" type="number" min="0" value="0"></div>
            <div><label>Custom discounted price (₹)</label><input name="discounted_price" type="number" min="0" value="0"></div>
          </div>
          <p class="text-muted" style="font-size:12px;margin:0">With a tier selected, prices come from .env and the custom fields are ignored.</p>
          <div>
            <label>Fields the buyer fills (JSON)</label>
            <textarea name="fields_schema" style="min-height:160px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px"></textarea>
            <div class="text-muted" style="font-size:12px">Types: text, textarea, date, time, phone, select, color. Loaded from the composition by default.</div>
          </div>
          <div><label><input type="checkbox" name="is_published" checked> Published (visible in the generator)</label></div>
          <div id="modalAlert"></div>
          <div class="modal-actions">
            <button type="button" class="btn" id="closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save changes' : 'Create template'}</button>
          </div>
        </form>
      </div>
    </div>`;
  const close = () => (root.innerHTML = '');
  document.getElementById('closeModal').addEventListener('click', close);
  root.firstElementChild.addEventListener('click', (e) => { if (e.target === root.firstElementChild) close(); });

  const form = document.getElementById('tplForm');
  const schemaBox = form.fields_schema;
  const syncSchema = () => { schemaBox.value = JSON.stringify(DEFAULT_SCHEMAS[form.composition_id.value] || [], null, 2); };
  if (!isEdit) { syncSchema(); form.composition_id.addEventListener('change', syncSchema); }

  if (isEdit) {
    api.get('/api/admin/video/templates').then((rows) => {
      const t = rows.find((x) => String(x.id) === String(id));
      if (!t) return;
      form.name.value = t.name || '';
      form.category_id.value = t.category_id || '';
      form.composition_id.value = t.composition_id || 'greeting';
      form.palette.value = (t.preset && t.preset.palette) || 'royal';
      form.heading.value = (t.preset && t.preset.heading) || '';
      form.duration_seconds.value = t.duration_seconds || 20;
      form.price_tier.value = t.price_tier || '';
      form.original_price.value = t.original_price || 0;
      form.discounted_price.value = t.discounted_price || 0;
      form.is_published.checked = !!t.is_published;
      schemaBox.value = JSON.stringify(t.fields_schema || [], null, 2);
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const alertEl = document.getElementById('modalAlert');
    alertEl.className = ''; alertEl.textContent = '';
    let schema;
    try { schema = JSON.parse(schemaBox.value || '[]'); if (!Array.isArray(schema)) throw new Error('must be an array'); }
    catch (e) { alertEl.className = 'alert error'; alertEl.textContent = `Fields JSON is invalid: ${e.message}`; return; }
    const fd = new FormData();
    fd.set('name', form.name.value);
    if (form.category_id.value) fd.set('category_id', form.category_id.value);
    fd.set('composition_id', form.composition_id.value);
    fd.set('price_tier', form.price_tier.value);
    fd.set('preset', JSON.stringify({ palette: form.palette.value, heading: form.heading.value }));
    fd.set('duration_seconds', form.duration_seconds.value);
    fd.set('original_price', form.original_price.value);
    fd.set('discounted_price', form.discounted_price.value);
    fd.set('fields_schema', JSON.stringify(schema));
    fd.set('is_published', form.is_published.checked ? 'true' : 'false');
    if (form.thumbnail.files[0]) fd.set('thumbnail', form.thumbnail.files[0]);
    try {
      if (isEdit) await api.putForm(`/api/admin/video/templates/${id}`, fd);
      else await api.postForm('/api/admin/video/templates', fd);
      close();
      loadVideoTemplates();
    } catch (e) {
      alertEl.className = 'alert error';
      alertEl.textContent = e.message;
    }
  });
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
  document.getElementById('catalogFilter')?.addEventListener('input', renderCatalog);
  document.getElementById('addCourseBtn')?.addEventListener('click', () => openCourseModal(null, 'course'));
  document.getElementById('addProductBtn')?.addEventListener('click', () => openCourseModal(null, 'product'));
  document.getElementById('addTemplateBtn')?.addEventListener('click', () => openTemplateModal(null));
  document.getElementById('addCategoryBtn')?.addEventListener('click', addCategory);
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await api.post('/api/auth/logout', {}); location.href = '/admin';
  });
  activateTab('overview');
}

document.addEventListener('DOMContentLoaded', init);
