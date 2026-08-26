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
/** The dashed separator .receipt-rule draws between sections on the site. */
const RULE = `<tr><td style="padding:16px 28px"><div style="border-top:1px dashed rgba(11,16,32,0.28);font-size:0;line-height:0">&nbsp;</div></td></tr>`;

const FONT_MONO = "'Geist Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

const DEFAULT_COMPLETED_TEMPLATE = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F6F8FC;margin:0;padding:28px 12px">
 <tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="420" style="max-width:420px;width:100%;background:#FFFFFF;border-left:1px solid #0B1020;border-right:1px solid #0B1020">

   <!-- Perforated top edge. The site punches real semicircles with a CSS
        mask; email cannot, so the holes are drawn as characters in the page
        colour, which reads the same and renders everywhere. -->
   <tr><td style="background:#0B1020;font-family:${FONT_MONO};font-size:13px;line-height:9px;letter-spacing:3px;color:#F6F8FC;padding:3px 0;text-align:center;mso-line-height-rule:exactly">
     &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
   </td></tr>

   <tr><td style="padding:26px 28px 0;text-align:center">
     <div style="font-family:${FONT_DISPLAY};font-size:30px;font-weight:800;line-height:1;color:#0B1020;letter-spacing:0.01em">Dropdesk</div>
     <div style="font-family:${FONT_MONO};font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#5A6480;padding-top:7px">
       Digital products &middot; Instant download
     </div>
   </td></tr>

   ${RULE}

   <tr><td style="padding:0 28px;font-family:${FONT_BODY};font-size:15px;line-height:1.45;color:#0B1020">
     {{product_title}}
   </td></tr>

   ${RULE}

   <!-- The paid line, weighted like a receipt total. -->
   <tr><td style="padding:0 28px">
     <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
       <tr>
         <td style="font-family:${FONT_MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#5A6480">Paid</td>
         <td align="right" style="font-family:${FONT_DISPLAY};font-size:24px;font-weight:800;color:#0B1020;line-height:1">{{amount_display}}</td>
       </tr>
     </table>
   </td></tr>

   <tr><td style="padding:12px 28px 0">
     <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:${FONT_MONO};font-size:10px;letter-spacing:0.08em;color:#5A6480">
       <tr>
         <td style="padding-bottom:5px;text-transform:uppercase">Order</td>
         <td align="right" style="padding-bottom:5px;color:#0B1020">{{order_id}}</td>
       </tr>
       <tr>
         <td style="padding-bottom:5px;text-transform:uppercase">Buyer</td>
         <td align="right" style="padding-bottom:5px;color:#0B1020">{{buyer_name}}</td>
       </tr>
       <tr>
         <td style="padding-bottom:5px;text-transform:uppercase">Sent to</td>
         <td align="right" style="padding-bottom:5px;color:#0B1020">{{buyer_email}}</td>
       </tr>
       <tr>
         <td style="text-transform:uppercase">Date</td>
         <td align="right" style="color:#0B1020">{{order_date}}</td>
       </tr>
     </table>
   </td></tr>

   ${RULE}

   <tr><td style="padding:0 28px">{{resources_block}}</td></tr>

   ${RULE}

   <!-- The stamp, in the storefront's vermilion. -->
   <tr><td style="padding:0 28px;text-align:center">
     <div style="display:inline-block;border:2px solid #C42B22;color:#C42B22;font-family:${FONT_MONO};font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:7px 16px">
       Payment received
     </div>
   </td></tr>

   <tr><td style="padding:18px 28px 22px;text-align:center;font-family:${FONT_BODY};font-size:12px;line-height:1.55;color:#5A6480">
     Keep this receipt &mdash; the link stays valid, so you can download again from here.<br>
     Something wrong with the file? Just reply to this email.
   </td></tr>

   <!-- Perforated bottom edge. -->
   <tr><td style="background:#0B1020;font-family:${FONT_MONO};font-size:13px;line-height:9px;letter-spacing:3px;color:#F6F8FC;padding:3px 0;text-align:center;mso-line-height-rule:exactly">
     &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
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

/**
 * Indian-format rupees, matching web/lib/format.ts's formatRupees so the
 * receipt in the email and the receipt on the order page read identically.
 */
function formatRupees(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/** "26 Aug 2026". Falls back to today when an order carries no timestamp. */
function formatOrderDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
    // A receipt shows what was paid and when. The old email showed neither,
    // which is the one thing a buyer looks for when they come back to it.
    amount_display: formatRupees(order.amount),
    order_date: formatOrderDate(order.created_at),
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
  formatRupees,
  renderCompletedEmail,
  buildResourcesBlock,
  DEFAULT_COMPLETED_TEMPLATE,
  escapeHtml,
};
