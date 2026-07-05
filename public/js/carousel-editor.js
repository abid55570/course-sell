(function () {
  'use strict';

  const API = {
    get: (u) => fetch(u, { credentials: 'include' }).then(h),
    post: (u, b) => fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then(h),
  };
  async function h(r) {
    const ct = r.headers.get('content-type') || '';
    const d = ct.includes('json') ? await r.json() : await r.text();
    if (!r.ok) throw new Error((d && d.error) || `Request failed (${r.status})`);
    return d;
  }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ── State ──
  let templates = [];
  let currentTemplate = null;
  let currentSlideIdx = 0;
  let editedSlides = [];
  let licensed = false;
  let licenseKey = localStorage.getItem('carousel_license') || '';
  let userLogo = null;
  let activePalette = null;

  const PALETTES = [
    { name: 'Midnight', colors: ['#0b1026', '#1b2450'], accent: '#6d6bff', text: '#ffffff' },
    { name: 'Royal', colors: ['#1a1130', '#3b1d5e'], accent: '#e6c15a', text: '#ffffff' },
    { name: 'Emerald', colors: ['#06231d', '#0e4a3a'], accent: '#34d8f0', text: '#ffffff' },
    { name: 'Crimson', colors: ['#2a0a0a', '#6b1a12'], accent: '#fbbf24', text: '#ffffff' },
    { name: 'Ocean', colors: ['#0a192f', '#172a45'], accent: '#64ffda', text: '#e6f1ff' },
    { name: 'Slate', colors: ['#1e293b', '#334155'], accent: '#818cf8', text: '#f1f5f9' },
    { name: 'Noir', colors: ['#0a0a0a', '#1a1a1a'], accent: '#ffffff', text: '#ffffff' },
    { name: 'Sunset', colors: ['#1a0a2e', '#3d1654'], accent: '#f97316', text: '#ffffff' },
    { name: 'Forest', colors: ['#0d1b0e', '#1a3a1c'], accent: '#4ade80', text: '#dcfce7' },
    { name: 'Cloud', colors: ['#f8fafc', '#e2e8f0'], accent: '#6d6bff', text: '#0f172a' },
    { name: 'Sand', colors: ['#fefce8', '#fef3c7'], accent: '#92400e', text: '#1c1917' },
    { name: 'Blush', colors: ['#fdf2f8', '#fce7f3'], accent: '#be185d', text: '#1c1917' },
  ];

  // ── Gallery ──
  const $gallery = document.getElementById('gallery');
  const $editor = document.getElementById('editorView');
  const $galleryGrid = document.getElementById('galleryGrid');
  const $catChips = document.getElementById('categoryChips');

  async function loadGallery(filterCat) {
    try {
      const url = filterCat && filterCat !== 'all' ? `/api/carousel/templates?category=${encodeURIComponent(filterCat)}` : '/api/carousel/templates';
      templates = await API.get(url);
    } catch (e) {
      $galleryGrid.innerHTML = `<div class="alert error">${esc(e.message)}</div>`;
      return;
    }
    renderGallery();
  }

  function renderGallery() {
    $galleryGrid.innerHTML = templates.map(t => {
      const slide = t.slides && t.slides[0];
      const bg = slideBg(slide);
      const locked = !t.is_free && !licensed;
      return `<div class="gallery-card" data-slug="${esc(t.slug)}">
        <div class="g-thumb" style="background:${bg}">
          <div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.6)">${esc(t.category)}</div>
            <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-top:4px;color:#fff">${esc(t.name)}</div>
          </div>
          ${t.is_free ? '<div class="g-free">FREE</div>' : (locked ? '<div class="g-lock">🔒 PRO</div>' : '')}
        </div>
        <div class="g-body">
          <div class="g-name">${esc(t.name)}</div>
          <div class="g-meta">${t.slide_count || (t.slides ? t.slides.length : 0)} slides · ${esc(t.category)}</div>
        </div>
      </div>`;
    }).join('');

    $galleryGrid.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.dataset.slug;
        const tpl = templates.find(t => t.slug === slug);
        if (!tpl) return;
        if (!tpl.is_free && !licensed) {
          showLicenseModal();
          return;
        }
        openEditor(tpl);
      });
    });
  }

  async function loadCategories() {
    try {
      const cats = await API.get('/api/carousel/categories');
      $catChips.innerHTML = `<button class="chip active" data-cat="all">All</button>` +
        cats.map(c => `<button class="chip" data-cat="${esc(c)}">${esc(c.charAt(0).toUpperCase() + c.slice(1))}</button>`).join('');
      $catChips.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
          $catChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          loadGallery(chip.dataset.cat);
        });
      });
    } catch (e) { /* ignore */ }
  }

  // ── Editor ──
  function openEditor(tpl) {
    currentTemplate = tpl;
    editedSlides = JSON.parse(JSON.stringify(tpl.slides));
    currentSlideIdx = 0;
    activePalette = null;
    $gallery.style.display = 'none';
    $editor.style.display = 'grid';
    renderSlideStrip();
    renderCurrentSlide();
    renderPalettes();
    updateTextProps();
  }

  function closeEditor() {
    $editor.style.display = 'none';
    $gallery.style.display = '';
  }

  function slideBg(slide) {
    if (!slide || !slide.background) return '#1a1130';
    const bg = slide.background;
    if (bg.type === 'gradient' && bg.colors) return `linear-gradient(${bg.angle || 135}deg, ${bg.colors.join(', ')})`;
    return bg.color || '#1a1130';
  }

  function renderSlideStrip() {
    const strip = document.getElementById('slideStrip');
    strip.innerHTML = editedSlides.map((slide, i) => {
      const bg = slideBg(slide);
      return `<div class="slide-thumb${i === currentSlideIdx ? ' active' : ''}" data-idx="${i}">
        <div class="slide-thumb-inner" style="background:${bg}">
          <span class="slide-num">${i + 1}</span>
          <span style="font-size:8px;color:#fff;opacity:.7">${esc((slide.elements && slide.elements[0] && slide.elements[0].content) || 'Slide ' + (i + 1))}</span>
        </div>
      </div>`;
    }).join('');
    strip.querySelectorAll('.slide-thumb').forEach(th => {
      th.addEventListener('click', () => {
        currentSlideIdx = parseInt(th.dataset.idx);
        renderSlideStrip();
        renderCurrentSlide();
        updateTextProps();
      });
    });
    document.getElementById('slideCounter').textContent = `${currentSlideIdx + 1} / ${editedSlides.length}`;
  }

  function renderCurrentSlide() {
    const slide = editedSlides[currentSlideIdx];
    if (!slide) return;
    const canvas = document.getElementById('canvasSlide');
    const bg = slideBg(slide);
    canvas.style.background = bg;

    let html = '';
    if (slide.decorations) {
      slide.decorations.forEach(d => {
        if (d.type === 'border') {
          html += `<div style="position:absolute;inset:${d.inset || 14}px;border:${d.width || 1.5}px solid ${d.color || 'rgba(255,255,255,0.2)'};border-radius:${d.radius || 4}px;pointer-events:none"></div>`;
        }
        if (d.type === 'circle') {
          html += `<div style="position:absolute;width:${d.size || 80}px;height:${d.size || 80}px;border-radius:50%;background:${d.color || 'rgba(255,255,255,0.05)'};top:${d.top || 'auto'};left:${d.left || 'auto'};right:${d.right || 'auto'};bottom:${d.bottom || 'auto'};pointer-events:none"></div>`;
        }
        if (d.type === 'line') {
          html += `<div style="position:absolute;width:${d.width || '60%'};height:${d.height || '2px'};background:${d.color || 'rgba(255,255,255,0.15)'};top:${d.top || 'auto'};left:${d.left || 'auto'};right:${d.right || 'auto'};bottom:${d.bottom || 'auto'};pointer-events:none"></div>`;
        }
      });
    }

    if (slide.elements) {
      slide.elements.forEach((el, ei) => {
        if (el.type === 'text') {
          const s = el.style || {};
          const styles = [
            `font-size:${s.fontSize || 16}px`,
            `font-weight:${s.fontWeight || 400}`,
            `color:${s.color || '#ffffff'}`,
            `font-family:${s.fontFamily || 'Inter'},sans-serif`,
            s.letterSpacing ? `letter-spacing:${s.letterSpacing}` : '',
            s.textTransform ? `text-transform:${s.textTransform}` : '',
            s.lineHeight ? `line-height:${s.lineHeight}` : '',
            s.marginTop ? `margin-top:${s.marginTop}px` : '',
            s.marginBottom ? `margin-bottom:${s.marginBottom}px` : '',
            s.opacity ? `opacity:${s.opacity}` : '',
            s.maxWidth ? `max-width:${s.maxWidth}` : '',
          ].filter(Boolean).join(';');
          html += `<div class="el-text" contenteditable="true" data-el="${ei}" style="${styles}">${esc(el.content)}</div>`;
        }
        if (el.type === 'number') {
          const s = el.style || {};
          html += `<div style="font-size:${s.fontSize || 72}px;font-weight:${s.fontWeight || 900};color:${s.color || 'rgba(255,255,255,0.08)'};font-family:${s.fontFamily || 'Space Grotesk'},sans-serif;line-height:1;${s.marginBottom ? `margin-bottom:${s.marginBottom}px` : ''}">${esc(el.content)}</div>`;
        }
        if (el.type === 'divider') {
          const s = el.style || {};
          html += `<div style="width:${s.width || '40px'};height:${s.height || '3px'};background:${s.color || '#e6c15a'};border-radius:2px;margin:${s.margin || '12px 0'}"></div>`;
        }
        if (el.type === 'logo' && userLogo) {
          html += `<img src="${userLogo}" style="max-width:${el.style?.maxWidth || '80px'};max-height:${el.style?.maxHeight || '40px'};margin:${el.style?.margin || '8px 0'};object-fit:contain" alt="logo">`;
        }
      });
    }

    canvas.innerHTML = html;

    canvas.querySelectorAll('.el-text').forEach(el => {
      el.addEventListener('input', () => {
        const idx = parseInt(el.dataset.el);
        if (editedSlides[currentSlideIdx].elements[idx]) {
          editedSlides[currentSlideIdx].elements[idx].content = el.textContent;
        }
      });
    });
  }

  function updateTextProps() {
    const slide = editedSlides[currentSlideIdx];
    const container = document.getElementById('textProps');
    if (!slide || !slide.elements) { container.innerHTML = ''; return; }
    container.innerHTML = slide.elements
      .filter(el => el.type === 'text')
      .map((el, i) => {
        const origIdx = slide.elements.indexOf(el);
        return `<div class="prop-row">
          <span class="prop-label">${esc(el.label || 'Text')}</span>
          <input type="text" class="prop-input" data-el="${origIdx}" value="${esc(el.content)}">
        </div>`;
      }).join('');
    container.querySelectorAll('.prop-input').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.dataset.el);
        if (editedSlides[currentSlideIdx].elements[idx]) {
          editedSlides[currentSlideIdx].elements[idx].content = input.value;
          renderCurrentSlide();
        }
      });
    });
  }

  // ── Palettes ──
  function renderPalettes() {
    const grid = document.getElementById('paletteGrid');
    grid.innerHTML = PALETTES.map((p, i) => {
      const bg = `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})`;
      return `<div class="palette-swatch${activePalette === i ? ' active' : ''}" data-idx="${i}" style="background:${bg}" title="${esc(p.name)}"></div>`;
    }).join('');
    grid.querySelectorAll('.palette-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const idx = parseInt(sw.dataset.idx);
        applyPalette(PALETTES[idx]);
        activePalette = idx;
        renderPalettes();
      });
    });
  }

  function applyPalette(pal) {
    editedSlides.forEach(slide => {
      if (slide.background) {
        slide.background.colors = [...pal.colors];
      }
      if (slide.elements) {
        slide.elements.forEach(el => {
          if (el.type === 'divider' && el.style) el.style.color = pal.accent;
          if (el.type === 'text' && el.style) {
            if (el.style.isAccent) el.style.color = pal.accent;
            else if (!el.style.preserveColor) el.style.color = pal.text;
          }
        });
      }
      if (slide.decorations) {
        slide.decorations.forEach(d => {
          if (d.useAccent) d.color = pal.accent;
        });
      }
    });
    renderSlideStrip();
    renderCurrentSlide();
  }

  // Custom color pickers
  document.getElementById('customBg1').addEventListener('input', (e) => {
    editedSlides.forEach(s => { if (s.background && s.background.colors) s.background.colors[0] = e.target.value; });
    renderSlideStrip(); renderCurrentSlide();
  });
  document.getElementById('customBg2').addEventListener('input', (e) => {
    editedSlides.forEach(s => { if (s.background && s.background.colors) s.background.colors[1] = e.target.value; });
    renderSlideStrip(); renderCurrentSlide();
  });
  document.getElementById('customAccent').addEventListener('input', (e) => {
    const accent = e.target.value;
    editedSlides.forEach(s => {
      if (s.elements) s.elements.forEach(el => {
        if (el.type === 'divider' && el.style) el.style.color = accent;
        if (el.type === 'text' && el.style && el.style.isAccent) el.style.color = accent;
      });
      if (s.decorations) s.decorations.forEach(d => { if (d.useAccent) d.color = accent; });
    });
    renderSlideStrip(); renderCurrentSlide();
  });

  // ── Logo ──
  const logoArea = document.getElementById('logoArea');
  const logoInput = document.getElementById('logoInput');
  const removeLogo = document.getElementById('removeLogo');
  logoArea.addEventListener('click', () => logoInput.click());
  logoArea.addEventListener('dragover', e => { e.preventDefault(); logoArea.style.borderColor = 'var(--primary)'; });
  logoArea.addEventListener('dragleave', () => { logoArea.style.borderColor = ''; });
  logoArea.addEventListener('drop', e => {
    e.preventDefault(); logoArea.style.borderColor = '';
    if (e.dataTransfer.files.length) handleLogoFile(e.dataTransfer.files[0]);
  });
  logoInput.addEventListener('change', () => { if (logoInput.files[0]) handleLogoFile(logoInput.files[0]); });
  removeLogo.addEventListener('click', () => { userLogo = null; logoArea.innerHTML = 'Click or drag to upload your logo'; removeLogo.style.display = 'none'; renderCurrentSlide(); });

  function handleLogoFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      userLogo = reader.result;
      logoArea.innerHTML = `<img src="${userLogo}" alt="logo">`;
      removeLogo.style.display = '';
      renderCurrentSlide();
    };
    reader.readAsDataURL(file);
  }

  // ── Background type ──
  document.getElementById('bgType').addEventListener('change', (e) => {
    const type = e.target.value;
    editedSlides.forEach(s => {
      if (s.background) s.background.type = type;
      if (type === 'solid' && s.background.colors) s.background.color = s.background.colors[0];
    });
    renderSlideStrip(); renderCurrentSlide();
  });

  // ── Navigation ──
  document.getElementById('prevSlide').addEventListener('click', () => {
    if (currentSlideIdx > 0) { currentSlideIdx--; renderSlideStrip(); renderCurrentSlide(); updateTextProps(); }
  });
  document.getElementById('nextSlide').addEventListener('click', () => {
    if (currentSlideIdx < editedSlides.length - 1) { currentSlideIdx++; renderSlideStrip(); renderCurrentSlide(); updateTextProps(); }
  });
  document.getElementById('backToGallery').addEventListener('click', closeEditor);

  // ── Export ──
  async function loadHtml2Canvas() {
    if (window.html2canvas) return;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load export library'));
      document.head.appendChild(s);
    });
  }

  async function exportSlide(slideIdx) {
    await loadHtml2Canvas();
    const slide = editedSlides[slideIdx];
    if (!slide) return null;

    const container = document.getElementById('offscreenRender');
    const dims = currentTemplate.dimensions || { width: 1080, height: 1350 };
    const scale = dims.width / 400;

    const clone = document.createElement('div');
    clone.style.cssText = `width:${dims.width}px;height:${dims.height}px;position:absolute;left:0;top:0;`;
    container.innerHTML = '';
    container.appendChild(clone);

    const inner = document.createElement('div');
    inner.style.cssText = `width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${40 * scale}px ${36 * scale}px;text-align:center;box-sizing:border-box;background:${slideBg(slide)};overflow:hidden;position:relative;`;

    if (slide.decorations) {
      slide.decorations.forEach(d => {
        const dEl = document.createElement('div');
        if (d.type === 'border') {
          dEl.style.cssText = `position:absolute;inset:${(d.inset || 14) * scale}px;border:${(d.width || 1.5) * scale}px solid ${d.color || 'rgba(255,255,255,0.2)'};border-radius:${(d.radius || 4) * scale}px;pointer-events:none;`;
        }
        if (d.type === 'circle') {
          dEl.style.cssText = `position:absolute;width:${(d.size || 80) * scale}px;height:${(d.size || 80) * scale}px;border-radius:50%;background:${d.color || 'rgba(255,255,255,0.05)'};top:${d.top || 'auto'};left:${d.left || 'auto'};right:${d.right || 'auto'};bottom:${d.bottom || 'auto'};pointer-events:none;`;
        }
        inner.appendChild(dEl);
      });
    }

    if (slide.elements) {
      slide.elements.forEach(el => {
        const div = document.createElement('div');
        if (el.type === 'text') {
          const s = el.style || {};
          div.style.cssText = [
            `font-size:${(s.fontSize || 16) * scale}px`,
            `font-weight:${s.fontWeight || 400}`,
            `color:${s.color || '#ffffff'}`,
            `font-family:${s.fontFamily || 'Inter'},sans-serif`,
            s.letterSpacing ? `letter-spacing:${parseFloat(s.letterSpacing) * scale}${s.letterSpacing.replace(/[0-9.-]/g, '') || 'em'}` : '',
            s.textTransform ? `text-transform:${s.textTransform}` : '',
            s.lineHeight ? `line-height:${s.lineHeight}` : '',
            s.marginTop ? `margin-top:${s.marginTop * scale}px` : '',
            s.marginBottom ? `margin-bottom:${s.marginBottom * scale}px` : '',
            s.opacity ? `opacity:${s.opacity}` : '',
            s.maxWidth ? `max-width:${s.maxWidth}` : '',
            `word-break:break-word`,
          ].filter(Boolean).join(';');
          div.textContent = el.content || '';
        }
        if (el.type === 'number') {
          const s = el.style || {};
          div.style.cssText = `font-size:${(s.fontSize || 72) * scale}px;font-weight:${s.fontWeight || 900};color:${s.color || 'rgba(255,255,255,0.08)'};font-family:${s.fontFamily || 'Space Grotesk'},sans-serif;line-height:1;${s.marginBottom ? `margin-bottom:${s.marginBottom * scale}px` : ''}`;
          div.textContent = el.content || '';
        }
        if (el.type === 'divider') {
          const s = el.style || {};
          div.style.cssText = `width:${parseInt(s.width || 40) * scale}px;height:${parseInt(s.height || 3) * scale}px;background:${s.color || '#e6c15a'};border-radius:${2 * scale}px;margin:${parseInt(s.margin || 12) * scale}px 0`;
        }
        if (el.type === 'logo' && userLogo) {
          const img = document.createElement('img');
          img.src = userLogo;
          img.style.cssText = `max-width:${parseInt(el.style?.maxWidth || 80) * scale}px;max-height:${parseInt(el.style?.maxHeight || 40) * scale}px;object-fit:contain;margin:${parseInt(el.style?.margin || 8) * scale}px 0`;
          div.appendChild(img);
        }
        inner.appendChild(div);
      });
    }

    clone.appendChild(inner);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 100));

    const canvas = await window.html2canvas(clone, {
      width: dims.width,
      height: dims.height,
      scale: 1,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    container.innerHTML = '';
    return canvas;
  }

  function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  document.getElementById('exportSlide').addEventListener('click', async () => {
    const btn = document.getElementById('exportSlide');
    btn.disabled = true; btn.textContent = 'Exporting…';
    try {
      const canvas = await exportSlide(currentSlideIdx);
      if (canvas) downloadCanvas(canvas, `slide-${currentSlideIdx + 1}.png`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = 'Export slide';
  });

  document.getElementById('exportAll').addEventListener('click', async () => {
    const btn = document.getElementById('exportAll');
    btn.disabled = true;
    try {
      for (let i = 0; i < editedSlides.length; i++) {
        btn.textContent = `Exporting ${i + 1}/${editedSlides.length}…`;
        const canvas = await exportSlide(i);
        if (canvas) downloadCanvas(canvas, `slide-${i + 1}.png`);
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = 'Export all';
  });

  // ── License ──
  function showLicenseModal() {
    document.getElementById('licenseModal').style.display = 'flex';
  }

  document.getElementById('licenseBtn').addEventListener('click', showLicenseModal);
  document.getElementById('licenseClose').addEventListener('click', () => {
    document.getElementById('licenseModal').style.display = 'none';
  });

  document.getElementById('licenseSubmit').addEventListener('click', async () => {
    const input = document.getElementById('licenseInput');
    const alert = document.getElementById('licenseAlert');
    const key = input.value.trim();
    if (!key) { showEl(alert, 'error', 'Please enter a license key'); return; }
    try {
      const res = await API.post('/api/carousel/validate-license', { license_key: key });
      if (res.valid) {
        licensed = true;
        licenseKey = key;
        localStorage.setItem('carousel_license', key);
        document.getElementById('licenseModal').style.display = 'none';
        updateLicenseUI();
        loadGallery();
      } else {
        showEl(alert, 'error', 'Invalid license key. Check for typos or buy a new one.');
      }
    } catch (e) {
      showEl(alert, 'error', e.message);
    }
  });

  document.getElementById('licenseBuy').addEventListener('click', () => {
    document.getElementById('licenseModal').style.display = 'none';
    document.getElementById('checkoutModal').style.display = 'flex';
  });

  document.getElementById('licenseRecover').addEventListener('click', () => {
    document.getElementById('licenseModal').style.display = 'none';
    document.getElementById('recoverModal').style.display = 'flex';
  });

  document.getElementById('recoverSubmit').addEventListener('click', async () => {
    const email = document.getElementById('recoverEmail').value.trim();
    const alert = document.getElementById('recoverAlert');
    if (!email) { showEl(alert, 'error', 'Enter your email'); return; }
    try {
      const res = await API.post('/api/carousel/recover-license', { email });
      if (res.found) {
        showEl(alert, 'success', 'License key sent to your email! Check your inbox.');
      } else {
        showEl(alert, 'error', 'No license found for this email. Did you use a different one?');
      }
    } catch (e) {
      showEl(alert, 'error', e.message);
    }
  });
  document.getElementById('recoverCancel').addEventListener('click', () => {
    document.getElementById('recoverModal').style.display = 'none';
  });

  // ── Checkout ──
  document.getElementById('buyCancel').addEventListener('click', () => {
    document.getElementById('checkoutModal').style.display = 'none';
  });

  document.getElementById('buySubmit').addEventListener('click', async () => {
    const name = document.getElementById('buyName').value.trim();
    const email = document.getElementById('buyEmail').value.trim();
    const phone = document.getElementById('buyPhone').value.trim();
    const alert = document.getElementById('buyAlert');
    const btn = document.getElementById('buySubmit');
    if (!name || !email) { showEl(alert, 'error', 'Name and email are required'); return; }

    btn.disabled = true; btn.textContent = 'Starting payment…';
    const reset = () => { btn.disabled = false; btn.textContent = 'Pay ₹499 & get license key'; };

    try {
      const product = await API.get('/api/courses/carousel-editor');
      const order = await API.post('/api/orders', {
        course_id: product.id,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
      });
      await window.Checkout.payAndVerify(order, {
        onSuccess: async (result) => {
          document.getElementById('checkoutModal').style.display = 'none';
          const key = result && result.license_key;
          if (key) {
            licensed = true;
            licenseKey = key;
            localStorage.setItem('carousel_license', key);
            updateLicenseUI();
            loadGallery();
            showPaymentSuccess(key);
          } else {
            showPaymentSuccess(null);
          }
        },
        onError: (e) => { showEl(alert, 'error', e.message); reset(); },
        onDismiss: reset,
      });
    } catch (e) {
      showEl(alert, 'error', e.message);
      reset();
    }
  });

  function showPaymentSuccess(key) {
    const modal = document.getElementById('licenseModal');
    const card = modal.querySelector('.license-card');
    card.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:12px">🎉</div>
        <h3 style="margin:0 0 8px">You're all set!</h3>
        <p style="color:var(--muted);margin:0 0 16px;font-size:14px">All templates are now unlocked. Your license key has been emailed to you.</p>
        ${key ? `<div style="background:rgba(109,107,255,0.1);border:1px solid var(--border);border-radius:10px;padding:14px;font-family:monospace;font-size:14px;letter-spacing:1px;word-break:break-all;margin-bottom:16px">${esc(key)}</div>` : ''}
        <button class="btn btn-primary" style="width:100%" onclick="this.closest('.license-modal').style.display='none'">Start creating →</button>
      </div>`;
    modal.style.display = 'flex';
  }

  function updateLicenseUI() {
    const status = document.getElementById('licenseStatus');
    const btn = document.getElementById('licenseBtn');
    if (licensed) {
      status.innerHTML = '<span style="color:var(--success)">✓ Pro unlocked</span>';
      btn.textContent = 'Manage license';
    } else {
      status.textContent = 'Free plan · 3 templates';
      btn.textContent = 'Enter license key';
    }
  }

  function showEl(el, type, msg) {
    el.className = `alert ${type}`;
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  // ── Init ──
  async function init() {
    if (licenseKey) {
      try {
        const res = await API.post('/api/carousel/validate-license', { license_key: licenseKey });
        if (res.valid) licensed = true;
        else localStorage.removeItem('carousel_license');
      } catch (e) { /* ignore */ }
    }
    updateLicenseUI();
    await Promise.all([loadGallery(), loadCategories()]);

    const params = new URLSearchParams(location.search);
    const tplSlug = params.get('template');
    if (tplSlug) {
      const tpl = templates.find(t => t.slug === tplSlug);
      if (tpl && (tpl.is_free || licensed)) openEditor(tpl);
      else if (tpl) showLicenseModal();
    }
  }

  init();
})();
