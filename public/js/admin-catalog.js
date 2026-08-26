/* ---------------------------------------------------------------------------
 * Catalogue: what the storefront actually sells.
 *
 * Reads catalog_products through /api/admin/catalog. The Courses and Products
 * tabs drive the legacy `courses` table, which the storefront stopped reading
 * when the catalogue moved into its own table — editing a product there
 * changes nothing a buyer sees, which is why those tabs are marked legacy.
 *
 * Saving here revalidates the storefront, so an edit appears on the site
 * within a few seconds instead of waiting out the cache.
 *
 * Loaded before admin.js, which owns `api`, `escapeHtml` and `fmtPrice`.
 * ------------------------------------------------------------------------- */

let CATALOG_ROWS = [];

async function loadCatalog() {
  const root = document.getElementById('catalogTable');
  if (!root) return;
  root.innerHTML = '<div class="alert">Loading&hellip;</div>';
  try {
    CATALOG_ROWS = await api.get('/api/admin/catalog');
    renderCatalog();
  } catch (e) {
    root.innerHTML = '<div class="alert error">' + escapeHtml(e.message) + '</div>';
  }
}

function renderCatalog() {
  const root = document.getElementById('catalogTable');
  if (!root) return;
  const q = (document.getElementById('catalogFilter')?.value || '').trim().toLowerCase();
  const rows = q
    ? CATALOG_ROWS.filter((r) => (r.title + ' ' + r.slug).toLowerCase().includes(q))
    : CATALOG_ROWS;

  if (!rows.length) {
    root.innerHTML = q
      ? '<div class="alert">Nothing matches that filter.</div>'
      : '<div class="alert">The catalogue is empty. Run: npm --prefix api run migrate:catalog</div>';
    return;
  }

  const deliveryCell = (r) => {
    const file = r.pdf_file && r.send_pdf_in_email;
    const drive = r.drive_link && r.send_drive_in_email;
    if (!file && !drive) return '<span class="badge cancelled">None</span>';
    return (file ? '<span class="tag">File</span> ' : '') + (drive ? '<span class="tag">Drive</span>' : '');
  };

  const statusCell = (r) => {
    let out = r.is_published
      ? '<span class="badge completed">Live</span>'
      : '<span class="badge cancelled">Hidden</span>';
    if (r.kind === 'bundle' && !r.available_today) out += ' <span class="badge cancelled">Coming soon</span>';
    if (r.featured) out += ' <span class="tag">Featured</span>';
    return out;
  };

  root.innerHTML =
    '<p class="text-muted" style="margin:0 0 12px;font-size:12px">Showing ' +
    rows.length + ' of ' + CATALOG_ROWS.length + '</p>' +
    '<table class="table"><thead><tr>' +
    '<th>Title</th><th>Price</th><th>Kind</th><th>Category</th><th>Status</th><th>Delivery</th><th></th>' +
    '</tr></thead><tbody>' +
    rows.map((r) =>
      '<tr>' +
      '<td><div><strong>' + escapeHtml(r.title) + '</strong></div>' +
      '<div class="text-muted" style="font-size:12px">/p/' + escapeHtml(r.slug) + '</div></td>' +
      '<td>&#8377;' + fmtPrice(r.price) + '</td>' +
      '<td>' + (r.kind === 'bundle' ? '<span class="tag">Bundle</span>' : 'Product') + '</td>' +
      '<td class="text-muted" style="font-size:12px">' + escapeHtml(r.category_label || '—') + '</td>' +
      '<td>' + statusCell(r) + '</td>' +
      '<td>' + deliveryCell(r) + '</td>' +
      '<td><button class="btn btn-sm" data-edit-cat="' + r.id + '">Edit</button></td>' +
      '</tr>'
    ).join('') +
    '</tbody></table>';

  root.querySelectorAll('button[data-edit-cat]').forEach((b) =>
    b.addEventListener('click', () => openCatalogModal(b.dataset.editCat))
  );
}

function catField(label, name, value, type, hint) {
  return '<label class="field"><span>' + label + '</span>' +
    '<input class="input" name="' + name + '" type="' + (type || 'text') +
    '" value="' + escapeHtml(value == null ? '' : value) + '" />' +
    (hint ? '<span class="text-muted" style="font-size:11px">' + hint + '</span>' : '') +
    '</label>';
}

function catCheck(label, name, on, hint) {
  return '<label class="field" style="flex-direction:row;align-items:center;gap:8px">' +
    '<input type="checkbox" name="' + name + '" ' + (on ? 'checked' : '') + ' />' +
    '<span>' + label + '</span>' +
    (hint ? '<span class="text-muted" style="font-size:11px">' + hint + '</span>' : '') +
    '</label>';
}

const CAT_HR = '<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:18px 0" />';

function openCatalogModal(id) {
  const row = CATALOG_ROWS.find((r) => String(r.id) === String(id));
  if (!row) return;
  const root = document.getElementById('modalRoot');

  root.innerHTML =
    '<div class="modal-backdrop"><div class="modal" style="max-width:760px">' +
    '<h3 style="margin-top:0">' + escapeHtml(row.title) + '</h3>' +
    '<p class="text-muted" style="margin:0 0 4px;font-size:12px">/p/' + escapeHtml(row.slug) +
    ' &middot; the slug cannot be changed here: existing orders are keyed to it.</p>' +
    '<form id="catalogForm" style="margin-top:16px">' +
      '<div class="grid-2">' +
        catField('Title', 'title', row.title) +
        catField('Short title', 'short_title', row.short_title, 'text', 'Optional, for tight spaces') +
      '</div>' +
      '<label class="field"><span>Tagline</span>' +
      '<textarea class="input" name="tagline" rows="3">' + escapeHtml(row.tagline || '') + '</textarea></label>' +
      '<div class="grid-2">' +
        catField('Price (&#8377;)', 'price', row.price, 'number') +
        catField('Anchor price (&#8377;)', 'anchor_price', row.anchor_price, 'number', 'The crossed-out "worth" price. Blank for none.') +
      '</div>' +
      '<div class="grid-2">' +
        catField('Category slug', 'category_slug', row.category_slug) +
        catField('Category label', 'category_label', row.category_label) +
      '</div>' +
      '<div class="grid-2">' +
        catField('Accent name', 'accent_name', row.accent_name) +
        catField('Accent hex', 'accent_hex', row.accent_hex, 'text', 'e.g. #2f9e44') +
      '</div>' +
      catField('Tags', 'tags', (row.tags || []).join(', '), 'text', 'Comma separated. Used by search.') +
      '<div class="grid-2">' +
        catField('Pairs with (slug)', 'pair_slug', row.pair_slug, 'text', 'Cross-sell partner') +
        catField('Part of set (slug)', 'set_slug', row.set_slug) +
      '</div>' +

      CAT_HR +
      '<p class="text-muted" style="margin:0 0 10px;font-size:12px">Delivery &mdash; what the buyer receives after paying.</p>' +
      '<div class="grid-2">' +
        catField('File path', 'pdf_file', row.pdf_file, 'text', 'e.g. /uploads/pdfs/glow-up-os.zip') +
        catField('Drive link', 'drive_link', row.drive_link) +
      '</div>' +
      '<div class="grid-2">' +
        catCheck('Send the file', 'send_pdf_in_email', row.send_pdf_in_email, 'Needs a file path') +
        catCheck('Send the Drive link', 'send_drive_in_email', row.send_drive_in_email, 'Needs a link') +
      '</div>' +

      CAT_HR +
      '<div class="grid-2">' +
        catCheck('Live on the site', 'is_published', row.is_published) +
        catCheck('Featured on the homepage', 'featured', row.featured) +
      '</div>' +
      (row.kind === 'bundle'
        ? catCheck('Available to buy today', 'available_today', row.available_today,
                   'Unticked shows "coming soon" and blocks checkout')
        : '') +

      CAT_HR +
      '<label class="field"><span>Page content (JSON)</span>' +
      '<textarea class="input" name="content" rows="12" spellcheck="false" ' +
      'style="font-family:monospace;font-size:12px">' +
      escapeHtml(JSON.stringify(row.content || {}, null, 2)) + '</textarea>' +
      '<span class="text-muted" style="font-size:11px">Modules, sections, FAQs, bullet points, gallery and disclaimer. ' +
      'Must stay valid JSON &mdash; it is checked before saving.</span></label>' +

      '<div id="catalogError" class="alert error hidden" style="margin-top:12px"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">' +
        '<button type="button" class="btn" id="closeModal">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save changes</button>' +
      '</div>' +
    '</form></div></div>';

  const close = () => { root.innerHTML = ''; };
  document.getElementById('closeModal').addEventListener('click', close);
  root.firstElementChild.addEventListener('click', (e) => {
    if (e.target === root.firstElementChild) close();
  });

  document.getElementById('catalogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('catalogError');
    const fd = new FormData(e.target);
    const val = (k) => String(fd.get(k) == null ? '' : fd.get(k)).trim();
    const on = (k) => fd.get(k) === 'on';

    // Parsed here rather than left to the server, so a typo costs no round
    // trip and never looks like a save that silently did nothing.
    let content;
    try {
      content = JSON.parse(val('content') || '{}');
    } catch (parseError) {
      err.textContent = 'Page content is not valid JSON: ' + parseError.message;
      err.classList.remove('hidden');
      return;
    }

    const body = {
      title: val('title'),
      short_title: val('short_title'),
      tagline: val('tagline'),
      price: Number(val('price')),
      anchor_price: val('anchor_price'),
      category_slug: val('category_slug'),
      category_label: val('category_label'),
      accent_name: val('accent_name'),
      accent_hex: val('accent_hex'),
      tags: val('tags') ? val('tags').split(',').map((t) => t.trim()).filter(Boolean) : [],
      pair_slug: val('pair_slug'),
      set_slug: val('set_slug'),
      pdf_file: val('pdf_file'),
      drive_link: val('drive_link'),
      send_pdf_in_email: on('send_pdf_in_email'),
      send_drive_in_email: on('send_drive_in_email'),
      is_published: on('is_published'),
      featured: on('featured'),
      content,
    };
    if (row.kind === 'bundle') body.available_today = on('available_today');

    try {
      await api.put('/api/admin/catalog/' + row.id, body);
      close();
      await loadCatalog();
    } catch (saveError) {
      err.textContent = saveError.message;
      err.classList.remove('hidden');
    }
  });
}
