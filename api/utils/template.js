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

const DEFAULT_COMPLETED_TEMPLATE = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
  <h2 style="color:#16a34a">Payment confirmed - your course is ready</h2>
  <p>Hi {{buyer_name}},</p>
  <p>Your payment for <strong>{{course_title}}</strong> has been confirmed. Below is your access:</p>
  {{resources_block}}
  <p>Order ID: <strong>{{order_id}}</strong></p>
  <p>Need help? Reply to this email.</p>
  <p>Happy learning!</p>
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
    return '<p style="color:#6b7280">No additional resources are attached. Reply to this email if you expected a download link.</p>';
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
