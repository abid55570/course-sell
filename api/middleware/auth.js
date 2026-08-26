const jwt = require('jsonwebtoken');

/**
 * The signing secret, or a thrown error.
 *
 * This used to be `process.env.JWT_SECRET || 'dev-secret'`. That string is
 * published in this repository, so a deploy that forgot JWT_SECRET would sign
 * and verify admin tokens with a value any reader of the source already knows —
 * letting anyone mint `{ role: 'admin' }` and reach every admin route,
 * including the one that marks an order paid and the one that rewrites prices.
 *
 * server.js only *warns* about missing required env vars so the test suite can
 * run without a database, which meant nothing would have caught it. There is no
 * safe default for a signing key, so this refuses instead of inventing one: an
 * admin route that 500s is recoverable, one that trusts a public secret is not.
 */
function signingSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short (needs at least 32 characters). ' +
        'Admin authentication is disabled until it is set — refusing to fall back to a default.'
    );
  }
  return secret;
}

function getTokenFromReq(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies && req.cookies.admin_token) return req.cookies.admin_token;
  return null;
}

function requireAdmin(req, res, next) {
  let secret;
  try {
    secret = signingSecret();
  } catch (configError) {
    // A misconfigured server must not look like a rejected password. Log it
    // loudly and answer 503 so an operator can tell the two apart.
    console.error('[auth]', configError.message);
    return res.status(503).json({ error: 'admin authentication is not configured on this server' });
  }

  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: 'admin' },
    signingSecret(),
    { expiresIn: '7d' }
  );
}

module.exports = { requireAdmin, signAdminToken, signingSecret };
