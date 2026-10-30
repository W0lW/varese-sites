/* ============================================================
   DRIFTWEAR — AW26 · DRIFT
   Signature: a cursor-follow parallax hero + generative duotone
   "fabric drape" panels (image-free garments), plus a drag/snap
   lookbook. No 3D library, no build step — one seeded canvas
   routine renders every garment.
   ============================================================ */
(() => {
  'use strict';
  document.documentElement.classList.add('js'); // belt & suspenders (also inlined in <head>)

  const docEl = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- seeded PRNG (mulberry32) ---------- */
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- colour helpers ---------- */
  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mixRgb = (a, b, t) =>
    `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;

  /* ---------- feature-detect canvas ---------- */
  const canvasOK = (() => {
    try { return !!document.createElement('canvas').getContext('2d'); }
    catch (e) { return false; }
  })();
  if (!canvasOK) docEl.classList.add('no-canvas');

  /* ============================================================
     HERO INTRO — CSS/compositor-driven via .loaded (never a blank hero).
     Registered FIRST so nothing downstream can strand the hero hidden.
     ============================================================ */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
    setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe
  }

  /* ============================================================
     THE DRAPE — a duotone draped-fabric panel from one integer seed.
     Vertical folds slant with a per-seed tilt; a light term shades the
     ridges toward the highlight colour, valleys toward the shadow colour.
     Fully generative — this is how every "garment" is drawn, no photos.
     ============================================================ */
  function drawDrape(canvas, seed, loHex, hiHex) {
    if (!canvasOK || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 420;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rng = mulberry32(seed >>> 0);
    const folds = 6 + Math.floor(rng() * 7);   // number of vertical folds
    const phase = rng() * TAU;
    const sharp = 0.7 + rng() * 1.5;           // fold contrast
    const tilt = (rng() * 2 - 1) * 0.55;       // diagonal drape
    const ripFreq = 2 + rng() * 3;             // secondary cloth ripple
    const ripPh = rng() * TAU;
    const bias = rng() * 0.18;                 // where the light pools
    const lo = hexToRgb(loHex), hi = hexToRgb(hiHex);

    const step = 2;
    for (let x = 0; x <= w; x += step) {
      const fx = x / w;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      for (let s = 0; s <= 4; s++) {
        const yy = s / 4;
        // main folds shift horizontally as y increases -> the cloth drapes
        const u = (fx * folds + tilt * yy + phase);
        let b = 0.5 + 0.5 * Math.sin(u * TAU);
        b += 0.12 * Math.sin((fx * ripFreq + yy * 1.6) * TAU + ripPh); // cloth grain
        b += bias * Math.sin(fx * Math.PI);                            // broad envelope
        b = clamp(b, 0, 1);
        b = Math.pow(b, sharp);
        b = clamp(b * (1.05 - yy * 0.14), 0, 1);                       // top catches light
        grad.addColorStop(yy, mixRgb(lo, hi, b));
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, step + 1, h);
    }

    // depth vignette
    const vg = ctx.createRadialGradient(w / 2, h * 0.4, Math.min(w, h) * 0.1, w / 2, h * 0.52, Math.max(w, h) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  /* ---------- render every garment ---------- */
  const looks = [];
  document.querySelectorAll('.look').forEach((li) => {
    const canvas = li.querySelector('canvas.drape');
    const seed = parseInt(li.getAttribute('data-seed'), 10) || 1;
    const lo = li.getAttribute('data-lo') || '#0d0d0e';
    const hi = li.getAttribute('data-hi') || '#c9a68a';
    looks.push({ canvas, seed, lo, hi });
  });
  const heroCanvas = document.getElementById('heroDrape');

  function renderAll() {
    try {
      drawDrape(heroCanvas, 4, '#0d0d0e', '#c9a68a');
      looks.forEach((l) => drawDrape(l.canvas, l.seed, l.lo, l.hi));
    } catch (e) { /* canvas issue → CSS duotone fallback shows */ }
  }
  renderAll();

  /* ---------- redraw on resize (debounced) ---------- */
  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(renderAll, 220);
  }, { passive: true });

  /* ============================================================
     SIGNATURE — cursor-follow parallax over the hero.
     Layers translate by data-depth (px) toward/away from the pointer;
     the look panel also tilts in 3D. Starts only after the intro so it
     inherits a clean transform:none resting state (no jump).
     ============================================================ */
  function bindSheen() {
    // a soft highlight that tracks the pointer inside each garment panel
    document.querySelectorAll('.look-panel, .look-hero').forEach((panel) => {
      const sheen = panel.querySelector('.look-sheen');
      if (!sheen) return;
      panel.addEventListener('pointermove', (e) => {
        const r = panel.getBoundingClientRect();
        sheen.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        sheen.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      }, { passive: true });
    });
  }

  if (hero && fine && !reduce) {
    bindSheen();
    const layers = Array.from(hero.querySelectorAll('[data-depth]')).map((el) => ({
      el,
      depth: parseFloat(el.getAttribute('data-depth')) || 0,
      tilt: el.hasAttribute('data-tilt'),
      cx: 0, cy: 0, tx: 0, ty: 0
    }));
    let px = 0, py = 0, tpx = 0, tpy = 0, active = false, raf = 0;

    const onMove = (e) => {
      const r = hero.getBoundingClientRect();
      tpx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      tpy = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
    };

    const frame = () => {
      px = lerp(px, tpx, 0.07);
      py = lerp(py, tpy, 0.07);
      for (const L of layers) {
        L.tx = lerp(L.tx, px * L.depth, 0.12);
        L.ty = lerp(L.ty, py * L.depth, 0.12);
        let tf = `translate3d(${L.tx.toFixed(2)}px,${L.ty.toFixed(2)}px,0)`;
        if (L.tilt) tf += ` rotateY(${(px * 6).toFixed(2)}deg) rotateX(${(-py * 6).toFixed(2)}deg)`;
        L.el.style.transform = tf;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (active) return;
      active = true;
      hero.classList.add('px-on');
      window.addEventListener('pointermove', onMove, { passive: true });
      raf = requestAnimationFrame(frame);
    };
    // start after the intro settles so the handoff is seamless
    setTimeout(start, 1500);
  }

  /* ============================================================
     CUSTOM CURSOR — a ring that reads "VIEW" / "DRAG" over panels
     ============================================================ */
  if (fine && !reduce) {
    const cur = document.querySelector('.cursor');
    const label = cur && cur.querySelector('.cursor-label');
    if (cur && label) {
      let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
      window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
      (function loop() {
        cx = lerp(cx, tx, 0.24); cy = lerp(cy, ty, 0.24);
        cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
        requestAnimationFrame(loop);
      })();
      document.addEventListener('pointerover', (e) => {
        const t = e.target;
        const dc = t.closest ? t.closest('[data-cursor]') : null;
        const link = t.closest ? t.closest('a,button') : null;
        if (dc) {
          label.textContent = dc.getAttribute('data-cursor') || 'VIEW';
          cur.classList.add('is-active'); cur.classList.remove('is-link');
        } else if (link) {
          cur.classList.add('is-link'); cur.classList.remove('is-active');
        } else {
          cur.classList.remove('is-active', 'is-link');
        }
      });
      document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
      document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
    }
  }

  /* ============================================================
     LOOKBOOK — drag-to-scroll with snap, arrows, and a progress bar
     ============================================================ */
  const track = document.getElementById('track');
  if (track) {
    const progress = document.getElementById('progress');
    const prev = document.getElementById('prev');
    const next = document.getElementById('next');

    const stepSize = () => {
      const card = track.querySelector('.look');
      if (!card) return track.clientWidth * 0.6;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return card.offsetWidth + gap;
    };

    const updateUI = () => {
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 0;
      const ratio = track.scrollWidth > 0 ? clamp(track.clientWidth / track.scrollWidth, 0.08, 1) : 1;
      if (progress) {
        progress.style.width = (ratio * 100) + '%';
        progress.style.transform = `translateX(${(p * ((1 - ratio) / ratio) * 100).toFixed(2)}%)`;
      }
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };
    updateUI();

    track.addEventListener('scroll', updateUI, { passive: true });
    window.addEventListener('resize', () => setTimeout(updateUI, 240), { passive: true });

    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -stepSize(), behavior: reduce ? 'auto' : 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: stepSize(), behavior: reduce ? 'auto' : 'smooth' }));

    // keyboard support when the row is focused
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: stepSize(), behavior: reduce ? 'auto' : 'smooth' }); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -stepSize(), behavior: reduce ? 'auto' : 'smooth' }); }
    });

    // pointer drag (mouse / pen) with light momentum
    let down = false, startX = 0, startScroll = 0, vx = 0, lastX = 0, moved = false, momRaf = 0;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // native touch scroll is best on touch
      down = true; moved = false;
      startX = lastX = e.clientX;
      startScroll = track.scrollLeft;
      vx = 0;
      cancelAnimationFrame(momRaf);
      track.classList.add('dragging');
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    });
    track.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      track.scrollLeft = startScroll - dx;
      vx = e.clientX - lastX;
      lastX = e.clientX;
    });
    const release = (e) => {
      if (!down) return;
      down = false;
      track.classList.remove('dragging'); // re-enable scroll-snap
      try { track.releasePointerCapture(e.pointerId); } catch (err) {}
      // brief momentum before snap re-engages
      if (!reduce && Math.abs(vx) > 2) {
        let v = clamp(vx, -60, 60);
        const glide = () => {
          track.scrollLeft -= v;
          v *= 0.9;
          if (Math.abs(v) > 0.5) momRaf = requestAnimationFrame(glide);
        };
        momRaf = requestAnimationFrame(glide);
      }
    };
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    // swallow the click that ends a drag so it never feels like a mis-tap
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ============================================================
     SCROLL REVEALS — JS-gated; fall back to visible if unsupported
     ============================================================ */
  const revealAll = () => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
  if (reduce || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal:not(.look)').forEach((el) => io.observe(el));

    // looks live in a horizontal scroller — reveal the whole row when it enters
    const lb = document.querySelector('.lookbook');
    if (lb) {
      const lbIo = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            document.querySelectorAll('.look.reveal').forEach((l) => l.classList.add('is-in'));
            lbIo.disconnect();
          }
        });
      }, { threshold: 0.04 });
      lbIo.observe(lb);
    } else {
      document.querySelectorAll('.look.reveal').forEach((l) => l.classList.add('is-in'));
    }
  }
})();
