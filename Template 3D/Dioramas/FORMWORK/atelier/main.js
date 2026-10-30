/* ATELIER NOIR — horizontal drag-scroll gallery (drag + inertia + wheel-to-horizontal
   + parallax between a plate's ground and its type) · custom "Drag" cursor · serif reveals.
   Everything degrades gracefully: the gallery is a native scroll container, so even if this
   whole file fails to run, all six looks remain reachable. */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFine = matchMedia('(pointer: fine)').matches;

  /* ---------- nav backdrop ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- cover intro (CSS/compositor driven, never rAF-dependent) ---------- */
  const cover = document.querySelector('.cover');
  if (cover) {
    requestAnimationFrame(() => requestAnimationFrame(() => cover.classList.add('loaded')));
    setTimeout(() => cover.classList.add('loaded'), 400); // hard failsafe — hero is never blank
  }

  /* ---------- scroll reveals (GSAP if present, else a plain failsafe) ---------- */
  const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  setTimeout(() => { if (!window.gsap) revealAll(); }, 2500);
  window.addEventListener('load', () => {
    if (!window.gsap) { revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal').filter(el => !el.closest('.cover')).forEach(el =>
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') }));
  });

  /* ---------- custom cursor ---------- */
  const cursorEl = document.querySelector('.cursor');
  const cur = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
  const cursorLive = cursorEl && !reduce && hasFine;
  if (cursorLive) {
    document.documentElement.classList.add('cursor-on'); // hides the native cursor only when ours is live
    addEventListener('pointermove', e => { cur.tx = e.clientX; cur.ty = e.clientY; }, { passive: true });
  }

  /* ============================================================
     THE SIGNATURE TECHNIQUE — horizontal drag gallery
     ============================================================ */
  const vp = document.getElementById('viewport');
  const plates = vp ? [...vp.querySelectorAll('.plate')] : [];
  const gpFill = document.getElementById('gpFill');
  const gpIndex = document.getElementById('gpIndex');

  const galleryLive = vp && plates.length && !reduce;

  if (galleryLive) {
    const maxScroll = () => Math.max(0, vp.scrollWidth - vp.clientWidth);
    let vel = 0;              // inertia velocity, px per frame
    let dragging = false;
    let moved = false;

    /* ---- pointer drag (mouse only; touch uses native momentum scroll) ---- */
    let startX = 0, startScroll = 0, lastX = 0, lastT = 0;
    vp.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      dragging = true; moved = false; vel = 0;
      startX = e.clientX; startScroll = vp.scrollLeft;
      lastX = e.clientX; lastT = performance.now();
      if (cursorEl) cursorEl.classList.add('grabbing');
      vp.classList.add('dragging');
      try { vp.setPointerCapture(e.pointerId); } catch (_) {}
    });
    vp.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      vp.scrollLeft = startScroll - dx;
      const now = performance.now(), dt = now - lastT;
      if (dt > 0) { vel = -((e.clientX - lastX) / dt) * 16; lastX = e.clientX; lastT = now; }
      e.preventDefault();
    });
    const endDrag = e => {
      if (!dragging) return;
      dragging = false;
      vp.classList.remove('dragging');
      if (cursorEl) cursorEl.classList.remove('grabbing');
      if (performance.now() - lastT > 80) vel = 0;             // pointer was resting — no fling
      vel = Math.max(-70, Math.min(70, vel));                  // hand off to inertia
      // suppress the click that follows a real drag
      if (moved) {
        const kill = ev => { ev.preventDefault(); ev.stopPropagation(); };
        vp.addEventListener('click', kill, { capture: true, once: true });
        setTimeout(() => vp.removeEventListener('click', kill, { capture: true }), 0);
      }
      // drop the "Drag" label if the pointer left the gallery
      if (cursorEl && e) {
        const over = document.elementFromPoint(e.clientX, e.clientY);
        if (!over || !vp.contains(over)) cursorEl.classList.remove('drag');
      }
    };
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);

    /* ---- wheel → horizontal, with boundary pass-through to the page ---- */
    vp.addEventListener('wheel', e => {
      const max = maxScroll();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const atStart = vp.scrollLeft <= 0;
      const atEnd = vp.scrollLeft >= max - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return; // let the page scroll on
      e.preventDefault();
      vel = 0;
      vp.scrollLeft += delta;
    }, { passive: false });

    /* ---- keyboard: arrows / home / end ---- */
    vp.addEventListener('keydown', e => {
      const step = plates.length > 1 ? (plates[1].offsetLeft - plates[0].offsetLeft) : vp.clientWidth * 0.8;
      let target = null;
      if (e.key === 'ArrowRight') target = vp.scrollLeft + step;
      else if (e.key === 'ArrowLeft') target = vp.scrollLeft - step;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = maxScroll();
      if (target !== null) { e.preventDefault(); vel = 0; vp.scrollTo({ left: target, behavior: 'smooth' }); }
    });

    /* ---- cursor "Drag" label over the gallery ---- */
    if (cursorEl) {
      vp.addEventListener('pointerenter', () => cursorEl.classList.add('drag'));
      vp.addEventListener('pointerleave', () => { if (!dragging) cursorEl.classList.remove('drag'); });
    }

    /* ---- master loop: cursor + inertia + parallax + progress ---- */
    let lastSL = -1;
    const applyParallax = () => {
      const vpW = vp.clientWidth, vpLeft = vp.getBoundingClientRect().left;
      const rects = plates.map(p => p.getBoundingClientRect());          // read
      let best = 0, bestDist = Infinity;
      rects.forEach((r, i) => {                                          // write
        const center = r.left + r.width / 2 - vpLeft;
        const norm = Math.max(-1.4, Math.min(1.4, (center - vpW / 2) / vpW));
        const bg = plates[i].querySelector('.plate-bg');
        const fg = plates[i].querySelector('.plate-fg');
        if (bg) bg.style.transform = `translate3d(${(norm * 46).toFixed(2)}px,0,0)`;
        if (fg) fg.style.transform = `translate3d(${(norm * -24).toFixed(2)}px,0,0)`;
        const d = Math.abs(center - vpW / 2);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      const max = maxScroll();
      const prog = max > 0 ? vp.scrollLeft / max : 0;
      if (gpFill) gpFill.style.transform = `scaleX(${(0.16 + prog * 0.84).toFixed(3)})`;
      if (gpIndex) gpIndex.textContent = String(best + 1).padStart(2, '0');
    };

    const render = () => {
      if (cursorLive && cursorEl) {
        cur.x += (cur.tx - cur.x) * 0.2;
        cur.y += (cur.ty - cur.y) * 0.2;
        cursorEl.style.transform = `translate(${cur.x.toFixed(1)}px,${cur.y.toFixed(1)}px) translate(-50%,-50%)`;
      }
      if (!dragging && Math.abs(vel) > 0.3) {
        vp.scrollLeft += vel;
        vel *= 0.92;
        const max = maxScroll();
        if (vp.scrollLeft <= 0) { vp.scrollLeft = 0; vel = 0; }
        else if (vp.scrollLeft >= max) { vp.scrollLeft = max; vel = 0; }
      }
      const sl = Math.round(vp.scrollLeft);
      if (sl !== lastSL) { lastSL = sl; applyParallax(); }
      requestAnimationFrame(render);
    };
    applyParallax();
    addEventListener('resize', applyParallax);
    requestAnimationFrame(render);

  } else if (cursorLive && cursorEl) {
    /* gallery disabled (reduced motion) but a fine pointer is present — still run the cursor */
    const loop = () => {
      cur.x += (cur.tx - cur.x) * 0.2;
      cur.y += (cur.ty - cur.y) * 0.2;
      cursorEl.style.transform = `translate(${cur.x.toFixed(1)}px,${cur.y.toFixed(1)}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
})();
