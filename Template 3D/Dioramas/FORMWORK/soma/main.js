/* SOMA — gooey pastel metaballs + a live 4·4·6 breathing guide.
   Everything degrades gracefully: no CDN, no canvas required, no console noise. */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav backdrop after leaving the hero ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- hero intro (CSS/compositor-driven, robust to backgrounded tabs) ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
    setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe
  }

  /* ---------- scroll reveals via IntersectionObserver (no library) ---------- */
  const revealEls = [...document.querySelectorAll('.reveal')].filter(el => !el.closest('.hero'));
  const revealAll = () => revealEls.forEach(el => el.classList.add('is-in'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    revealEls.forEach(el => io.observe(el));
    setTimeout(revealAll, 3000); // failsafe: nothing stays hidden
  } else {
    revealAll();
  }

  /* ---------- gooey metaball drift ---------- */
  // Tune the goo threshold down on small screens so it stays crisp and cheap.
  const feBlur = document.querySelector('#goo feGaussianBlur');
  const setGoo = () => { if (feBlur) feBlur.setAttribute('stdDeviation', innerWidth < 640 ? 11 : 16); };
  setGoo();
  addEventListener('resize', setGoo, { passive: true });

  const blobEls = [...document.querySelectorAll('.blob')];
  if (blobEls.length && !reduce) {
    const blobs = blobEls.map((el, i) => ({
      el,
      ax: 22 + Math.random() * 40,   // horizontal drift amplitude (px)
      ay: 18 + Math.random() * 32,   // vertical drift amplitude (px)
      fx: 0.05 + Math.random() * 0.07, // frequencies — slow, so blobs merge & part gently
      fy: 0.04 + Math.random() * 0.06,
      fs: 0.03 + Math.random() * 0.04, // even slower scale-morph, so shapes swell & thin
      am: 0.10 + Math.random() * 0.10, // scale-morph amplitude (±10–20%)
      px: Math.random() * Math.PI * 2,
      py: Math.random() * Math.PI * 2,
      ps: Math.random() * Math.PI * 2,
      par: 8 + i * 3.5               // subtle pointer parallax, deeper per blob
    }));
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener('pointermove', e => {
      ptr.tx = e.clientX / innerWidth - 0.5;
      ptr.ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });

    const TAU = Math.PI * 2;
    let raf = 0;
    const tick = now => {
      const t = now / 1000;
      ptr.x += (ptr.tx - ptr.x) * 0.04;
      ptr.y += (ptr.ty - ptr.y) * 0.04;
      for (const b of blobs) {
        const dx = Math.sin(t * b.fx * TAU + b.px) * b.ax + ptr.x * b.par;
        const dy = Math.cos(t * b.fy * TAU + b.py) * b.ay + ptr.y * b.par;
        const s = 1 + Math.sin(t * b.fs * TAU + b.ps) * b.am; // slow swell/thin → gooey morph
        b.el.style.transform =
          `translate(-50%,-50%) translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) scale(${s.toFixed(3)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- the live breathing guide (4 in · 4 hold · 6 out) ---------- */
  const breath = document.querySelector('.breath');
  const word = document.getElementById('breathWord');
  if (breath && word) {
    if (reduce) {
      // static instruction — no loop, orb held mid-scale by CSS
      breath.dataset.phase = 'hold';
      word.textContent = 'In 4 · hold 4 · out 6';
    } else {
      const orb = breath.querySelector('.breath-orb');
      const ring = breath.querySelector('.breath-ring');
      const phases = [
        { phase: 'in',   label: 'Breathe in',  dur: 4000 },
        { phase: 'hold', label: 'Hold',        dur: 4000 },
        { phase: 'out',  label: 'Breathe out', dur: 6000 }
      ];
      let idx = 0, stepT = 0, swapT = 0;

      const setPhase = i => {
        const p = phases[i];
        if (orb) orb.style.transitionDuration = p.dur + 'ms';
        if (ring) ring.style.transitionDuration = p.dur + 'ms';
        breath.classList.add('fade');            // crossfade the cue word out
        clearTimeout(swapT);
        swapT = setTimeout(() => {
          word.textContent = p.label;
          breath.classList.remove('fade');       // …and back in with the new word
        }, 260);
        breath.dataset.phase = p.phase;          // drives orb + ring scale via CSS
        clearTimeout(stepT);
        stepT = setTimeout(() => { idx = (i + 1) % phases.length; setPhase(idx); }, p.dur);
      };

      // start small, then let the first inhale animate on the next frame
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase(0)));

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { clearTimeout(stepT); clearTimeout(swapT); }
        else setPhase(idx); // resume gently on the current phase
      });
    }
  }
})();
