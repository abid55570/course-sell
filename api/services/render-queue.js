// In-process render queue (concurrency 1 by default). Good enough for MVP
// volume; swap for BullMQ + Redis when throughput demands it. Jobs are the
// project id; state lives in video_projects.render_status so a process restart
// can recover (see recoverStuck()).

const path = require('path');
const fs = require('fs');
const os = require('os');
const db = require('../utils/db');
const { buildRenderModel } = require('./video-templates');
const { renderProject } = require('./renderer');
const { getPlan, defaultPlanForTier } = require('./pricing');
const mediaStore = require('./media-store');

const CONCURRENCY = parseInt(process.env.RENDER_CONCURRENCY || '1', 10);
const queue = [];
let active = 0;

async function enqueue(projectId) {
  queue.push(projectId);
  pump();
}

function pump() {
  while (active < CONCURRENCY && queue.length) {
    const id = queue.shift();
    active += 1;
    processProject(id)
      .catch((e) => console.error('render job crashed', id, e.message))
      .finally(() => { active -= 1; pump(); });
  }
}

async function processProject(projectId) {
  const project = await db.get('SELECT * FROM video_projects WHERE id = $1', [projectId]);
  if (!project) return;
  // Only render paid projects whose order is completed (defence in depth).
  if (project.order_id) {
    const order = await db.get('SELECT status FROM orders WHERE order_id = $1', [project.order_id]);
    if (!order || order.status !== 'completed') {
      console.warn('skip render: order not completed', project.order_id);
      return;
    }
  }
  const template = await db.get('SELECT * FROM video_templates WHERE id = $1', [project.template_id]);
  if (!template) {
    await db.run("UPDATE video_projects SET render_status='failed', render_error=$1, updated_at=NOW() WHERE id=$2",
      ['template missing', projectId]);
    return;
  }

  await db.run("UPDATE video_projects SET render_status='rendering', render_error=NULL, updated_at=NOW() WHERE id=$1", [projectId]);
  try {
    // The chosen plan drives length, photo count and output resolution.
    const plan = getPlan(project.plan) || getPlan(defaultPlanForTier(template.price_tier)) || getPlan('standard');
    const model = buildRenderModel(
      {
        composition_id: template.composition_id,
        preset: template.preset || {},
        duration_seconds: template.duration_seconds,
      },
      project.form_data || {},
      project.style || {},
      { duration: plan.seconds }
    );
    // Render in an isolated temp dir; fetch photos + push outputs via the media
    // store (Swift object storage when configured, else local disk).
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
    try {
      const photoFiles = [];
      for (const key of (project.photos || []).slice(0, plan.maxPhotos)) {
        try { photoFiles.push(await mediaStore.toLocalFile(key, tmpDir)); }
        catch (e) { console.warn('photo fetch failed', key, e.message); }
      }
      const { hdFile, waFile, hdSizeMb } = await renderProject({
        model, outDir: tmpDir, baseName: project.public_id, watermark: false,
        photos: photoFiles, hdWidth: plan.width, hdHeight: plan.height,
      });
      const hdKey = await mediaStore.saveFile('renders', path.basename(hdFile), hdFile, 'video/mp4');
      const waKey = await mediaStore.saveFile('renders', path.basename(waFile), waFile, 'video/mp4');
      await db.run(
        `UPDATE video_projects
           SET render_status='done', output_file=$1, wa_file=$2, output_size_mb=$3, updated_at=NOW()
         WHERE id=$4`,
        [hdKey, waKey, hdSizeMb, projectId]
      );
      if (project.order_id) {
        await db.logTransaction({ order_id: project.order_id, event: 'note', actor: 'renderer', detail: `video rendered (${hdSizeMb}MB)` });
      }
      await notifyReady(project).catch((e) => console.warn('video-ready email failed', e.message));
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  } catch (err) {
    console.error('render failed for project', projectId, err.message);
    await db.run("UPDATE video_projects SET render_status='failed', render_error=$1, updated_at=NOW() WHERE id=$2",
      [String(err.message).slice(0, 500), projectId]);
  }
}

async function notifyReady(project) {
  if (!project.order_id || !project.buyer_email) return;
  const { sendVideoReadyEmail } = require('../utils/email');
  const order = await db.get('SELECT * FROM orders WHERE order_id = $1', [project.order_id]);
  const template = await db.get('SELECT name FROM video_templates WHERE id = $1', [project.template_id]);
  await sendVideoReadyEmail(order, { ...project, template_name: template && template.name });
}

// On boot, re-queue anything left mid-flight by a previous process.
async function recoverStuck() {
  try {
    await db.run("UPDATE video_projects SET render_status='queued' WHERE render_status='rendering'");
    const rows = await db.all(
      `SELECT vp.id FROM video_projects vp
       JOIN orders o ON o.order_id = vp.order_id
       WHERE vp.render_status='queued' AND o.status='completed'`
    );
    rows.forEach((r) => enqueue(r.id));
    if (rows.length) console.log(`render-queue: recovered ${rows.length} pending job(s)`);
  } catch (e) {
    console.warn('render-queue recovery skipped:', e.message);
  }
}

module.exports = { enqueue, recoverStuck, _state: () => ({ active, queued: queue.length }) };
