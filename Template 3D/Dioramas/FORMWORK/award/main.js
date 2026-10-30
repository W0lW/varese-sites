/* THE AWARD — cinematic scroll-driven title sequence
   Signature: GSAP ScrollTrigger PINNED horizontal act-sequence with clip reveals,
   an act counter + progress bar, scroll-velocity skew, and a kinetic marquee. */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  /* ---- hero intro: CSS/compositor driven, with double-rAF + failsafe ---- */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
    setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe
  }

  /* ---- reveal fallback: if GSAP never loads, show everything ---- */
  const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  setTimeout(() => { if (!window.gsap) revealAll(); }, 2500);

  /* ---- custom cursor (fine pointers, motion allowed) ---- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const cur = document.querySelector('.cursor');
    if (cur) {
      const p = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
      addEventListener('pointermove', e => { p.tx = e.clientX; p.ty = e.clientY; }, { passive: true });
      (function loop() {
        p.x += (p.tx - p.x) * 0.2; p.y += (p.ty - p.y) * 0.2;
        cur.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll('a,button,.act,.credit').forEach(el => {
        el.addEventListener('pointerenter', () => cur.classList.add('hot'));
        el.addEventListener('pointerleave', () => cur.classList.remove('hot'));
      });
    }
  }

  /* ---- motion layer (GSAP) ---- */
  window.addEventListener('load', () => {
    if (!window.gsap || !window.ScrollTrigger) { revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // generic scroll reveals (credits, headings)
    gsap.utils.toArray('.reveal').forEach(el =>
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') }));

    // reduced motion: leave acts as a static vertical stack, skip all kinetics
    if (reduce) return;

    /* ===== SIGNATURE: pinned horizontal act sequence ===== */
    const acts = document.querySelector('.acts');
    const track = document.querySelector('.acts-track');
    const panels = gsap.utils.toArray('.act');
    const fill = document.querySelector('.hud-fill');
    const curEl = document.querySelector('.hud-cur');
    const totalEl = document.querySelector('.hud-total');

    if (acts && track && panels.length) {
      acts.classList.add('is-horizontal');
      if (totalEl) totalEl.textContent = ROMAN[panels.length - 1];

      const distance = () => Math.max(0, track.scrollWidth - innerWidth);
      let lastRoman = '';

      // the driving horizontal tween — scrubbed to vertical scroll while the section is pinned
      const horiz = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: acts,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: self => {
            const prog = self.progress;
            if (fill) fill.style.transform = `scaleX(${prog})`;
            const idx = Math.round(prog * (panels.length - 1));
            const r = ROMAN[idx];
            if (curEl && r !== lastRoman) { curEl.textContent = r; lastRoman = r; }
          }
        }
      });

      // per-act reveal: clip-wipe + lift as each panel slides through, driven by the horizontal tween
      panels.forEach(panel => {
        const statement = panel.querySelector('.act-statement');
        const kicker = panel.querySelector('.act-kicker');
        const line = panel.querySelector('.act-line');
        const num = panel.querySelector('.act-num');

        if (statement) {
          gsap.fromTo(statement,
            { clipPath: 'inset(0 0 100% 0)', y: 48, scale: 1.06 },
            {
              clipPath: 'inset(0 0 0% 0)', y: 0, scale: 1, ease: 'none',
              scrollTrigger: { trigger: panel, containerAnimation: horiz, start: 'left 82%', end: 'left 34%', scrub: true }
            });
        }
        [kicker, line].forEach((el, i) => {
          if (!el) return;
          gsap.fromTo(el, { autoAlpha: 0, y: 26 },
            {
              autoAlpha: 1, y: 0, ease: 'none',
              scrollTrigger: { trigger: panel, containerAnimation: horiz, start: `left ${76 - i * 6}%`, end: 'left 40%', scrub: true }
            });
        });
        if (num) {
          gsap.fromTo(num, { xPercent: -10 }, {
            xPercent: 10, ease: 'none',
            scrollTrigger: { trigger: panel, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true }
          });
        }
      });
    }

    /* ===== scroll-velocity skew on the kinetic marquee band ===== */
    const bandSkew = document.querySelector('.band-skew');
    if (bandSkew) {
      const setSkew = gsap.quickSetter(bandSkew, 'skewX', 'deg');
      const clamp = gsap.utils.clamp(-14, 14);
      const proxy = { skew: 0 };
      ScrollTrigger.create({
        onUpdate: self => {
          const v = clamp(self.getVelocity() / -320);
          if (Math.abs(v) > Math.abs(proxy.skew)) {
            proxy.skew = v;
            gsap.to(proxy, {
              skew: 0, duration: 0.7, ease: 'power3', overwrite: true,
              onUpdate: () => setSkew(proxy.skew)
            });
          }
        }
      });
    }

    /* gentle parallax drift on the credits roll */
    const list = document.querySelector('.credits-list');
    if (list) {
      gsap.fromTo(list, { y: 46 }, {
        y: -46, ease: 'none',
        scrollTrigger: { trigger: '.credits', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // keep pinned measurements correct after fonts settle
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  });
})();
