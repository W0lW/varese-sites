/**
 * THE DECONSTRUCTED BURGER - INTERACTIVE ENGINE
 * Pure vanilla JavaScript with Web Audio API, 3D CSS transforms & smooth lerping.
 */

(function () {
  'use strict';

  // --- Layer Culinary Knowledge Base ---
  const LAYER_DATA = {
    bun_top: {
      index: 'LAYER 01',
      title: 'Artisan Brioche Crown',
      tagline: 'Gently dome-baked with cultured French butter & toasted white sesame',
      img: 'assets/bun_top.png',
      role: 'Aroma, Structural Lid & Subtle Sweetness',
      temp: 'Warm (55°C)',
      flavor: 'Buttery, Toasted Yeast, Caramelized Crust',
      origin: 'Bespoke Craft Bakery, Wild-fermented starter',
      description: 'Our top crown is enriched with high-fat Normandy butter and local farm egg yolks. It undergoes an 18-hour cold proof before being hand-glazed and topped with Japanese white sesame seeds. Flash-toasted under radiant heat to ensure the interior crumb stays pillowy while the exterior holds structural integrity.'
    },
    sauce: {
      index: 'LAYER 02',
      title: 'Signature Secret Sauce',
      tagline: 'Velvety emulsion of smoked sweet paprika, aged cheddar reduction & roasted garlic',
      img: 'assets/sauce.png',
      role: 'Acidic Balance, Moisture & Umami Bridge',
      temp: 'Tempered (40°C)',
      flavor: 'Savory, Tangy, Deep Smoke, Piquant Kick',
      origin: 'House Recipe, Reduced & emulsified daily',
      description: 'The culinary backbone that unites bun and beef. Crafted by emulsifying slow-roasted garlic aioli, Spanish smoked pimentón, cornichon pickle brine, and a touch of Worcestershire reduction. Designed to coat every bite with velvety acidity and prevent dryness.'
    },
    tomato: {
      index: 'LAYER 03',
      title: 'Heirloom Vine Tomatoes',
      tagline: 'Dual thick-cut heirloom beefsteak rounds, lightly finished with flaky Maldon sea salt',
      img: 'assets/tomato.png',
      role: 'Juiciness, Bright Acidity & Palate Refreshment',
      temp: 'Room Temperature (21°C)',
      flavor: 'Sweet Acidity, Fresh Herbaceous, Mineral Finish',
      origin: 'Heritage Organic Farms, Vine-ripened 90 days',
      description: 'Selected strictly from heritage beefsteak varieties at peak ripeness. Sliced to an exact 7mm thickness to deliver clean, crisp sweetness and luscious juices without overwhelming the bun. Lightly dusted with coarse sea salt crystals to awaken flavor compounds.'
    },
    lettuce: {
      index: 'LAYER 04',
      title: 'Farm-Fresh Frisée Lettuce',
      tagline: 'Cold-spring washed curly frisée leaves for maximum acoustic crunch',
      img: 'assets/lettuce.png',
      role: 'Acoustic Texture, Crispness & Freshness Shield',
      temp: 'Chilled Crisp (8°C)',
      flavor: 'Fresh Herbaceous, Mild Peppery, Clean Crunch',
      origin: 'Hydroponic Coastal Farm, Harvested morning-of',
      description: 'Carefully ruffled frisée greens act as a thermal and moisture barrier between the warm seared beef and the delicate toppings. Plunged in ice-cold water before assembly to maximize cell turgor pressure, creating an audible, satisfying crunch with each bite.'
    },
    burger: {
      index: 'LAYER 05',
      title: 'Prime Angus Beef Patty',
      tagline: 'Coarsely ground 200g prime chuck & brisket blend, flame-seared on cast iron',
      img: 'assets/burger.png',
      role: 'Savory Centerpiece, Deep Maillard Umami & Rich Juices',
      temp: 'Medium-Well (65°C core)',
      flavor: 'Caramelized Maillard, Beefy Umami, Cracked Black Pepper',
      origin: 'Grass-fed Pasture Angus, 28-day dry-aged trim',
      description: 'A bespoke 80/20 blend of prime chuck, brisket flat, and short rib. Smashed onto a 260°C seasoned cast-iron plancha to generate a deep, lacey caramelized Maillard crust while preserving internal moisture. Seasoned solely with butcher-cut black pepper and kosher salt.'
    },
    bun_bottom: {
      index: 'LAYER 06',
      title: 'Toasted Brioche Heel',
      tagline: 'Heavy-duty foundation bun heel, butter-seared to a golden brown seal',
      img: 'assets/bun_bottom.png',
      role: 'Foundation, Juice Absorption & Golden Crunch',
      temp: 'Hot & Toasted (60°C)',
      flavor: 'Rich Toasted Butter, Dense Crumb, Golden Caramel',
      origin: 'Bespoke Craft Bakery, Dense crumb profile',
      description: 'The foundational architectural element of the burger. Cut thicker than the crown to absorb the cascading meat juices and sauce without collapsing. Toasted in clarified grass-fed butter until a crisp golden seal forms across the entire surface.'
    }
  };

  const LAYER_KEYS = ['bun_top', 'sauce', 'tomato', 'lettuce', 'burger', 'bun_bottom'];

  // --- Layer Spatial Offsets (Exploded vs Assembled) ---
  // Values represent Y offset (px), Z offset (px), rotateX (deg), and scale
  const LAYER_OFFSETS = {
    bun_top: {
      assembled: { y: -100, z: 25, rx: 0, scale: 1 },
      exploded:  { y: -260, z: 65, rx: 14, scale: 1.02 }
    },
    sauce: {
      assembled: { y: -50,  z: 15, rx: 0, scale: 1 },
      exploded:  { y: -155, z: 35, rx: 9,  scale: 1 }
    },
    tomato: {
      assembled: { y: -15,  z: 8,  rx: 0, scale: 1 },
      exploded:  { y: -50,  z: 12, rx: 2,  scale: 1 }
    },
    lettuce: {
      assembled: { y: 22,   z: 0,  rx: 0, scale: 1 },
      exploded:  { y: 50,   z: 0,  rx: -3, scale: 1 }
    },
    burger: {
      assembled: { y: 65,   z: -12, rx: 0, scale: 1 },
      exploded:  { y: 155,  z: -20, rx: -8, scale: 1 }
    },
    bun_bottom: {
      assembled: { y: 115,  z: -25, rx: 0, scale: 1 },
      exploded:  { y: 265,  z: -45, rx: -14, scale: 1.01 }
    }
  };

  // --- DOM Elements ---
  const burgerScene = document.getElementById('burgerScene');
  const groundShadow = document.getElementById('groundShadow');
  const scrollHint = document.getElementById('scrollHint');
  const explosionSlider = document.getElementById('explosionSlider');
  const scrubberFill = document.getElementById('scrubberFill');
  const statusValue = document.getElementById('statusValue');
  const ambientGlow = document.getElementById('ambientGlow');
  const particlesContainer = document.getElementById('particlesContainer');

  const btnAutoPlay = document.getElementById('btnAutoPlay');
  const btnSound = document.getElementById('btnSound');
  const btnReset = document.getElementById('btnReset');
  const presetButtons = document.querySelectorAll('.btn-preset');
  const quickDots = document.querySelectorAll('.layer-dot');

  // Drawer Elements
  const ingredientDrawer = document.getElementById('ingredientDrawer');
  const drawerClose = document.getElementById('drawerClose');
  const drawerLayerIndex = document.getElementById('drawerLayerIndex');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerTagline = document.getElementById('drawerTagline');
  const drawerImage = document.getElementById('drawerImage');
  const drawerRole = document.getElementById('drawerRole');
  const drawerTemp = document.getElementById('drawerTemp');
  const drawerFlavor = document.getElementById('drawerFlavor');
  const drawerOrigin = document.getElementById('drawerOrigin');
  const drawerDescription = document.getElementById('drawerDescription');
  const drawerPrev = document.getElementById('drawerPrev');
  const drawerNext = document.getElementById('drawerNext');

  // Layer Item Elements
  const layerElements = {};
  const calloutElements = {};
  LAYER_KEYS.forEach((key) => {
    layerElements[key] = document.querySelector(`.layer-item[data-layer-id="${key}"]`);
    calloutElements[key] = document.querySelector(`.callout[data-layer-ref="${key}"]`);
  });

  // --- State Variables ---
  let targetProgress = 0;
  let currentProgress = 0;
  let isAutoPlaying = false;
  let autoPlayDirection = 1;
  let autoPlaySpeed = 0.0035;
  let isSoundEnabled = false;
  let activeDrawerLayerKey = null;
  let isProgrammaticScroll = false;
  let programmaticScrollTimer = null;
  let touchStartY = 0;

  // Mouse Parallax
  let mouseTargetX = 0;
  let mouseTargetY = 0;
  let mouseCurrentX = 0;
  let mouseCurrentY = 0;

  // Sound Engine
  let audioCtx = null;
  let lastSoundProgress = 0;

  // --- Web Audio Synthesizer ---
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playWhoosh(direction) {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(direction > 0 ? 180 : 380, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(direction > 0 ? 380 : 160, audioCtx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(direction > 0 ? 70 : 120, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(direction > 0 ? 130 : 65, audioCtx.currentTime + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  function playSnap() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  }

  // --- Particles Initialization ---
  function initParticles() {
    const count = 35;
    const colors = ['#e5a93c', '#d97706', '#fef3c7', '#ffffff', '#b45309'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 3 + 1.5;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 12;
      const duration = Math.random() * 10 + 10;
      const color = colors[Math.floor(Math.random() * colors.length)];

      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${left}%`;
      p.style.top = `${top}%`;
      p.style.background = color;
      p.style.animationDelay = `${delay}s`;
      p.style.animationDuration = `${duration}s`;

      particlesContainer.appendChild(p);
    }
  }

  // --- Interpolation (Lerp) Helper ---
  function lerp(start, end, amt) {
    return start + (end - start) * amt;
  }

  // --- Sync Native Scroll with Progress ---
  function syncScrollFromProgress(p) {
    const maxScroll = 3000;
    if (maxScroll > 0) {
      isProgrammaticScroll = true;
      window.scrollTo({
        top: p * maxScroll,
        behavior: 'auto'
      });
      clearTimeout(programmaticScrollTimer);
      programmaticScrollTimer = setTimeout(() => {
        isProgrammaticScroll = false;
      }, 100);
    }
  }

  // --- Update Render Loop ---
  function update() {
    // Auto Play Animation
    if (isAutoPlaying) {
      targetProgress += autoPlayDirection * autoPlaySpeed;
      if (targetProgress >= 1) {
        targetProgress = 1;
        autoPlayDirection = -1;
      } else if (targetProgress <= 0) {
        targetProgress = 0;
        autoPlayDirection = 1;
      }
      syncScrollFromProgress(targetProgress);
    }

    // Smooth Lerp of Explosion Progress
    currentProgress = lerp(currentProgress, targetProgress, 0.09);
    if (Math.abs(currentProgress - targetProgress) < 0.0005) {
      currentProgress = targetProgress;
    }

    // Smooth Mouse Parallax Lerp
    mouseCurrentX = lerp(mouseCurrentX, mouseTargetX, 0.07);
    mouseCurrentY = lerp(mouseCurrentY, mouseTargetY, 0.07);

    // Render Scene Transforms
    renderScene();

    // Check Sound Triggers
    if (Math.abs(currentProgress - lastSoundProgress) > 0.2) {
      const dir = currentProgress > lastSoundProgress ? 1 : -1;
      playWhoosh(dir);
      if (currentProgress < 0.05) playSnap();
      lastSoundProgress = currentProgress;
    }

    requestAnimationFrame(update);
  }

  // --- Render Scene Visuals ---
  function renderScene() {
    const p = currentProgress;

    // 1. Scene 3D Rotation from Mouse Parallax + Subtle Dynamic Pitch
    const sceneRotX = -mouseCurrentY * 14 + (p * 2.5);
    const sceneRotY = mouseCurrentX * 18;
    burgerScene.style.transform = `rotateX(${sceneRotX.toFixed(2)}deg) rotateY(${sceneRotY.toFixed(2)}deg)`;

    // 2. Ambient Spotlight Parallax
    const glowX = 50 + mouseCurrentX * 10;
    const glowY = 50 + mouseCurrentY * 10;
    ambientGlow.style.background = `radial-gradient(circle at ${glowX.toFixed(1)}% ${glowY.toFixed(1)}%, rgba(229, 169, 60, ${0.08 + p * 0.04}) 0%, rgba(180, 80, 20, 0.03) 45%, rgba(0, 0, 0, 0.98) 75%)`;

    // 3. Ground Shadow Dynamics (Expands & dims as burger explodes)
    const shadowScale = 1 + p * 0.35;
    const shadowOpacity = Math.max(0.2, 0.85 - p * 0.5);
    groundShadow.style.transform = `translateX(-50%) rotateX(80deg) scale(${shadowScale.toFixed(3)})`;
    groundShadow.style.opacity = shadowOpacity.toFixed(3);

    // 4. Update Each Layer Position
    LAYER_KEYS.forEach((key) => {
      const el = layerElements[key];
      if (!el) return;

      const offsets = LAYER_OFFSETS[key];
      const y = lerp(offsets.assembled.y, offsets.exploded.y, p);
      const z = lerp(offsets.assembled.z, offsets.exploded.z, p);
      const rx = lerp(offsets.assembled.rx, offsets.exploded.rx, p);
      const scale = lerp(offsets.assembled.scale, offsets.exploded.scale, p);

      el.style.transform = `translate3d(0px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

      // Shadow underneath layer softens as distance increases
      const shadowEl = el.querySelector('.layer-shadow');
      if (shadowEl) {
        const shadowOp = Math.max(0.05, 0.65 - p * 0.55);
        shadowEl.style.setProperty('--shadow-opacity', shadowOp.toFixed(3));
      }

      // Callout Labels Visibility & Dynamic Vertical Tracking (fade in when p > 0.25)
      const callout = calloutElements[key];
      if (callout) {
        callout.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        if (p > 0.25) {
          callout.classList.add('visible');
        } else {
          callout.classList.remove('visible');
        }
      }
    });

    // 5. Scroll Hint Visibility (fade out when scrolled)
    if (p > 0.08) {
      scrollHint.classList.add('hidden');
    } else {
      scrollHint.classList.remove('hidden');
    }

    // 6. Update HUD Scrubber & Percentage
    const pct = Math.round(p * 100);
    statusValue.textContent = `${pct}%`;
    explosionSlider.value = (p * 100).toFixed(1);
    scrubberFill.style.width = `${pct}%`;

    // 7. Update Preset Buttons Active State
    presetButtons.forEach((btn) => {
      const target = parseFloat(btn.dataset.target);
      if (Math.abs(p - target) < 0.12) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- Native Window Scroll Handler ---
  function onScroll() {
    if (isAutoPlaying || isProgrammaticScroll) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      targetProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      document.body.classList.toggle("menu-mode", window.scrollY >= 2950);
    }
  }

  // --- Mouse Wheel Listener (Direct scrubbing & native integration) ---
  function onWheel(e) {
    if (ingredientDrawer.classList.contains('open')) return;
    if (isAutoPlaying) stopAutoPlay();
    const delta = e.deltaY * 0.0014;
    targetProgress = Math.min(1, Math.max(0, targetProgress + delta));
    syncScrollFromProgress(targetProgress);
  }

  // --- Mouse Move for 3D Parallax ---
  function onMouseMove(e) {
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    mouseTargetX = (e.clientX - halfW) / halfW;
    mouseTargetY = (e.clientY - halfH) / halfH;
  }

  function onTouchStart(e) {
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseTargetX = (touch.clientX - halfW) / halfW;
      mouseTargetY = (touch.clientY - halfH) / halfH;

      if (!ingredientDrawer.classList.contains('open')) {
        const deltaY = touchStartY - touch.clientY;
        touchStartY = touch.clientY;
        targetProgress = Math.min(1, Math.max(0, targetProgress + deltaY * 0.0025));
        syncScrollFromProgress(targetProgress);
      }
    }
  }

  // --- Scrubber Input Handler ---
  function onScrubberInput(e) {
    stopAutoPlay();
    const val = parseFloat(e.target.value) / 100;
    targetProgress = val;
    syncScrollFromProgress(val);
  }

  // --- Preset Button Click ---
  function onPresetClick(e) {
    stopAutoPlay();
    const target = parseFloat(e.currentTarget.dataset.target);
    targetProgress = target;
    syncScrollFromProgress(target);
  }

  // --- Auto Demo Tour ---
  function toggleAutoPlay() {
    initAudio();
    isAutoPlaying = !isAutoPlaying;
    if (isAutoPlaying) {
      btnAutoPlay.classList.add('active');
      autoPlayDirection = targetProgress >= 0.9 ? -1 : 1;
    } else {
      btnAutoPlay.classList.remove('active');
    }
  }

  function stopAutoPlay() {
    if (isAutoPlaying) {
      isAutoPlaying = false;
      btnAutoPlay.classList.remove('active');
    }
  }

  // --- Sound FX Toggle ---
  function toggleSound() {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    const iconOn = btnSound.querySelector('.icon-sound-on');
    const iconOff = btnSound.querySelector('.icon-sound-off');

    if (isSoundEnabled) {
      iconOn.style.display = 'block';
      iconOff.style.display = 'none';
      btnSound.style.borderColor = 'var(--accent-gold)';
      playWhoosh(1);
    } else {
      iconOn.style.display = 'none';
      iconOff.style.display = 'block';
      btnSound.style.borderColor = 'var(--card-border)';
    }
  }

  // --- Reset View ---
  function resetView() {
    stopAutoPlay();
    targetProgress = 0;
    currentProgress = 0;
    mouseTargetX = 0;
    mouseTargetY = 0;
    syncScrollFromProgress(0);
    closeDrawer();
  }

  // --- Ingredient Detail Drawer Logic ---
  function openDrawer(layerKey) {
    const data = LAYER_DATA[layerKey];
    if (!data) return;

    initAudio();
    activeDrawerLayerKey = layerKey;

    drawerLayerIndex.textContent = data.index;
    drawerTitle.textContent = data.title;
    drawerTagline.textContent = data.tagline;
    drawerImage.src = data.img;
    drawerImage.alt = data.title;
    drawerRole.textContent = data.role;
    drawerTemp.textContent = data.temp;
    drawerFlavor.textContent = data.flavor;
    drawerOrigin.textContent = data.origin;
    drawerDescription.textContent = data.description;

    ingredientDrawer.classList.add('open');
    ingredientDrawer.setAttribute('aria-hidden', 'false');

    // Highlight Quick Dot
    quickDots.forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.layer === layerKey);
    });

    // If fully stacked, expand slightly so user sees layer context
    if (targetProgress < 0.35) {
      targetProgress = 0.65;
      syncScrollFromProgress(0.65);
    }
  }

  function closeDrawer() {
    ingredientDrawer.classList.remove('open');
    ingredientDrawer.setAttribute('aria-hidden', 'true');
    activeDrawerLayerKey = null;
    quickDots.forEach((dot) => dot.classList.remove('active'));
  }

  function stepDrawer(step) {
    if (!activeDrawerLayerKey) return;
    const curIdx = LAYER_KEYS.indexOf(activeDrawerLayerKey);
    let nextIdx = curIdx + step;
    if (nextIdx < 0) nextIdx = LAYER_KEYS.length - 1;
    if (nextIdx >= LAYER_KEYS.length) nextIdx = 0;
    openDrawer(LAYER_KEYS[nextIdx]);
  }

  // --- Keyboard Accessibility Navigation ---
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }

    if (ingredientDrawer.classList.contains('open')) {
      if (e.key === 'ArrowLeft') stepDrawer(-1);
      if (e.key === 'ArrowRight') stepDrawer(1);
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      targetProgress = Math.min(1, targetProgress + 0.1);
      syncScrollFromProgress(targetProgress);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      targetProgress = Math.max(0, targetProgress - 0.1);
      syncScrollFromProgress(targetProgress);
    } else if (e.key === ' ') {
      e.preventDefault();
      targetProgress = targetProgress > 0.5 ? 0 : 1;
      syncScrollFromProgress(targetProgress);
    } else if (e.key === 'Home') {
      targetProgress = 0;
      syncScrollFromProgress(0);
    } else if (e.key === 'End') {
      targetProgress = 1;
      syncScrollFromProgress(1);
    }
  }

  // --- Attach Event Listeners ---
  function initEvents() {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    explosionSlider.addEventListener('input', onScrubberInput);

    presetButtons.forEach((btn) => btn.addEventListener('click', onPresetClick));
    btnAutoPlay.addEventListener('click', toggleAutoPlay);
    btnSound.addEventListener('click', toggleSound);
    btnReset.addEventListener('click', resetView);

    // Layer Click / Tap to Open Drawer + Bidirectional Cross-Highlighting
    LAYER_KEYS.forEach((key) => {
      const layerEl = layerElements[key];
      const calloutEl = calloutElements[key];

      if (layerEl) {
        layerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openDrawer(key);
        });
        layerEl.addEventListener('mouseenter', () => {
          if (calloutEl) calloutEl.classList.add('highlighted');
        });
        layerEl.addEventListener('mouseleave', () => {
          if (calloutEl) calloutEl.classList.remove('highlighted');
        });
      }

      if (calloutEl) {
        calloutEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openDrawer(key);
        });
        calloutEl.addEventListener('mouseenter', () => {
          if (layerEl) layerEl.classList.add('highlighted');
        });
        calloutEl.addEventListener('mouseleave', () => {
          if (layerEl) layerEl.classList.remove('highlighted');
        });
      }
    });

    // Quick Dots
    quickDots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        openDrawer(dot.dataset.layer);
      });
    });

    // Drawer Controls
    drawerClose.addEventListener('click', closeDrawer);
    drawerPrev.addEventListener('click', () => stepDrawer(-1));
    drawerNext.addEventListener('click', () => stepDrawer(1));

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
      if (
        ingredientDrawer.classList.contains('open') &&
        !ingredientDrawer.contains(e.target) &&
        !e.target.closest('.layer-item') &&
        !e.target.closest('.callout') &&
        !e.target.closest('.layer-dot')
      ) {
        closeDrawer();
      }
    });
  }

  // --- Application Bootstrap ---
  function init() {
    initParticles();
    initEvents();

    // Start in stacked assembled view
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('p')) {
      const p = Math.min(1, Math.max(0, parseFloat(urlParams.get('p'))));
      targetProgress = p;
      currentProgress = p;
      syncScrollFromProgress(p);
    } else if (window.location.hash === '#exploded') {
      targetProgress = 1;
      currentProgress = 1;
      syncScrollFromProgress(1);
    } else if (window.location.hash === '#expanded') {
      targetProgress = 0.5;
      currentProgress = 0.5;
      syncScrollFromProgress(0.5);
    } else {
      targetProgress = 0;
      currentProgress = 0;
      syncScrollFromProgress(0);
    }

    renderScene();
    requestAnimationFrame(update);
    console.log('🍔 New Sama Garden interactive demo initialized.');
  }

  // Expose clean public API for testing & external integrations
  window.BurgerLab = {
    setProgress: function (p) {
      p = Math.min(1, Math.max(0, p));
      targetProgress = p;
      currentProgress = p;
      syncScrollFromProgress(p);
      renderScene();
    },
    getProgress: function () {
      return currentProgress;
    },
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    resetView: resetView,
    toggleAutoPlay: toggleAutoPlay,
    toggleSound: toggleSound
  };

  init();
})();
