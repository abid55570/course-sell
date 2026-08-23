const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const version = path.basename(file, '.sql');
    const r = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (r.rowCount > 0) {
      console.log(`-  skip   ${version} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`>  apply  ${version}`);
    await pool.query(sql);
  }
  console.log('migrations done');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
