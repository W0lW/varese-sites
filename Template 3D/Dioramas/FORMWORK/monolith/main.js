/* MONOLITH — kinetic type engine: scramble, scroll-velocity skew, magnetic, reveals */
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero intro (CSS-driven, robust)
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
  setTimeout(() => hero.classList.add('loaded'), 400);

  /* ---- custom cursor ---- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const cur = document.querySelector('.cursor');
    const p = { x: innerWidth/2, y: innerHeight/2, tx: innerWidth/2, ty: innerHeight/2 };
    addEventListener('pointermove', e => { p.tx = e.clientX; p.ty = e.clientY; });
    (function loop(){ p.x += (p.tx-p.x)*0.25; p.y += (p.ty-p.y)*0.25;
      cur.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    document.querySelectorAll('a,button,.work-row,.magnetic,.magnetic-soft').forEach(el => {
      el.addEventListener('pointerenter', () => cur.classList.add('hot'));
      el.addEventListener('pointerleave', () => cur.classList.remove('hot'));
    });
  }

  /* ---- text scramble (additive: real text stays if JS dies) ---- */
  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/';
  function scramble(el, dur = 620) {
    if (reduce) return;
    const text = el.dataset.original || (el.dataset.original = el.textContent);
    const len = text.length, start = performance.now();
    (function step(now){
      const prog = Math.min(1, (now - start) / dur);
      const reveal = Math.floor(prog * len);
      let out = '';
      for (let i = 0; i < len; i++) out += (i < reveal || text[i] === ' ') ? text[i] : CH[(Math.random()*CH.length)|0];
      el.textContent = out;
      if (prog < 1) requestAnimationFrame(step); else el.textContent = text;
    })(performance.now());
  }
  const heroLines = [...document.querySelectorAll('[data-scramble]')];
  window.addEventListener('load', () => heroLines.forEach((el, i) => setTimeout(() => scramble(el), 180 + i * 110)));
  heroLines.forEach(el => el.addEventListener('pointerenter', () => scramble(el, 420)));
  document.querySelectorAll('.w-name[data-hover]').forEach(el => el.addEventListener('pointerenter', () => scramble(el, 380)));

  /* ---- GSAP: skew-on-scroll, reveals, magnetic ---- */
  window.addEventListener('load', () => {
    const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
    if (!window.gsap) { revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal').forEach(el =>
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') }));

    if (!reduce) {
      // scroll-velocity skew (canonical GSAP pattern)
      gsap.set('.skewer', { transformOrigin: 'left center', force3D: true });
      const skewSetter = gsap.quickSetter('.skewer', 'skewY', 'deg');
      const clamp = gsap.utils.clamp(-8, 8);
      const proxy = { skew: 0 };
      ScrollTrigger.create({ onUpdate: self => {
        const skew = clamp(self.getVelocity() / -420);
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, { skew: 0, duration: 0.7, ease: 'power3', overwrite: true,
            onUpdate: () => skewSetter(proxy.skew) });
        }
      }});

      // magnetic buttons
      document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width/2)*0.4, y: (e.clientY - r.top - r.height/2)*0.5, duration: 0.5, ease: 'power3' });
        });
        el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }));
      });
    }
  });
})();
