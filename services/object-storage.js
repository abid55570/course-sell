// OpenStack Swift object storage client (Keystone v3 application-credential auth).
//
// Enabled when the SWIFT_* env vars are set; otherwise the app falls back to
// local disk (see media-store.js). All object keys are placed under a folder
// prefix (SWIFT_PREFIX, default "course-sell") inside the container, e.g.
//   course-sell/renders/<file>.mp4
//   course-sell/photos/<file>
//
// The Keystone endpoint is an IP with a self-signed cert, so the auth call may
// use an insecure TLS agent (SWIFT_AUTH_INSECURE_TLS=true). The storage host is
// assumed to have a valid cert unless SWIFT_STORAGE_INSECURE_TLS=true.

const https = require('https');
const http = require('http');
const fs = require('fs');
const { URL } = require('url');

const insecureAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

function env(name) { return process.env[name]; }
function truthy(v) { return v === 'true' || v === '1'; }

function isEnabled() {
  return Boolean(
    env('SWIFT_AUTH_URL') && env('SWIFT_APP_CREDENTIAL_ID') &&
    env('SWIFT_APP_CREDENTIAL_SECRET') && env('SWIFT_STORAGE_URL') && env('SWIFT_CONTAINER')
  );
}

function request(method, urlStr, { headers = {}, body = null, insecure = false, stream = false } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const mod = u.protocol === 'http:' ? http : https;
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'http:' ? 80 : 443),
      path: u.pathname + u.search,
      headers,
    };
    if (insecure && u.protocol === 'https:') opts.agent = insecureAgent;
    const req = mod.request(opts, (res) => {
      if (stream) return resolve(res);
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('swift request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

let tokenCache = { token: null, expires: 0 };

async function authToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expires > now + 60000) return tokenCache.token;
  const url = `${env('SWIFT_AUTH_URL').replace(/\/$/, '')}/auth/tokens`;
  const payload = JSON.stringify({
    auth: {
      identity: {
        methods: ['application_credential'],
        application_credential: {
          id: env('SWIFT_APP_CREDENTIAL_ID'),
          secret: env('SWIFT_APP_CREDENTIAL_SECRET'),
        },
      },
    },
  });
  const res = await request('POST', url, {
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    body: payload,
    insecure: truthy(env('SWIFT_AUTH_INSECURE_TLS')),
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Swift auth failed: HTTP ${res.status} ${res.body.toString().slice(0, 160)}`);
  }
  const token = res.headers['x-subject-token'];
  if (!token) throw new Error('Swift auth: no X-Subject-Token in response');
  let expires = now + 3600000;
  try {
    const j = JSON.parse(res.body.toString());
    if (j.token && j.token.expires_at) expires = Date.parse(j.token.expires_at);
  } catch { /* keep default */ }
  tokenCache = { token, expires };
  return token;
}

function objectUrl(key) {
  const base = env('SWIFT_STORAGE_URL').replace(/\/$/, '');
  const container = env('SWIFT_CONTAINER');
  const path = key.split('/').map(encodeURIComponent).join('/');
  return `${base}/${container}/${path}`;
}

const storageInsecure = () => truthy(env('SWIFT_STORAGE_INSECURE_TLS'));

async function putObject(key, buffer, contentType = 'application/octet-stream') {
  const token = await authToken();
  const res = await request('PUT', objectUrl(key), {
    headers: { 'X-Auth-Token': token, 'Content-Type': contentType, 'Content-Length': buffer.length },
    body: buffer,
    insecure: storageInsecure(),
  });
  if (res.status >= 300) throw new Error(`Swift PUT ${key} failed: HTTP ${res.status}`);
  return key;
}

// Returns a readable stream of the object (caller pipes it).
async function getObjectStream(key) {
  const token = await authToken();
  const res = await request('GET', objectUrl(key), {
    headers: { 'X-Auth-Token': token }, insecure: storageInsecure(), stream: true,
  });
  if (res.statusCode >= 300) { res.resume(); throw new Error(`Swift GET ${key} failed: HTTP ${res.statusCode}`); }
  return res;
}

async function downloadToFile(key, destPath) {
  const s = await getObjectStream(key);
  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(destPath);
    s.on('error', reject);
    w.on('error', reject);
    w.on('finish', resolve);
    s.pipe(w);
  });
  return destPath;
}

async function removeObject(key) {
  const token = await authToken();
  await request('DELETE', objectUrl(key), { headers: { 'X-Auth-Token': token }, insecure: storageInsecure() });
}

function publicUrl(key) {
  const base = (env('SWIFT_PUBLIC_BASE_URL') || '').replace(/\/$/, '');
  return base ? `${base}/${key.split('/').map(encodeURIComponent).join('/')}` : null;
}

module.exports = { isEnabled, authToken, putObject, getObjectStream, downloadToFile, removeObject, publicUrl, objectUrl };
