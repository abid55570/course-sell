const path = require('path');
// server.js lives in api/, but .env lives at the repo root one level up.
// dotenv resolves its default path relative to process.cwd(), which is wrong
// whenever the process is started from inside api/ (e.g. `cd api && node
// server.js`, or the root package.json's `dev:api` script, which shells out
// via `npm --prefix api run dev`). Resolving from __dirname makes env
// loading independent of the working directory the process was launched from.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
// public/ stays at the repo root; server.js now runs one level down in api/.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
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
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/video', require('./routes/video'));
app.use('/api/carousel', require('./routes/carousel'));
app.use('/api/tools', require('./routes/tools'));
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

app.use(express.static(PUBLIC_DIR, { index: 'index.html' }));

app.get('/course/:slug', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'course.html'));
});
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'checkout.html'));
});
app.get('/invite', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'invite.html'));
});
app.get('/generator', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'generator.html'));
});
app.get('/generator/:slug', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'generator-edit.html'));
});
app.get('/order/:orderId', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'order.html'));
});
app.get('/carousel', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'carousel.html'));
});
app.get('/carousel/editor', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'carousel-editor.html'));
});

// One-time creator tools: /<key> serves the landing, /<key>/editor the tool.
const toolProducts = require('./services/tool-products');
for (const tool of toolProducts.list()) {
  app.get(tool.landingPath, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'tools', `${tool.key}.html`));
  });
  app.get(tool.editorPath, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'tools', `${tool.key}-editor.html`));
  });
}
// Public hosted QR menu (customers scan the QR to reach this).
app.get('/m/:publicId', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'tools', 'qrmenu-view.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin', 'login.html'));
});
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin', 'dashboard.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'server error' });
});

const PORT = process.env.PORT || 4000;

// Env vars the app cannot meaningfully function without: database, auth
// signing secrets, payments, and outbound email. This is a warning, not a
// hard failure -- some deployments inject env by other means (e.g. the
// platform's own secrets manager rather than a .env file), and the test
// suite must be able to run without a database configured at all. Missing
// vars used to fail silently (see the dotenv path bug this guard exists to
// catch); this makes a misconfigured environment loud and diagnosable
// instead of a confusing 500 with no explanation.
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

function checkRequiredEnv(vars = REQUIRED_ENV_VARS, env = process.env) {
  const missing = vars.filter((name) => !env[name]);
  if (missing.length > 0) {
    console.warn(
      `[startup] WARNING: missing required environment variable(s): ${missing.join(', ')}. ` +
      'The server will keep running, but features that depend on these ' +
      '(database, auth, payments, or email) will fail at request time. ' +
      'Confirm .env exists and is being loaded from the right path.'
    );
  }
  return missing;
}

if (require.main === module) {
  checkRequiredEnv();
  // Loud, hard-to-miss warning: this mode lets /api/orders/:id/verify mark
  // orders paid without checking a Razorpay signature. It requires an
  // explicit RAZORPAY_DEV_BYPASS=true (see services/payments.js) and can
  // never be true in production, but an operator staring at boot logs still
  // needs to see this before they wonder why a course got "sold" for free.
  if (require('./services/payments').devBypassEnabled()) {
    const line = '!'.repeat(78);
    console.warn(`\n${line}`);
    console.warn('! RAZORPAY_DEV_BYPASS is ON.');
    console.warn('! Orders can be marked paid with no valid Razorpay signature.');
    console.warn('! This is for local development only. Unset it before deploying.');
    console.warn(`${line}\n`);
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Recover any renders left mid-flight by a previous process.
    require('./services/render-queue').recoverStuck().catch(() => {});
  });
}

module.exports = app;
module.exports.checkRequiredEnv = checkRequiredEnv;
