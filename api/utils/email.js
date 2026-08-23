const nodemailer = require('nodemailer');
const { renderCompletedEmail } = require('./template');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

function resetTransporter() {
  transporter = null;
}

async function sendMail({ to, subject, html, text, replyTo }) {
  const t = getTransporter();
  if (!t) {
    console.log('[email] would send', { to, subject });
    return { skipped: true, to, subject, html };
  }
  const fromName = process.env.SMTP_FROM_NAME || 'Course Hub';
  return t.sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to, subject, text, html, replyTo,
  });
}

async function sendOrderPendingEmail(order, course) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="color:#0f172a">Order received - awaiting payment</h2>
    <p>Hi ${order.buyer_name},</p>
    <p>Thanks for your interest in <strong>${course.title}</strong>. Your order has been placed and is awaiting UPI payment confirmation.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;border:1px solid #e5e7eb">Order ID</td><td style="padding:8px;border:1px solid #e5e7eb"><strong>${order.order_id}</strong></td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb">Course</td><td style="padding:8px;border:1px solid #e5e7eb">${course.title}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb">Amount</td><td style="padding:8px;border:1px solid #e5e7eb">INR ${order.amount}</td></tr>
    </table>
    <p>Once we verify your UPI transaction, you'll receive another email with your course access.</p>
  </div>`;
  return sendMail({
    to: order.buyer_email,
    subject: `Order ${order.order_id} - awaiting payment`,
    html,
  });
}

async function sendOrderCompletedEmail(order, course) {
  const html = renderCompletedEmail({
    course,
    order,
    includePdf: !!course.send_pdf_in_email && !!course.pdf_file,
    includeDrive: !!course.send_drive_in_email && !!course.drive_link,
    customTemplate: course.email_template_html,
  });
  return sendMail({
    to: order.buyer_email,
    subject: `Access granted: ${course.title}`,
    html,
  });
}

async function sendVideoReadyEmail(order, project) {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const orderUrl = `${base}/order/${order.order_id}`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="color:#16a34a">Your video is ready 🎬</h2>
    <p>Hi ${order.buyer_name || 'there'},</p>
    <p>Your <strong>${project.template_name || 'invite'}</strong> video has been created and is ready to download.</p>
    <p style="margin:24px 0">
      <a href="${orderUrl}" style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">Download your video</a>
    </p>
    <p style="color:#6b7280;font-size:13px">Order ID: <strong>${order.order_id}</strong>. The download includes an HD version and a WhatsApp-ready version. Need a spelling fix? Reply to this email — one free revision is included.</p>
  </div>`;
  return sendMail({
    to: order.buyer_email,
    subject: `Your video is ready — order ${order.order_id}`,
    html,
  });
}

module.exports = {
  sendMail,
  sendOrderPendingEmail,
  sendOrderCompletedEmail,
  sendVideoReadyEmail,
  resetTransporter,
};
