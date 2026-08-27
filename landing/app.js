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
  setLandingLanguage(currentLandingLang);
});

/* --------------------------------------------------------------------------
   1. THEME TOGGLE (LIGHT / DARK) WITH REAL-TIME GLOBE & LEAFLET SYNC
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const brandLogoImg = document.getElementById('brandLogoImg');

  const savedTheme = localStorage.getItem('vibetours_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
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

    // High Contrast Luxury Theme Configuration
    const darkFactor = isDark ? 1 : 0;
    const baseColor = isDark ? [0.15, 0.20, 0.32] : [0.72, 0.78, 0.88];
    const markerColor = [0.0, 0.48, 1.0]; // VibeTours Primary Blue (#007AFF)
    const glowColor = isDark ? [0.0, 0.4, 1.0] : [0.65, 0.78, 0.98];
    const arcColor = [0.68, 0.32, 0.87]; // AI Purple (#AF52DE)
    const mapBrightness = isDark ? 8.2 : 6.0;

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
   4. SCROLL EFFECTS: INSTANT 1:1 TICKER, 3D PARALLAX & STICKY SIMULATOR
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  const progressBar = document.getElementById('scrollProgress');
  const orb1 = document.getElementById('ambientOrb1');
  const orb2 = document.getElementById('ambientOrb2');
  const orb3 = document.getElementById('ambientOrb3');

  // Hero Parallax Elements
  const heroSection = document.querySelector('.hero-section');
  const heroCardTop = document.querySelector('.floating-top-left');
  const heroCardBottom = document.querySelector('.floating-bottom-right');
  const heroVisualStage = document.querySelector('.globe-hud-stage');

  // Simulator Sticky Track
  const simTrack = document.getElementById('simulatorStickyTrack');
  let currentScrolledTab = 'tabContentExplore';

  // Observe Hero visibility to pause globe rendering when far away
  if (heroSection) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!pointerInteracting && !isGlidingToCity) {
          isGlobePaused = !entry.isIntersecting;
        }
      });
    }, { threshold: 0.05 });
    heroObserver.observe(heroSection);
  }

  let ticking = false;

  function updateScrollVisuals() {
    const scrollY = window.scrollY;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (scrollY / totalHeight) * 100 : 0;

    // 1. Top Scroll Progress Bar (Instant 1:1)
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    // 2. Ambient Orbs Parallax (Instant 1:1 Transform)
    if (orb1) orb1.style.transform = `translate3d(0, ${scrollY * 0.08}px, 0)`;
    if (orb2) orb2.style.transform = `translate3d(0, ${-scrollY * 0.06}px, 0)`;
    if (orb3) orb3.style.transform = `translate3d(0, ${scrollY * 0.04}px, 0)`;

    // 3. Hero Parallax & Dynamic 3D Globe Spin
    if (scrollY < window.innerHeight * 1.5) {
      globeScrollPhi = scrollY * 0.0022;
      if (heroCardTop) {
        heroCardTop.style.transform = `translate3d(${scrollY * -0.06}px, ${scrollY * -0.15}px, 0) rotate(${scrollY * -0.01}deg)`;
      }
      if (heroCardBottom) {
        heroCardBottom.style.transform = `translate3d(${scrollY * 0.06}px, ${scrollY * 0.14}px, 0) rotate(${scrollY * 0.01}deg)`;
      }
      if (heroVisualStage) {
        const scaleVal = Math.max(0.92, 1 - scrollY * 0.00012);
        heroVisualStage.style.transform = `translate3d(0, ${scrollY * 0.05}px, 0) scale(${scaleVal})`;
      }
    }

    // 4. Simulator Sticky Track Walkthrough
    if (simTrack && window.innerWidth > 1024 && simulatorInstance) {
      const rect = simTrack.getBoundingClientRect();
      const trackHeight = simTrack.offsetHeight - window.innerHeight;
      if (trackHeight > 0) {
        const simProgress = -rect.top / trackHeight;
        if (simProgress >= -0.05 && simProgress <= 1.05) {
          handleSimulatorProgress(simProgress);
        }
      }
    }

    ticking = false;
  }

  function handleSimulatorProgress(p) {
    if (simulatorInstance.isManualOverride) return;

    let targetTab = 'tabContentExplore';
    if (p < 0.22) {
      targetTab = 'tabContentExplore';
    } else if (p >= 0.22 && p < 0.52) {
      targetTab = 'tabContentChat';
    } else if (p >= 0.52 && p < 0.80) {
      targetTab = 'tabContentMap';
    } else {
      targetTab = 'tabContentProfile';
    }

    if (targetTab !== currentScrolledTab) {
      currentScrolledTab = targetTab;
      simulatorInstance.switchTab(targetTab, false);
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollVisuals);
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  updateScrollVisuals();

  // Reveal On Scroll Observer
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
    rating: "⭐ 4.9",
    center: [10.4236, -75.5501],
    zoom: 16,
    imgClaro: "assets/screenshots/Modo claro/Detalles de tour 1.jpeg",
    imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 1.jpeg",
    popular: [
      { title: "Getsemaní Arte Callejero y Sabores", duration: "3h", distance: "3.2 km", rating: "4.8 ⭐", img: "assets/screenshots/Modo claro/Explorar 1.jpeg" },
      { title: "Baluartes & Atardecer Caribe", duration: "1.5h", distance: "1.8 km", rating: "4.9 ⭐", img: "assets/screenshots/Modo claro/Detalles de tour 2.jpeg" }
    ],
    stops: [
      { name: "1. Torre del Reloj & Plaza de los Coches", latlng: [10.4236, -75.5501], voice: "Bienvenido a la Torre del Reloj, entrada principal a la ciudad amurallada de Cartagena construida en el siglo diecinueve." },
      { name: "2. Plaza de la Aduana & Museo de Arte", latlng: [10.4222, -75.5492], voice: "Plaza de la Aduana: la plaza más amplia de la ciudad colonial, sede de mercaderes y casas reales." },
      { name: "3. Santuario San Pedro Claver", latlng: [10.4215, -75.5480], voice: "Santuario San Pedro Claver, iglesia barroca de piedra coralina dedicada al defensor de los derechos humanos." },
      { name: "4. Baluarte de Santo Domingo", latlng: [10.4245, -75.5530], voice: "Baluarte de Santo Domingo: la fortificación más antigua frente al mar Caribe, ideal para ver el atardecer." }
    ]
  },
  paris: {
    name: "París, Francia",
    weather: "⛅ 19°C",
    title: "París Imperial: Notre-Dame al Louvre",
    desc: "Recorrido histórico por la Île de la Cité, puentes del Sena y monumentos del corazón parisino.",
    duration: "3h 00m",
    distance: "3.5 km",
    rating: "⭐ 4.9",
    center: [48.8566, 2.3450],
    zoom: 15,
    imgClaro: "assets/screenshots/Modo claro/Detalles de tour 2.jpeg",
    imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 2.jpeg",
    popular: [
      { title: "Montmartre Bohemio & Cafés de Arte", duration: "3h", distance: "3.5 km", rating: "4.9 ⭐", img: "assets/screenshots/Modo claro/Explorar 2.jpeg" },
      { title: "Bistrós de Saint-Germain", duration: "2.5h", distance: "2.8 km", rating: "4.7 ⭐", img: "assets/screenshots/Modo claro/Detalles de tour 1.jpeg" }
    ],
    stops: [
      { name: "1. Catedral de Notre-Dame", latlng: [48.8530, 2.3499], voice: "Notre-Dame de París, obra maestra gótica en la Isla de la Cité a orillas del río Sena." },
      { name: "2. Puente de las Artes", latlng: [48.8584, 2.3375], voice: "Puente de las Artes, famoso mirador peatonal con vistas panorámicas al Museo del Louvre." },
      { name: "3. Patio de la Pirámide del Louvre", latlng: [48.8606, 2.3376], voice: "Museo del Louvre y su icónica pirámide de cristal diseñada por I.M. Pei." },
      { name: "4. Jardines de las Tullerías", latlng: [48.8635, 2.3275], voice: "Jardines de las Tullerías, parque histórico que conecta el Louvre con la Plaza de la Concordia." }
    ]
  },
  tokio: {
    name: "Tokio, Japón",
    weather: "🌧️ 16°C",
    title: "Tokio Tradicional: Santuarios y Jardines",
    desc: "Recorrido espiritual desde los templos milenarios de Asakusa hasta los jardines del Palacio Imperial.",
    duration: "3h 30m",
    distance: "4.2 km",
    rating: "⭐ 5.0",
    center: [35.7000, 139.7750],
    zoom: 14,
    imgClaro: "assets/screenshots/Modo claro/Detalles de tour 3.jpeg",
    imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 3.jpeg",
    popular: [
      { title: "Ruta de Ramen & Izakayas en Shinjuku", duration: "3h", distance: "3.8 km", rating: "5.0 ⭐", img: "assets/screenshots/Modo claro/Explorar 1.jpeg" },
      { title: "Akihabara Tech & Shibuya Sky", duration: "4h", distance: "5.0 km", rating: "4.8 ⭐", img: "assets/screenshots/Modo claro/Detalles de tour 2.jpeg" }
    ],
    stops: [
      { name: "1. Templo Senso-ji & Kaminarimon", latlng: [35.7147, 139.7967], voice: "Templo Senso-ji en Asakusa, el templo budista más antiguo y venerado de Tokio, fundado en el año 628." },
      { name: "2. Calle Comercial Nakamise", latlng: [35.7128, 139.7966], voice: "Calle Nakamise, centenario paseo comercial con delicias tradicionales y artesanías japonesas." },
      { name: "3. Jardines del Palacio Imperial", latlng: [35.6852, 139.7528], voice: "Jardines del Palacio Imperial de Tokio, residencia del Emperador de Japón entre fosos y murallas." },
      { name: "4. Santuario Meiji Jingu", latlng: [35.6764, 139.6993], voice: "Santuario Meiji, oasis de bosque sagrado y paz en medio del vibrante distrito de Shibuya." }
    ]
  },
  roma: {
    name: "Roma, Italia",
    weather: "☀️ 24°C",
    title: "Roma Eterna: Coliseo y Foros",
    desc: "Sumérgete en dos milenios de historia imperial visitando los monumentos cumbre de Roma.",
    duration: "2h 45m",
    distance: "3.1 km",
    rating: "⭐ 4.9",
    center: [41.8950, 12.4850],
    zoom: 15,
    imgClaro: "assets/screenshots/Modo claro/Detalles del tour 4.jpeg",
    imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 4.jpeg",
    popular: [
      { title: "Trattorias & Gelato en Trastevere", duration: "2.5h", distance: "2.6 km", rating: "4.9 ⭐", img: "assets/screenshots/Modo claro/Explorar 2.jpeg" },
      { title: "Barroco & Plazas de Bernini", duration: "3h", distance: "3.4 km", rating: "4.8 ⭐", img: "assets/screenshots/Modo claro/Detalles de tour 1.jpeg" }
    ],
    stops: [
      { name: "1. Coliseo Romano", latlng: [41.8902, 12.4922], voice: "El Coliseo Romano, el anfiteatro más grande de la antigüedad y símbolo eterno de la civilización romana." },
      { name: "2. Foro Romano & Palatino", latlng: [41.8925, 12.4853], voice: "Foro Romano, el epicentro político, religioso y judicial de la antigua Roma." },
      { name: "3. Panteón de Agripa", latlng: [41.8986, 12.4769], voice: "Panteón de Agripa, templo romano con la cúpula de hormigón no armado más grande del mundo." },
      { name: "4. Fontana di Trevi", latlng: [41.9009, 12.4833], voice: "Fontana di Trevi, joya del barroco donde la tradición manda lanzar una moneda para asegurar el regreso." }
    ]
  },
  newyork: {
    name: "Nueva York, USA",
    weather: "⛅ 22°C",
    title: "Nueva York: Central Park a Broadway",
    desc: "Itinerario vibrante cruzando miradores, rascacielos históricos y avenidas icónicas.",
    duration: "3h 15m",
    distance: "3.8 km",
    rating: "⭐ 4.8",
    center: [40.7550, -73.9800],
    zoom: 14,
    imgClaro: "assets/screenshots/Modo claro/Explorar 1.jpeg",
    imgOscuro: "assets/screenshots/Modo oscuro/Explorar 1.jpeg",
    popular: [
      { title: "High Line & Chelsea Market Gourmet", duration: "2h", distance: "2.3 km", rating: "4.9 ⭐", img: "assets/screenshots/Modo claro/Detalles de tour 2.jpeg" },
      { title: "Ruta de Arte en SoHo & Village", duration: "3h", distance: "3.8 km", rating: "4.7 ⭐", img: "assets/screenshots/Modo claro/Detalles de tour 3.jpeg" }
    ],
    stops: [
      { name: "1. Central Park (Bethesda)", latlng: [40.7739, -73.9708], voice: "Central Park y la emblemática terraza Bethesda en el pulmón verde de Manhattan." },
      { name: "2. Times Square & Broadway", latlng: [40.7580, -73.9855], voice: "Times Square, la encrucijada del mundo iluminada por pantallas gigantes y teatros legendarios." },
      { name: "3. Empire State Building", latlng: [40.7484, -73.9857], voice: "Empire State Building, rascacielos art déco que definió el horizonte de Nueva York." },
      { name: "4. Puente de Brooklyn", latlng: [40.7061, -73.9969], voice: "Puente de Brooklyn, maravilla de la ingeniería del siglo diecinueve con vistas al skyline." }
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

    // Pace Chips in Cockpit
    const paceChips = document.querySelectorAll('#simPaceChips .cockpit-chip');
    paceChips.forEach(chip => {
      chip.addEventListener('click', () => {
        paceChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentPace = chip.dataset.simPace || 'relaxed';
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

    // Update bottom nav active state
    document.querySelectorAll('.phone-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.targetTab === tabId);
    });

    // Update Cockpit button styles
    const btnExplore = document.getElementById('btnSwitchToExplore');
    const btnChat = document.getElementById('btnSwitchToChat');
    const btnMap = document.getElementById('btnSwitchToMap');
    const btnProfile = document.getElementById('btnSwitchToProfile');

    if (btnExplore) btnExplore.classList.toggle('active-sim-mode', tabId === 'tabContentExplore');
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
    const city = SIMULATOR_DATA[cityKey] || SIMULATOR_DATA['cartagena'];
    this.currentStepIdx = 0;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

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
    if (featuredImg) featuredImg.src = isDark ? city.imgOscuro : city.imgClaro;
    if (featuredTitle) featuredTitle.innerText = city.title;
    if (featuredDuration) featuredDuration.innerText = `⏱️ ${city.duration}`;
    if (featuredDistance) featuredDistance.innerText = `🚶 ${city.distance}`;

    if (popularList) {
      popularList.innerHTML = city.popular.map(item => `
        <div class="popular-tour-item" onclick="simulatorInstance.switchTab('tabContentMap')">
          <img class="popular-tour-img" src="${item.img}" alt="${item.title}" onerror="this.src='assets/screenshots/Modo claro/Detalles de tour 1.jpeg'">
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

  simulateWalkStep() {
    const city = SIMULATOR_DATA[this.currentCityKey];
    if (!city) return;

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
      this.speechUtterance = new SpeechSynthesisUtterance(text);
      this.speechUtterance.lang = currentLandingLang === 'es' ? 'es-ES' : 'en-US';
      this.speechUtterance.rate = 0.95;

      this.speechUtterance.onend = () => {
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
              <span>💵 $15 USD</span>
            </div>
            <button class="btn-card-action" onclick="simulatorInstance.switchTab('tabContentMap')">
              📍 Iniciar Navegación GPS
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
   9. BILINGUAL TRANSLATION ENGINE (ES / EN)
   -------------------------------------------------------------------------- */
const landingTranslations = {
  es: {
    navHow: '¿Cómo Funciona?',
    navGenerator: 'Simulador App',
    navCompare: 'Comparativa',
    navFaq: 'FAQ',
    navRegister: 'Registrarse',

    heroBadge: 'Turismo Inteligente con IA & GPS Real',
    heroTitle: 'Explora el mundo con <span class="gradient-text">Inteligencia Artificial</span>',
    heroDesc: 'Itinerarios a tu ritmo, coordenadas reales de OpenStreetMap y audioguías contextuales mientras caminas.',
    heroCtaPrimary: 'Crear Cuenta Gratis',
    heroCtaSecondary: 'Probar Simulador en Vivo',
    trust1: '100% Mapas Satelitales Reales',
    trust2: 'Audioguías GPS Manos Libres',

    floatVoiceTitle: 'Audioguía en Vivo',
    floatVoiceSub: 'Torre del Reloj',
    floatGpsTitle: 'GPS Satelital Activo',
    floatGpsSub: '6 Paradas • 2.4 km',

    simSubtitle: 'Experiencia Interactiva 3D',
    simTitle: 'Prueba la App desde tu Navegador',
    simDesc: 'Navega la interfaz real de VibeTours: explora tours, interactúa con el Asistente IA, sigue rutas GPS con audioguía y gestiona tu perfil.',
    simCockpitBadge: 'Centro de Mando del Simulador',
    simCockpitTitle: 'Configura tu Destino',
    simCockpitDesc: 'Elige una ciudad y prueba cómo la app adapta el feed de exploración, las respuestas de IA y el mapa de navegación GPS.',
    simLblCity: '1. Destino Turístico',
    simLblPace: '2. Ritmo de Viaje',
    simTeleGpsLabel: 'Precisión GPS',
    simTeleLatencyLabel: 'Latencia IA',
    simTeleSourceLabel: 'Cartografía',
    simTeleVoiceLabel: 'Voz Narrativa',
    btnSwitchToExplore: '🧭 Explorar',
    btnSwitchToChat: '💬 Chat IA',
    btnSwitchToMap: '🏖️ Live Tour',
    btnSwitchToProfile: '👤 Perfil',
    pnavExplore: 'Explorar',
    pnavChat: 'Chat IA',
    pnavTours: 'Tours',
    pnavProfile: 'Perfil',
    simWalkBtnText: 'Simular Paso',
    simStep1Label: 'Explorar',
    simStep2Label: 'Chat IA',
    simStep3Label: 'Live Tour',
    simStep4Label: 'Perfil',

    compSubtitle: 'Evolución del Turismo',
    compTitle: '¿Por Qué Cambiar a VibeTours?',
    compDesc: 'Compara la experiencia convencional con la libertad guiada por inteligencia artificial.',
    compTradTitle: 'Turismo Tradicional',
    compTradTag: 'Método Antiguo',
    compTrad1: '<strong>Grupos masivos y lentos:</strong> Sigues un paraguas con 30 personas sin escuchar bien al guía.',
    compTrad2: '<strong>Horarios rígidos:</strong> Te obligan a madrugar y apurar tus fotos en cada sitio.',
    compTrad3: '<strong>Costos elevados:</strong> $40 - $120 USD por persona para un recorrido genérico.',
    compTrad4: '<strong>Paradas trampa:</strong> Desvíos comerciales no solicitados para comprar souvenirs.',
    compVibeTitle: 'Experiencia VibeTours',
    compVibeTag: 'Inteligencia Artificial & GPS',
    compVibe1: '<strong>100% a tu propio ritmo:</strong> Camina cuando quieras, haz pausas para café y retoma en cualquier punto.',
    compVibe2: '<strong>Audioguías por proximidad:</strong> Historias y anécdotas narradas al oído exactamente cuando llegas.',
    compVibe3: '<strong>Ahorro superior al 85%:</strong> Generación ilimitada de rutas satelitales sin intermediarios.',
    compVibe4: '<strong>Itinerarios personalizados:</strong> La IA adapta las paradas a tu presupuesto, gustos y energía.',

    howSubtitle: 'Fácil y Rápido',
    howTitle: 'Tu Viaje en Tres Pasos',
    howDesc: 'Empieza a explorar cualquier ciudad en minutos de forma autónoma.',
    step1Title: 'Personaliza tu Estilo',
    step1Desc: 'Elige tu ritmo de caminata, presupuesto e intereses en segundos.',
    step2Title: 'Genera con IA',
    step2Desc: 'Pide un tour personalizado por chat o elige uno del catálogo verificado.',
    step3Title: 'Recorre con Live Tour',
    step3Desc: 'Sigue el mapa GPS con narraciones de voz automáticas al llegar a cada sitio.',

    faqSubtitle: 'Dudas Frecuentes',
    faqTitle: 'Preguntas Frecuentes',
    faqDesc: 'Respuestas rápidas sobre el funcionamiento de VibeTours.',
    faq1Q: '¿Cómo evita la IA inventar lugares ficticios?',
    faq1A: 'Cada parada se valida contra coordenadas satelitales reales de OpenStreetMap y Wikipedia. Los lugares inexistentes se descartan automáticamente.',
    faq2Q: '¿Puedo usar la aplicación sin registrarme?',
    faq2A: 'Sí. El Modo Demo permite explorar inmediatamente el catálogo de tours precargados sin necesidad de crear cuenta.',
    faq3Q: '¿Las audioguías se activan solas al caminar?',
    faq3A: 'Sí. Al iniciar Live Tour, el GPS detecta tu cercanía a cada monumento y reproduce la narración de audio automáticamente.',
    faq4Q: '¿Puedo crear mis propios recorridos?',
    faq4A: 'Sí. Con el Creador de Tours puedes fijar puntos en el mapa, añadir fotografías, notas y compartir tu ruta con la comunidad.',

    bannerTag: 'Acceso Inmediato',
    bannerTitle: '¿Listo para tu próxima aventura?',
    bannerDesc: 'Únete gratis y descubre el mundo con itinerarios inteligentes diseñados a tu medida.',
    bannerBtnRegister: 'Crear Cuenta Gratis',
    bannerBtnDemo: 'Probar Modo Demo',

    footerDesc: 'Tu compañero de viaje inteligente con IA, geolocalización satelital y audioguías en vivo.',
    footerCol1Title: 'Navegación',
    footerLinkHow: '¿Cómo Funciona?',
    footerLinkGenerator: 'Simulador App',
    footerLinkCompare: 'Comparativa',
    footerLinkFaq: 'Preguntas Frecuentes',
    footerCol2Title: 'Portal Legal',
    footerLinkTerms: 'Términos de Servicio',
    footerLinkPrivacy: 'Política de Privacidad',
    footerLinkLegal: 'Información de Seguridad',
    footerLinkRegister: 'Registro de Usuario',
    footerCopyRights: 'Todos los derechos reservados.',
    footerCopyDesign: 'Diseño Glassmorphic & Neomórfico de Alta Fidelidad.'
  },
  en: {
    navHow: 'How it Works',
    navGenerator: 'App Simulator',
    navCompare: 'Comparison',
    navFaq: 'FAQ',
    navRegister: 'Sign Up',

    heroBadge: 'Smart Tourism with AI & Real GPS',
    heroTitle: 'Explore the world with <span class="gradient-text">Artificial Intelligence</span>',
    heroDesc: 'Itineraries at your pace, verified OpenStreetMap coordinates, and hands-free contextual audio guides.',
    heroCtaPrimary: 'Create Free Account',
    heroCtaSecondary: 'Try Live Simulator',
    trust1: '100% Verified Satellite Maps',
    trust2: 'Hands-Free GPS Audio Guides',

    floatVoiceTitle: 'Live Audio Guide',
    floatVoiceSub: 'Clock Tower',
    floatGpsTitle: 'Active Satellite GPS',
    floatGpsSub: '6 Stops • 2.4 km',

    simSubtitle: '3D Interactive Experience',
    simTitle: 'Test the App Directly in Your Browser',
    simDesc: 'Explore real VibeTours features: browse tours, chat with AI Planner, navigate GPS routes with audio guide, and manage your profile.',
    simCockpitBadge: 'Simulator Command Cockpit',
    simCockpitTitle: 'Configure Destination',
    simCockpitDesc: 'Pick a city to test how the app adapts discovery tours, AI chat responses, and GPS navigation maps.',
    simLblCity: '1. Destination',
    simLblPace: '2. Walking Pace',
    simTeleGpsLabel: 'GPS Accuracy',
    simTeleLatencyLabel: 'AI Latency',
    simTeleSourceLabel: 'Cartography',
    simTeleVoiceLabel: 'Narrative Voice',
    btnSwitchToExplore: '🧭 Explore',
    btnSwitchToChat: '💬 AI Chat',
    btnSwitchToMap: '🏖️ Live Tour',
    btnSwitchToProfile: '👤 Profile',
    pnavExplore: 'Explore',
    pnavChat: 'AI Chat',
    pnavTours: 'Tours',
    pnavProfile: 'Profile',
    simWalkBtnText: 'Simulate Step',
    simStep1Label: 'Explore',
    simStep2Label: 'AI Chat',
    simStep3Label: 'Live Tour',
    simStep4Label: 'Profile',

    compSubtitle: 'Tourism Evolution',
    compTitle: 'Why Switch to VibeTours?',
    compDesc: 'Compare rigid group tours with total freedom guided by artificial intelligence.',
    compTradTitle: 'Traditional Tourism',
    compTradTag: 'Old Method',
    compTrad1: '<strong>Massive & slow groups:</strong> Follow an umbrella in a crowd of 30 without hearing the guide.',
    compTrad2: '<strong>Rigid schedules:</strong> Forced early mornings and rushed photo stops at each landmark.',
    compTrad3: '<strong>Expensive fees:</strong> $40 - $120 USD per person for generic standardized routes.',
    compTrad4: '<strong>Tourist trap stops:</strong> Unsolicited commercial detours to buy marked-up souvenirs.',
    compVibeTitle: 'VibeTours Smart Experience',
    compVibeTag: 'Artificial Intelligence & GPS',
    compVibe1: '<strong>100% at your own pace:</strong> Walk when you want, stop for coffee, and resume anytime.',
    compVibe2: '<strong>Proximity audio guides:</strong> Stories and historical anecdotes narrated in your ear automatically.',
    compVibe3: '<strong>Over 85% cost savings:</strong> Unlimited satellite itineraries without middleman markups.',
    compVibe4: '<strong>Personalized routes:</strong> AI tailors every stop to your budget, tastes, and energy.',

    howSubtitle: 'Quick & Simple',
    howTitle: 'Your Trip in 3 Steps',
    howDesc: 'Start exploring any city autonomously in minutes.',
    step1Title: 'Set Your Style',
    step1Desc: 'Select your walking pace, budget, and interests in seconds.',
    step2Title: 'Generate with AI',
    step2Desc: 'Ask the AI chatbot for a tailored route or pick from curated tours.',
    step3Title: 'Explore Hands-Free',
    step3Desc: 'Follow GPS maps with automatic proximity voice narration.',

    faqSubtitle: 'Clear Answers',
    faqTitle: 'Frequently Asked Questions',
    faqDesc: 'Quick answers about how VibeTours works.',
    faq1Q: 'How does VibeTours ensure the AI doesn\'t make up fake places?',
    faq1A: 'Every stop is validated against real OpenStreetMap and Wikipedia satellite data. Unverified places are discarded automatically.',
    faq2Q: 'Can I try the app without creating an account?',
    faq2A: 'Yes! Demo Mode allows you to explore all pre-loaded city tours immediately without registration.',
    faq3Q: 'Does voice narration trigger automatically while walking?',
    faq3A: 'Yes. Live Tour tracks your GPS position and triggers audio stories automatically as you approach each landmark.',
    faq4Q: 'Can I create and share my own tours?',
    faq4A: 'Yes. The Tour Creator lets you pin stops on the map, attach photos, write notes, and share with the community.',

    bannerTag: 'Immediate Access',
    bannerTitle: 'Ready for your next adventure?',
    bannerDesc: 'Join for free and discover the world with intelligent itineraries tailored to you.',
    bannerBtnRegister: 'Create Free Account',
    bannerBtnDemo: 'Try Demo Mode',

    footerDesc: 'Your smart travel companion powered by AI, satellite geolocation, and hands-free audio guides.',
    footerCol1Title: 'Navigation',
    footerLinkHow: 'How it Works',
    footerLinkGenerator: 'App Simulator',
    footerLinkCompare: 'Comparison',
    footerLinkFaq: 'FAQ',
    footerCol2Title: 'Legal Portal',
    footerLinkTerms: 'Terms of Service',
    footerLinkPrivacy: 'Privacy Policy',
    footerLinkLegal: 'Security Info',
    footerLinkRegister: 'User Registration',
    footerCopyRights: 'All rights reserved.',
    footerCopyDesign: 'High-Fidelity Glassmorphic & Neomorphic Design.'
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
  updateText('#nav-how', t.navHow);
  updateText('#nav-generator', t.navGenerator);
  updateText('#nav-compare', t.navCompare);
  updateText('#nav-faq', t.navFaq);
  updateText('#nav-btn-register', t.navRegister);

  // Hero
  updateText('#hero-badge', t.heroBadge);
  updateHTML('#hero-title', t.heroTitle);
  updateText('#hero-desc', t.heroDesc);
  updateText('#hero-cta-primary span', t.heroCtaPrimary);
  updateText('#hero-cta-secondary span', t.heroCtaSecondary);
  updateText('#trust-1', t.trust1);
  updateText('#trust-2', t.trust2);

  updateText('#float-voice-title', t.floatVoiceTitle);
  updateText('#float-voice-sub', t.floatVoiceSub);
  updateText('#float-gps-title', t.floatGpsTitle);
  updateText('#float-gps-sub', t.floatGpsSub);

  // Simulator
  updateText('#sim-subtitle', t.simSubtitle);
  updateText('#sim-title', t.simTitle);
  updateText('#sim-desc', t.simDesc);
  updateText('#sim-cockpit-badge', t.simCockpitBadge);
  updateText('#sim-cockpit-title', t.simCockpitTitle);
  updateText('#sim-cockpit-desc', t.simCockpitDesc);
  updateText('#sim-lbl-city', t.simLblCity);
  updateText('#sim-lbl-pace', t.simLblPace);
  updateText('#sim-tele-gps-label', t.simTeleGpsLabel);
  updateText('#sim-tele-latency-label', t.simTeleLatencyLabel);
  updateText('#sim-tele-source-label', t.simTeleSourceLabel);
  updateText('#sim-tele-voice-label', t.simTeleVoiceLabel);
  updateText('#btnSwitchToExplore', t.btnSwitchToExplore);
  updateText('#btnSwitchToChat', t.btnSwitchToChat);
  updateText('#btnSwitchToMap', t.btnSwitchToMap);
  updateText('#btnSwitchToProfile', t.btnSwitchToProfile);
  updateText('#pnav-explore', t.pnavExplore);
  updateText('#pnav-chat', t.pnavChat);
  updateText('#pnav-tours', t.pnavTours);
  updateText('#pnav-profile', t.pnavProfile);
  updateText('#simWalkBtnText', t.simWalkBtnText);
  updateText('#sim-step1-label', t.simStep1Label);
  updateText('#sim-step2-label', t.simStep2Label);
  updateText('#sim-step3-label', t.simStep3Label);
  updateText('#sim-step4-label', t.simStep4Label);

  // Comparison
  updateText('#comp-subtitle', t.compSubtitle);
  updateText('#comp-title', t.compTitle);
  updateText('#comp-desc', t.compDesc);
  updateText('#comp-trad-title', t.compTradTitle);
  updateText('#comp-trad-tag', t.compTradTag);
  updateHTML('#comp-trad-1', t.compTrad1);
  updateHTML('#comp-trad-2', t.compTrad2);
  updateHTML('#comp-trad-3', t.compTrad3);
  updateHTML('#comp-trad-4', t.compTrad4);
  updateText('#comp-vibe-title', t.compVibeTitle);
  updateText('#comp-vibe-tag', t.compVibeTag);
  updateHTML('#comp-vibe-1', t.compVibe1);
  updateHTML('#comp-vibe-2', t.compVibe2);
  updateHTML('#comp-vibe-3', t.compVibe3);
  updateHTML('#comp-vibe-4', t.compVibe4);

  // How it Works
  updateText('#how-subtitle', t.howSubtitle);
  updateText('#how-title', t.howTitle);
  updateText('#how-desc', t.howDesc);
  updateText('#step1-title', t.step1Title);
  updateText('#step1-desc', t.step1Desc);
  updateText('#step2-title', t.step2Title);
  updateText('#step2-desc', t.step2Desc);
  updateText('#step3-title', t.step3Title);
  updateText('#step3-desc', t.step3Desc);

  // FAQ
  updateText('#faq-subtitle', t.faqSubtitle);
  updateText('#faq-title', t.faqTitle);
  updateText('#faq-desc', t.faqDesc);
  updateText('#faq1-q', t.faq1Q);
  updateText('#faq1-a', t.faq1A);
  updateText('#faq2-q', t.faq2Q);
  updateText('#faq2-a', t.faq2A);
  updateText('#faq3-q', t.faq3Q);
  updateText('#faq3-a', t.faq3A);
  updateText('#faq4-q', t.faq4Q);
  updateText('#faq4-a', t.faq4A);

  // Banner
  updateText('#banner-tag', t.bannerTag);
  updateText('#banner-title', t.bannerTitle);
  updateText('#banner-desc', t.bannerDesc);
  updateText('#banner-btn-register', t.bannerBtnRegister);
  updateText('#banner-btn-demo', t.bannerBtnDemo);

  // Footer
  updateText('#footer-desc', t.footerDesc);
  updateText('#footer-col1-title', t.footerCol1Title);
  updateText('#footer-link-how', t.footerLinkHow);
  updateText('#footer-link-generator', t.footerLinkGenerator);
  updateText('#footer-link-compare', t.footerLinkCompare);
  updateText('#footer-link-faq', t.footerLinkFaq);
  updateText('#footer-col2-title', t.footerCol2Title);
  updateText('#footer-link-terms', t.footerLinkTerms);
  updateText('#footer-link-privacy', t.footerLinkPrivacy);
  updateText('#footer-link-legal', t.footerLinkLegal);
  updateText('#footer-link-register', t.footerLinkRegister);
  updateText('#footer-copy-rights', t.footerCopyRights);
  updateText('#footer-copy-design', t.footerCopyDesign);
};

function updateText(selector, text) {
  const el = document.querySelector(selector);
  if (el && text !== undefined) el.innerText = text;
}

function updateHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el && html !== undefined) el.innerHTML = html;
}


