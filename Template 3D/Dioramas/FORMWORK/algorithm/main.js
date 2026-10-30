/* ALGORITHM — seeded flow-field hero + generative gallery
   (circle packing · Truchet contours · de Jong attractor).
   Everything derives from one 32-bit seed carried in the URL. */
(() => {
  document.documentElement.classList.add('js');    // gate reveal-hiding on JS presence
  const docEl = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const BG = '#0c0d0f';

  /* ---------- seed in the URL ---------- */
  const parseSeed = () => {
    try {
      const raw = new URLSearchParams(location.search).get('seed');
      if (raw && /^\d{1,10}$/.test(raw)) { const n = parseInt(raw, 10) >>> 0; if (n) return n; }
    } catch (e) {}
    return 0;
  };
  const randomSeed = () => (((Math.random() * 0xffffffff) >>> 0) || 0x1a2b3c4d);
  let seed = parseSeed() || randomSeed();
  const syncURL = () => {
    try { const u = new URL(location.href); u.searchParams.set('seed', String(seed)); history.replaceState(null, '', u); } catch (e) {}
  };

  /* ---------- mulberry32 PRNG ---------- */
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- palette from seed ---------- */
  const pal = {};
  function derivePalette(s) {
    const r = mulberry32(s >>> 0);
    pal.hue = Math.floor(r() * 360);
    pal.sat = 60 + Math.floor(r() * 24);
    pal.lig = 54 + Math.floor(r() * 9);
    pal.hue2 = (pal.hue + 16 + Math.floor(r() * 50)) % 360;
    docEl.style.setProperty('--accent', `hsl(${pal.hue} ${pal.sat}% ${pal.lig}%)`);
    docEl.style.setProperty('--accent-2', `hsl(${pal.hue2} ${pal.sat}% ${pal.lig + 4}%)`);
    docEl.style.setProperty('--accent-soft', `hsla(${pal.hue}, ${pal.sat}%, ${pal.lig}%, 0.14)`);
  }

  /* ---------- seeded Perlin noise + fBm ---------- */
  function makeNoise(rng) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + (b - a) * t;
    const grad = (h, x, y) => {
      switch (h & 7) {
        case 0: return x + y; case 1: return x - y; case 2: return -x + y; case 3: return -x - y;
        case 4: return x; case 5: return -x; case 6: return y; default: return -y;
      }
    };
    return (x, y) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y);
      const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
      const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
      return lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
                  lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
    };
  }
  const fbm = (n, x, y) => {
    let v = 0, amp = 0.5, f = 1;
    for (let i = 0; i < 4; i++) { v += amp * n(x * f, y * f); f *= 2; amp *= 0.5; }
    return v;
  };

  const canvasOK = !!document.createElement('canvas').getContext;
  if (!canvasOK) docEl.classList.add('no-canvas');

  /* ---------- hero flow field ---------- */
  const field = (() => {
    const canvas = document.getElementById('field');
    if (!canvas || !canvasOK) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) { docEl.classList.add('no-canvas'); return null; }
    let w = 0, h = 0, dpr = 1, particles = [], noise = null, raf = 0;
    const cfg = {};
    const pcountEl = document.getElementById('pcount');

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeColor(rand) {
      const a = 0.045 + rand() * 0.05;
      if (rand() < 0.13) return `hsla(42, 26%, 90%, ${(a + 0.02).toFixed(3)})`; // rare white ink
      const hue = Math.round(pal.hue + (pal.hue2 - pal.hue) * rand());
      const l = Math.round(pal.lig - 8 + rand() * 22);
      return `hsla(${hue}, ${pal.sat}%, ${l}%, ${a.toFixed(3)})`;
    }
    function spawn(rand, pt) {
      pt = pt || {};
      pt.x = rand() * w; pt.y = rand() * h;
      pt.life = 0; pt.max = 50 + ((rand() * 190) | 0);
      pt.col = makeColor(rand);
      return pt;
    }

    function setup() {
      const rng = mulberry32((seed ^ 0x51ED2701) >>> 0);   // own stream, still seed-locked
      noise = makeNoise(rng);
      cfg.scale = 0.0011 + rng() * 0.0015;
      cfg.turns = 1.4 + rng() * 2.3;
      cfg.speed = 0.85;
      const count = Math.round(Math.min(3200, Math.max(650, (w * h) / 430)));
      particles = new Array(count);
      for (let i = 0; i < count; i++) particles[i] = spawn(rng, null);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      if (pcountEl) pcountEl.textContent = count.toLocaleString() + ' PARTICLES';
    }

    function advance(fadeOn) {
      if (fadeOn) { ctx.fillStyle = 'rgba(12,13,15,0.024)'; ctx.fillRect(0, 0, w, h); }
      ctx.lineWidth = 1.15; ctx.lineCap = 'round';
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const ang = fbm(noise, pt.x * cfg.scale, pt.y * cfg.scale) * TAU * cfg.turns;
        const nx = pt.x + Math.cos(ang) * cfg.speed;
        const ny = pt.y + Math.sin(ang) * cfg.speed;
        ctx.strokeStyle = pt.col;
        ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(nx, ny); ctx.stroke();
        pt.x = nx; pt.y = ny; pt.life++;
        if (pt.life > pt.max || nx < -12 || nx > w + 12 || ny < -12 || ny > h + 12) spawn(Math.random, pt);
      }
    }

    function loop() { advance(true); raf = requestAnimationFrame(loop); }

    function render() {
      cancelAnimationFrame(raf);
      resize(); setup();
      if (reduce) { for (let s = 0; s < 200; s++) advance(false); } // one dense static frame
      else loop();
    }

    let rt = 0;
    function onResize() { clearTimeout(rt); rt = setTimeout(render, 200); }
    return { render, onResize };
  })();

  /* ---------- gallery helpers ---------- */
  function fit(canvas) {
    if (!canvas || !canvasOK) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth || 320, h = canvas.clientHeight || 320;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }
  const accentStroke = (a) => `hsla(${pal.hue},${pal.sat}%,${pal.lig}%,${a})`;

  /* piece 01 — circle packing */
  function renderPacking(canvas) {
    const f = fit(canvas); if (!f) return; const { ctx, w, h } = f;
    const rng = mulberry32((seed ^ 0x9E3779B1) >>> 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = 8, circles = [], cap = Math.min(46, Math.min(w, h) * 0.16);
    let tries = 0;
    while (circles.length < 300 && tries < 5200) {
      tries++;
      const x = pad + rng() * (w - 2 * pad), y = pad + rng() * (h - 2 * pad);
      let mr = Math.min(x - pad, y - pad, w - pad - x, h - pad - y, cap), ok = true;
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i], d = Math.hypot(x - c.x, y - c.y) - c.r;
        if (d < 2.2) { ok = false; break; }
        if (d < mr) mr = d;
      }
      if (ok && mr > 2.6) circles.push({ x, y, r: mr - 1.4 });
    }
    for (let i = 0; i < circles.length; i++) {
      const c = circles[i], accent = rng() < 0.36;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU);
      ctx.lineWidth = accent ? 1.3 : 1;
      ctx.strokeStyle = accent ? accentStroke(0.92) : 'rgba(233,231,225,0.5)';
      ctx.stroke();
      if (accent && c.r > 9) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 0.42, 0, TAU); ctx.strokeStyle = accentStroke(0.42); ctx.stroke(); }
    }
  }

  /* piece 02 — Truchet contours */
  function renderTruchet(canvas) {
    const f = fit(canvas); if (!f) return; const { ctx, w, h } = f;
    const rng = mulberry32((seed ^ 0x2545F491) >>> 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const n = 6 + Math.floor(rng() * 4), ts = w / n, rows = Math.ceil(h / ts) + 1;
    ctx.lineWidth = Math.max(1.4, ts * 0.13); ctx.lineCap = 'round';
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const x = gx * ts, y = gy * ts, accent = rng() < 0.32;
        ctx.strokeStyle = accent ? accentStroke(0.95) : 'rgba(233,231,225,0.5)';
        ctx.beginPath();
        if (rng() < 0.5) {
          ctx.arc(x, y, ts / 2, 0, Math.PI / 2);
          ctx.moveTo(x + ts, y + ts); ctx.arc(x + ts, y + ts, ts / 2, Math.PI, Math.PI * 1.5);
        } else {
          ctx.arc(x + ts, y, ts / 2, Math.PI / 2, Math.PI);
          ctx.moveTo(x, y + ts); ctx.arc(x, y + ts, ts / 2, Math.PI * 1.5, TAU);
        }
        ctx.stroke();
      }
    }
  }

  /* piece 03 — de Jong strange attractor */
  function renderAttractor(canvas) {
    const f = fit(canvas); if (!f) return; const { ctx, w, h } = f;
    const rng = mulberry32((seed ^ 0xB5297A4D) >>> 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const P = () => (rng() * 2 - 1) * 2.4;
    const a = P(), b = P(), c = P(), d = P();
    let x = 0, y = 0;
    const cx = w / 2, cy = h / 2, scale = Math.min(w, h) / 4.5;
    ctx.fillStyle = `hsla(${pal.hue},${pal.sat}%,${pal.lig + 8}%,0.44)`;
    const N = Math.min(85000, Math.round(w * h * 0.85));
    for (let i = 0; i < N; i++) {
      const xn = Math.sin(a * y) - Math.cos(b * x);
      const yn = Math.sin(c * x) - Math.cos(d * y);
      x = xn; y = yn;
      if (i > 24) ctx.fillRect(cx + x * scale, cy + y * scale, 0.9, 0.9);
    }
  }

  const pieces = [
    { el: document.getElementById('piece-packing'), fn: renderPacking },
    { el: document.getElementById('piece-truchet'), fn: renderTruchet },
    { el: document.getElementById('piece-attractor'), fn: renderAttractor },
  ];
  let gt = 0;
  function renderGallery() {
    for (const p of pieces) if (p.el) p.fn(p.el);
    const label = '#' + seed;
    document.querySelectorAll('[data-seed-label]').forEach(el => { el.textContent = label; });
  }

  /* ---------- seed UI ---------- */
  const seedValEl = document.getElementById('seedVal');
  const updateSeedUI = () => { if (seedValEl) seedValEl.textContent = String(seed).padStart(10, '0'); };

  function applySeed(newSeed, push) {
    seed = newSeed >>> 0; if (!seed) seed = randomSeed();
    derivePalette(seed);
    updateSeedUI();
    if (push) syncURL();
    if (field) field.render();
    renderGallery();
  }

  /* ---------- boot ---------- */
  derivePalette(seed);
  updateSeedUI();
  syncURL();
  if (field) field.render();
  renderGallery();

  const regen = document.getElementById('regen');
  if (regen) regen.addEventListener('click', () => applySeed(randomSeed(), true));

  const copyBtn = document.getElementById('copy');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const s = copyBtn.querySelector('span') || copyBtn, original = s.textContent;
    const done = () => { s.textContent = 'Copied'; copyBtn.classList.add('ok'); setTimeout(() => { s.textContent = original; copyBtn.classList.remove('ok'); }, 1400); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done);
      else {
        const t = document.createElement('textarea'); t.value = location.href; t.setAttribute('readonly', '');
        t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t); done();
      }
    } catch (e) {}
  });

  window.addEventListener('resize', () => {
    if (field) field.onResize();
    clearTimeout(gt); gt = setTimeout(renderGallery, 240);
  }, { passive: true });

  /* ---------- hero intro (compositor-driven) ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
    setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe
  }

  /* ---------- scroll reveals ---------- */
  const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  if (reduce || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(el => { if (!el.closest('.hero')) io.observe(el); });
  }

  /* ---------- nav backdrop ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.72);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---------- custom cursor ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const cur = document.querySelector('.cursor');
    if (cur) {
      const p = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
      addEventListener('pointermove', e => { p.tx = e.clientX; p.ty = e.clientY; }, { passive: true });
      (function loop() { p.x += (p.tx - p.x) * 0.22; p.y += (p.ty - p.y) * 0.22;
        cur.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
      document.querySelectorAll('a,button,.piece').forEach(el => {
        el.addEventListener('pointerenter', () => cur.classList.add('hot'));
        el.addEventListener('pointerleave', () => cur.classList.remove('hot'));
      });
    }
  }
})();
