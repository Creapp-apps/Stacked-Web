/* ═══════════════════════════════════════════
   STACKED — Scroll Engine
   Lenis + GSAP ScrollTrigger + Canvas Frames
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── CONFIG ──
  const FRAME_COUNT = 192;
  const FRAME_PATH = 'frames/frame_';
  const FRAME_EXT = '.webp';
  const IMAGE_SCALE = 0.85;
  const FRAME_SPEED = 2.0;

  // Spin loop config
  const SPIN_COUNT = 192;
  const SPIN_PATH = 'frames-spin/frame_';
  const SPIN_FPS = 24;

  // Closing video config
  const CLOSE_COUNT = 192;
  const CLOSE_PATH = 'frames-close/frame_';
  const CLOSE_START = 0.75; // scroll progress where closing kicks in
  const CLOSE_END = 1.0;

  // ── DOM ──
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderPct = document.getElementById('loader-percent');
  const canvasWrap = document.querySelector('.canvas-wrap');
  const darkOverlay = document.getElementById('dark-overlay');
  const scrollCont = document.getElementById('scroll-container');
  const sections = document.querySelectorAll('.scroll-section');
  const heroWords = document.querySelectorAll('.hw');
  const heroTagline = document.querySelector('.hero-tagline');
  const scrollInd = document.querySelector('.scroll-indicator');

  // ── STATE ──
  const frames = [];
  const spinFrames = [];
  const closeFrames = [];
  let currentFrame = -1;
  let bgColor = '#0A0A0A';
  let loaded = 0;
  let spinLoopId = null;
  let spinIndex = 0;

  // ═══════════ 1. LENIS SMOOTH SCROLL ═══════════
  if (typeof Lenis === 'undefined') {
    console.error('Lenis not loaded!');
  }
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ═══════════ 2. FRAME PRELOADER ═══════════
  function padFrame(n) {
    return String(n).padStart(4, '0');
  }

  function loadFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { frames[index] = img; resolve(); };
      img.onerror = () => { frames[index] = null; resolve(); };
      img.src = FRAME_PATH + padFrame(index + 1) + FRAME_EXT;
    });
  }

  function updateLoader() {
    loaded++;
    const pct = Math.round((loaded / FRAME_COUNT) * 100);
    loaderBar.style.width = pct + '%';
    loaderPct.textContent = pct + '%';
  }

  async function preloadFrames() {
    // Phase 1: first 10 frames for fast first paint
    const first = [];
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) {
      first.push(loadFrame(i).then(updateLoader));
    }
    await Promise.all(first);
    drawFrame(0);

    // Phase 2: remaining frames
    const rest = [];
    for (let i = 10; i < FRAME_COUNT; i++) {
      rest.push(loadFrame(i).then(updateLoader));
    }
    await Promise.all(rest);

    // Hide loader
    loader.classList.add('hidden');
    initAnimations();

    // Preload spin frames in background (non-blocking)
    preloadSpinFrames();
    preloadCloseFrames();
  }

  async function preloadSpinFrames() {
    const batch = [];
    for (let i = 0; i < SPIN_COUNT; i++) {
      batch.push(new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { spinFrames[i] = img; resolve(); };
        img.onerror = () => { spinFrames[i] = null; resolve(); };
        img.src = SPIN_PATH + padFrame(i + 1) + FRAME_EXT;
      }));
    }
    await Promise.all(batch);
  }

  async function preloadCloseFrames() {
    const batch = [];
    for (let i = 0; i < CLOSE_COUNT; i++) {
      batch.push(new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { closeFrames[i] = img; resolve(); };
        img.onerror = () => { closeFrames[i] = null; resolve(); };
        img.src = CLOSE_PATH + padFrame(i + 1) + FRAME_EXT;
      }));
    }
    await Promise.all(batch);
  }

  // ═══════════ 3. CANVAS RENDERER ═══════════
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    if (currentFrame >= 0) drawFrame(currentFrame);
  }

  function sampleBgColor(img) {
    const tc = document.createElement('canvas');
    tc.width = img.naturalWidth;
    tc.height = img.naturalHeight;
    const tc2 = tc.getContext('2d');
    tc2.drawImage(img, 0, 0);
    const d = tc2.getImageData(2, 2, 1, 1).data;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  }

  function drawFrame(index) {
    const img = frames[index];
    if (!img) return;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);

    // Sample bg color periodically
    if (index % 20 === 0) {
      bgColor = sampleBgColor(img);
    }
  }

  // ═══════════ 4. ANIMATIONS ═══════════
  function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero word-split reveal
    gsap.to(heroWords, {
      opacity: 1, y: 0,
      duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2,
    });
    gsap.to(heroTagline, {
      opacity: 1, y: 0,
      duration: 0.8, ease: 'power3.out', delay: 0.7,
    });
    gsap.to(scrollInd, {
      opacity: 1, duration: 0.6, delay: 1.2,
    });

    // ── Hero circle-wipe → canvas ──
    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top bottom',
      end: '2% top',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        canvasWrap.style.clipPath = `circle(${p * 120}% at 50% 50%)`;
        // Fade hero
        document.querySelector('.hero-standalone').style.opacity = 1 - p;
      },
    });

    // ── Frame-to-Scroll binding ──
    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(
          Math.floor(accelerated * FRAME_COUNT),
          FRAME_COUNT - 1
        );
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }
        // Idle spin loop — only when frames are done AND before transition zone
        const TRANSITION_START = CLOSE_START - 0.05;
        if (accelerated >= 1 && !spinLoopId && spinFrames.length === SPIN_COUNT && self.progress < TRANSITION_START) {
          startSpinLoop();
        } else if (spinLoopId && (accelerated < 1 || self.progress >= TRANSITION_START)) {
          stopSpinLoop();
        }

        // Progressive dimming + closing video
        const dimStart = 0.05;
        const dimEnd = 0.65;
        const minOpacity = 0.15;

        if (self.progress >= CLOSE_START && closeFrames.length === CLOSE_COUNT) {
          // === CLOSING VIDEO ZONE ===
          const closeProgress = (self.progress - CLOSE_START) / (CLOSE_END - CLOSE_START);
          const maxClose = 0.35;
          const fadeInEnd = 0.15; // first 15% of close range = fade in
          let closeOpacity;
          if (closeProgress < fadeInEnd) {
            // Fade in: 0 → maxClose
            closeOpacity = maxClose * (closeProgress / fadeInEnd);
          } else {
            // Fade out: maxClose → 0 (quadratic)
            const fadeOutProgress = (closeProgress - fadeInEnd) / (1 - fadeInEnd);
            closeOpacity = maxClose * (1 - fadeOutProgress * fadeOutProgress);
          }
          canvasWrap.style.opacity = closeOpacity;
          const closeIndex = Math.min(Math.floor(closeProgress * CLOSE_COUNT), CLOSE_COUNT - 1);
          drawCloseFrame(closeIndex);
        } else if (self.progress >= TRANSITION_START) {
          // === TRANSITION ZONE: fade to black, then closing takes over ===
          const fadeProgress = (self.progress - TRANSITION_START) / 0.05; // 0→1
          canvasWrap.style.opacity = Math.max(minOpacity * (1 - fadeProgress), 0.02);
        } else if (self.progress <= dimStart) {
          canvasWrap.style.opacity = 1;
        } else if (self.progress >= dimEnd) {
          canvasWrap.style.opacity = minOpacity;
        } else {
          const dimProgress = (self.progress - dimStart) / (dimEnd - dimStart);
          canvasWrap.style.opacity = 1 - dimProgress * (1 - minOpacity);
        }
      },
    });

    // ── Navbar pill transform ──
    gsap.to('.site-header nav', {
      maxWidth: '800px',
      borderRadius: '50px',
      marginTop: '12px',
      padding: '10px 28px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      webkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      scrollTrigger: {
        trigger: 'body',
        start: '80px top',
        end: '250px top',
        scrub: true,
      },
    });

    // ── Dark overlay for stats ──
    sections.forEach((sec) => {
      if (sec.classList.contains('section-stats')) {
        const enter = parseFloat(sec.dataset.enter) / 100;
        const leave = parseFloat(sec.dataset.leave) / 100;
        ScrollTrigger.create({
          trigger: scrollCont,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (p >= enter - 0.03 && p <= leave + 0.03) {
              const fadeIn = Math.min((p - (enter - 0.03)) / 0.04, 1);
              const fadeOut = Math.max((leave + 0.03 - p) / 0.04, 0);
              darkOverlay.style.opacity = Math.min(fadeIn, fadeOut);
            } else {
              darkOverlay.style.opacity = 0;
            }
          },
        });
      }
    });

    // ── Marquee visibility & scroll ──
    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const mw = document.querySelector('.marquee-wrap');
        mw.style.opacity = self.progress > 0.05 && self.progress < 0.85 ? 1 : 0;
      },
    });
    document.querySelectorAll('.marquee-wrap').forEach((el) => {
      const speed = parseFloat(el.dataset.scrollSpeed) || -25;
      gsap.to(el.querySelector('.marquee-text'), {
        xPercent: speed,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollCont,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    });

    // ── Section reveal system ──
    setupSections();
  }

  // ═══════════ 5. SECTION ANIMATION SYSTEM ═══════════
  function setupSections() {
    sections.forEach((section) => {
      const type = section.dataset.animation;
      const persist = section.dataset.persist === 'true';
      const enter = parseFloat(section.dataset.enter) / 100;
      const leave = parseFloat(section.dataset.leave) / 100;
      const children = section.querySelectorAll(
        '.section-label, .section-heading, .section-body, .section-note, .cta-button, .stat'
      );

      // Build GSAP timeline
      const tl = gsap.timeline({ paused: true });

      switch (type) {
        case 'fade-up':
          tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out' });
          break;
        case 'slide-left':
          tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: 'power3.out' });
          break;
        case 'slide-right':
          tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: 'power3.out' });
          break;
        case 'scale-up':
          tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: 'power2.out' });
          break;
        case 'rotate-in':
          tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' });
          break;
        case 'stagger-up':
          tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' });
          break;
        case 'clip-reveal':
          tl.from(children, { clipPath: 'inset(100% 0 0 0)', opacity: 0, stagger: 0.15, duration: 1.2, ease: 'power4.inOut' });
          break;
      }

      let isActive = false;
      let hasPlayed = false;

      ScrollTrigger.create({
        trigger: scrollCont,
        start: 'top top',
        end: 'bottom bottom',
        scrub: false,
        onUpdate: (self) => {
          const p = self.progress;
          const inRange = p >= enter && p <= leave;

          if (inRange && !isActive) {
            section.classList.add('active');
            tl.play();
            isActive = true;
            hasPlayed = true;
            // Counter animation
            if (section.classList.contains('section-stats') && !section.dataset.counted) {
              section.dataset.counted = 'true';
              animateCounters(section);
            }
          } else if (!inRange && isActive) {
            if (persist && hasPlayed && p > leave) {
              // Keep visible
            } else {
              section.classList.remove('active');
              // Reset timeline after CSS fade-out completes
              setTimeout(() => { tl.pause(0); }, 500);
              isActive = false;
            }
          }
        },
      });
    });
  }

  // ═══════════ 6. COUNTER ANIMATION ═══════════
  function animateCounters(section) {
    section.querySelectorAll('.stat-number').forEach((el) => {
      const target = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals) || 0;
      gsap.to({ val: 0 }, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: function () {
          el.textContent = this.targets()[0].val.toFixed(decimals);
        },
      });
    });
  }

  // ═══════════ 7. CLOSING VIDEO RENDERER ═══════════
  function drawCloseFrame(index) {
    const img = closeFrames[index];
    if (!img) return;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ═══════════ 8. SPIN LOOP ═══════════
  function drawSpinFrame(index) {
    const img = spinFrames[index];
    if (!img) return;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  let lastSpinTime = 0;
  function spinLoop(timestamp) {
    if (!spinLoopId) return;
    const elapsed = timestamp - lastSpinTime;
    if (elapsed >= 1000 / SPIN_FPS) {
      lastSpinTime = timestamp;
      drawSpinFrame(spinIndex);
      spinIndex = (spinIndex + 1) % SPIN_COUNT;
    }
    spinLoopId = requestAnimationFrame(spinLoop);
  }

  function startSpinLoop() {
    spinIndex = 0;
    lastSpinTime = performance.now();
    spinLoopId = requestAnimationFrame(spinLoop);
  }

  function stopSpinLoop() {
    if (spinLoopId) {
      cancelAnimationFrame(spinLoopId);
      spinLoopId = null;
    }
  }

  // ═══════════ 9. INIT ═══════════
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  preloadFrames();
})();

