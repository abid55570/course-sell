// FFmpeg-based invite renderer. Uses the ffmpeg binary bundled by ffmpeg-static
// (no system install needed) and the OFL fonts bundled in assets/fonts.
//
// Phase-0 design: an elegant animated *text* invite over a vignetted background
// with a decorative accent border. Text is drawn with `drawtext` reading from
// temp files (expansion=none) so arbitrary buyer text is rendered literally and
// safely. Photos/music are wired as future enhancements (see options).
//
// This is deliberately the "baseline" engine from the plan. It can be swapped
// for Remotion/After-Effects compositions later without changing callers.

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const FONTS = {
  script: path.join(FONT_DIR, 'GreatVibes-Regular.ttf'),
  serif: path.join(FONT_DIR, 'Cinzel-Black.ttf'),
  sans: path.join(FONT_DIR, 'NotoSans-Regular.ttf'),
  sansBold: path.join(FONT_DIR, 'NotoSans-Bold.ttf'),
};

// Per-role visual style. size in px (1080x1920 canvas), wrap = chars/line.
const ROLE_STYLE = {
  kicker: { font: 'serif', size: 40, wrap: 34, dim: 0.85 },
  name: { font: 'script', size: 150, wrap: 18, dim: 1 },
  amp: { font: 'script', size: 90, wrap: 4, dim: 1, accent: true },
  detail: { font: 'sans', size: 44, wrap: 30, dim: 0.95 },
  message: { font: 'sans', size: 40, wrap: 34, dim: 0.8 },
  small: { font: 'sans', size: 32, wrap: 40, dim: 0.7 },
};

// Escape a filesystem path for use inside an ffmpeg filtergraph value on both
// Windows (drive colon + backslashes) and POSIX.
function escFilterPath(p) {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:');
}

// Naive word-wrap to a max chars-per-line; returns lines joined with '\n'.
function wrapText(text, maxChars) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function hexToFF(hex) {
  // ffmpeg fontcolor accepts 0xRRGGBB.
  return `0x${String(hex).replace(/^#/, '').slice(0, 6)}`;
}

function run(bin, args, { timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 16 }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Build the filter_complex string + the list of temp text files to clean up.
 */
function buildFilters(model, tmpDir, { watermark, photoCount = 0, perPhotoDur = 0, xfadeT = 1 }) {
  const { width, height, palette, elements, duration, fps } = model;
  const cleanup = [];
  const chains = [];

  // 1) Background: either a Ken Burns photo slideshow (if the buyer uploaded
  //    photos) or a solid palette colour. Either way it ends at label [bg].
  let label = 'bg';
  if (photoCount > 0) {
    const D = perPhotoDur;
    const dframes = Math.max(1, Math.round(D * fps));
    // Cover-crop each photo to ~1.35x the canvas (enough headroom for the 1.18x
    // zoom) in a single scale pass, then zoompan. A single bounded scale avoids
    // the pathological blow-up a tiny source hits when upscaled 2x.
    const cw = Math.round(width * 1.35);
    const ch = Math.round(height * 1.35);
    for (let i = 0; i < photoCount; i += 1) {
      const zoomIn = i % 2 === 0;
      const z = zoomIn ? `min(zoom+0.0011,1.18)` : `if(eq(on,0),1.18,max(zoom-0.0011,1.0))`;
      chains.push(
        `[${i}:v]scale=${cw}:${ch}:force_original_aspect_ratio=increase,crop=${cw}:${ch},` +
        `zoompan=z='${z}':d=${dframes}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps},` +
        `setsar=1,format=rgba[p${i}]`
      );
    }
    if (photoCount === 1) {
      chains.push(`[p0]null[slide]`);
    } else {
      // Cross-fade the segments together.
      let prev = 'p0';
      let prevLen = D;
      for (let i = 1; i < photoCount; i += 1) {
        const out = i === photoCount - 1 ? 'slide' : `xf${i}`;
        const offset = (prevLen - xfadeT).toFixed(2);
        chains.push(`[${prev}][p${i}]xfade=transition=fade:duration=${xfadeT}:offset=${offset}[${out}]`);
        prev = out;
        prevLen = prevLen + D - xfadeT;
      }
    }
    // Dark scrim so light text stays readable over any photo.
    chains.push(`[slide]drawbox=x=0:y=0:w=${width}:h=${height}:color=black@0.45:t=fill,format=rgb24[${label}]`);
  } else {
    chains.push(`color=c=${hexToFF(palette.bg)}:s=${width}x${height}:d=${duration},format=rgb24,vignette=PI/4[${label}]`);
  }

  // Accent border — style chosen by the buyer (none / single / inset / double).
  const acc = hexToFF(palette.accent);
  const frame = model.frame || 'double';
  const FRAMES = {
    single: [{ inset: 46, t: 4, a: 0.9 }],
    inset: [{ inset: 40, t: 2, a: 0.85 }, { inset: 54, t: 2, a: 0.85 }],
    double: [{ inset: 44, t: 6, a: 0.9 }, { inset: 60, t: 2, a: 0.5 }],
  };
  (FRAMES[frame] || []).forEach((b, i) => {
    const out = `bd${i}`;
    chains.push(`[${label}]drawbox=x=${b.inset}:y=${b.inset}:w=${width - 2 * b.inset}:h=${height - 2 * b.inset}:color=${acc}@${b.a}:t=${b.t}[${out}]`);
    label = out;
  });

  // 2) Compute vertical layout: stack elements, center the whole column.
  const gap = 34;
  const measured = elements.map((el) => {
    const style = ROLE_STYLE[el.role] || ROLE_STYLE.detail;
    const lines = wrapText(el.text, style.wrap);
    const lineH = style.size * 1.22;
    const blockH = lines.length * lineH;
    return { el, style, lines, blockH };
  });
  const totalH = measured.reduce((s, m) => s + m.blockH, 0) + gap * (measured.length - 1);
  let curY = Math.max(180, Math.round((height - totalH) / 2));

  // 3) One drawtext per element, fading in staggered.
  const lastAppear = Math.min(duration - 3, 1 + measured.length * 0.7);
  measured.forEach((m, i) => {
    const { el, style, lines, blockH } = m;
    const txtFile = path.join(tmpDir, `t${i}.txt`);
    fs.writeFileSync(txtFile, lines.join('\n'), 'utf8');
    cleanup.push(txtFile);
    const font = FONTS[style.font] || FONTS.sans;
    const color = style.accent ? hexToFF(palette.accent) : hexToFF(palette.text);
    const tIn = Math.min(lastAppear, 0.6 + i * 0.7);
    const alpha = `if(lt(t,${tIn.toFixed(2)}),0,if(lt(t,${(tIn + 0.9).toFixed(2)}),(t-${tIn.toFixed(2)})/0.9,${style.dim}))`;
    const out = i === measured.length - 1 && !watermark ? 'vout' : `v${i}`;
    chains.push(
      `[${label}]drawtext=fontfile='${escFilterPath(font)}':textfile='${escFilterPath(txtFile)}':expansion=none:` +
      `fontcolor=${color}:fontsize=${style.size}:line_spacing=10:` +
      `x=(w-text_w)/2:y=${curY}:alpha='${alpha}'[${out}]`
    );
    label = out;
    curY += blockH + gap;
  });

  // 4) Optional watermark for shareable teasers (paid renders pass watermark:false).
  if (watermark) {
    const wmFile = path.join(tmpDir, 'wm.txt');
    fs.writeFileSync(wmFile, 'PREVIEW • PAY TO UNLOCK', 'utf8');
    cleanup.push(wmFile);
    chains.push(
      `[${label}]drawtext=fontfile='${escFilterPath(FONTS.sansBold)}':textfile='${escFilterPath(wmFile)}':expansion=none:` +
      `fontcolor=white@0.28:fontsize=54:x=(w-text_w)/2:y=(h-text_h)/2:box=0[vout]`
    );
    label = 'vout';
  }

  return { filter: chains.join(';'), cleanup };
}

/**
 * Render one MP4 from a render model.
 * @returns {Promise<{path:string, sizeMb:number}>}
 */
async function renderToFile(model, outPath, { watermark = false, music = null, photos = [] } = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invite-'));
  try {
    const valid = (photos || []).filter((p) => p && fs.existsSync(p)).slice(0, 5);
    const xfadeT = 1;
    // Split the timeline across photos; account for overlap consumed by xfades.
    const perPhotoDur = valid.length
      ? (model.duration + (valid.length - 1) * xfadeT) / valid.length
      : 0;
    const { filter, cleanup } = buildFilters(model, tmpDir, {
      watermark, photoCount: valid.length, perPhotoDur, xfadeT,
    });

    const args = ['-y'];
    // Photo inputs first (each a still looped for its segment), so they map to
    // [0:v]..[n-1:v] in the filtergraph. Audio is the last input.
    for (const p of valid) {
      args.push('-loop', '1', '-t', String(perPhotoDur + xfadeT), '-i', p);
    }
    const audioIndex = valid.length;
    if (music && fs.existsSync(music)) {
      args.push('-i', music);
    } else {
      args.push('-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo:d=${model.duration}`);
    }
    args.push(
      '-filter_complex', filter,
      '-map', '[vout]', '-map', `${audioIndex}:a`,
      '-t', String(model.duration),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-preset', 'medium', '-crf', '20',
      '-r', String(model.fps),
      '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart',
      outPath
    );
    await run(ffmpegPath, args, { timeoutMs: 240000 });
    cleanup.forEach((f) => { try { fs.unlinkSync(f); } catch { /* ignore */ } });
    const sizeMb = fs.statSync(outPath).size / (1024 * 1024);
    return { path: outPath, sizeMb: Math.round(sizeMb * 100) / 100 };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

/**
 * Re-encode `src` to a WxH variant. Used for the WhatsApp copy and for the
 * Basic-plan downscale.
 */
async function scaleTo(src, dst, w, h, crf = 28) {
  await run(ffmpegPath, [
    '-y', '-i', src,
    '-vf', `scale=${w}:${h}:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
    dst,
  ], { timeoutMs: 120000 });
  const sizeMb = fs.statSync(dst).size / (1024 * 1024);
  return { path: dst, sizeMb: Math.round(sizeMb * 100) / 100 };
}

const makeWhatsappVariant = (src, dst) => scaleTo(src, dst, 720, 1280, 30);

/**
 * High-level: render clean HD (at the plan's resolution) + a WhatsApp variant.
 * The master is always composed at 1080x1920 so the layout is consistent; the
 * Basic plan's HD is that master downscaled to hdWidth x hdHeight.
 * @returns {{ hdFile:string, waFile:string, hdSizeMb:number, waSizeMb:number }}
 */
async function renderProject({ model, outDir, baseName, watermark = false, music = null, photos = [], hdWidth = 1080, hdHeight = 1920 }) {
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = crypto.randomBytes(4).toString('hex');
  const hdPath = path.join(outDir, `${baseName}-${stamp}-hd.mp4`);
  const waPath = path.join(outDir, `${baseName}-${stamp}-wa.mp4`);

  if (hdHeight >= model.height) {
    // Standard / Premium — HD is the full-res master.
    const hd = await renderToFile(model, hdPath, { watermark, music, photos });
    const wa = await makeWhatsappVariant(hdPath, waPath);
    return { hdFile: hdPath, waFile: waPath, hdSizeMb: hd.sizeMb, waSizeMb: wa.sizeMb };
  }
  // Basic — render the full-res master, then downscale for HD + WhatsApp.
  const masterPath = path.join(outDir, `${baseName}-${stamp}-master.mp4`);
  await renderToFile(model, masterPath, { watermark, music, photos });
  const hd = await scaleTo(masterPath, hdPath, hdWidth, hdHeight);
  const wa = await makeWhatsappVariant(masterPath, waPath);
  try { fs.unlinkSync(masterPath); } catch { /* ignore */ }
  return { hdFile: hdPath, waFile: waPath, hdSizeMb: hd.sizeMb, waSizeMb: wa.sizeMb };
}

module.exports = {
  renderProject,
  renderToFile,
  makeWhatsappVariant,
  buildFilters,
  wrapText,
  ffmpegPath,
  FONTS,
};
