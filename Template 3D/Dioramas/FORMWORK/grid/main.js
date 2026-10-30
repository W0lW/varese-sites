/* ===========================================================
   GRID SYSTEM — modular grid engine + restrained motion layer
   Signature: a real, toggleable column + baseline overlay,
   a live crosshair readout, count-up figures, and expanding
   project records. Everything degrades gracefully.
   =========================================================== */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;

  /* ---------- hero intro: CSS/compositor driven (never blank) ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
    setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe
  }

  /* ---------- nav backdrop after leaving the hero ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* =========================================================
     SIGNATURE — the grid overlay
     ========================================================= */
  const html = document.documentElement;
  const overlay = document.getElementById('gridOverlay');
  const toggleBtn = document.getElementById('gridToggle');
  const hudState = document.getElementById('hudState');
  const status = document.getElementById('gridStatus');
  const cross = document.getElementById('goCross');
  const readOut = document.getElementById('goRead');
  let gridOn = false;

  function setGrid(on) {
    gridOn = on;
    html.classList.toggle('grid-on', on);
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (hudState) hudState.textContent = on ? 'GRID · ON' : 'GRID · OFF';
    if (status) status.textContent = on ? 'Modular grid revealed.' : 'Modular grid hidden.';
    if (on) startBaseline(); else stopBaseline();
  }
  const toggleGrid = () => setGrid(!gridOn);

  if (toggleBtn) toggleBtn.addEventListener('click', toggleGrid);

  // keyboard: G toggles, unless typing in a field
  addEventListener('keydown', (e) => {
    if (e.key !== 'g' && e.key !== 'G') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    toggleGrid();
  });

  // baseline appears anchored to the document as you scroll (module = 32px)
  const MODULE = 32;
  let baselineRAF = 0;
  const applyBaseline = () => {
    baselineRAF = 0;
    overlay && overlay.style.setProperty('--bl', (-(window.scrollY % MODULE)) + 'px');
  };
  const onBaselineScroll = () => { if (!baselineRAF) baselineRAF = requestAnimationFrame(applyBaseline); };
  function startBaseline() {
    if (reduce || !overlay) return;
    applyBaseline();
    addEventListener('scroll', onBaselineScroll, { passive: true });
  }
  function stopBaseline() {
    removeEventListener('scroll', onBaselineScroll);
    if (baselineRAF) { cancelAnimationFrame(baselineRAF); baselineRAF = 0; }
  }

  // live crosshair + coordinate readout (only fine pointers)
  if (overlay && cross && finePointer && !reduce) {
    let crossRAF = 0, mx = 0, my = 0;
    const paint = () => {
      crossRAF = 0;
      cross.style.setProperty('--cx', mx + 'px');
      cross.style.setProperty('--cy', my + 'px');
      if (readOut) {
        const cxg = String(Math.round(mx)).padStart(4, '0');
        const cyg = String(Math.round(my)).padStart(4, '0');
        readOut.innerHTML = 'X&nbsp;' + cxg + '&nbsp;·&nbsp;Y&nbsp;' + cyg;
      }
    };
    addEventListener('pointermove', (e) => {
      if (!gridOn) return;
      mx = e.clientX; my = e.clientY;
      cross.classList.add('active');
      if (!crossRAF) crossRAF = requestAnimationFrame(paint);
    }, { passive: true });
    addEventListener('pointerleave', () => cross.classList.remove('active'));
  }

  /* =========================================================
     Project index — expandable records (mouse / touch / keys)
     ========================================================= */
  document.querySelectorAll('.p-group').forEach((group) => {
    const row = group.querySelector('.p-row');
    if (!row) return;
    const toggle = () => {
      const open = group.classList.toggle('open');
      row.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* =========================================================
     Count-up figures (IntersectionObserver — GSAP-independent)
     ========================================================= */
  const format = (n, pad) => pad ? String(n).padStart(+pad, '0') : n.toLocaleString('en-US');
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    const pad = el.dataset.pad;
    if (reduce) { el.textContent = format(target, pad); return; }
    const dur = 1150, start = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = format(Math.round(target * e), pad);
      if (p < 1) requestAnimationFrame(step); else el.textContent = format(target, pad);
    })(start);
  }
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) { countUp(ent.target); obs.unobserve(ent.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => io.observe(el));
  } else {
    counters.forEach(countUp); // ancient fallback — just show final values
  }

  /* =========================================================
     Reveals + magnetic (GSAP if present, safe fallback if not)
     ========================================================= */
  const revealAll = () => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-in'));
  // hard failsafe: if GSAP never loads, never leave content hidden
  setTimeout(() => { if (!window.gsap) revealAll(); }, 2200);

  addEventListener('load', () => {
    if (!window.gsap) { revealAll(); return; }
    const { gsap } = window;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // scroll reveals (skip hero — it animates on .loaded)
    gsap.utils.toArray('.reveal:not(.hero .reveal)').forEach((el) => {
      if (window.ScrollTrigger) {
        window.ScrollTrigger.create({ trigger: el, start: 'top 90%', onEnter: () => el.classList.add('is-in') });
      } else { el.classList.add('is-in'); }
    });

    // subtle magnetic on the accent controls (grid toggle + contact mail)
    if (!reduce && finePointer) {
      document.querySelectorAll('.magnetic').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, {
            x: (e.clientX - r.left - r.width / 2) * 0.28,
            y: (e.clientY - r.top - r.height / 2) * 0.4,
            duration: 0.5, ease: 'power3.out'
          });
        });
        el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' }));
      });
    }
  });
})();
