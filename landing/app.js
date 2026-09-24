/* ==========================================================================
   VIBETOURS - CYBER-LUXURY 2.0 LOGIC, 3D GLOBE ENGINE & BILINGUAL ENGINE
   ========================================================================== */

let currentLandingLang = localStorage.getItem('vibetours_lang') || 'es';
let simulatorInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initInteractiveGlobe();
  initCityDockControls();
  initScrollEffects();
  initCardSpotlight();
  initInteractiveSmartphoneSimulator();
  initLivePhoneClock();
  initFaqAccordion();
  initBentoAudioWidget();
  setLandingLanguage(currentLandingLang);
});

/* --------------------------------------------------------------------------
   1. THEME TOGGLE (LIGHT / DARK) WITH REAL-TIME GLOBE & LEAFLET SYNC
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const brandLogoImg = document.getElementById('brandLogoImg');

  const savedTheme = localStorage.getItem('vibetours_theme') || 'dark';
  
  setTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vibetours_theme', theme);

    if (themeIcon) {
      if (theme === 'dark') {
        themeIcon.innerHTML = `
          <svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>
        `;
        if (brandLogoImg) brandLogoImg.src = 'assets/images/logo_dark.png';
      } else {
        themeIcon.innerHTML = `
          <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/></svg>
        `;
        if (brandLogoImg) brandLogoImg.src = 'assets/images/logo_light.png';
      }
    }

    // Update Bento & Gallery showcase images
    const showcaseImgs = document.querySelectorAll('.showcase-img');
    showcaseImgs.forEach(img => {
      const src = theme === 'dark' ? img.dataset.oscuro : img.dataset.claro;
      if (src) img.src = src;
    });

    // Rebuild globe in real time with the new palette
    if (typeof window.rebuildCobeGlobe === 'function') {
      window.rebuildCobeGlobe();
    }

    // Update simulator map tile layer if active
    if (simulatorInstance && typeof simulatorInstance.updateMapTheme === 'function') {
      simulatorInstance.updateMapTheme(theme);
    }
  }
}

/* --------------------------------------------------------------------------
   2. 3D INTERACTIVE GLOBE (COBE) WITH PROPER 1:1 RATIO & TARGET GLIDING
   -------------------------------------------------------------------------- */
let globeInstance = null;
let globeCanvas = null;
let globePhi = 0;
let globeTargetPhi = 0;
let globePhiOffset = 0;
let globeScrollPhi = 0;
let globeThetaOffset = 0;
let globeDragOffset = { phi: 0, theta: 0 };
let isGlobePaused = false;
let pointerInteracting = null;
let isGlidingToCity = false;

const VIBETOURS_MARKERS = [
  { id: "cartagena", location: [10.39, -75.48], size: 0.055 },
  { id: "paris", location: [48.85, 2.35], size: 0.055 },
  { id: "tokyo", location: [35.68, 139.69], size: 0.055 },
  { id: "newyork", location: [40.71, -74.0], size: 0.055 },
  { id: "rome", location: [41.9, 12.49], size: 0.055 },
  { id: "london", location: [51.5, -0.12], size: 0.055 }
];

const VIBETOURS_ARCS = [
  { from: [10.39, -75.48], to: [40.71, -74.0] },
  { from: [40.71, -74.0], to: [48.85, 2.35] },
  { from: [48.85, 2.35], to: [41.9, 12.49] },
  { from: [41.9, 12.49], to: [35.68, 139.69] },
  { from: [35.68, 139.69], to: [10.39, -75.48] }
];

async function initInteractiveGlobe() {
  globeCanvas = document.getElementById('cobeGlobeCanvas');
  if (!globeCanvas) return;

  let createGlobe = null;
  try {
    const cobeModule = await import('https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm');
    createGlobe = cobeModule.default || cobeModule.createGlobe;
  } catch (err) {
    try {
      const fallbackModule = await import('https://esm.sh/cobe@0.6.3');
      createGlobe = fallbackModule.default || fallbackModule.createGlobe;
    } catch (fallbackErr) {
      console.warn('Cobe library unavailable:', fallbackErr);
      return;
    }
  }

  if (!createGlobe) return;

  // Pointer drag and touch support
  globeCanvas.addEventListener('pointerdown', (e) => {
    pointerInteracting = { x: e.clientX, y: e.clientY };
    globeCanvas.style.cursor = 'grabbing';
    isGlobePaused = true;
    isGlidingToCity = false;
  });

  window.addEventListener('pointerup', () => {
    if (pointerInteracting !== null) {
      globePhiOffset += globeDragOffset.phi;
      globeThetaOffset += globeDragOffset.theta;
      globeDragOffset = { phi: 0, theta: 0 };
    }
    pointerInteracting = null;
    if (globeCanvas) globeCanvas.style.cursor = 'grab';
    isGlobePaused = false;
  });

  window.addEventListener('pointermove', (e) => {
    if (pointerInteracting !== null) {
      globeDragOffset = {
        phi: (e.clientX - pointerInteracting.x) / 280,
        theta: (e.clientY - pointerInteracting.y) / 800
      };
    }
  }, { passive: true });

  function buildGlobe() {
    if (!globeCanvas) return;
    const width = globeCanvas.offsetWidth || 420;
    if (width === 0) return;

    if (globeInstance) {
      globeInstance.destroy();
      globeInstance = null;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const isDark = currentTheme === 'dark';

    // High Contrast Clean Travel Configuration
    const darkFactor = isDark ? 1 : 0;
    const baseColor = isDark ? [0.14, 0.18, 0.28] : [0.76, 0.81, 0.89];
    const markerColor = [0.0, 0.40, 1.0]; // VibeTours Ocean Blue (#0066FF)
    const glowColor = isDark ? [0.0, 0.35, 0.9] : [0.70, 0.82, 0.98];
    const arcColor = [0.05, 0.58, 0.53]; // Refined Teal (#0D9488)
    const mapBrightness = isDark ? 7.8 : 5.8;

    // IMPORTANT: width passed to createGlobe is the dimension (cobe applies devicePixelRatio internally)
    globeInstance = createGlobe(globeCanvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width,
      height: width,
      phi: 0,
      theta: 0.15,
      dark: darkFactor,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: mapBrightness,
      baseColor: baseColor,
      markerColor: markerColor,
      glowColor: glowColor,
      markerElevation: 0.06,
      markers: VIBETOURS_MARKERS,
      arcs: VIBETOURS_ARCS,
      arcColor: arcColor,
      arcWidth: 0.7,
      arcHeight: 0.28,
      opacity: 0.94,
      onRender: (state) => {
        if (!isGlobePaused) {
          if (isGlidingToCity) {
            globePhi += (globeTargetPhi - globePhi) * 0.05;
            if (Math.abs(globeTargetPhi - globePhi) < 0.01) {
              isGlidingToCity = false;
            }
          } else {
            globePhi += 0.003;
          }
        }
        state.phi = globePhi + globePhiOffset + globeDragOffset.phi + globeScrollPhi;
        state.theta = 0.15 + globeThetaOffset + globeDragOffset.theta;
      }
    });

    setTimeout(() => {
      if (globeCanvas) globeCanvas.style.opacity = '1';
    }, 50);
  }

  if (globeCanvas.offsetWidth > 0) {
    buildGlobe();
  } else {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]?.contentRect.width > 0) {
        resizeObserver.disconnect();
        buildGlobe();
      }
    });
    resizeObserver.observe(globeCanvas);
  }

  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      buildGlobe();
    }, 200);
  });

  window.rebuildCobeGlobe = buildGlobe;
}

/* --------------------------------------------------------------------------
   3. MISSION CONTROL CITY DOCK CONTROLS (SMOOTH GLIDE TO TARGET CITY)
   -------------------------------------------------------------------------- */
function initCityDockControls() {
  const cityButtons = document.querySelectorAll('.city-dock-btn');
  const cityCoordinates = {
    cartagena: { phi: 0, theta: 0.15, voice: "Torre del Reloj", stops: "6 Paradas • 2.4 km" },
    tokio: { phi: 4.7, theta: 0.25, voice: "Templo Senso-ji", stops: "12 Paradas • 4.8 km" },
    paris: { phi: 1.5, theta: 0.3, voice: "Torre Eiffel", stops: "10 Paradas • 4.1 km" },
    newyork: { phi: 0.2, theta: 0.28, voice: "Central Park", stops: "9 Paradas • 3.5 km" },
    roma: { phi: 1.7, theta: 0.28, voice: "Coliseo Romano", stops: "8 Paradas • 3.2 km" }
  };

  cityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      cityButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cityKey = btn.dataset.city;
      const target = cityCoordinates[cityKey];
      if (target) {
        globeTargetPhi = target.phi;
        globePhiOffset = 0;
        globeThetaOffset = target.theta - 0.15;
        isGlidingToCity = true;

        const voiceSubEl = document.getElementById('float-voice-sub');
        const gpsSubEl = document.getElementById('float-gps-sub');
        if (voiceSubEl) voiceSubEl.innerText = target.voice;
        if (gpsSubEl) gpsSubEl.innerText = target.stops;
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. MNTN CONTINUOUS SCROLL ENGINE (100-THRESHOLD PARALLAX & SCRUBBING)
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  const mainHeader = document.getElementById('mainHeader');
  const heroSection = document.getElementById('hero-start');
  const heroContentBlock = document.getElementById('heroContentBlock');
  const heroLayerSky = document.getElementById('heroLayerSky');
  const heroLayerPlanet = document.getElementById('heroLayerPlanet');
  const heroLayerHorizon = document.getElementById('heroLayerHorizon');
  const rightSideNav = document.getElementById('mntnRightNav');
  const sectionIndicator = document.getElementById('mntnSectionIndicator');
  const rightNavLinks = document.querySelectorAll('.right-nav-link');
  const trackedSections = ['hero-start', 'step-01', 'step-02', 'step-03', 'simulador'];
  const storySections = document.querySelectorAll('#step-01, #step-02, #step-03, #simulador');

  // Build 100 fine-grained thresholds [0.00, 0.01, ..., 1.00] like MNTN main.js
  const thresholds = [];
  for (let i = 0; i <= 100; i++) {
    thresholds.push(i / 100);
  }

  // Right-side navigation auto-fade behavior (shows on scroll/hover, dims after 2.5s)
  let rightSideNavOpacityTimeout = null;
  function pulseRightSideNav() {
    if (!rightSideNav) return;
    if (rightSideNavOpacityTimeout) {
      clearTimeout(rightSideNavOpacityTimeout);
    }
    rightSideNav.style.opacity = '1';
    rightSideNavOpacityTimeout = setTimeout(() => {
      rightSideNav.style.opacity = '0.28';
    }, 2500);
  }

  if (rightSideNav) {
    rightSideNav.addEventListener('mouseenter', () => {
      if (rightSideNavOpacityTimeout) clearTimeout(rightSideNavOpacityTimeout);
      rightSideNav.style.opacity = '1';
    });
    rightSideNav.addEventListener('mouseleave', () => {
      rightSideNavOpacityTimeout = setTimeout(() => {
        rightSideNav.style.opacity = '0.28';
      }, 1500);
    });
  }

  function setActiveNavIndex(index) {
    if (sectionIndicator) {
      sectionIndicator.style.transform = `translateY(${index * 100}%)`;
    }
    rightNavLinks.forEach((link, idx) => {
      if (idx === index) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // 1. MNTN Hero 100-Threshold Observer (Multi-layer parallax + Hero text opacity fade)
  if (heroSection) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!pointerInteracting && !isGlidingToCity) {
          isGlobePaused = !entry.isIntersecting;
        }
        if (entry.isIntersecting) {
          const ratio = entry.intersectionRatio;
          if (heroContentBlock) {
            heroContentBlock.style.opacity = Math.max(0, Math.pow(ratio, 1.15)).toFixed(3);
            heroContentBlock.style.transform = `translate3d(0, ${(1 - ratio) * -42}px, 0)`;
          }
          if (heroLayerSky) {
            heroLayerSky.style.transform = `translateY(-${(150 - 150 * ratio).toFixed(1)}px)`;
          }
          if (heroLayerPlanet) {
            heroLayerPlanet.style.transform = `translate3d(0, ${(45 - 115 * (1 - ratio)).toFixed(1)}px, 0) scale(${(1 + (1 - ratio) * 0.07).toFixed(3)})`;
          }
          if (heroLayerHorizon) {
            heroLayerHorizon.style.transform = `translateY(-${(55 - 55 * ratio).toFixed(1)}px)`;
          }
          if (ratio > 0.55) {
            setActiveNavIndex(0);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: thresholds
    });
    heroObserver.observe(heroSection);
  }

  // 2. MNTN Story Sections (01, 02, 03, 04) Continuous Scroll Scrubbing Observer
  function applyCardScrollRatio(sectionEl, index, ratio, fromBottom) {
    const visualEl = sectionEl.querySelector('.mntn-story-visual, .mntn-simulator-body');
    const eyebrowLine = sectionEl.querySelector('.eyebrow-line');
    const titleEl = sectionEl.querySelector('.mntn-story-title');
    const descEl = sectionEl.querySelector('.mntn-story-desc');
    const readMoreEl = sectionEl.querySelector('.mntn-read-more');
    const giantNumberEl = sectionEl.querySelector('.mntn-giant-number');

    // Clamp effective ratio so that once a section reaches 65% visibility it locks cleanly at 1.0
    const normalizedRatio = Math.min(1, Math.max(0, ratio / 0.65));

    if (fromBottom) {
      // Horizontal slide-in + opacity on the visual card (Odd: from right, Even: from left)
      if (visualEl) {
        const isOddCard = (index % 2 === 0); // index 0 is #step-01 (odd), index 1 is #step-02 (even)
        const offsetX = (52 - normalizedRatio * 52).toFixed(2);
        visualEl.style.transform = isOddCard
          ? `translateX(${offsetX}px)`
          : `translateX(-${offsetX}px)`;
        visualEl.style.opacity = (0.28 + normalizedRatio * 0.72).toFixed(3);
      }

      // Expanding Eyebrow Horizontal Line (0px -> 72px)
      if (eyebrowLine) {
        const lineMax = Math.min(72 * ((normalizedRatio * 100) + 25) / 100, 72);
        eyebrowLine.style.maxWidth = `${lineMax.toFixed(1)}px`;
      }

      // Staggered vertical slide-up on Title, Description, and Action Link
      const slideY = (22 - 22 * normalizedRatio).toFixed(2);
      const textOpacity = (0.3 + normalizedRatio * 0.7).toFixed(3);
      if (titleEl) {
        titleEl.style.transform = `translateY(${slideY}px)`;
        titleEl.style.opacity = textOpacity;
      }
      if (descEl) {
        descEl.style.transform = `translateY(${slideY}px)`;
        descEl.style.opacity = textOpacity;
      }
      if (readMoreEl) {
        readMoreEl.style.transform = `translateY(${slideY}px)`;
      }
      if (giantNumberEl) {
        giantNumberEl.style.transform = `translateY(${((1 - normalizedRatio) * -36).toFixed(1)}px)`;
      }
    }
  }

  if (storySections.length > 0) {
    const cardsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionIndex = Array.from(storySections).indexOf(entry.target);
          const ratio = entry.intersectionRatio;
          const fromBottom = entry.boundingClientRect.top >= -40;

          applyCardScrollRatio(entry.target, sectionIndex, ratio, fromBottom);

          if (ratio > 0.38 && sectionIndex !== -1) {
            setActiveNavIndex(sectionIndex + 1);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: thresholds
    });

    storySections.forEach(sec => cardsObserver.observe(sec));
  }

  // 3. Scroll Listener for Header Blur, Globe Spin, & Active Section Fallback
  let ticking = false;

  function updateScrollVisuals() {
    const scrollY = window.scrollY;
    pulseRightSideNav();

    // Header background blur on scroll
    if (mainHeader) {
      if (scrollY > 40) {
        mainHeader.classList.add('scrolled');
      } else {
        mainHeader.classList.remove('scrolled');
      }
    }

    // Continuous 3D Planet rotation on scroll
    if (scrollY < window.innerHeight * 1.4) {
      globeScrollPhi = scrollY * 0.0028;
    }

    // Keep right-side sliding indicator synced with viewport center
    let activeIdx = 0;
    const triggerLine = window.innerHeight * 0.45;
    trackedSections.forEach((secId, idx) => {
      const el = document.getElementById(secId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          activeIdx = idx;
        }
      }
    });
    setActiveNavIndex(activeIdx);

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollVisuals);
      ticking = true;
    }
  }, { passive: true });

  updateScrollVisuals();

  // Reveal On Scroll Observer for supplementary elements
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.08 });

  revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   5. CARD SPOTLIGHT EFFECT (CURSOR REACTIVE GLOW)
   -------------------------------------------------------------------------- */
function initCardSpotlight() {
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   6. WIDGET INTERACTIVO: SIMULADOR DE TOURS IA
   -------------------------------------------------------------------------- */
const tourTemplates = {
  cartagena: {
    history: {
      es: {
        title: "Cartagena Colonial: Murallas y Plazas",
        desc: "Ruta histórica por fortalezas coloniales, plazas emblemáticas y baluartes con audioguía GPS contextual.",
        stops: [
          "Torre del Reloj & Plaza de los Coches",
          "Plaza de la Aduana & Museo de Arte Moderno",
          "Santuario San Pedro Claver",
          "Baluarte de Santo Domingo"
        ]
      },
      en: {
        title: "Colonial Cartagena: Walls & Plazas",
        desc: "Historic walking tour along 16th-century sea bastions, colonial squares, and landmarks with GPS audio.",
        stops: [
          "Clock Tower & Coaches Plaza",
          "Aduana Square & Modern Art Museum",
          "San Pedro Claver Sanctuary",
          "Santo Domingo Bastion"
        ]
      }
    },
    food: {
      es: {
        title: "Sabores del Caribe: Getsemaní Gastronómico",
        desc: "Ruta de delicias locales, dulces tradicionales y cócteles tropicales en el corazón de Getsemaní.",
        stops: [
          "Portal de los Dulces",
          "Calle de la Sierpe (Street Food)",
          "Plaza de la Trinidad",
          "Muelle de los Pegasos"
        ]
      },
      en: {
        title: "Caribbean Flavors: Gourmet Getsemaní",
        desc: "Taste traditional sweets, local street bites, and signature sunset cocktails in vibrant alleys.",
        stops: [
          "Sweets Portal",
          "Calle de la Sierpe (Street Food)",
          "Trinidad Plaza",
          "Pegasos Pier"
        ]
      }
    },
    art: {
      es: {
        title: "Arte & Color: Murales y Museos",
        desc: "Descubre galerías coloniales y la vibrante galería de murales a cielo abierto.",
        stops: [
          "Palacio de la Inquisición",
          "Museo Naval del Caribe",
          "Callejón Angosto (Murales)",
          "Teatro Adolfo Mejía"
        ]
      },
      en: {
        title: "Art & Color: Murals & Museums",
        desc: "Discover colonial art collections and the vibrant open-air street murals of Getsemaní.",
        stops: [
          "Inquisition Palace Museum",
          "Caribbean Naval Museum",
          "Callejón Angosto (Art Murals)",
          "Adolfo Mejía Theater"
        ]
      }
    }
  },
  tokio: {
    history: {
      es: {
        title: "Tokio Tradicional: Santuarios y Jardines",
        desc: "Recorrido espiritual desde los templos milenarios de Asakusa hasta los jardines del Palacio Imperial.",
        stops: [
          "Templo Senso-ji & Puerta Kaminarimon",
          "Calle Comercial Nakamise",
          "Jardines del Palacio Imperial",
          "Santuario Meiji Jingu"
        ]
      },
      en: {
        title: "Traditional Tokyo: Shrines & Gardens",
        desc: "A spiritual journey from ancient Asakusa temples to the serene Imperial Palace grounds.",
        stops: [
          "Senso-ji Temple & Kaminarimon Gate",
          "Nakamise Historic Street",
          "Imperial Palace East Gardens",
          "Meiji Jingu Shrine"
        ]
      }
    },
    food: {
      es: {
        title: "Ruta Culinaria de Tokio: Ramen & Izakayas",
        desc: "Experiencia culinaria probando sushi fresco, brochetas yakitori y auténtico ramen artesanal.",
        stops: [
          "Mercado Exterior de Tsukiji",
          "Callejón Omoide Yokocho",
          "Calle del Ramen de Tokio",
          "Barrio Gastronómico de Ginza"
        ]
      },
      en: {
        title: "Tokyo Food Route: Ramen & Izakayas",
        desc: "Taste fresh Tsukiji sushi, yakitori skewers in Shinjuku alleys, and artisanal ramen.",
        stops: [
          "Tsukiji Outer Market",
          "Omoide Yokocho Alley",
          "Tokyo Station Ramen Street",
          "Ginza Gourmet Quarter"
        ]
      }
    },
    art: {
      es: {
        title: "Tokio Futurista & Arte Digital",
        desc: "Explora galerías interactivas, distritos tecnológicos y las vistas panorámicas de Shibuya.",
        stops: [
          "Cruce de Shibuya & Mirador Sky",
          "Distrito Tecnológico de Akihabara",
          "Mori Art Museum (Roppongi)",
          "Isla Artificial de Odaiba"
        ]
      },
      en: {
        title: "Futuristic Tokyo & Digital Art",
        desc: "Explore interactive digital art galleries, tech districts, and panoramic skyline vistas.",
        stops: [
          "Shibuya Crossing & Sky Lookout",
          "Akihabara Tech Quarter",
          "Mori Art Museum (Roppongi)",
          "Odaiba Bay"
        ]
      }
    }
  },
  paris: {
    history: {
      es: {
        title: "París Imperial: De Notre-Dame al Louvre",
        desc: "Recorrido histórico por la Île de la Cité, puentes del Sena y la emblemática arquitectura parisina.",
        stops: [
          "Catedral de Notre-Dame",
          "Puente Alejandro III",
          "Patio de la Pirámide del Louvre",
          "Arco de Triunfo & Campos Elíseos"
        ]
      },
      en: {
        title: "Imperial Paris: Notre-Dame to Louvre",
        desc: "Historic walking tour across Île de la Cité, Seine bridges, and monumental landmarks.",
        stops: [
          "Notre-Dame Cathedral",
          "Pont Alexandre III",
          "Louvre Courtyard & Pyramid",
          "Arc de Triomphe & Champs-Élysées"
        ]
      }
    },
    food: {
      es: {
        title: "Bistrós & Boulangeries: París Gourmet",
        desc: "Degustación de croissants artesanales, quesos franceses, crepes y café en terrazas clásicas.",
        stops: [
          "Marché des Enfants Rouges",
          "Place des Vosges",
          "Bistró en Rue des Rosiers",
          "Café de Flore en Saint-Germain"
        ]
      },
      en: {
        title: "Bistros & Boulangeries: Gourmet Paris",
        desc: "Tasting tour featuring artisanal croissants, fine cheeses, sweet crêpes, and iconic cafés.",
        stops: [
          "Marché des Enfants Rouges",
          "Place des Vosges",
          "Rue des Rosiers Bistro",
          "Café de Flore"
        ]
      }
    },
    art: {
      es: {
        title: "París Bohemio: Montmartre y Pintores",
        desc: "Recorre las calles empedradas de los grandes artistas, la Plaza del Tertre y el Sacré-Cœur.",
        stops: [
          "Basílica del Sacré-Cœur",
          "Place du Tertre (Pintores)",
          "Museo de Montmartre",
          "Moulin Rouge"
        ]
      },
      en: {
        title: "Bohemian Paris: Montmartre & Art",
        desc: "Wander cobblestone alleys of legendary painters, Place du Tertre, and Sacré-Cœur Basilica.",
        stops: [
          "Sacré-Cœur Basilica Overlook",
          "Place du Tertre (Painters)",
          "Montmartre Museum",
          "Moulin Rouge"
        ]
      }
    }
  },
  roma: {
    history: {
      es: {
        title: "Roma Eterna: Coliseo y Foros Imperiales",
        desc: "Sumérgete en la historia imperial visitando los monumentos cumbre de la civilización romana.",
        stops: [
          "Coliseo Romano",
          "Foro Romano & Colina Palatina",
          "Panteón de Agripa",
          "Fontana di Trevi"
        ]
      },
      en: {
        title: "Eternal Rome: Colosseum & Forums",
        desc: "Immerse in two millennia of history visiting the pinnacle monuments of ancient Rome.",
        stops: [
          "Roman Colosseum",
          "Roman Forum & Palatine Hill",
          "Pantheon of Agrippa",
          "Trevi Fountain"
        ]
      }
    },
    food: {
      es: {
        title: "Trattorias & Gelato: Trastevere Auténtico",
        desc: "Ruta de pasta carbonara fresca, pizza al taglio romana, supplí crujiente y helado artesanal.",
        stops: [
          "Campo de' Fiori",
          "Piazza Santa Maria in Trastevere",
          "Trattoria Tradicional",
          "Gelatería Artesanal"
        ]
      },
      en: {
        title: "Trattorias & Gelato: Authentic Trastevere",
        desc: "Taste fresh handmade pasta, Roman pizza al taglio, crispy suppli, and artisan gelato.",
        stops: [
          "Campo de' Fiori",
          "Piazza Santa Maria in Trastevere",
          "Historic Roman Trattoria",
          "Artisan Gelateria"
        ]
      }
    },
    art: {
      es: {
        title: "Barroco & Plazas: Bernini y Caravaggio",
        desc: "Obras maestras de la escultura y pintura en las iglesias y fuentes monumentales de Roma.",
        stops: [
          "Piazza Navona (Fuente de los Cuatro Ríos)",
          "Iglesia San Luis de los Franceses",
          "Piazza del Popolo",
          "Castillo de Sant'Angelo"
        ]
      },
      en: {
        title: "Baroque & Piazzas: Bernini & Caravaggio",
        desc: "Sculptural and painting masterpieces across Rome's churches and monumental fountains.",
        stops: [
          "Piazza Navona (Fountain of Four Rivers)",
          "San Luigi dei Francesi Church",
          "Piazza del Popolo",
          "Sant'Angelo Castle"
        ]
      }
    }
  }
};

/* --------------------------------------------------------------------------
   6. SMARTPHONE SIMULATOR ENGINE (FLUTTER APP FIDELITY CONTROLLER)
   -------------------------------------------------------------------------- */
const SIMULATOR_DATA = {
  cartagena: {
    name: "Cartagena de Indias",
    weather: "☀️ 28°C",
    title: "Cartagena Colonial: Murallas y Plazas",
    desc: "Ruta histórica por fortalezas coloniales, plazas emblemáticas y baluartes con audioguía GPS contextual.",
    duration: "2h 30m",
    distance: "2.4 km",
    rating: "⭐ 4.9 (142)",
    center: [10.4236, -75.5501],
    zoom: 16,
    img: "https://images.unsplash.com/photo-1583997052103-b4a1cb974ce3?w=600&auto=format&fit=crop&q=80",
    popular: [
      {
        title: "Getsemaní Arte Callejero y Sabores",
        duration: "3h",
        distance: "3.2 km",
        rating: "⭐ 4.8",
        img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=300&auto=format&fit=crop&q=80",
        desc: "Murales vibrantes, gastronomía callejera caribeña y vida bohemia en el barrio más auténtico de Cartagena."
      },
      {
        title: "Baluartes & Atardecer Caribe",
        duration: "1.5h",
        distance: "1.8 km",
        rating: "⭐ 4.9",
        img: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=300&auto=format&fit=crop&q=80",
        desc: "Paseo por las murallas centenarias contemplando el mar Caribe bajo la brisa del ocaso."
      }
    ],
    stops: [
      {
        name: "1. Torre del Reloj & Plaza de los Coches",
        sub: "Entrada triunfal a la ciudad amurallada",
        latlng: [10.4236, -75.5501],
        voice: "Bienvenido a la Torre del Reloj, entrada principal a la ciudad amurallada de Cartagena construida en el siglo diecinueve sobre el puente levadizo colonial."
      },
      {
        name: "2. Plaza de la Aduana & Museo de Arte",
        sub: "Epicentro administrativo y comercial colonial",
        latlng: [10.4222, -75.5492],
        voice: "Plaza de la Aduana: la plaza más amplia de la ciudad colonial, sede de mercaderes de ultramar y antiguas casas reales de gobierno."
      },
      {
        name: "3. Santuario San Pedro Claver",
        sub: "Joya de piedra coralina y claustro jesuita",
        latlng: [10.4215, -75.5480],
        voice: "Santuario de San Pedro Claver, iglesia barroca de piedra coralina construida en honor al defensor de los derechos humanos en el Caribe."
      },
      {
        name: "4. Baluarte de Santo Domingo",
        sub: "Fortificación sobre el mar Caribe",
        latlng: [10.4245, -75.5530],
        voice: "Baluarte de Santo Domingo: la fortificación más antigua frente al mar Caribe, baluarte defensivo clave y el mejor lugar para ver el atardecer."
      }
    ]
  },
  paris: {
    name: "París, Francia",
    weather: "⛅ 19°C",
    title: "París Imperial: Notre-Dame al Louvre",
    desc: "Recorrido histórico por la Île de la Cité, puentes emblemáticos del Sena y monumentos del corazón parisino.",
    duration: "3h 00m",
    distance: "3.5 km",
    rating: "⭐ 4.9 (210)",
    center: [48.8566, 2.3450],
    zoom: 15,
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80",
    popular: [
      {
        title: "Montmartre Bohemio & Cafés de Arte",
        duration: "3h",
        distance: "3.5 km",
        rating: "⭐ 4.9",
        img: "https://images.unsplash.com/photo-1509299349698-dd22323b5963?w=300&auto=format&fit=crop&q=80",
        desc: "Colina de artistas, pintores callejeros, la basílica del Sacré-Cœur y miradores panorámicos de la ciudad."
      },
      {
        title: "Bistrós de Saint-Germain",
        duration: "2.5h",
        distance: "2.8 km",
        rating: "⭐ 4.7",
        img: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=300&auto=format&fit=crop&q=80",
        desc: "La esencia bohemia parisina entre librerías legendarias, cafés históricos y galerías de arte."
      }
    ],
    stops: [
      {
        name: "1. Catedral de Notre-Dame",
        sub: "Obra cumbre del gótico medieval",
        latlng: [48.8530, 2.3499],
        voice: "Notre-Dame de París, obra maestra de la arquitectura gótica en la Isla de la Cité, testigo de ocho siglos de historia de Francia."
      },
      {
        name: "2. Puente de las Artes & Río Sena",
        sub: "Paseo peatonal y mirador sobre el Sena",
        latlng: [48.8584, 2.3375],
        voice: "Puente de las Artes, famoso mirador peatonal con vistas directas al Instituto de Francia y al Palacio del Louvre."
      },
      {
        name: "3. Patio de la Pirámide del Louvre",
        sub: "Fusión de palacio real y modernismo",
        latlng: [48.8606, 2.3376],
        voice: "Museo del Louvre y su icónica pirámide de cristal diseñada por I.M. Pei, entrada al museo más visitado del mundo."
      },
      {
        name: "4. Jardines de las Tullerías",
        sub: "Parque real entre el Louvre y Concorde",
        latlng: [48.8635, 2.3275],
        voice: "Jardines de las Tullerías, parque histórico renacentista creado por Catalina de Médici con fuentes y esculturas clásicas."
      }
    ]
  },
  tokio: {
    name: "Tokio, Japón",
    weather: "🌧️ 16°C",
    title: "Tokio Tradicional: Santuarios y Jardines",
    desc: "Recorrido espiritual desde los templos milenarios de Asakusa hasta los jardines del Palacio Imperial.",
    duration: "3h 30m",
    distance: "4.2 km",
    rating: "⭐ 5.0 (98)",
    center: [35.7000, 139.7750],
    zoom: 14,
    img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80",
    popular: [
      {
        title: "Ruta de Ramen & Izakayas en Shinjuku",
        duration: "3h",
        distance: "3.8 km",
        rating: "⭐ 5.0",
        img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&auto=format&fit=crop&q=80",
        desc: "Callejones Omoide Yokocho, templos de ramen de autor y gastronomía nocturna japonesa."
      },
      {
        title: "Akihabara Tech & Shibuya Sky",
        duration: "4h",
        distance: "5.0 km",
        rating: "⭐ 4.8",
        img: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=300&auto=format&fit=crop&q=80",
        desc: "De la meca tecnológica y retro de Akihabara al cruce más transitado y mirador de Shibuya."
      }
    ],
    stops: [
      {
        name: "1. Templo Senso-ji & Kaminarimon",
        sub: "El templo budista más antiguo de Tokio (628 d.C.)",
        latlng: [35.7147, 139.7967],
        voice: "Templo Senso-ji en Asakusa, fundado en el año 628, con su gigantesco farol rojo en la Puerta del Trueno."
      },
      {
        name: "2. Calle Comercial Nakamise",
        sub: "Centenario paseo de artesanías y dulces",
        latlng: [35.7128, 139.7966],
        voice: "Calle Nakamise, histórico paseo peatonal repleto de dulces tradicionales ningyo-yaki y artesanías japonesas."
      },
      {
        name: "3. Jardines del Palacio Imperial",
        sub: "Residencia del Emperador entre fosos",
        latlng: [35.6852, 139.7528],
        voice: "Jardines del Palacio Imperial de Tokio, residencia del Emperador de Japón entre antiguos fosos y murallas del Castillo Edo."
      },
      {
        name: "4. Santuario Meiji Jingu",
        sub: "Bosque sagrado en el corazón urbano",
        latlng: [35.6764, 139.6993],
        voice: "Santuario Meiji Jingu, oasis de bosque sagrado con más de cien mil árboles donados de todo Japón."
      }
    ]
  },
  roma: {
    name: "Roma, Italia",
    weather: "☀️ 24°C",
    title: "Roma Eterna: Coliseo y Foros",
    desc: "Sumérgete en dos milenios de historia imperial visitando los monumentos cumbre de Roma.",
    duration: "2h 45m",
    distance: "3.1 km",
    rating: "⭐ 4.9 (185)",
    center: [41.8950, 12.4850],
    zoom: 15,
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80",
    popular: [
      {
        title: "Trattorias & Gelato en Trastevere",
        duration: "2.5h",
        distance: "2.6 km",
        rating: "⭐ 4.9",
        img: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=300&auto=format&fit=crop&q=80",
        desc: "Callejones medievales adoquinados, auténtica pasta carbonara y las mejores heladerías artesanales."
      },
      {
        title: "Barroco & Plazas de Bernini",
        duration: "3h",
        distance: "3.4 km",
        rating: "⭐ 4.8",
        img: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=300&auto=format&fit=crop&q=80",
        desc: "Piazza Navona, Campo de' Fiori y las espectaculares fuentes del barroco romano."
      }
    ],
    stops: [
      {
        name: "1. Coliseo Romano",
        sub: "El anfiteatro más grande de la antigüedad",
        latlng: [41.8902, 12.4922],
        voice: "El Coliseo Romano, imponente anfiteatro del imperio con capacidad para cincuenta mil espectadores."
      },
      {
        name: "2. Foro Romano & Palatino",
        sub: "Epicentro político y religioso de Roma",
        latlng: [41.8925, 12.4853],
        voice: "Foro Romano, corazón de la vida pública imperial flanqueado por templos, basílicas y arcos de triunfo."
      },
      {
        name: "3. Panteón de Agripa",
        sub: "Cúpula de hormigón más grande del mundo",
        latlng: [41.8986, 12.4769],
        voice: "Panteón de Agripa, templo romano intacto con su óculo abierto al cielo y una cúpula arquitectónicamente milagrosa."
      },
      {
        name: "4. Fontana di Trevi",
        sub: "Joya cumbre del barroco romano",
        latlng: [41.9009, 12.4833],
        voice: "Fontana di Trevi, majestuosa fuente monumental donde la tradición manda lanzar una moneda para asegurar el regreso a Roma."
      }
    ]
  },
  newyork: {
    name: "Nueva York, USA",
    weather: "⛅ 22°C",
    title: "Nueva York: Central Park a Broadway",
    desc: "Itinerario vibrante cruzando miradores, rascacielos históricos y avenidas icónicas.",
    duration: "3h 15m",
    distance: "3.8 km",
    rating: "⭐ 4.8 (167)",
    center: [40.7550, -73.9800],
    zoom: 14,
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=80",
    popular: [
      {
        title: "High Line & Chelsea Market Gourmet",
        duration: "2h",
        distance: "2.3 km",
        rating: "⭐ 4.9",
        img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=300&auto=format&fit=crop&q=80",
        desc: "Parque elevado sobre antiguas vías de tren, galerías de arte contemporáneo y comida gourmet."
      },
      {
        title: "Ruta de Arte en SoHo & Village",
        duration: "3h",
        distance: "3.8 km",
        rating: "⭐ 4.7",
        img: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=300&auto=format&fit=crop&q=80",
        desc: "Edificios de hierro fundido, clubes de jazz, boutiques independientes y cafeterías de autor."
      }
    ],
    stops: [
      {
        name: "1. Central Park (Bethesda)",
        sub: "El corazón verde y escénico de Manhattan",
        latlng: [40.7739, -73.9708],
        voice: "Central Park y la icónica terraza Bethesda con su fuente Angel of the Waters en el pulmón de la ciudad."
      },
      {
        name: "2. Times Square & Broadway",
        sub: "El cruce del mundo y marquesinas teatrales",
        latlng: [40.7580, -73.9855],
        voice: "Times Square, la encrucijada del mundo iluminada por pantallas colosales y el pulso vibrante de Broadway."
      },
      {
        name: "3. Empire State Building",
        sub: "Rascacielos art déco inmortal",
        latlng: [40.7484, -73.9857],
        voice: "Empire State Building, joya art déco que definió para siempre el horizonte de rascacielos de Nueva York."
      },
      {
        name: "4. Puente de Brooklyn",
        sub: "Maravilla de cables de acero y piedra gótica",
        latlng: [40.7061, -73.9969],
        voice: "Puente de Brooklyn, maravilla de la ingeniería del siglo diecinueve con vistas panorámicas al skyline de Manhattan."
      }
    ]
  }
};

class AppSimulator {
  constructor() {
    this.currentCityKey = 'cartagena';
    this.currentPace = 'relaxed';
    this.activeTab = 'tabContentExplore';
    this.mapInstance = null;
    this.tileLayer = null;
    this.routeLine = null;
    this.stopMarkers = [];
    this.userGpsMarker = null;
    this.currentStepIdx = 0;
    this.isAudioPlaying = false;
    this.speechUtterance = null;
    this.isManualOverride = false;
    this.overrideTimer = null;
  }

  init() {
    this.bindCockpitControls();
    this.bindPhoneNavigation();
    this.bindChatEvents();
    this.initPhoneMap();
    this.updateCityState(this.currentCityKey);
    this.updateJourneyTracker(this.activeTab);
  }

  setManualOverride() {
    this.isManualOverride = true;
    clearTimeout(this.overrideTimer);
    this.overrideTimer = setTimeout(() => {
      this.isManualOverride = false;
    }, 2000);
  }

  bindCockpitControls() {
    // City Chips in Cockpit
    const cityChips = document.querySelectorAll('#simCityChips .cockpit-chip');
    cityChips.forEach(chip => {
      chip.addEventListener('click', () => {
        cityChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCityKey = chip.dataset.simCity || 'cartagena';
        this.updateCityState(this.currentCityKey);
      });
    });

    // Quick Screen Switchers
    const btnExplore = document.getElementById('btnSwitchToExplore');
    const btnChat = document.getElementById('btnSwitchToChat');
    const btnMap = document.getElementById('btnSwitchToMap');
    const btnProfile = document.getElementById('btnSwitchToProfile');

    if (btnExplore) btnExplore.addEventListener('click', () => this.switchTab('tabContentExplore', true));
    if (btnChat) btnChat.addEventListener('click', () => this.switchTab('tabContentChat', true));
    if (btnMap) btnMap.addEventListener('click', () => this.switchTab('tabContentMap', true));
    if (btnProfile) btnProfile.addEventListener('click', () => this.switchTab('tabContentProfile', true));
  }

  bindPhoneNavigation() {
    const navItems = document.querySelectorAll('.phone-bottom-navbar .phone-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.dataset.targetTab;
        if (targetTab) this.switchTab(targetTab, true);
      });
    });

    // Simulate Step Button in Map
    const stepBtn = document.getElementById('simStepWalkBtn');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => this.simulateWalkStep());
    }

    // Audio Play/Pause Button in Mini Player
    const audioBtn = document.getElementById('phoneAudioToggleBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleVoiceAudio();
      });
    }
  }

  updateJourneyTracker(tabId) {
    const tabToStep = {
      'tabContentExplore': 0,
      'tabContentDetail': 0,
      'tabContentChat': 1,
      'tabContentMap': 2,
      'tabContentProfile': 3
    };
    const stepIdx = tabToStep[tabId] ?? 0;
    const steps = document.querySelectorAll('#cockpitJourneyTracker .journey-step');
    const fill = document.getElementById('journeyProgressFill');

    if (fill) {
      const percentage = (stepIdx / 3) * 100;
      fill.style.width = `${percentage}%`;
    }

    steps.forEach((step, idx) => {
      step.classList.toggle('active', idx === stepIdx);
      step.classList.toggle('completed', idx < stepIdx);
    });
  }

  switchTab(tabId, isManual = false) {
    if (isManual) {
      this.setManualOverride();
    }
    this.activeTab = tabId;

    // Update screen content
    document.querySelectorAll('.phone-tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === tabId);
    });

    // Update bottom nav active state (Detail screen keeps Explore active)
    document.querySelectorAll('.phone-nav-item').forEach(item => {
      const isTarget = item.dataset.targetTab === tabId || (tabId === 'tabContentDetail' && item.dataset.targetTab === 'tabContentExplore');
      item.classList.toggle('active', isTarget);
    });

    // Update Cockpit button styles
    const btnExplore = document.getElementById('btnSwitchToExplore');
    const btnChat = document.getElementById('btnSwitchToChat');
    const btnMap = document.getElementById('btnSwitchToMap');
    const btnProfile = document.getElementById('btnSwitchToProfile');

    if (btnExplore) btnExplore.classList.toggle('active-sim-mode', tabId === 'tabContentExplore' || tabId === 'tabContentDetail');
    if (btnChat) btnChat.classList.toggle('active-sim-mode', tabId === 'tabContentChat');
    if (btnMap) btnMap.classList.toggle('active-sim-mode', tabId === 'tabContentMap');
    if (btnProfile) btnProfile.classList.toggle('active-sim-mode', tabId === 'tabContentProfile');

    // Update Live Journey Step Progress in Cockpit
    this.updateJourneyTracker(tabId);

    // Invalidate Leaflet map size on switch to Map
    if (tabId === 'tabContentMap' && this.mapInstance) {
      setTimeout(() => {
        this.mapInstance.invalidateSize();
        const city = SIMULATOR_DATA[this.currentCityKey];
        if (city && this.routeLine) {
          this.mapInstance.fitBounds(this.routeLine.getBounds(), { padding: [25, 25] });
        }
      }, 150);
    }
  }

  initPhoneMap() {
    const mapEl = document.getElementById('simLeafletMap');
    if (!mapEl || typeof L === 'undefined') return;

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const city = SIMULATOR_DATA[this.currentCityKey];

    try {
      this.mapInstance = L.map('simLeafletMap', {
        zoomControl: false,
        attributionControl: false
      }).setView(city.center, city.zoom);

      this.updateMapTheme(currentTheme);
    } catch (e) {
      console.warn('Leaflet map initialization skipped:', e);
    }
  }

  updateMapTheme(theme) {
    if (!this.mapInstance || typeof L === 'undefined') return;

    if (this.tileLayer) {
      this.mapInstance.removeLayer(this.tileLayer);
    }

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    this.tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(this.mapInstance);
  }

  updateCityState(cityKey) {
    this.currentCityKey = cityKey;
    const city = SIMULATOR_DATA[cityKey] || SIMULATOR_DATA['cartagena'];
    this.currentStepIdx = 0;

    // Update Explorar (Home Screen)
    const homeCityName = document.getElementById('simHomeCityName');
    const homeWeatherChip = document.getElementById('simHomeWeatherChip');
    const featuredImg = document.getElementById('simFeaturedImg');
    const featuredTitle = document.getElementById('simFeaturedTitle');
    const featuredDuration = document.getElementById('simFeaturedDuration');
    const featuredDistance = document.getElementById('simFeaturedDistance');
    const popularList = document.getElementById('simPopularToursList');

    if (homeCityName) homeCityName.innerText = city.name;
    if (homeWeatherChip) homeWeatherChip.innerText = city.weather;
    if (featuredImg) featuredImg.src = city.img;
    if (featuredTitle) featuredTitle.innerText = city.title;
    if (featuredDuration) featuredDuration.innerText = `⏱️ ${city.duration}`;
    if (featuredDistance) featuredDistance.innerText = `🚶 ${city.distance}`;

    if (popularList) {
      popularList.innerHTML = city.popular.map((item, idx) => `
        <div class="popular-tour-item" onclick="simulatorInstance.openTourDetail(null, ${idx})">
          <img class="popular-tour-img" src="${item.img}" alt="${item.title}">
          <div class="popular-tour-info">
            <h6 class="popular-tour-title">${item.title}</h6>
            <div class="popular-tour-meta">
              <span>⏱️ ${item.duration}</span>
              <span>🚶 ${item.distance}</span>
              <span class="text-warning">${item.rating}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Update Map Title Header
    const mapHeaderTitle = document.getElementById('simMapHeaderTitle');
    const mapHeaderSub = document.getElementById('simMapHeaderSubtitle');
    if (mapHeaderTitle) mapHeaderTitle.innerText = city.title;
    if (mapHeaderSub) mapHeaderSub.innerText = `${city.stops.length} Paradas • ${city.distance}`;

    // Update Map Layer and Markers
    if (this.mapInstance && typeof L !== 'undefined') {
      // Clear old markers
      this.stopMarkers.forEach(m => this.mapInstance.removeLayer(m));
      this.stopMarkers = [];
      if (this.routeLine) this.mapInstance.removeLayer(this.routeLine);
      if (this.userGpsMarker) this.mapInstance.removeLayer(this.userGpsMarker);

      const latlngs = city.stops.map(s => s.latlng);

      // Draw Route Polyline
      this.routeLine = L.polyline(latlngs, {
        color: '#007AFF',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(this.mapInstance);

      // Add Numbered Stop Markers
      city.stops.forEach((stop, idx) => {
        const pinIcon = L.divIcon({
          className: 'custom-pin-icon',
          html: `<div style="background:#007AFF; color:#fff; font-size:10px; font-weight:800; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.3);">${idx + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        const marker = L.marker(stop.latlng, { icon: pinIcon }).addTo(this.mapInstance);
        marker.bindTooltip(stop.name, { permanent: false, direction: 'top' });
        this.stopMarkers.push(marker);
      });

      // Add User GPS Pulsing Dot Marker
      this.userGpsMarker = L.circleMarker(latlngs[0], {
        radius: 7,
        fillColor: '#00F0FF',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 1
      }).addTo(this.mapInstance);

      this.mapInstance.fitBounds(this.routeLine.getBounds(), { padding: [30, 30] });
    }

    // Update Floating Audio Mini Player Info
    this.updateAudioCard(0);
  }

  openTourDetail(cityKey = null, popularTourIdx = null) {
    if (cityKey) {
      this.currentCityKey = cityKey;
    }
    const city = SIMULATOR_DATA[this.currentCityKey] || SIMULATOR_DATA['cartagena'];

    const tourData = (popularTourIdx !== null && city.popular[popularTourIdx])
      ? {
          title: city.popular[popularTourIdx].title,
          desc: city.popular[popularTourIdx].desc || city.desc,
          duration: city.popular[popularTourIdx].duration,
          distance: city.popular[popularTourIdx].distance,
          rating: city.popular[popularTourIdx].rating,
          img: city.popular[popularTourIdx].img,
          stops: city.stops
        }
      : {
          title: city.title,
          desc: city.desc,
          duration: city.duration,
          distance: city.distance,
          rating: city.rating,
          img: city.img,
          stops: city.stops
        };

    const headerCity = document.getElementById('simDetailHeaderCity');
    const detailImg = document.getElementById('simDetailImg');
    const detailTitle = document.getElementById('simDetailTitle');
    const detailDuration = document.getElementById('simDetailDuration');
    const detailDistance = document.getElementById('simDetailDistance');
    const detailRating = document.getElementById('simDetailRating');
    const detailDesc = document.getElementById('simDetailDesc');
    const stopsTitle = document.getElementById('simDetailStopsTitle');
    const stopsList = document.getElementById('simDetailStopsList');

    if (headerCity) headerCity.innerText = city.name.split(',')[0];
    if (detailImg) detailImg.src = tourData.img;
    if (detailTitle) detailTitle.innerText = tourData.title;
    if (detailDuration) detailDuration.innerText = `⏱️ ${tourData.duration}`;
    if (detailDistance) detailDistance.innerText = `🚶 ${tourData.distance}`;
    if (detailRating) detailRating.innerText = tourData.rating;
    if (detailDesc) detailDesc.innerText = tourData.desc;
    if (stopsTitle) {
      stopsTitle.innerText = (typeof currentLandingLang !== 'undefined' && currentLandingLang === 'en')
        ? `Stop Itinerary (${tourData.stops.length})`
        : `Itinerario de Paradas (${tourData.stops.length})`;
    }

    if (stopsList) {
      stopsList.innerHTML = tourData.stops.map((stop, idx) => `
        <div class="timeline-stop-item">
          <div class="stop-pin-col">
            <span class="stop-num">${idx + 1}</span>
            ${idx < tourData.stops.length - 1 ? '<span class="stop-line"></span>' : ''}
          </div>
          <div class="stop-details">
            <div class="stop-name">${stop.name}</div>
            <div class="stop-sub">${stop.sub || 'Parada satelital verificada'}</div>
            <button class="stop-audio-badge" onclick="simulatorInstance.previewStopAudio(${idx}, event)">
              <span>🎧 Escuchar demo (30s)</span>
            </button>
          </div>
        </div>
      `).join('');
    }

    this.switchTab('tabContentDetail', true);
  }

  startTourFromDetail() {
    this.currentStepIdx = 0;
    this.switchTab('tabContentMap', true);

    const city = SIMULATOR_DATA[this.currentCityKey];
    if (city && city.stops.length > 0) {
      const firstStop = city.stops[0];
      if (this.userGpsMarker) {
        this.userGpsMarker.setLatLng(firstStop.latlng);
      }
      if (this.mapInstance) {
        this.mapInstance.panTo(firstStop.latlng, { animate: true, duration: 0.8 });
      }
      this.updateAudioCard(0);
      this.playVoiceNarration(firstStop.voice);
    }
  }

  previewStopAudio(idx, event) {
    if (event) event.stopPropagation();
    const city = SIMULATOR_DATA[this.currentCityKey];
    if (city && city.stops[idx]) {
      this.currentStepIdx = idx;
      this.updateAudioCard(idx);
      this.playVoiceNarration(city.stops[idx].voice);
    }
  }

  simulateWalkStep() {
    const city = SIMULATOR_DATA[this.currentCityKey];
    if (!city || !city.stops.length) return;

    this.currentStepIdx = (this.currentStepIdx + 1) % city.stops.length;
    const currentStop = city.stops[this.currentStepIdx];

    if (this.userGpsMarker && this.mapInstance) {
      this.userGpsMarker.setLatLng(currentStop.latlng);
      this.mapInstance.panTo(currentStop.latlng, { animate: true, duration: 0.8 });
    }

    this.updateAudioCard(this.currentStepIdx);
    this.playVoiceNarration(currentStop.voice);
  }

  updateAudioCard(stepIdx) {
    const city = SIMULATOR_DATA[this.currentCityKey];
    if (!city || !city.stops[stepIdx]) return;

    const stop = city.stops[stepIdx];
    const titleEl = document.getElementById('phoneAudioStopTitle');
    const subEl = document.getElementById('phoneAudioStopSub');

    if (titleEl) titleEl.innerText = stop.name;
    if (subEl) subEl.innerText = `GPS en proximidad (12m) • Parada ${stepIdx + 1}/${city.stops.length}`;
  }

  toggleVoiceAudio() {
    this.isAudioPlaying = !this.isAudioPlaying;
    const city = SIMULATOR_DATA[this.currentCityKey];
    const currentStop = city.stops[this.currentStepIdx];

    if (this.isAudioPlaying) {
      this.playVoiceNarration(currentStop.voice);
    } else {
      this.stopVoiceNarration();
    }
  }

  playVoiceNarration(text) {
    this.stopVoiceNarration();
    this.isAudioPlaying = true;

    const btn = document.getElementById('phoneAudioToggleBtn');
    const waveform = document.getElementById('phoneWaveform');
    const islandLive = document.getElementById('islandLiveStatus');

    if (btn) btn.innerText = '⏸';
    if (waveform) waveform.classList.add('playing');
    if (islandLive) islandLive.classList.add('active');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.speechUtterance = new SpeechSynthesisUtterance(text);
      this.speechUtterance.lang = (typeof currentLandingLang !== 'undefined' && currentLandingLang === 'en') ? 'en-US' : 'es-ES';
      this.speechUtterance.rate = 0.95;

      this.speechUtterance.onend = () => {
        this.stopVoiceNarration();
      };
      this.speechUtterance.onerror = () => {
        this.stopVoiceNarration();
      };

      window.speechSynthesis.speak(this.speechUtterance);
    }
  }

  stopVoiceNarration() {
    this.isAudioPlaying = false;
    const btn = document.getElementById('phoneAudioToggleBtn');
    const waveform = document.getElementById('phoneWaveform');
    const islandLive = document.getElementById('islandLiveStatus');

    if (btn) btn.innerText = '▶';
    if (waveform) waveform.classList.remove('playing');
    if (islandLive) islandLive.classList.remove('active');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  bindChatEvents() {
    const form = document.getElementById('simChatForm');
    const input = document.getElementById('simChatInputField');
    const promptChips = document.querySelectorAll('.phone-quick-prompts .prompt-chip');

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        this.handleUserChat(text);
        input.value = '';
      });
    }

    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const promptText = chip.dataset.prompt || chip.innerText;
        this.handleUserChat(promptText);
      });
    });
  }

  handleUserChat(userText) {
    const scrollArea = document.getElementById('simChatScroll');
    if (!scrollArea) return;

    // 1. Add User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user-msg';
    userMsg.innerHTML = `
      <div class="msg-bubble">${userText}</div>
      <span class="msg-time">Ahora</span>
    `;
    scrollArea.appendChild(userMsg);
    scrollArea.scrollTop = scrollArea.scrollHeight;

    // 2. Simulate AI Thinking
    setTimeout(() => {
      const city = SIMULATOR_DATA[this.currentCityKey];
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-msg bot-msg';
      botMsg.innerHTML = `
        <div class="msg-bubble">
          ¡Entendido! He diseñado una ruta inteligente verificada en <strong>${city.name}</strong> con <strong>${city.stops.length} paradas satelitales</strong> de OpenStreetMap.
          <div class="sim-tour-card">
            <h5>${city.title}</h5>
            <div class="sim-tour-meta-row">
              <span>⏱️ ${city.duration}</span>
              <span>🚶 ${city.distance}</span>
              <span>⭐ 4.9</span>
            </div>
            <button class="btn-card-action" onclick="simulatorInstance.startTourFromDetail()">
              📍 Iniciar Tour en Mapa GPS
            </button>
          </div>
        </div>
        <span class="msg-time">Ahora</span>
      `;
      scrollArea.appendChild(botMsg);
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }, 650);
  }
}

function initInteractiveSmartphoneSimulator() {
  simulatorInstance = new AppSimulator();
  simulatorInstance.init();
}

/* --------------------------------------------------------------------------
   7. LIVE PHONE STATUS BAR CLOCK
   -------------------------------------------------------------------------- */
function initLivePhoneClock() {
  const clockEl = document.getElementById('phoneLiveClock');
  function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    if (clockEl) clockEl.innerText = `${hours}:${mins}`;
  }
  updateTime();
  setInterval(updateTime, 30000);
}

/* --------------------------------------------------------------------------
   8. FAQ ACCORDION INTERACTION
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqCards = document.querySelectorAll('.faq-card');

  faqCards.forEach(card => {
    const btn = card.querySelector('.faq-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = card.classList.contains('active');
        faqCards.forEach(c => c.classList.remove('active'));
        if (!isActive) {
          card.classList.add('active');
        }
      });
    }
  });
}

/* --------------------------------------------------------------------------
   8b. BENTO AUDIO WIDGET INTERACTION
   -------------------------------------------------------------------------- */
function initBentoAudioWidget() {
  const playBtn = document.querySelector('.audio-badge-play');
  const waveform = document.querySelector('.mini-waveform');
  let isPlaying = false;

  if (playBtn && waveform) {
    playBtn.style.cursor = 'pointer';
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.innerText = isPlaying ? '⏸' : '▶';
      waveform.classList.toggle('playing', isPlaying);

      if (window.speechSynthesis) {
        if (isPlaying) {
          window.speechSynthesis.cancel();
          const lang = currentLandingLang === 'en' ? 'en-US' : 'es-ES';
          const text = currentLandingLang === 'en'
            ? "Welcome to the Clock Tower of Cartagena. Built in the seventeenth century, this historic gateway marks the entrance to the walled city."
            : "Bienvenidos a la Torre del Reloj de Cartagena de Indias. Erigida en el siglo diecisiete, esta entrada protegía el acceso principal a la ciudad amurallada.";
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = lang;
          utter.rate = 1.0;
          utter.onend = () => {
            isPlaying = false;
            playBtn.innerText = '▶';
            waveform.classList.remove('playing');
          };
          utter.onerror = () => {
            isPlaying = false;
            playBtn.innerText = '▶';
            waveform.classList.remove('playing');
          };
          window.speechSynthesis.speak(utter);
        } else {
          window.speechSynthesis.cancel();
        }
      }
    });
  }
}

/* --------------------------------------------------------------------------
   9. BILINGUAL TRANSLATION ENGINE (ES / EN)
   -------------------------------------------------------------------------- */
const landingTranslations = {
  es: {
    navStep1: '01. Rutas',
    navStep2: '02. Audio GPS',
    navStep3: '03. Libertad',
    navGenerator: 'Prueba Interactiva',
    navRegister: 'Empezar Gratis',

    heroBadge: 'TU GUÍA PERSONAL CON IA',
    heroTitle: 'El mundo a tu propio ritmo.<br><span class="editorial-italic">Tu guía al oído.</span>',
    heroDesc: 'Crea rutas personalizadas en segundos y escucha la historia de cada monumento automáticamente al llegar.',
    heroCtaPrimary: 'Empezar Gratis',
    heroCtaSecondary: 'Explorar abajo',
    heroDockLabel: 'Girar planeta a:',

    s1Eyebrow: 'RUTAS AL INSTANTE',
    s1Title: 'Hechas para tu tiempo y tus gustos',
    s1Desc: 'Indica cuántas horas tienes libres y qué quieres descubrir. El asistente traza un recorrido real en el mapa en segundos, sin perder horas buscando en blogs.',
    s1Link: 'Probar el planificador en vivo',

    s2Eyebrow: 'AUDIO AUTOMÁTICO POR GPS',
    s2Title: 'La historia empieza sola cuando llegas',
    s2Desc: 'Guarda el teléfono en el bolsillo y camina tranquilo. El GPS detecta tu cercanía a cada plaza o monumento y reproduce la narración automáticamente en tus audífonos.',
    bentoAudioProximity: 'Torre del Reloj • A 12 metros',
    s2AudioSub: 'Haz clic para escuchar cómo suena tu guía',

    s3Eyebrow: '100% A TU RITMO',
    s3Title: 'Sin grupos, sin horarios y sin pagar de más',
    s3Desc: 'Detente a tomar fotos o almorzar cuando te apetezca sin miedo a perder al guía. Tu recorrido se pausa contigo y ahorras lo que cobran las agencias tradicionales.',
    s3OldLbl: 'Tour de Agencia',
    s3NewVal: 'Gratis',

    simCockpitBadge: 'PRUEBA EN VIVO',
    simTitle: 'Interactúa con la app desde aquí',
    simDesc: 'Elige una ciudad, navega el mapa GPS real o simula tus pasos para activar el audio por proximidad.',
    simLblCity: 'Destino de prueba:',
    simLblScreens: 'Pantallas de la App:',
    btnSwitchToExplore: '1. Explorar',
    btnSwitchToChat: '2. Crear Ruta',
    btnSwitchToMap: '3. Mapa GPS',
    btnSwitchToProfile: '4. Perfil',
    pnavExplore: 'Explorar',
    pnavChat: 'Chat IA',
    pnavTours: 'Mapa',
    pnavProfile: 'Perfil',
    simWalkBtnText: 'Simular Paso',

    footerDesc: 'Sal a descubrir tu próximo destino con rutas a tu medida y audioguías GPS al oído.',
    footerCol1Title: 'Explorar',
    footerLinkFeatures: '01. Rutas a Medida',
    footerLinkAudio: '02. Audio GPS',
    footerLinkFreedom: '03. Libertad',
    footerLinkGenerator: 'Prueba Interactiva',
    footerLinkRegister: 'Empezar Gratis',
    footerCol2Title: 'Legal',
    footerLinkTerms: 'Términos de Servicio',
    footerLinkPrivacy: 'Política de Privacidad',
    footerLinkLegal: 'Seguridad',
    footerCopyRights: 'Todos los derechos reservados.'
  },
  en: {
    navStep1: '01. Routes',
    navStep2: '02. GPS Audio',
    navStep3: '03. Freedom',
    navGenerator: 'Interactive Demo',
    navRegister: 'Start Free',

    heroBadge: 'YOUR PERSONAL AI GUIDE',
    heroTitle: 'The world at your own pace.<br><span class="editorial-italic">Your guide in your ear.</span>',
    heroDesc: 'Build custom walking routes in seconds and hear the story of each landmark automatically as you arrive.',
    heroCtaPrimary: 'Start Free',
    heroCtaSecondary: 'Scroll down',
    heroDockLabel: 'Spin planet to:',

    s1Eyebrow: 'INSTANT ROUTES',
    s1Title: 'Tailored to your time and tastes',
    s1Desc: 'Tell the assistant how many hours you have and what you want to discover. Get a verified walking route on the map in seconds.',
    s1Link: 'Try the live planner',

    s2Eyebrow: 'AUTOMATIC GPS AUDIO',
    s2Title: 'The story starts right when you arrive',
    s2Desc: 'Keep your phone in your pocket and walk freely. GPS detects your proximity to each square or monument and plays the audio automatically.',
    bentoAudioProximity: 'Clock Tower • 12 meters away',
    s2AudioSub: 'Click to preview how your guide sounds',

    s3Eyebrow: '100% YOUR PACE',
    s3Title: 'No crowds, no schedules, zero overpriced fees',
    s3Desc: 'Pause for photos or grab coffee whenever you want without losing the group. Your route waits for you while saving agency costs.',
    s3OldLbl: 'Agency Tour',
    s3NewVal: 'Free',

    simCockpitBadge: 'LIVE INTERACTIVE DEMO',
    simTitle: 'Interact with the app right here',
    simDesc: 'Pick a city, browse the real GPS map, or simulate walking steps to trigger proximity audio.',
    simLblCity: 'Demo Destination:',
    simLblScreens: 'App Screens:',
    btnSwitchToExplore: '1. Explore',
    btnSwitchToChat: '2. Plan Route',
    btnSwitchToMap: '3. GPS Map',
    btnSwitchToProfile: '4. Profile',
    pnavExplore: 'Explore',
    pnavChat: 'AI Chat',
    pnavTours: 'Map',
    pnavProfile: 'Profile',
    simWalkBtnText: 'Simulate Step',

    footerDesc: 'Discover your next destination with custom walking routes and hands-free GPS audio guides.',
    footerCol1Title: 'Explore',
    footerLinkFeatures: '01. Custom Routes',
    footerLinkAudio: '02. GPS Audio',
    footerLinkFreedom: '03. Total Freedom',
    footerLinkGenerator: 'Interactive Demo',
    footerLinkRegister: 'Start Free',
    footerCol2Title: 'Legal',
    footerLinkTerms: 'Terms of Service',
    footerLinkPrivacy: 'Privacy Policy',
    footerLinkLegal: 'Security',
    footerCopyRights: 'All rights reserved.'
  }
};

window.setLandingLanguage = function(lang) {
  currentLandingLang = lang;
  localStorage.setItem('vibetours_lang', lang);

  const btnEs = document.getElementById('landing-btn-es');
  const btnEn = document.getElementById('landing-btn-en');

  if (btnEs) btnEs.className = lang === 'es' ? 'btn-lang active' : 'btn-lang';
  if (btnEn) btnEn.className = lang === 'en' ? 'btn-lang active' : 'btn-lang';

  const t = landingTranslations[lang] || landingTranslations['es'];

  // Navigation
  updateText('#nav-step1', t.navStep1);
  updateText('#nav-step2', t.navStep2);
  updateText('#nav-step3', t.navStep3);
  updateText('#nav-generator', t.navGenerator);
  updateText('#nav-btn-register', t.navRegister);

  // Hero
  updateText('#hero-badge', t.heroBadge);
  updateHTML('#hero-title', t.heroTitle);
  updateText('#hero-desc', t.heroDesc);
  updateText('#hero-cta-primary span', t.heroCtaPrimary);
  updateText('#hero-cta-secondary span', t.heroCtaSecondary);
  updateText('#hero-dock-label', t.heroDockLabel);

  // 01. Routes
  updateText('#s1-eyebrow', t.s1Eyebrow);
  updateText('#s1-title', t.s1Title);
  updateText('#s1-desc', t.s1Desc);
  updateText('#s1-link', t.s1Link);

  // 02. GPS Audio
  updateText('#s2-eyebrow', t.s2Eyebrow);
  updateText('#s2-title', t.s2Title);
  updateText('#s2-desc', t.s2Desc);
  updateText('#bento-audio-proximity', t.bentoAudioProximity);
  updateText('#s2-audio-sub', t.s2AudioSub);

  // 03. Freedom
  updateText('#s3-eyebrow', t.s3Eyebrow);
  updateText('#s3-title', t.s3Title);
  updateText('#s3-desc', t.s3Desc);
  updateText('#s3-old-lbl', t.s3OldLbl);
  updateText('#s3-new-val', t.s3NewVal);

  // 04. Simulator
  updateText('#sim-cockpit-badge', t.simCockpitBadge);
  updateText('#sim-title', t.simTitle);
  updateText('#sim-desc', t.simDesc);
  updateText('#sim-lbl-city', t.simLblCity);
  updateText('#sim-lbl-screens', t.simLblScreens);
  updateText('#btnSwitchToExplore', t.btnSwitchToExplore);
  updateText('#btnSwitchToChat', t.btnSwitchToChat);
  updateText('#btnSwitchToMap', t.btnSwitchToMap);
  updateText('#btnSwitchToProfile', t.btnSwitchToProfile);
  updateText('#pnav-explore', t.pnavExplore);
  updateText('#pnav-chat', t.pnavChat);
  updateText('#pnav-tours', t.pnavTours);
  updateText('#pnav-profile', t.pnavProfile);
  updateText('#simWalkBtnText', t.simWalkBtnText);
  updateText('#detail-back-label', lang === 'es' ? 'Explorar' : 'Explore');
  updateText('#detail-start-label', lang === 'es' ? 'Iniciar Tour con GPS' : 'Start Tour with GPS');

  // Footer
  updateText('#footer-desc', t.footerDesc);
  updateText('#footer-col1-title', t.footerCol1Title);
  updateText('#footer-link-features', t.footerLinkFeatures);
  updateText('#footer-link-audio', t.footerLinkAudio);
  updateText('#footer-link-freedom', t.footerLinkFreedom);
  updateText('#footer-link-generator', t.footerLinkGenerator);
  updateText('#footer-link-register', t.footerLinkRegister);
  updateText('#footer-col2-title', t.footerCol2Title);
  updateText('#footer-link-terms', t.footerLinkTerms);
  updateText('#footer-link-privacy', t.footerLinkPrivacy);
  updateText('#footer-link-legal', t.footerLinkLegal);
  updateText('#footer-copy-rights', t.footerCopyRights);
};

function updateText(selector, text) {
  const el = document.querySelector(selector);
  if (el && text !== undefined) el.innerText = text;
}

function updateHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el && html !== undefined) el.innerHTML = html;
}


