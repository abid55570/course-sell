function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderTemplate(template, data, { escape = true } = {}) {
  if (!template) return '';
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return '';
    const v = data[key] ?? '';
    return escape ? escapeHtml(v) : String(v);
  });
}

// The store sells 84 digital products and zero courses, so this no longer
// calls everything a course or signs off with "Happy learning". The wording
// works for a PDF, a template pack or a font without changing again.
const DEFAULT_COMPLETED_TEMPLATE = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0b1020">
  <h2 style="color:#0b1020;font-size:20px;margin:0 0 16px">Payment received</h2>
  <p style="margin:0 0 12px">Hi {{buyer_name}},</p>
  <p style="margin:0 0 16px">Your payment for <strong>{{product_title}}</strong> went through. Here is your download:</p>
  {{resources_block}}
  <p style="margin:16px 0 4px;color:#5a6480;font-size:13px">Order {{order_id}}</p>
  <p style="margin:0 0 16px;color:#5a6480;font-size:13px">Keep this email. The link stays valid, so you can download again from here.</p>
  <p style="margin:0">Something wrong with the file or the link? Reply to this email and we will fix it.</p>
</div>
`;

function buildResourcesBlock(course, order, opts) {
  const items = [];
  if (opts.includeDrive && course.drive_link) {
    items.push(`<li><strong>Google Drive:</strong> <a href="${escapeHtml(course.drive_link)}">${escapeHtml(course.drive_link)}</a></li>`);
  }
  if (opts.includePdf && course.pdf_file) {
    const base = (process.env.SITE_URL || '').replace(/\/$/, '');
    items.push(`<li><strong>PDF download:</strong> <a href="${base}/api/orders/${escapeHtml(order.order_id)}/pdf">Download PDF</a></li>`);
  }
  if (!items.length) {
    // A paying buyer reaching this has been charged and given nothing. Say so
    // plainly, promise a resolution, and do not make them work out what
    // "no additional resources are attached" is supposed to mean.
    return (
      '<p style="margin:0;padding:12px 14px;background:#fdecea;border-left:3px solid #c42b22;color:#0b1020">' +
      '<strong>Your download is not ready yet.</strong><br>' +
      'Your payment went through and your order is recorded. Reply to this email and we will send the file straight to you.' +
      '</p>'
    );
  }
  return `<ul style="line-height:1.8">${items.join('')}</ul>`;
}

function renderCompletedEmail({ course, order, includePdf, includeDrive, customTemplate }) {
  const template = customTemplate && customTemplate.trim().length > 0
    ? customTemplate
    : DEFAULT_COMPLETED_TEMPLATE;
  const resources = buildResourcesBlock(course, order, { includePdf, includeDrive });
  const SENTINEL = 'RESOURCES_BLOCK';
  const withSentinel = String(template).replace(/\{\{\s*resources_block\s*\}\}/g, SENTINEL);
  const textData = {
    buyer_name: order.buyer_name,
    buyer_email: order.buyer_email,
    product_title: course.title,
    // Retained so any custom template written against the old name keeps working.
    course_title: course.title,
    course_slug: course.slug,
    order_id: order.order_id,
    amount: order.amount,
    drive_link: includeDrive ? (course.drive_link || '') : '',
    pdf_url: includePdf && course.pdf_file
      ? `${(process.env.SITE_URL || '').replace(/\/$/, '')}/api/orders/${order.order_id}/pdf`
      : '',
  };
  const escaped = renderTemplate(withSentinel, textData, { escape: true });
  return escaped.split(SENTINEL).join(resources);
}

module.exports = {
  renderTemplate,
  renderCompletedEmail,
  buildResourcesBlock,
  DEFAULT_COMPLETED_TEMPLATE,
  escapeHtml,
};
