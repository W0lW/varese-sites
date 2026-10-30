/* ============================================================
   CLAY — motion layer (vanilla, no CDN, zero dependencies)
   · CSS-driven hero intro via .loaded (double-rAF + 400ms failsafe)
   · IntersectionObserver scroll reveals (graceful fallback)
   · Signature ambient engine: every hero clay shape BOBS on its
     own sine phase and PARALLAXES toward the cursor. Poke a shape
     (click / tap) and it SQUISHES with a spring — squash-and-stretch
     that overshoots and settles, like pressing real clay.
   All motion runs in ONE requestAnimationFrame loop, paused when
   the hero scrolls out of view, and fully disabled under
   prefers-reduced-motion.
   ============================================================ */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add('js'); // gate all hide-then-reveal on JS being alive

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- hero intro (compositor-driven, never blank) ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
    setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe
  }

  /* ---------- nav backdrop after leaving the top ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- scroll reveals (skip hero — it uses .loaded) ---------- */
  const revealTargets = document.querySelectorAll('.reveal:not(.hero .reveal)');
  const revealAll = () => revealTargets.forEach(el => el.classList.add('is-in'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealAll();
  }
  // safety net: never leave content hidden even if the observer misbehaves
  setTimeout(revealAll, 2600);

  /* ---------- mood garden: bloom-in on scroll + poke-to-squish ---------- */
  const garden = document.getElementById('gardenGrid');
  if (garden) {
    const bloom = () => garden.classList.add('in');
    if ('IntersectionObserver' in window) {
      const gio = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { bloom(); gio.disconnect(); }
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      gio.observe(garden);
    } else {
      bloom();
    }
    setTimeout(bloom, 2600); // never leave the garden hidden

    if (!reduce) {
      garden.querySelectorAll('.pip').forEach((pip) => {
        const clay = pip.querySelector('.pip-clay');
        if (!clay) return;
        pip.addEventListener('pointerdown', () => {
          clay.classList.remove('squish');
          void clay.offsetWidth;        // restart the keyframe on rapid re-pokes
          clay.classList.add('squish');
        });
        clay.addEventListener('animationend', (e) => {
          if (e.animationName === 'pipSquish') clay.classList.remove('squish');
        });
      });
    }
  }

  /* ---------- signature ambient: bob + parallax + poke-to-squish ---------- */
  if (!reduce) {
    const shapes = Array.prototype.slice.call(document.querySelectorAll('.hero-play .shape'));
    if (shapes.length) {
      const fine = matchMedia('(pointer:fine)').matches;

      const items = shapes.map((el, i) => ({
        el,
        depth: parseFloat(el.dataset.depth) || 8,   // px of cursor parallax
        amp: 7 + (i % 3) * 4,                        // bob amplitude (px)
        speed: 0.55 + (i % 4) * 0.13,                // bob speed
        phase: i * 1.35,                             // phase offset per shape
        rest: parseFloat(el.dataset.rot) || 0,       // resting tilt (deg)
        squish: 0, squishV: 0,                       // spring state (scalar)
        hover: 0, hoverT: 0                          // hover grow (0..1)
      }));

      // poke = spring impulse. Negative squish reads as "compressed".
      const poke = (s) => { s.squish = -0.26; s.squishV = 0; };
      items.forEach(s => {
        s.el.addEventListener('pointerdown', () => poke(s));
        if (fine) {
          s.el.addEventListener('pointerenter', () => { s.hover = 1; });
          s.el.addEventListener('pointerleave', () => { s.hover = 0; });
        }
      });

      // cursor parallax target (fine pointers only)
      let mx = 0, my = 0, tmx = 0, tmy = 0;
      if (fine) {
        addEventListener('pointermove', (e) => {
          tmx = (e.clientX / innerWidth - 0.5) * 2;
          tmy = (e.clientY / innerHeight - 0.5) * 2;
        }, { passive: true });
      }

      const start = performance.now();
      let last = start;
      let ticking = false;
      let visible = true;
      const K = 165, C = 12;   // spring stiffness / damping

      const frame = (now) => {
        if (!visible) { ticking = false; return; }
        let dt = (now - last) / 1000; last = now;
        if (dt > 1 / 30) dt = 1 / 30;          // clamp after tab-switch stalls
        mx += (tmx - mx) * 0.06;
        my += (tmy - my) * 0.06;
        const t = (now - start) / 1000;

        for (let i = 0; i < items.length; i++) {
          const s = items[i];
          // bob on an independent sine, tiny orbital drift on x
          const by = Math.sin(t * s.speed + s.phase) * s.amp;
          const bx = Math.cos(t * s.speed * 0.8 + s.phase) * s.amp * 0.4;
          // parallax toward the cursor
          const px = mx * s.depth;
          const py = my * s.depth;
          // lazy rotation wobble around the resting tilt
          const rz = s.rest + Math.sin(t * s.speed * 0.7 + s.phase) * (s.amp * 0.12);

          // spring the squish back to rest (under-damped → overshoot)
          const acc = -K * s.squish - C * s.squishV;
          s.squishV += acc * dt;
          s.squish += s.squishV * dt;

          // hover grow eases in/out
          s.hoverT += (s.hover - s.hoverT) * 0.12;

          // squash-and-stretch: compress → wider+flatter, overshoot → taller+thinner
          const grow = 1 + s.hoverT * 0.07;
          const sx = grow * (1 - s.squish * 0.6);
          const sy = grow * (1 + s.squish * 0.9);

          s.el.style.transform =
            'translate3d(' + (px + bx).toFixed(2) + 'px,' + (py + by).toFixed(2) + 'px,0) ' +
            'rotate(' + rz.toFixed(2) + 'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
        }
        requestAnimationFrame(frame);
      };

      const startLoop = () => {
        if (!ticking) { ticking = true; last = performance.now(); requestAnimationFrame(frame); }
      };

      // pause the loop when the hero is off-screen (perf)
      if (hero && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          if (visible) startLoop();
        }, { threshold: 0 }).observe(hero);
      }
      startLoop();
    }
  }
})();
