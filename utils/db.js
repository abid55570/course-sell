const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    throw new Error('DATABASE_URL is not set. Use postgres://user:pass@host:5432/dbname');
  }
  pool = new Pool({
    connectionString: cs,
    max: parseInt(process.env.PG_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
  });
  pool.on('error', (err) => console.error('pg pool error', err));
  return pool;
}

async function query(sql, params) {
  return getPool().query(sql, params);
}

async function get(sql, params) {
  const r = await query(sql, params);
  return r.rows[0] || null;
}

async function all(sql, params) {
  const r = await query(sql, params);
  return r.rows;
}

async function run(sql, params) {
  const r = await query(sql, params);
  return { rowCount: r.rowCount, rows: r.rows };
}

async function logTransaction({ order_id, event, actor, amount, upi_txn_ref, detail }) {
  await query(
    `INSERT INTO transactions (order_id, event, actor, amount, upi_txn_ref, detail)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [order_id, event, actor || null, amount ?? null, upi_txn_ref || null, detail || null]
  );
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

function setPool(externalPool) {
  pool = externalPool;
}

module.exports = { query, get, all, run, logTransaction, close, getPool, setPool };
