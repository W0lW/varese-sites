/* VELOCITY — live PR-review terminal, scanning dot-grid, pipeline, count-ups, magnetics */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;

  /* ---------- nav backdrop ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- hero intro (CSS/compositor driven, robust) ---------- */
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
  setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe

  /* failsafe: if GSAP never arrives, reveal everything */
  const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  setTimeout(() => { if (!window.gsap) revealAll(); }, 2500);

  /* ---------- scanning dot-grid background (canvas 2D, feature-detected) ---------- */
  (function grid(){
    const canvas = document.getElementById('grid');
    if (!canvas || !canvas.getContext) return;            // CSS grid texture remains as fallback
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const GAP = 34;
    let w = 0, h = 0, cols = 0, rows = 0;
    const mouse = { x: .5, y: .5, tx: .5, ty: .5 };

    function resize(){
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP) + 1; rows = Math.ceil(h / GAP) + 1;
    }
    resize();
    addEventListener('resize', resize);
    if (finePointer) addEventListener('pointermove', e => {
      mouse.tx = e.clientX / innerWidth; mouse.ty = e.clientY / innerHeight;
    }, { passive: true });

    const start = performance.now();
    function draw(now){
      const t = (now - start) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
      ctx.clearRect(0, 0, w, h);
      // a soft diagonal scan band sweeping down the field
      const scanY = ((t * 90) % (h + 260)) - 130;
      const px = (mouse.x - .5) * 14, py = (mouse.y - .5) * 14;
      for (let y = 0; y < rows; y++){
        for (let x = 0; x < cols; x++){
          const cx = x * GAP + px, cy = y * GAP + py;
          const d = Math.abs(cy - scanY - cx * 0.18);   // diagonal falloff
          const band = Math.max(0, 1 - d / 120);
          const tw = 0.5 + 0.5 * Math.sin(t * 1.5 + x * 0.6 + y * 0.5); // gentle twinkle
          const base = 0.05 + tw * 0.03;
          const a = base + band * 0.55;
          const r = 1 + band * 1.6;
          if (band > 0.02){
            ctx.fillStyle = `rgba(59,130,246,${Math.min(0.9, a)})`;
          } else {
            ctx.fillStyle = `rgba(232,234,237,${a})`;
          }
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (!reduce) rafId = requestAnimationFrame(draw);
    }
    let rafId = requestAnimationFrame(draw);
    if (reduce){ cancelAnimationFrame(rafId); draw(start + 3000); } // one static frame
  })();

  /* ---------- the signature: PR review that types itself out ---------- */
  (function terminal(){
    const term = document.getElementById('term');
    if (!term) return;
    const lines = [...term.querySelectorAll('.code-line')];

    const revealTerminal = () => {
      lines.forEach(ln => {
        ln.classList.remove('typing'); ln.classList.add('is-typed');
        const inner = ln.querySelector('.code-inner');
        inner.style.transition = 'none'; inner.style.width = 'auto';
      });
      term.classList.add('reviewed');
    };
    if (reduce){ revealTerminal(); return; }

    const failsafe = setTimeout(revealTerminal, 6000); // never leave it half-typed

    function typeLine(ln){
      return new Promise(res => {
        const inner = ln.querySelector('.code-inner');
        const full = inner.scrollWidth;                       // natural content width
        const chars = Math.max(4, (inner.textContent || '').length);
        const dur = Math.min(460, Math.max(120, chars * 13));
        inner.style.transition = 'none'; inner.style.width = '0px';
        ln.classList.add('typing');
        requestAnimationFrame(() => {
          inner.style.transition = `width ${dur}ms steps(${Math.min(chars, 40)},end)`;
          inner.style.width = full + 'px';
        });
        setTimeout(() => {
          ln.classList.remove('typing'); ln.classList.add('is-typed');
          inner.style.width = full + 'px';
          res();
        }, dur + 40);
      });
    }

    async function play(){
      for (const ln of lines){ await typeLine(ln); await wait(60); }
      term.classList.add('scanning');
      await wait(520);
      term.classList.add('reviewed');
      clearTimeout(failsafe);
    }
    const wait = ms => new Promise(r => setTimeout(r, ms));

    // start when the terminal scrolls into view (or immediately if already visible)
    let started = false;
    const begin = () => { if (started) return; started = true; setTimeout(play, 260); };
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((ents) => {
        ents.forEach(e => { if (e.isIntersecting){ begin(); io.disconnect(); } });
      }, { threshold: 0.35 });
      io.observe(term);
    } else { begin(); }
    // safety: if observer never fires, start after load
    addEventListener('load', () => setTimeout(begin, 400));
  })();

  /* ---------- copy install command ---------- */
  document.querySelectorAll('.cmd').forEach(btn => {
    const state = btn.querySelector('.cmd-copy');
    const original = state ? state.textContent : 'copy';
    btn.addEventListener('click', () => {
      const text = 'npx velocity init';
      const done = () => { btn.classList.add('copied'); if (state) state.textContent = 'copied'; state && (state.setAttribute('aria-hidden','false'));
        setTimeout(() => { btn.classList.remove('copied'); if (state){ state.textContent = original; state.setAttribute('aria-hidden','true'); } }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else { done(); }
    });
  });

  /* ---------- count-ups ---------- */
  function formatVal(v, o){
    if (o.scale && o.scale > 1) v = v / o.scale;
    let s = v.toFixed(o.dec || 0);
    if (o.comma) s = Number(s).toLocaleString('en-US');
    return s + (o.suffix || '');
  }
  function countUp(el){
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const o = { suffix: el.dataset.suffix || '', scale: parseFloat(el.dataset.scale) || 1,
                dec: parseInt(el.dataset.dec || '0', 10), comma: el.dataset.comma === '1' };
    if (reduce){ el.textContent = formatVal(target, o); return; }
    const dur = 1300, start = performance.now();
    (function step(now){
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatVal(target * eased, o);
      if (p < 1) requestAnimationFrame(step); else el.textContent = formatVal(target, o);
    })(start);
  }

  /* ---------- motion layer (GSAP) ---------- */
  window.addEventListener('load', () => {
    if (!window.gsap){ revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // scroll reveals
    gsap.utils.toArray('.reveal:not(.hero .reveal)').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') });
    });

    // count-ups fire once on view
    gsap.utils.toArray('[data-count]').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) });
    });

    // pipeline: animate edges + node lighting + traveling pulse when in view
    const svg = document.getElementById('pipeSvg');
    if (svg){
      ScrollTrigger.create({ trigger: '.pipeline', start: 'top 72%', once: true, onEnter: () => {
        svg.classList.add('animate');
        if (reduce) return;
        const nodes = [...svg.querySelectorAll('.node')];
        const pulse = svg.querySelector('.pulse');
        const stops = [182, 288, 418, 524, 654, 760, 890, 996]; // segment endpoints
        nodes[0] && nodes[0].classList.add('on');
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
        for (let i = 0; i < nodes.length - 1; i++){
          tl.to(pulse, { attr: { cx: stops[i * 2], cy: 150 }, duration: 0.001 })
            .to(pulse, { attr: { cx: stops[i * 2 + 1], cy: 150 }, duration: 0.5, ease: 'power1.inOut' })
            .add(() => nodes[i + 1] && nodes[i + 1].classList.add('on'), '>-0.05');
        }
        tl.to(pulse, { opacity: 0, duration: 0.3 })
          .add(() => nodes.forEach((n, i) => i && n.classList.remove('on')))
          .to(pulse, { opacity: 1, duration: 0.3 });
      }});
    }

    if (!reduce && finePointer){
      // magnetic buttons
      document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.35,
                        y: (e.clientY - r.top - r.height / 2) * 0.5, duration: 0.5, ease: 'power3' });
        });
        el.addEventListener('pointerleave', () =>
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }));
      });
    }
  });
})();
