/* AETHER — aurora gradient-mesh (raw WebGL) + product-UI motion layer */
(() => {
  document.documentElement.classList.add('js'); // gate reveal-hiding on JS presence
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav backdrop on scroll ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- hero intro: CSS/compositor-driven, never rAF-dependent ---------- */
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
  setTimeout(() => hero.classList.add('loaded'), 400); // hard failsafe

  // failsafe: if GSAP never arrives, reveal everything so nothing stays hidden
  const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  setTimeout(() => { if (!window.gsap) revealAll(); }, 2500);

  /* ---------- signature aurora: drifting gradient-mesh shader ---------- */
  const canvas = document.getElementById('aurora');
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { gl = null; }

  if (gl) {
    const vert = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
    const frag = `
      precision highp float;
      uniform float u_time; uniform vec2 u_res; uniform vec2 u_mouse;
      float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f);
        return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
      }
      float fbm(vec2 p){ float v=0.0, a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
        for(int i=0;i<4;i++){ v+=a*noise(p); p=m*p; a*=0.5; } return v; }
      float blob(vec2 p, vec2 c, float s){ float d=length(p-c); return exp(-d*d*s); }
      void main(){
        vec2 uv=gl_FragCoord.xy/u_res.xy;
        float asp=u_res.x/u_res.y;
        vec2 p=vec2(uv.x*asp, uv.y);
        float t=u_time*0.06;
        vec2 w=vec2(fbm(p*1.4+t), fbm(p*1.4-t+5.2));
        p+=(w-0.5)*0.30;                              // organic domain warp
        vec3 violet=vec3(0.486,0.361,1.0);
        vec3 cyan  =vec3(0.208,0.878,0.902);
        vec3 blue  =vec3(0.35,0.50,1.0);
        vec3 mag   =vec3(0.72,0.42,1.0);
        vec3 col=vec3(0.031,0.035,0.047);            // near-black base #08090c
        col+=violet*0.90*blob(p, vec2(asp*0.26+0.10*sin(t*1.1), 0.30+0.08*cos(t*0.9)), 3.0);
        col+=cyan  *0.85*blob(p, vec2(asp*0.74+0.12*cos(t*0.8), 0.64+0.10*sin(t*1.05)), 3.2);
        col+=blue  *0.60*blob(p, vec2(asp*0.52+0.14*sin(t*0.6+2.0), 0.20+0.09*cos(t*1.2)), 2.7);
        col+=mag   *0.50*blob(p, vec2(asp*0.86+0.08*sin(t*1.3+1.0), 0.16+0.07*cos(t*0.5)), 3.4);
        col+=cyan  *0.60*blob(p, vec2(asp*0.12+0.10*cos(t*0.7+3.0), 0.80+0.08*sin(t*0.9)), 3.0);
        vec2 mp=vec2(u_mouse.x*asp, u_mouse.y);
        col+=mix(violet,cyan,u_mouse.x)*0.32*blob(p, mp, 4.0);   // pointer light
        col*=0.92;
        float vig=smoothstep(1.30,0.20,length((uv-0.5)*vec2(asp,1.0)));
        col*=0.55+0.45*vig;                          // vignette keeps text legible
        float d=hash(gl_FragCoord.xy*0.7+t)*0.026-0.013;         // dither kills banding
        gl_FragColor=vec4(col+d,1.0);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl = null; // fall back to the CSS gradient painted on the canvas element
    } else {
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uT = gl.getUniformLocation(prog, 'u_time');
      const uR = gl.getUniformLocation(prog, 'u_res');
      const uM = gl.getUniformLocation(prog, 'u_mouse');
      const mouse = { x: 0.5, y: 0.55, tx: 0.5, ty: 0.55 };
      addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth; mouse.ty = 1 - e.clientY / innerHeight; }, { passive: true });

      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const resize = () => {
        const w = (canvas.clientWidth * dpr) | 0, h = (canvas.clientHeight * dpr) | 0;
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      };
      addEventListener('resize', resize, { passive: true });
      const start = performance.now();
      const frame = (now) => {
        resize();
        mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
        gl.uniform1f(uT, reduce ? 8 : (now - start) / 1000);
        gl.uniform2f(uR, canvas.width, canvas.height);
        gl.uniform2f(uM, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!reduce) requestAnimationFrame(frame);
      };
      resize();
      requestAnimationFrame(frame);
    }
  }

  /* ---------- hero command bar: typing animation ---------- */
  const typedEl = document.getElementById('typed');
  if (typedEl && !reduce) {
    const queries = [
      'What did we decide about pricing?',
      'Summarize the Q3 planning thread',
      'Who owns the auth migration?',
      'Find the onboarding retention notes'
    ];
    let qi = 0;
    const typeLoop = () => {
      const text = queries[qi];
      let i = 0;
      typedEl.textContent = '';
      const typeChar = () => {
        typedEl.textContent = text.slice(0, i++);
        if (i <= text.length) setTimeout(typeChar, 44 + Math.random() * 42);
        else setTimeout(erase, 1900);
      };
      const erase = () => {
        const cur = typedEl.textContent;
        if (cur.length) { typedEl.textContent = cur.slice(0, -1); setTimeout(erase, 22); }
        else { qi = (qi + 1) % queries.length; setTimeout(typeLoop, 280); }
      };
      typeChar();
    };
    setTimeout(typeLoop, 1500);
  }

  /* ---------- count-up numbers ---------- */
  const nums = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const comma = el.dataset.comma === '1';
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const render = (v) => {
      const s = comma ? Math.round(v).toLocaleString('en-US')
        : (decimals ? v.toFixed(decimals) : Math.round(v).toString());
      return prefix + s + suffix;
    };
    if (reduce) { el.textContent = render(target); return; }
    const dur = 1500, start = performance.now();
    const step = (now) => {
      const prog = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - prog, 3); // easeOutCubic
      el.textContent = render(target * e);
      if (prog < 1) requestAnimationFrame(step); else el.textContent = render(target);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { animateCount(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  } else {
    nums.forEach(animateCount);
  }

  /* ---------- "how it works": sticky visual synced to scrolling steps ---------- */
  /* GSAP-independent so the section always resolves, even if a CDN stalls */
  const steps = [...document.querySelectorAll('.step')];
  const stages = [...document.querySelectorAll('.hv-stage')];
  const activateStep = (i) => {
    steps.forEach((s, k) => s.classList.toggle('active', k === i));
    stages.forEach((s, k) => s.classList.toggle('active', k === i));
  };
  if (steps.length) {
    activateStep(0);
    if (!reduce && 'IntersectionObserver' in window) {
      const so = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) activateStep(steps.indexOf(en.target)); });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      steps.forEach(s => so.observe(s));
    }
  }

  /* ---------- GSAP motion layer ---------- */
  window.addEventListener('load', () => {
    if (!window.gsap || !window.ScrollTrigger) { revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // scroll reveals (hero reveals are handled by the CSS .loaded intro)
    gsap.utils.toArray('.reveal').forEach(el => {
      if (el.closest('.hero')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') });
    });

    if (!reduce) {
      // magnetic buttons — subtle, precise, never bouncy on entry
      document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.5, ease: 'power3' });
        });
        el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }));
      });

      // hero mockup scroll parallax — created after the CSS intro settles so it never snaps
      const mockup = document.querySelector('.mockup');
      if (mockup) {
        setTimeout(() => {
          gsap.to(mockup, {
            yPercent: -9, ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
          });
          ScrollTrigger.refresh();
        }, 1250);
      }
    }
  });
})();
