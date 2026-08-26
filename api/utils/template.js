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

/**
 * The delivery email, styled to match the storefront.
 *
 * Brand values are copied from web/app/globals.css rather than invented:
 * vermilion #C42B22, ink #0B1020, ink-soft #5A6480, canvas-2 #F6F8FC.
 *
 * Two constraints shape the markup:
 *
 * 1. Tables, not flexbox. Outlook renders the desktop versions through Word,
 *    which supports neither flex nor grid, and every value is inlined because
 *    Gmail strips <style> blocks from the head.
 * 2. No webfonts. The site sets headings in Big Shoulders and body in
 *    Instrument Sans, and Gmail loads neither — it drops @font-face and
 *    remote font links. So the stacks below reach for the nearest widely
 *    installed shapes instead: a condensed face for the heading, and the
 *    system UI sans for body text. The storefront's other signatures survive
 *    without fonts — the vermilion rule, the mono uppercase labels with wide
 *    tracking, and the dotted leader lines are all plain CSS that email
 *    clients do render.
 *
 * The wording works for a PDF, a template pack or a ZIP without changing.
 */
const FONT_BODY = "'Instrument Sans','Segoe UI',Helvetica,Arial,sans-serif";
const FONT_DISPLAY = "'Big Shoulders Display','Arial Narrow',Impact,Haettenschweiler,'Segoe UI',Arial,sans-serif";
const FONT_MONO = "'Geist Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

const DEFAULT_COMPLETED_TEMPLATE = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F6F8FC;margin:0;padding:24px 12px">
 <tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid rgba(11,16,32,0.12)">

   <!-- vermilion rule, the storefront's primary -->
   <tr><td style="height:6px;background:#C42B22;line-height:6px;font-size:0">&nbsp;</td></tr>

   <tr><td style="padding:32px 32px 0">
     <div style="font-family:${FONT_MONO};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#5A6480">
       Dropdesk &middot; Order confirmed
     </div>
     <h1 style="font-family:${FONT_DISPLAY};font-size:34px;line-height:1.05;font-weight:700;color:#0B1020;margin:12px 0 0;letter-spacing:-0.01em">
       Payment received
     </h1>
   </td></tr>

   <tr><td style="padding:20px 32px 0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:#0B1020">
     <p style="margin:0 0 12px">Hi {{buyer_name}},</p>
     <p style="margin:0 0 4px">Your payment for <strong style="color:#0B1020">{{product_title}}</strong> went through. Here is your download:</p>
   </td></tr>

   <tr><td style="padding:16px 32px 0">{{resources_block}}</td></tr>

   <!-- dotted leader, matching the rules used across the site -->
   <tr><td style="padding:24px 32px 0">
     <div style="border-bottom:1px dotted rgba(11,16,32,0.25);font-size:0;line-height:0">&nbsp;</div>
   </td></tr>

   <tr><td style="padding:16px 32px 0;font-family:${FONT_MONO};font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5A6480">
     Order {{order_id}}
   </td></tr>

   <tr><td style="padding:8px 32px 28px;font-family:${FONT_BODY};font-size:14px;line-height:1.6;color:#5A6480">
     <p style="margin:0 0 10px">Keep this email. The link stays valid, so you can download again from here.</p>
     <p style="margin:0;color:#0B1020">Something wrong with the file or the link? Reply to this email and we will fix it.</p>
   </td></tr>

   <!-- ink footer, the site's own footer colour -->
   <tr><td style="background:#0B1020;padding:18px 32px">
     <div style="font-family:${FONT_DISPLAY};font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:0.02em">Dropdesk</div>
     <div style="font-family:${FONT_MONO};font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.6);padding-top:4px">
       Digital products &middot; Instant download
     </div>
   </td></tr>

  </table>
 </td></tr>
</table>
`;

/**
 * The download block, styled to match DEFAULT_COMPLETED_TEMPLATE.
 *
 * A real download renders as a vermilion button — the storefront's own primary
 * — with a plain text link beneath it, because some clients strip background
 * colours and a button that loses its fill must still read as a link.
 */
function buildResourcesBlock(course, order, opts) {
  const items = [];

  if (opts.includeDrive && course.drive_link) {
    items.push({ label: 'Google Drive', href: escapeHtml(course.drive_link), cta: 'Open your Drive folder' });
  }
  if (opts.includePdf && course.pdf_file) {
    const base = (process.env.SITE_URL || '').replace(/\/$/, '');
    items.push({
      label: 'Download',
      href: `${base}/api/orders/${escapeHtml(order.order_id)}/pdf`,
      cta: 'Download your files',
    });
  }

  if (!items.length) {
    // A paying buyer reaching this has been charged and given nothing. Say so
    // plainly, promise a resolution, and do not make them work out what
    // "no additional resources are attached" is supposed to mean.
    return (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">` +
      `<tr><td style="background:#FDECEA;border-left:3px solid #C42B22;padding:14px 16px;` +
      `font-family:${FONT_BODY};font-size:14px;line-height:1.6;color:#0B1020">` +
      '<strong>Your download is not ready yet.</strong><br>' +
      'Your payment went through and your order is recorded. Reply to this email and we will send the file straight to you.' +
      '</td></tr></table>'
    );
  }

  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding-bottom:14px">` +
        `<div style="font-family:${FONT_MONO};font-size:10px;font-weight:600;text-transform:uppercase;` +
        `letter-spacing:0.12em;color:#5A6480;padding-bottom:8px">${item.label}</div>` +
        `<a href="${item.href}" style="display:inline-block;background:#C42B22;color:#FFFFFF;` +
        `font-family:${FONT_BODY};font-size:15px;font-weight:600;text-decoration:none;` +
        `padding:13px 26px">${item.cta}</a>` +
        // Repeated as a plain link: a client that drops the background would
        // otherwise leave white text on white.
        `<div style="font-family:${FONT_BODY};font-size:12px;color:#5A6480;padding-top:8px">` +
        `or paste this into your browser: <a href="${item.href}" style="color:#C42B22">${item.href}</a></div>` +
        `</td></tr>`
    )
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`;
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
