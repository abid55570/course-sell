// Storage abstraction for buyer photos + rendered videos. Uses Swift object
// storage when configured (SWIFT_* env), otherwise local disk under storage/.
//
// Everything is stored under a top folder (SWIFT_PREFIX, default "course-sell")
// with per-type subfolders:  course-sell/photos/…  and  course-sell/renders/…
//
// A "key" identifies an object. With Swift it's `course-sell/<sub>/<file>`;
// locally it's `<sub>/<file>` resolved under storage/. The gated download
// endpoint streams the object through the app, so the paywall holds whether the
// container is public or private.

const path = require('path');
const fs = require('fs');
const swift = require('./object-storage');
const { ROOT } = require('./storage');

const PREFIX = (process.env.SWIFT_PREFIX || 'course-sell').replace(/\/$/, '');
const LOCAL_BASE = path.join(ROOT, 'storage');

const CONTENT_TYPES = { '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
function contentTypeFor(name) { return CONTENT_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream'; }

function enabled() { return swift.isEnabled(); }

function keyFor(subfolder, filename) {
  return enabled() ? `${PREFIX}/${subfolder}/${filename}` : `${subfolder}/${filename}`;
}

// Local absolute path for a (local) key, resolved under storage/.
function localPathForKey(key) { return path.join(LOCAL_BASE, key); }

async function saveBuffer(subfolder, filename, buffer, contentType) {
  const key = keyFor(subfolder, filename);
  if (enabled()) {
    await swift.putObject(key, buffer, contentType || contentTypeFor(filename));
    return key;
  }
  const dir = path.join(LOCAL_BASE, subfolder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);
  return key;
}

async function saveFile(subfolder, filename, localPath, contentType) {
  if (enabled()) {
    return saveBuffer(subfolder, filename, fs.readFileSync(localPath), contentType);
  }
  const dir = path.join(LOCAL_BASE, subfolder);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, filename);
  if (path.resolve(localPath) !== path.resolve(dest)) fs.copyFileSync(localPath, dest);
  return keyFor(subfolder, filename);
}

// Get the object as a local file (downloads from Swift into tmpDir; for local
// storage returns the existing path). Used to feed ffmpeg.
async function toLocalFile(key, tmpDir) {
  if (enabled()) {
    const dest = path.join(tmpDir, path.basename(key));
    await swift.downloadToFile(key, dest);
    return dest;
  }
  return localPathForKey(key);
}

// Stream an object to an HTTP response as an attachment (gated download).
async function streamTo(key, res, downloadName) {
  if (enabled()) {
    const stream = await swift.getObjectStream(key);
    res.setHeader('Content-Type', contentTypeFor(key));
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    stream.on('error', () => { if (!res.headersSent) res.status(502); res.end(); });
    stream.pipe(res);
    return;
  }
  const abs = localPathForKey(key);
  if (!fs.existsSync(abs)) { res.status(404).send('File missing'); return; }
  res.download(abs, downloadName);
}

module.exports = { enabled, keyFor, saveBuffer, saveFile, toLocalFile, streamTo, localPathForKey, publicUrl: swift.publicUrl };
