/* AURUM — gold-dust particle field (canvas 2D) + motion layer */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav backdrop after leaving the hero ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal failsafe (content never stuck hidden) ---------- */
  const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  setTimeout(() => { if (!window.gsap) revealAll(); }, 2500);

  /* ---------- hero intro: CSS-driven, never depends on rAF/GSAP ---------- */
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
  setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe

  /* ---------- gold dust field ---------- */
  const canvas = document.getElementById('dust');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx && !reduce) {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, motes = [];
    const GOLD = [
      [246, 229, 166],  // light gold
      [217, 189, 122],  // gold
      [201, 161, 74],   // mid gold
      [255, 248, 227]   // near-white spark
    ];

    function build() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // density scaled to area, capped so it stays light on any screen
      const count = Math.min(170, Math.round((W * H) / 10500));
      motes = new Array(count).fill(0).map(spawn);
    }
    function spawn() {
      const c = GOLD[(Math.random() * GOLD.length) | 0];
      const spark = Math.random() < 0.12;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: spark ? 0.6 + Math.random() * 1.1 : 0.4 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -0.05 - Math.random() * 0.22,          // slow, upward drift
        a: 0.12 + Math.random() * 0.4,
        tw: Math.random() * Math.PI * 2,            // twinkle phase
        ts: 0.004 + Math.random() * 0.012,          // twinkle speed
        c, spark
      };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.x += m.vx; m.y += m.vy; m.tw += m.ts;
        // wrap
        if (m.y < -6) { m.y = H + 6; m.x = Math.random() * W; }
        if (m.x < -6) m.x = W + 6; else if (m.x > W + 6) m.x = -6;

        const flick = 0.55 + 0.45 * Math.sin(m.tw);
        const alpha = m.a * flick;
        const glow = m.r * (m.spark ? 5.5 : 3.4);
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, glow);
        const [r, gg, b] = m.c;
        g.addColorStop(0, `rgba(${r},${gg},${b},${alpha})`);
        g.addColorStop(0.5, `rgba(${r},${gg},${b},${alpha * 0.28})`);
        g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, glow, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // pause when hero scrolled out of view (perf)
    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 })
        .observe(hero);
    }

    let raf = 0;
    function loop() { if (visible) draw(); raf = requestAnimationFrame(loop); }

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); }, { passive: true });
    build();
    loop();
    void raf;
  } else if (ctx && reduce) {
    // reduced motion: paint a single still dusting of gold, no animation
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W, y = Math.random() * H, r = 1 + Math.random() * 4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(217,189,122,.35)');
      g.addColorStop(1, 'rgba(217,189,122,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ---------- custom cursor ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const cur = document.querySelector('.cursor');
    const p = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
    addEventListener('pointermove', e => { p.tx = e.clientX; p.ty = e.clientY; });
    (function loop() {
      p.x += (p.tx - p.x) * 0.16; p.y += (p.ty - p.y) * 0.16;
      cur.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,.card,.cta,.step,.spec-row').forEach(el => {
      el.addEventListener('pointerenter', () => cur.classList.add('hot'));
      el.addEventListener('pointerleave', () => cur.classList.remove('hot'));
    });
  }

  /* ---------- motion (GSAP) ---------- */
  window.addEventListener('load', () => {
    if (!window.gsap) { revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // scroll reveals (skip the hero — it has its own CSS intro)
    gsap.utils.toArray('.reveal').forEach(el => {
      if (el.closest('.hero')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') });
    });

    // card + step stagger
    if (!reduce) {
      gsap.utils.toArray('.card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 46, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 84%' }, delay: (i % 3) * 0.1
        });
      });
      // craft timeline gold line draws as you scroll
      gsap.to('.timeline-line', {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.timeline', start: 'top 72%', end: 'bottom 78%', scrub: true }
      });
    } else {
      // still ensure the line is present under reduced motion
      gsap.set('.timeline-line', { scaleY: 1 });
    }
  });
})();
