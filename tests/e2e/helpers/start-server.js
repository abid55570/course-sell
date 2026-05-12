const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Pool } = require('pg');

async function bootstrap() {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error('DATABASE_URL must be set');
  const schema = process.env.PG_SCHEMA;
  if (!schema) throw new Error('PG_SCHEMA must be set');

  // Pool that defaults search_path to the test schema.
  const pool = new Pool({
    connectionString: cs,
    max: 5,
    idleTimeoutMillis: 30000,
  });
  pool.on('connect', (client) => {
    client.query(`SET search_path TO "${schema}", public`).catch(() => {});
  });

  const dir = path.join(__dirname, '..', '..', '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  const setup = await pool.connect();
  try {
    await setup.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await setup.query(`SET search_path TO "${schema}"`);
    for (const f of files) {
      await setup.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    }
  } finally { setup.release(); }

  // Inject the test pool into the app's db module before routes are required.
  const db = require('../../../utils/db');
  db.setPool(pool);

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api/auth', require('../../../routes/auth'));
  app.use('/api/courses', require('../../../routes/courses'));
  app.use('/api/orders', require('../../../routes/orders'));
  app.use('/api/admin', require('../../../routes/admin'));

  app.get('/api/site-info', (req, res) => {
    res.json({
      site_name: process.env.SITE_NAME,
      site_url: process.env.SITE_URL || '',
      upi_id: process.env.UPI_ID,
      payee_name: process.env.UPI_PAYEE_NAME,
    });
  });

  app.use(express.static(path.join(__dirname, '..', '..', '..', 'public')));

  app.use((err, req, res, _next) => {
    console.error('test server error', err);
    res.status(500).json({ error: err.message });
  });

  const server = app.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    process.stdout.write(`__PORT__=${port}\n`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
