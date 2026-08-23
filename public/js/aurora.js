/* ============================================================================
   DropDash — Aurora interaction layer
   · Infinite Grid hero background (scrolling SVG grid + cursor-reveal mask + orbs)
   · Magnetic buttons · scroll reveals · header state · gentle card tilt
   Pure JS/CSS, no build step. Everything degrades under reduced-motion.
   ========================================================================== */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Header state on scroll ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Magnetic buttons + card tilt ---------- */
  if (!reduced && finePointer) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var strength = 0.32;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - (r.left + r.width / 2)) * strength).toFixed(1) + 'px');
        el.style.setProperty('--my', ((e.clientY - (r.top + r.height / 2)) * strength).toFixed(1) + 'px');
      });
      el.addEventListener('mouseleave', function () {
        el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px');
      });
    });

    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Infinite Grid — full-page background ---------- */
  var gridBg = document.querySelector('.grid-bg');
  if (!gridBg) {
    gridBg = document.createElement('div');
    gridBg.className = 'grid-bg';
    gridBg.setAttribute('aria-hidden', 'true');
    gridBg.innerHTML =
      '<svg class="grid-layer grid-base"><defs><pattern id="igA" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#igA)"/></svg>' +
      '<svg class="grid-layer grid-reveal"><defs><pattern id="igB" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#igB)"/></svg>' +
      '<span class="orb orb-1"></span><span class="orb orb-2"></span><span class="orb orb-3"></span>';
    document.body.insertBefore(gridBg, document.body.firstChild);
  }

  var patterns = gridBg.querySelectorAll('pattern');
  var reveal = gridBg.querySelector('.grid-reveal');

  // Cursor reveals the bright grid layer anywhere on the page (fixed viewport coords).
  if (!reduced && finePointer && reveal) {
    window.addEventListener('mousemove', function (e) {
      var m = 'radial-gradient(340px circle at ' + e.clientX + 'px ' + e.clientY +
        'px, #000, transparent)';
      reveal.style.webkitMaskImage = m;
      reveal.style.maskImage = m;
    }, { passive: true });
  }

  // Infinite scroll: nudge the pattern origin each frame, wrapping at the 40px cell.
  var ox = 0, oy = 0, speed = 0.5, running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden; if (running && !reduced) requestAnimationFrame(tick);
  });
  function tick() {
    ox = (ox + speed) % 40; oy = (oy + speed) % 40;
    for (var i = 0; i < patterns.length; i++) {
      patterns[i].setAttribute('x', ox);
      patterns[i].setAttribute('y', oy);
    }
    if (running && !reduced) requestAnimationFrame(tick);
  }
  tick();
})();
