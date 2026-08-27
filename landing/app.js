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
  initGalleryFilters();
  initLivePhoneClock();
  initAudioSimulator();
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
    const width = globeCanvas.offsetWidth || 380;
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
    const mapBrightness = isDark ? 8 : 5.8;

    // IMPORTANT: width passed to createGlobe is the dimension (cobe applies devicePixelRatio internally)
    globeInstance = createGlobe(globeCanvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width,
      height: width,
      phi: 0,
      theta: 0.15,
      dark: darkFactor,
      diffuse: 1.5,
      mapSamples: 16000,
      mapBrightness: mapBrightness,
      baseColor: baseColor,
      markerColor: markerColor,
      glowColor: glowColor,
      markerElevation: 0.05,
      markers: VIBETOURS_MARKERS,
      arcs: VIBETOURS_ARCS,
      arcColor: arcColor,
      arcWidth: 0.7,
      arcHeight: 0.28,
      opacity: 0.92,
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
        state.phi = globePhi + globePhiOffset + globeDragOffset.phi;
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
   4. SCROLL EFFECTS: PROGRESS BAR, PARALLAX & REVEAL ANIMATIONS
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  const progressBar = document.getElementById('scrollProgress');
  const orb1 = document.getElementById('ambientOrb1');
  const orb2 = document.getElementById('ambientOrb2');
  const orb3 = document.getElementById('ambientOrb3');

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    const scrollY = window.scrollY;
    if (orb1) orb1.style.transform = `translateY(${scrollY * 0.08}px)`;
    if (orb2) orb2.style.transform = `translateY(${-scrollY * 0.06}px)`;
    if (orb3) orb3.style.transform = `translateY(${scrollY * 0.04}px)`;
  }, { passive: true });

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
   6. SMARTPHONE SIMULATOR ENGINE (PLAYGROUND CONTROLLER & LEAFLET MAP)
   -------------------------------------------------------------------------- */
const SIMULATOR_DATA = {
  cartagena: {
    name: "Cartagena de Indias",
    title: "Cartagena Colonial: Murallas y Plazas",
    desc: "Ruta histórica por fortalezas coloniales, plazas emblemáticas y baluartes con audioguía GPS contextual.",
    center: [10.4236, -75.5501],
    zoom: 16,
    stops: [
      { name: "1. Torre del Reloj & Plaza de los Coches", latlng: [10.4236, -75.5501], voice: "Bienvenido a la Torre del Reloj, entrada principal a la ciudad amurallada de Cartagena construida en el siglo diecinueve." },
      { name: "2. Plaza de la Aduana & Museo de Arte", latlng: [10.4222, -75.5492], voice: "Plaza de la Aduana: la plaza más amplia de la ciudad colonial, sede de mercaderes y casas reales." },
      { name: "3. Santuario San Pedro Claver", latlng: [10.4215, -75.5480], voice: "Santuario San Pedro Claver, iglesia barroca de piedra coralina dedicada al defensor de los derechos humanos." },
      { name: "4. Baluarte de Santo Domingo", latlng: [10.4245, -75.5530], voice: "Baluarte de Santo Domingo: la fortificación más antigua frente al mar Caribe, ideal para ver el atardecer." }
    ],
    feed: [
      { title: "Cartagena Colonial y Murallas", duration: "2h • 2.1 km", rating: "4.9 ⭐", imgClaro: "assets/screenshots/Modo claro/Detalles de tour 1.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 1.jpeg" },
      { title: "Getsemaní Arte Callejero y Gastronomía", duration: "3h • 3.2 km", rating: "4.8 ⭐", imgClaro: "assets/screenshots/Modo claro/Explorar 1.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Explorar 1.jpeg" }
    ]
  },
  paris: {
    name: "París, Francia",
    title: "París Imperial: Notre-Dame al Louvre",
    desc: "Recorrido histórico por la Île de la Cité, puentes del Sena y monumentos del corazón parisino.",
    center: [48.8566, 2.3450],
    zoom: 15,
    stops: [
      { name: "1. Catedral de Notre-Dame", latlng: [48.8530, 2.3499], voice: "Notre-Dame de París, obra maestra gótica en la Isla de la Cité a orillas del río Sena." },
      { name: "2. Puente de las Artes", latlng: [48.8584, 2.3375], voice: "Puente de las Artes, famoso mirador peatonal con vistas panorámicas al Museo del Louvre." },
      { name: "3. Patio de la Pirámide del Louvre", latlng: [48.8606, 2.3376], voice: "Museo del Louvre y su icónica pirámide de cristal diseñada por I.M. Pei." },
      { name: "4. Jardines de las Tullerías", latlng: [48.8635, 2.3275], voice: "Jardines de las Tullerías, parque histórico que conecta el Louvre con la Plaza de la Concordia." }
    ],
    feed: [
      { title: "París Bohemio: Montmartre y Cafés", duration: "3h • 3.5 km", rating: "4.9 ⭐", imgClaro: "assets/screenshots/Modo claro/Detalles de tour 2.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 2.jpeg" },
      { title: "Ruta de Bistrós en Saint-Germain", duration: "2.5h • 2.8 km", rating: "4.7 ⭐", imgClaro: "assets/screenshots/Modo claro/Explorar 2.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Explorar 2.jpeg" }
    ]
  },
  tokio: {
    name: "Tokio, Japón",
    title: "Tokio Tradicional: Santuarios y Jardines",
    desc: "Recorrido espiritual desde los templos milenarios de Asakusa hasta los jardines del Palacio Imperial.",
    center: [35.7000, 139.7750],
    zoom: 14,
    stops: [
      { name: "1. Templo Senso-ji & Kaminarimon", latlng: [35.7147, 139.7967], voice: "Templo Senso-ji en Asakusa, el templo budista más antiguo y venerado de Tokio, fundado en el año 628." },
      { name: "2. Calle Comercial Nakamise", latlng: [35.7128, 139.7966], voice: "Calle Nakamise, centenario paseo comercial con delicias tradicionales y artesanías japonesas." },
      { name: "3. Jardines del Palacio Imperial", latlng: [35.6852, 139.7528], voice: "Jardines del Palacio Imperial de Tokio, residencia del Emperador de Japón entre fosos y murallas." },
      { name: "4. Santuario Meiji Jingu", latlng: [35.6764, 139.6993], voice: "Santuario Meiji, oasis de bosque sagrado y paz en medio del vibrante distrito de Shibuya." }
    ],
    feed: [
      { title: "Ruta Culinaria: Ramen & Izakayas", duration: "3.5h • 4.0 km", rating: "5.0 ⭐", imgClaro: "assets/screenshots/Modo claro/Explorar 1.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Explorar 1.jpeg" },
      { title: "Akihabara Tech & Shibuya Sky", duration: "4h • 5.1 km", rating: "4.8 ⭐", imgClaro: "assets/screenshots/Modo claro/Detalles de tour 3.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 3.jpeg" }
    ]
  },
  roma: {
    name: "Roma, Italia",
    title: "Roma Eterna: Coliseo y Foros",
    desc: "Sumérgete en dos milenios de historia imperial visitando los monumentos cumbre de Roma.",
    center: [41.8950, 12.4850],
    zoom: 15,
    stops: [
      { name: "1. Coliseo Romano", latlng: [41.8902, 12.4922], voice: "El Coliseo Romano, el anfiteatro más grande de la antigüedad y símbolo eterno de la civilización romana." },
      { name: "2. Foro Romano & Palatino", latlng: [41.8925, 12.4853], voice: "Foro Romano, el epicentro político, religioso y judicial de la antigua Roma." },
      { name: "3. Panteón de Agripa", latlng: [41.8986, 12.4769], voice: "Panteón de Agripa, templo romano con la cúpula de hormigón no armado más grande del mundo." },
      { name: "4. Fontana di Trevi", latlng: [41.9009, 12.4833], voice: "Fontana di Trevi, joya del barroco donde la tradición manda lanzar una moneda para asegurar el regreso." }
    ],
    feed: [
      { title: "Trattorias & Gelato en Trastevere", duration: "2.5h • 2.6 km", rating: "4.9 ⭐", imgClaro: "assets/screenshots/Modo claro/Detalles del tour 4.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 4.jpeg" },
      { title: "Barroco & Plazas de Roma", duration: "3h • 3.4 km", rating: "4.8 ⭐", imgClaro: "assets/screenshots/Modo claro/Explorar 2.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Explorar 2.jpeg" }
    ]
  },
  newyork: {
    name: "Nueva York, USA",
    title: "Nueva York: De Central Park a Times Square",
    desc: "Itinerario vibrante cruzando miradores, rascacielos históricos y avenidas icónicas.",
    center: [40.7550, -73.9800],
    zoom: 14,
    stops: [
      { name: "1. Central Park (Bethesda)", latlng: [40.7739, -73.9708], voice: "Central Park y la emblemática terraza Bethesda en el pulmón verde de Manhattan." },
      { name: "2. Times Square & Broadway", latlng: [40.7580, -73.9855], voice: "Times Square, la encrucijada del mundo iluminada por pantallas gigantes y teatros legendarios." },
      { name: "3. Empire State Building", latlng: [40.7484, -73.9857], voice: "Empire State Building, rascacielos art déco que definió el horizonte de Nueva York." },
      { name: "4. Puente de Brooklyn", latlng: [40.7061, -73.9969], voice: "Puente de Brooklyn, maravilla de la ingeniería del siglo diecinueve con vistas al skyline." }
    ],
    feed: [
      { title: "High Line & Chelsea Market Gourmet", duration: "2h • 2.3 km", rating: "4.9 ⭐", imgClaro: "assets/screenshots/Modo claro/Explorar 1.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Explorar 1.jpeg" },
      { title: "Ruta de Arte en SoHo & Village", duration: "3h • 3.8 km", rating: "4.7 ⭐", imgClaro: "assets/screenshots/Modo claro/Detalles de tour 1.jpeg", imgOscuro: "assets/screenshots/Modo oscuro/Detalles de tour 1.jpeg" }
    ]
  }
};

class AppSimulator {
  constructor() {
    this.currentCityKey = 'cartagena';
    this.currentPace = 'relaxed';
    this.activeTab = 'tabContentChat';
    this.mapInstance = null;
    this.tileLayer = null;
    this.routeLine = null;
    this.stopMarkers = [];
    this.userGpsMarker = null;
    this.currentStepIdx = 0;
    this.isAudioPlaying = false;
    this.speechUtterance = null;
  }

  init() {
    this.bindCockpitControls();
    this.bindPhoneNavigation();
    this.bindChatEvents();
    this.initPhoneMap();
    this.populateDiscoveryFeed();
    this.updateCityState(this.currentCityKey);
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

    // Quick Experience Switchers
    const btnChat = document.getElementById('btnSwitchToChat');
    const btnMap = document.getElementById('btnSwitchToMap');
    const btnFeed = document.getElementById('btnSwitchToFeed');

    if (btnChat) btnChat.addEventListener('click', () => this.switchTab('tabContentChat'));
    if (btnMap) btnMap.addEventListener('click', () => this.switchTab('tabContentMap'));
    if (btnFeed) btnFeed.addEventListener('click', () => this.switchTab('tabContentFeed'));
  }

  bindPhoneNavigation() {
    const navItems = document.querySelectorAll('.phone-bottom-navbar .phone-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.dataset.targetTab;
        if (targetTab) this.switchTab(targetTab);
      });
    });

    // Simulate Step Button in Map
    const stepBtn = document.getElementById('simStepWalkBtn');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => this.simulateWalkStep());
    }

    // Audio Play/Pause Button in Map Card
    const audioBtn = document.getElementById('phoneAudioToggleBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => this.toggleVoiceAudio());
    }
  }

  switchTab(tabId) {
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
    const btnChat = document.getElementById('btnSwitchToChat');
    const btnMap = document.getElementById('btnSwitchToMap');
    const btnFeed = document.getElementById('btnSwitchToFeed');
    if (btnChat) btnChat.classList.toggle('active-sim-mode', tabId === 'tabContentChat');
    if (btnMap) btnMap.classList.toggle('active-sim-mode', tabId === 'tabContentMap');
    if (btnFeed) btnFeed.classList.toggle('active-sim-mode', tabId === 'tabContentFeed');

    // Invalidate Leaflet map size on switch
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

    // Update Map Title Header
    const mapHeaderTitle = document.getElementById('simMapHeaderTitle');
    const mapHeaderSub = document.getElementById('simMapHeaderSubtitle');
    if (mapHeaderTitle) mapHeaderTitle.innerText = city.title;
    if (mapHeaderSub) mapHeaderSub.innerText = `${city.stops.length} Paradas • ${this.currentPace === 'relaxed' ? '2.1 km' : '3.8 km'}`;

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

    // Update Floating Audio Card Info
    this.updateAudioCard(0);
    this.populateDiscoveryFeed();
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
              <span>⏱️ 2h 30m</span>
              <span>🚶 2.4 km</span>
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

  populateDiscoveryFeed() {
    const container = document.getElementById('simFeedCardsContainer');
    if (!container) return;

    const city = SIMULATOR_DATA[this.currentCityKey] || SIMULATOR_DATA['cartagena'];
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    container.innerHTML = city.feed.map(item => `
      <div class="sim-feed-card" onclick="simulatorInstance.switchTab('tabContentMap')">
        <img class="feed-card-img" src="${isDark ? item.imgOscuro : item.imgClaro}" alt="${item.title}" onerror="this.src='assets/screenshots/Modo claro/Detalles de tour 1.jpeg'">
        <div class="feed-card-body">
          <h5 class="feed-card-title">${item.title}</h5>
          <div class="feed-card-meta">
            <span>⏱️ ${item.duration}</span>
            <span>${item.rating}</span>
          </div>
        </div>
      </div>
    `).join('');
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
   8. 3D APP SCREENSHOTS GALLERY CATEGORY FILTERS
   -------------------------------------------------------------------------- */
function initGalleryFilters() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const cards = document.querySelectorAll('.gallery-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.galleryFilter || 'all';

      cards.forEach(card => {
        const cat = card.dataset.category;
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   9. AUDIO DEMO SIMULATOR
   -------------------------------------------------------------------------- */
function initAudioSimulator() {
  const playBtn = document.getElementById('simPlayBtn');
  const waveAnim = document.getElementById('bentoWaveAnimation');
  const playIcon = document.getElementById('simPlayIcon');
  const playText = document.getElementById('simPlayText');
  let isPlaying = false;

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      const isEs = currentLandingLang === 'es';

      if (isPlaying) {
        if (waveAnim) waveAnim.classList.add('playing');
        if (playIcon) playIcon.innerText = '⏸';
        if (playText) playText.innerText = isEs ? 'Pausar' : 'Pause';

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(
            isEs 
              ? "Bienvenido a VibeTours. Te estás aproximando a la emblemática Torre del Reloj, construida sobre las murallas del siglo diecinueve."
              : "Welcome to VibeTours. You are approaching the historic Clock Tower, originally erected on 19th-century fortress walls."
          );
          utterance.lang = isEs ? 'es-ES' : 'en-US';
          utterance.rate = 0.95;
          utterance.onend = () => {
            isPlaying = false;
            if (waveAnim) waveAnim.classList.remove('playing');
            if (playIcon) playIcon.innerText = '▶';
            if (playText) playText.innerText = isEs ? 'Reproducir' : 'Play';
          };
          window.speechSynthesis.speak(utterance);
        }
      } else {
        if (waveAnim) waveAnim.classList.remove('playing');
        if (playIcon) playIcon.innerText = '▶';
        if (playText) playText.innerText = isEs ? 'Reproducir' : 'Play';
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
    });
  }
}

/* --------------------------------------------------------------------------
   10. FAQ ACCORDION INTERACTION
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
   11. BILINGUAL TRANSLATION ENGINE (ES / EN)
   -------------------------------------------------------------------------- */
const landingTranslations = {
  es: {
    navHow: '¿Cómo Funciona?',
    navGenerator: 'Simulador App',
    navFeatures: 'Funciones',
    navGallery: 'Galería App',
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
    simDesc: 'Interactúa en tiempo real con el Asistente IA, navega rutas GPS en el mapa satelital y escucha audioguías reales.',
    simCockpitBadge: 'Centro de Mando del Simulador',
    simCockpitTitle: 'Configura tu Experiencia',
    simCockpitDesc: 'Prueba cómo reacciona el smartphone virtual al cambiar de ciudad, ritmo e intereses turísticos.',
    simLblCity: '1. Selecciona Destino',
    simLblPace: '2. Ritmo & Duración',
    simTeleGpsLabel: 'Precisión GPS',
    simTeleLatencyLabel: 'Latencia IA',
    simTeleSourceLabel: 'Cartografía',
    simTeleVoiceLabel: 'Voz Narrativa',
    btnSwitchToChat: '💬 1. Probar Chat IA',
    btnSwitchToMap: '📍 2. Mapa Satelital',
    btnSwitchToFeed: '🧭 3. Feed de Tours',
    pnavChat: 'IA Planner',
    pnavMap: 'Live Tour',
    pnavFeed: 'Explorar',
    simWalkBtnText: 'Simular Paso',

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

    gallerySubtitle: 'Diseño de Alta Fidelidad',
    galleryTitle: 'Conoce la App por Dentro',
    galleryDesc: 'Explora las pantallas reales de VibeTours diseñadas para brindarte la mejor experiencia en cualquier destino.',
    gtabAll: 'Todas las Pantallas',
    gtabAi: '🤖 IA & Planificador',
    gtabTours: '📍 Navegación & Tours',
    gtabCreator: '✍️ Creador & Comunidad',

    testSubtitle: 'Opiniones de la Comunidad',
    testTitle: 'Amado por Viajeros Autónomos',
    testDesc: 'Descubre cómo miles de personas disfrutan de sus viajes sin depender de tours aburridos.',
    test1Text: '"Pude recorrer Cartagena a mi ritmo. Llegué a la Torre del Reloj y la voz me contó historias fascinantes que ni siquiera los guías locales sabían. ¡Increíble!"',
    test2Text: '"El chat de IA me diseñó una ruta de cafés y arte en París perfecta para mi presupuesto de estudiante. Ahorré más de 80 euros en un solo día."',
    test3Text: '"La precisión del GPS es impresionante. No se pierde nunca y me llevó a templos ocultos en Tokio que no aparecen en las guías turísticas tradicionales."',

    bentoSubtitle: 'Tecnología de Vanguardia',
    bentoTitle: 'Experiencia de Viaje Inmersiva',
    bentoDesc: 'Inteligencia artificial, cartografía satelital abierta y diseño de lujo en una sola app.',
    bento1Pill: '01. IA Generativa',
    bento1Title: 'Vibe Planner AI & Chatbot',
    bento1Desc: 'Pide tu tour en lenguaje natural. La IA calcula tiempos, distancias y coordenadas precisas al instante.',
    bento1ChatUser: '"Quiero un tour de 3 horas por cafés y museos en París con poco presupuesto."',
    bento1ChatAi: '"¡Listo! Ruta por Montmartre: 5 paradas reales, $18 USD estimados y mapa optimizado."',

    bento2Pill: '02. Guiado Satelital',
    bento2Title: 'Live Tour & Audioguía Manos Libres',
    bento2Desc: 'La voz narra historias y detalles automáticamente al aproximarte a cada parada con GPS en tiempo real.',
    bento2PlayerLabel: 'Proximidad GPS',
    bento2Snippet: '"Llegando a la Torre del Reloj, construida en el siglo XIX..."',
    simPlayText: 'Reproducir',

    bento3Pill: '03. Exploración Urbana',
    bento3Title: 'Lugares Cercanos & Clima en Vivo',
    bento3Desc: 'Monitorea el clima en tiempo real y encuentra puntos de interés a tu alrededor antes de salir.',
    bento3WeatherCity: 'Cartagena de Indias',
    bento3WeatherTag: 'Cielo Despejado',

    bento4Pill: '04. Comunidad',
    bento4Title: 'Creador Manual de Tours',
    bento4Desc: 'Crea y comparte rutas personalizadas con paradas interactivas, fotos en alta resolución y notas locales.',
    bento4Item1: '✍️ Edición rápida de paradas e itinerarios en mapa.',
    bento4Item2: '🖼️ Galería fotográfica y descripciones culturales.',
    bento4Item3: '⭐ Valoraciones comunitarias y perfiles de guías locales.',

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
    footerLinkFeatures: 'Funciones',
    footerLinkGallery: 'Galería App',
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
    navFeatures: 'Features',
    navGallery: 'App Gallery',
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
    simDesc: 'Chat with the AI Assistant, navigate real GPS maps, and listen to voice guides in real time.',
    simCockpitBadge: 'Simulator Command Cockpit',
    simCockpitTitle: 'Configure Your Experience',
    simCockpitDesc: 'Test how the virtual smartphone responds when changing city, pace, and interests.',
    simLblCity: '1. Select Destination',
    simLblPace: '2. Pace & Duration',
    simTeleGpsLabel: 'GPS Accuracy',
    simTeleLatencyLabel: 'AI Latency',
    simTeleSourceLabel: 'Cartography',
    simTeleVoiceLabel: 'Narrative Voice',
    btnSwitchToChat: '💬 1. Test AI Chat',
    btnSwitchToMap: '📍 2. Satellite Map',
    btnSwitchToFeed: '🧭 3. Tour Feed',
    pnavChat: 'AI Planner',
    pnavMap: 'Live Tour',
    pnavFeed: 'Explore',
    simWalkBtnText: 'Simulate Step',

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

    gallerySubtitle: 'High-Fidelity Interface',
    galleryTitle: 'Inside the App',
    galleryDesc: 'Discover real screenshots of VibeTours designed for the ultimate autonomous journey.',
    gtabAll: 'All Screens',
    gtabAi: '🤖 AI & Planner',
    gtabTours: '📍 Navigation & Tours',
    gtabCreator: '✍️ Creator & Community',

    testSubtitle: 'Community Reviews',
    testTitle: 'Loved by Autonomous Travelers',
    testDesc: 'Discover how thousands of travelers explore the world without rigid tour guides.',
    test1Text: '"I walked through Cartagena at my own pace. As soon as I reached the Clock Tower, the audio narrated stories even local guides didn\'t know!"',
    test2Text: '"The AI designed a gourmet cafe route in Paris perfect for my student budget. I saved over 80 euros in a single afternoon."',
    test3Text: '"The GPS precision is amazing. It never drops signal and led me to hidden temples in Tokyo that traditional tour books miss."',

    bentoSubtitle: 'Cutting-Edge Tech',
    bentoTitle: 'Immersive Travel Experience',
    bentoDesc: 'Artificial intelligence, open satellite maps, and luxury design in a single app.',
    bento1Pill: '01. Generative AI',
    bento1Title: 'Vibe Planner AI & Chatbot',
    bento1Desc: 'Request your dream tour in natural language. AI computes exact times, distances, and coordinates.',
    bento1ChatUser: '"I want a 3-hour tour around cafes and museums in Paris on a tight budget."',
    bento1ChatAi: '"Ready! Route across Montmartre: 5 real stops, $18 USD estimated, and map optimized."',

    bento2Pill: '02. Satellite Guidance',
    bento2Title: 'Live Tour & Hands-Free Audio',
    bento2Desc: 'Audio stories play automatically as you approach each landmark with real-time GPS.',
    bento2PlayerLabel: 'GPS Proximity',
    bento2Snippet: '"Approaching the Clock Tower, built over 19th-century fortress walls..."',
    simPlayText: 'Play',

    bento3Pill: '03. Urban Discovery',
    bento3Title: 'Nearby Spots & Live Weather',
    bento3Desc: 'Check live weather and discover trending cultural spots around you before heading out.',
    bento3WeatherCity: 'Cartagena de Indias',
    bento3WeatherTag: 'Clear Sky',

    bento4Pill: '04. Community',
    bento4Title: 'Manual Tour Creator',
    bento4Desc: 'Design and share custom routes with interactive map pins, high-res photos, and local tips.',
    bento4Item1: '✍️ Rapid drag-and-drop map itinerary editing.',
    bento4Item2: '🖼️ High-resolution photo galleries and descriptions.',
    bento4Item3: '⭐ Community reviews and local city guide profiles.',

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
    footerLinkFeatures: 'Features',
    footerLinkGallery: 'App Gallery',
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
  updateText('#nav-features', t.navFeatures);
  updateText('#nav-gallery', t.navGallery);
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
  updateText('#btnSwitchToChat', t.btnSwitchToChat);
  updateText('#btnSwitchToMap', t.btnSwitchToMap);
  updateText('#btnSwitchToFeed', t.btnSwitchToFeed);
  updateText('#pnav-chat', t.pnavChat);
  updateText('#pnav-map', t.pnavMap);
  updateText('#pnav-feed', t.pnavFeed);
  updateText('#simWalkBtnText', t.simWalkBtnText);

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

  // Gallery
  updateText('#gallery-subtitle', t.gallerySubtitle);
  updateText('#gallery-title', t.galleryTitle);
  updateText('#gallery-desc', t.galleryDesc);
  updateText('#gtab-all', t.gtabAll);
  updateText('#gtab-ai', t.gtabAi);
  updateText('#gtab-tours', t.gtabTours);
  updateText('#gtab-creator', t.gtabCreator);

  // Testimonials
  updateText('#test-subtitle', t.testSubtitle);
  updateText('#test-title', t.testTitle);
  updateText('#test-desc', t.testDesc);
  updateText('#test1-text', t.test1Text);
  updateText('#test2-text', t.test2Text);
  updateText('#test3-text', t.test3Text);

  // Bento Features
  updateText('#bento-subtitle', t.bentoSubtitle);
  updateText('#bento-title', t.bentoTitle);
  updateText('#bento-desc', t.bentoDesc);

  updateText('#bento1-pill', t.bento1Pill);
  updateText('#bento1-title', t.bento1Title);
  updateText('#bento1-desc', t.bento1Desc);
  updateText('#bento1-chat-user', t.bento1ChatUser);
  updateText('#bento1-chat-ai', t.bento1ChatAi);

  updateText('#bento2-pill', t.bento2Pill);
  updateText('#bento2-title', t.bento2Title);
  updateText('#bento2-desc', t.bento2Desc);
  updateText('#bento2-player-label', t.bento2PlayerLabel);
  updateText('#bento2-snippet', t.bento2Snippet);
  updateText('#simPlayText', t.simPlayText);

  updateText('#bento3-pill', t.bento3Pill);
  updateText('#bento3-title', t.bento3Title);
  updateText('#bento3-desc', t.bento3Desc);
  updateText('#bento3-weather-city', t.bento3WeatherCity);
  updateText('#bento3-weather-tag', t.bento3WeatherTag);

  updateText('#bento4-pill', t.bento4Pill);
  updateText('#bento4-title', t.bento4Title);
  updateText('#bento4-desc', t.bento4Desc);
  updateText('#bento4-item1', t.bento4Item1);
  updateText('#bento4-item2', t.bento4Item2);
  updateText('#bento4-item3', t.bento4Item3);

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
  updateText('#footer-link-features', t.footerLinkFeatures);
  updateText('#footer-link-gallery', t.footerLinkGallery);
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

