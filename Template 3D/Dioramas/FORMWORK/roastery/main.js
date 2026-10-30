/* EMBER & OAK — rising steam particle field + warm parallax + motion layer */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- hero intro: CSS/compositor driven, never rAF-dependent ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
    setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe
  }

  /* ---------- nav backdrop after leaving the hero ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* =====================================================================
     SIGNATURE TECHNIQUE — rising steam
     Soft, wispy, upward-drifting cream puffs with sinusoidal turbulence,
     emitted from the rim of the coffee cup. Additive blend for a warm glow.
     ===================================================================== */
  const canvas = document.getElementById('steam');
  const ctx = canvas && !reduce ? canvas.getContext('2d') : null;

  if (ctx) {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const cupEl = document.querySelector('.cup');
    let W = 0, H = 0;
    // emitter, in CSS pixels relative to the canvas
    const emitter = { x: 0, y: 0, spread: 60 };

    function measure() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      placeEmitter(r);
    }
    function placeEmitter(canvasRect) {
      const cr = canvasRect || canvas.getBoundingClientRect();
      if (cupEl) {
        const cup = cupEl.getBoundingClientRect();
        emitter.x = cup.left - cr.left + cup.width * 0.5;
        emitter.y = cup.top - cr.top + cup.height * 0.42; // near the rim
        emitter.spread = Math.max(34, cup.width * 0.2);
      } else {
        emitter.x = W * 0.5; emitter.y = H * 0.55; emitter.spread = W * 0.08;
      }
    }

    const particles = [];
    const MAX = 120;
    const rand = (a, b) => a + Math.random() * (b - a);

    function spawn() {
      const life = rand(2600, 5200);
      particles.push({
        x: emitter.x + rand(-emitter.spread, emitter.spread) * 0.5,
        y: emitter.y + rand(-8, 14),
        life: 0,
        max: life,
        r0: rand(10, 22),
        grow: rand(60, 130),
        vy: rand(28, 52),          // px per second, upward
        sway: rand(16, 46),
        swaySpeed: rand(0.5, 1.3),
        phase: rand(0, Math.PI * 2),
        drift: rand(-10, 14),      // gentle horizontal breeze
        alpha: rand(0.05, 0.13)
      });
    }

    let last = performance.now();
    let acc = 0;
    let running = true;

    function frame(now) {
      if (!running) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp after tab-away

      // spawn at a steady rate
      acc += dt;
      const rate = 0.035; // seconds between spawns
      while (acc >= rate && particles.length < MAX) { spawn(); acc -= rate; }
      if (acc > rate) acc = rate;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt * 1000;
        const t = p.life / p.max;
        if (t >= 1) { particles.splice(i, 1); continue; }

        // rise, decelerating slightly as it cools
        p.y -= p.vy * dt * (1.15 - t * 0.5);
        // turbulence: sway widens with height for a wispy spread
        const x = p.x + Math.sin(p.life * 0.001 * p.swaySpeed + p.phase) * p.sway * t
                      + p.drift * t;
        const r = p.r0 + p.grow * t;
        // fade in then out (sine envelope)
        const a = Math.sin(Math.PI * t) * p.alpha;
        if (a <= 0.002) continue;

        const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, r);
        g.addColorStop(0, `rgba(244,235,214,${a})`);
        g.addColorStop(0.5, `rgba(230,205,168,${a * 0.5})`);
        g.addColorStop(1, 'rgba(230,205,168,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    }

    measure();
    addEventListener('resize', measure);
    addEventListener('scroll', () => placeEmitter(), { passive: true });
    // pause when the hero scrolls away or tab is hidden (saves CPU, no visible cost)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
  }

  /* ---------- reveals + roast meters (IntersectionObserver: no CDN dependency) ---------- */
  const revealAll = () => {
    document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
    document.querySelectorAll('.meter').forEach(e => e.classList.add('is-in'));
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal, .meter').forEach(el => io.observe(el));
  } else {
    revealAll();
  }

  /* ---------- count-up numbers ---------- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const suffix = el.dataset.suffix || '';
    const render = (v) => Math.round(v) + suffix;
    if (reduce) { el.textContent = render(target); return; }
    const dur = 1600, start = performance.now();
    const step = (now) => {
      const prog = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - prog, 3);
      el.textContent = render(target * e);
      if (prog < 1) requestAnimationFrame(step); else el.textContent = render(target);
    };
    requestAnimationFrame(step);
  };
  const nums = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { animateCount(en.target); io2.unobserve(en.target); } });
    }, { threshold: 0.5 });
    nums.forEach(n => io2.observe(n));
  } else {
    nums.forEach(animateCount);
  }

  /* ---------- subscription cadence selector ---------- */
  const cads = document.querySelectorAll('.cad');
  const amtEl = document.getElementById('subAmt');
  const freqEl = document.getElementById('subFreq');
  cads.forEach(btn => {
    btn.addEventListener('click', () => {
      cads.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      if (amtEl && btn.dataset.price) amtEl.textContent = btn.dataset.price;
      if (freqEl && btn.dataset.freq) freqEl.textContent = btn.dataset.freq;
    });
  });

  /* ---------- warm parallax (GSAP; degrades gracefully) ---------- */
  window.addEventListener('load', () => {
    if (!window.gsap || reduce) { if (!window.gsap) revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // background word drifts, cup + seal float against scroll — a warm depth cue
    gsap.to('.hero-bgword', {
      yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-visual', {
      yPercent: -9, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-copy', {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });
})();
