require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../utils/db');

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const hash = bcrypt.hashSync(password, 10);

  const existing = await db.get('SELECT id FROM admins WHERE email = $1', [email]);
  if (existing) {
    await db.run('UPDATE admins SET password_hash = $1 WHERE email = $2', [hash, email]);
    console.log(`Admin ${email} updated.`);
  } else {
    await db.run(
      'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)',
      [email, hash, 'Admin']
    );
    console.log(`Admin ${email} created.`);
  }
  console.log('Login at /admin');
  await db.close();
}

main().catch(async (e) => { console.error(e); await db.close(); process.exit(1); });
