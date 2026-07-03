require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true, credentials: true }));

// Razorpay webhook needs the raw body for signature verification, so it is
// mounted with a raw parser BEFORE the JSON parser.
app.post('/api/payments/webhook', express.raw({ type: '*/*' }), require('./routes/payments').webhook);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/video', require('./routes/video'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/video', require('./routes/admin-video'));

app.get('/api/site-info', (req, res) => {
  res.json({
    site_name: process.env.SITE_NAME || 'My Course Hub',
    site_url: process.env.SITE_URL || '',
    support_email: process.env.SUPPORT_EMAIL || process.env.SMTP_USER || '',
    upi_id: process.env.UPI_ID || '',
    payee_name: process.env.UPI_PAYEE_NAME || '',
    payments: 'razorpay',
  });
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

app.get('/course/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'course.html'));
});
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});
app.get('/invite', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'invite.html'));
});
app.get('/generator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'generator.html'));
});
app.get('/generator/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'generator-edit.html'));
});
app.get('/order/:orderId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Recover any renders left mid-flight by a previous process.
    require('./services/render-queue').recoverStuck().catch(() => {});
  });
}

module.exports = app;
