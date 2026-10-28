(() => {
  const video = document.querySelector('#heroVideo');
  const soundToggle = document.querySelector('#soundToggle');
  const soundLabel = document.querySelector('#soundLabel');
  const preloader = document.querySelector('.preloader');
  const cursorGlow = document.querySelector('.cursor-glow');
  const year = document.querySelector('#year');
  year.textContent = new Date().getFullYear();

  // Browsers block autoplay with sound. The film starts muted and audio is enabled only after a deliberate tap/click.
  soundToggle.addEventListener('click', async () => {
    const enableSound = video.muted;
    video.muted = !enableSound;
    soundToggle.setAttribute('aria-pressed', String(enableSound));
    soundLabel.textContent = enableSound ? 'SOUND ON' : 'SOUND OFF';
    if (enableSound) {
      try { await video.play(); } catch (err) { video.muted = true; soundToggle.setAttribute('aria-pressed', 'false'); soundLabel.textContent = 'TAP TO SOUND'; }
    }
  });

  const finishIntro = () => window.setTimeout(() => preloader.classList.add('done'), 850);
  if (document.readyState === 'complete') finishIntro();
  else window.addEventListener('load', finishIntro, { once: true });
  window.setTimeout(finishIntro, 2400);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  window.addEventListener('pointermove', event => {
    cursorGlow.style.left = event.clientX + 'px';
    cursorGlow.style.top = event.clientY + 'px';
  }, { passive: true });

  // Soft, pointer-reactive 3D wire object. Falls back gracefully if Three.js is unavailable.
  const canvas = document.querySelector('#scene3d');
  if (window.THREE && canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    const group = new THREE.Group();
    scene.add(group);
    const geometry = new THREE.IcosahedronGeometry(1.55, 2);
    const wire = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xd8ff3e, wireframe: true, transparent: true, opacity: 0.42 }));
    group.add(wire);
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.12, 1), new THREE.MeshBasicMaterial({ color: 0xece9df, wireframe: true, transparent: true, opacity: 0.16 }));
    group.add(inner);
    const pointsGeometry = new THREE.BufferGeometry();
    const points = [];
    for (let i = 0; i < 420; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.15 + Math.random() * 1.4;
      points.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi));
    }
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const stars = new THREE.Points(pointsGeometry, new THREE.PointsMaterial({ color: 0xece9df, size: 0.012, transparent: true, opacity: 0.5 }));
    group.add(stars);
    let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
    window.addEventListener('pointermove', e => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 0.65;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 0.45;
    }, { passive: true });
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      group.position.x = w < 700 ? 1.35 : 1.55;
      group.scale.setScalar(w < 700 ? 0.75 : 1);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      targetX += (pointerY - targetX) * 0.035;
      targetY += (pointerX - targetY) * 0.035;
      group.rotation.x = t * 0.045 + targetX;
      group.rotation.y = t * 0.07 + targetY;
      wire.rotation.z = Math.sin(t * 0.15) * 0.12;
      inner.rotation.x = -t * 0.08;
      inner.rotation.y = t * 0.06;
      stars.rotation.y = -t * 0.012;
      renderer.render(scene, camera);
    };
    animate();
  }

  // Tiny parallax on hero content, disabled for touch and reduced-motion users.
  if (matchMedia('(hover:hover) and (prefers-reduced-motion: no-preference)').matches) {
    const hero = document.querySelector('.hero-content');
    window.addEventListener('pointermove', e => {
      const x = (e.clientX / window.innerWidth - 0.5) * -8;
      const y = (e.clientY / window.innerHeight - 0.5) * -5;
      hero.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }, { passive: true });
  }
})();