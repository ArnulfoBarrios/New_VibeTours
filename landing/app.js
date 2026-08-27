/* ==========================================================================
   VIBETOURS - MODERN INTERACTIVE LOGIC, 3D GLOBE & BILINGUAL ENGINE
   ========================================================================== */

let currentLandingLang = localStorage.getItem('vibetours_lang') || 'es';

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initInteractiveGlobe();
  initScrollEffects();
  initCardSpotlight();
  initTourGeneratorWidget();
  initAudioSimulator();
  initFaqAccordion();
  setLandingLanguage(currentLandingLang);
});

/* --------------------------------------------------------------------------
   1. THEME TOGGLE (LIGHT / DARK) WITH REAL-TIME GLOBE SYNC
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

    // Update Bento showcase images
    const showcaseImgs = document.querySelectorAll('.showcase-img');
    showcaseImgs.forEach(img => {
      const src = theme === 'dark' ? img.dataset.oscuro : img.dataset.claro;
      if (src) img.src = src;
    });

    // Rebuild globe in real time with the new palette
    if (typeof window.rebuildCobeGlobe === 'function') {
      window.rebuildCobeGlobe();
    }
  }
}

/* --------------------------------------------------------------------------
   2. 3D INTERACTIVE GLOBE (COBE) WITH HIGH DEFINITION & FLUID DRAG
   -------------------------------------------------------------------------- */
let globeInstance = null;
let globeCanvas = null;
let globePhi = 0;
let globePhiOffset = 0;
let globeThetaOffset = 0;
let globeDragOffset = { phi: 0, theta: 0 };
let isGlobePaused = false;
let pointerInteracting = null;

const VIBETOURS_MARKERS = [
  { id: "cartagena", location: [10.39, -75.48], size: 0.05 },
  { id: "paris", location: [48.85, 2.35], size: 0.05 },
  { id: "tokyo", location: [35.68, 139.69], size: 0.05 },
  { id: "newyork", location: [40.71, -74.0], size: 0.05 },
  { id: "rome", location: [41.9, 12.49], size: 0.05 },
  { id: "london", location: [51.5, -0.12], size: 0.05 }
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
    const baseColor = isDark ? [0.16, 0.20, 0.32] : [0.75, 0.80, 0.88];
    const markerColor = [0.0, 0.48, 1.0]; // VibeTours Primary Blue (#007AFF)
    const glowColor = isDark ? [0.0, 0.35, 0.95] : [0.65, 0.78, 0.98];
    const arcColor = [0.68, 0.32, 0.87]; // AI Purple (#AF52DE)
    const mapBrightness = isDark ? 8 : 5.5;

    globeInstance = createGlobe(globeCanvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width * 2,
      height: width * 2,
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
      arcWidth: 0.6,
      arcHeight: 0.28,
      opacity: 0.9,
      onRender: (state) => {
        if (!isGlobePaused) globePhi += 0.003;
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
   3. SCROLL EFFECTS: PROGRESS BAR, PARALLAX & REVEAL ANIMATIONS
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
   4. CARD SPOTLIGHT EFFECT (CURSOR REACTIVE GLOW)
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
   5. WIDGET INTERACTIVO: SIMULADOR DE TOURS IA
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

let activeCity = 'cartagena';
let activePace = 'relaxed';
let activeInterest = 'history';

function initTourGeneratorWidget() {
  setupChipListeners('#cityChips', 'city', (val) => { activeCity = val; updateGeneratedPreview(); });
  setupChipListeners('#paceChips', 'pace', (val) => { activePace = val; updateGeneratedPreview(); });
  setupChipListeners('#interestChips', 'interest', (val) => { activeInterest = val; updateGeneratedPreview(); });
  updateGeneratedPreview();
}

function setupChipListeners(containerSelector, dataAttr, callback) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const chips = container.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      callback(chip.dataset[dataAttr]);
    });
  });
}

function updateGeneratedPreview() {
  const cityData = tourTemplates[activeCity] || tourTemplates['cartagena'];
  const tourData = cityData[activeInterest] || cityData['history'];
  const localizedTour = tourData[currentLandingLang] || tourData['es'];

  const titleEl = document.getElementById('tourPreviewTitle');
  const descEl = document.getElementById('tourPreviewDesc');
  const durationEl = document.getElementById('tourPreviewDuration');
  const distanceEl = document.getElementById('tourPreviewDistance');
  const budgetEl = document.getElementById('tourPreviewBudget');
  const stopsEl = document.getElementById('tourPreviewStops');

  if (titleEl) titleEl.innerText = localizedTour.title;
  if (descEl) descEl.innerText = localizedTour.desc;

  const isEs = currentLandingLang === 'es';

  if (activePace === 'relaxed') {
    if (durationEl) durationEl.innerText = isEs ? "Duración: 2 Horas" : "Duration: 2 Hours";
    if (distanceEl) distanceEl.innerText = isEs ? "Distancia: 2.1 km" : "Distance: 2.1 km";
    if (budgetEl) budgetEl.innerText = isEs ? "Presupuesto: $15 - $25 USD" : "Budget: $15 - $25 USD";
  } else if (activePace === 'balanced') {
    if (durationEl) durationEl.innerText = isEs ? "Duración: 3.5 Horas" : "Duration: 3.5 Hours";
    if (distanceEl) distanceEl.innerText = isEs ? "Distancia: 3.8 km" : "Distance: 3.8 km";
    if (budgetEl) budgetEl.innerText = isEs ? "Presupuesto: $25 - $40 USD" : "Budget: $25 - $40 USD";
  } else {
    if (durationEl) durationEl.innerText = isEs ? "Duración: 5 Horas" : "Duration: 5 Hours";
    if (distanceEl) distanceEl.innerText = isEs ? "Distancia: 6.2 km" : "Distance: 6.2 km";
    if (budgetEl) budgetEl.innerText = isEs ? "Presupuesto: $40 - $65 USD" : "Budget: $40 - $65 USD";
  }

  if (stopsEl) {
    stopsEl.innerHTML = localizedTour.stops.map((stop, idx) => `
      <div class="stop-item">
        <span class="stop-number">${idx + 1}</span>
        <span class="stop-name">${stop}</span>
      </div>
    `).join('');
  }
}

/* --------------------------------------------------------------------------
   6. AUDIO DEMO SIMULATOR
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
   7. FAQ ACCORDION INTERACTION
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
   8. BILINGUAL TRANSLATION ENGINE (ES / EN)
   -------------------------------------------------------------------------- */
const landingTranslations = {
  es: {
    navHow: '¿Cómo Funciona?',
    navGenerator: 'Simulador IA',
    navFeatures: 'Funciones',
    navFaq: 'FAQ',
    navRegister: 'Registrarse',

    heroBadge: 'Turismo Inteligente con IA & GPS Real',
    heroTitle: 'Explora el mundo con <span class="gradient-text">Inteligencia Artificial</span>',
    heroDesc: 'Itinerarios a tu ritmo, coordenadas reales de OpenStreetMap y audioguías contextuales mientras caminas.',
    heroCtaPrimary: 'Crear Cuenta Gratis',
    heroCtaSecondary: 'Probar Simulador',
    trust1: '100% Mapas Satelitales Reales',
    trust2: 'Audioguías GPS Manos Libres',

    floatVoiceTitle: 'Audioguía en Vivo',
    floatVoiceSub: 'Torre del Reloj',
    floatGpsTitle: 'GPS Satelital Activo',
    floatGpsSub: '6 Paradas • 2.4 km',
    globeDragHint: 'Arrastra para girar en 3D',

    genSubtitle: 'Simulador en Vivo',
    genTitle: 'Diseña tu Tour al Instante',
    genDesc: 'Selecciona tus preferencias y observa cómo la IA genera un itinerario verificado en tiempo real.',
    genLblCity: '1. Elige una Ciudad',
    genLblPace: '2. Ritmo de Caminata',
    genLblInterest: '3. Interés Principal',
    genBadgeLive: '✨ Itinerario Verificado',
    genStatusOsm: '📡 OpenStreetMap GPS',
    genBtnCta: 'Explorar este tour en la app',

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
    footerLinkGenerator: 'Simulador IA',
    footerLinkFeatures: 'Funciones',
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
    navGenerator: 'AI Simulator',
    navFeatures: 'Features',
    navFaq: 'FAQ',
    navRegister: 'Sign Up',

    heroBadge: 'Smart Tourism with AI & Real GPS',
    heroTitle: 'Explore the world with <span class="gradient-text">Artificial Intelligence</span>',
    heroDesc: 'Itineraries at your pace, verified OpenStreetMap coordinates, and hands-free contextual audio guides.',
    heroCtaPrimary: 'Create Free Account',
    heroCtaSecondary: 'Try Simulator',
    trust1: '100% Verified Satellite Maps',
    trust2: 'Hands-Free GPS Audio Guides',

    floatVoiceTitle: 'Live Audio Guide',
    floatVoiceSub: 'Clock Tower',
    floatGpsTitle: 'Active Satellite GPS',
    floatGpsSub: '6 Stops • 2.4 km',
    globeDragHint: 'Drag to rotate in 3D',

    genSubtitle: 'Live Simulator',
    genTitle: 'Design Your Tour in Seconds',
    genDesc: 'Choose your preferences and watch our AI structure a verified route in real time.',
    genLblCity: '1. Select a City',
    genLblPace: '2. Walking Pace',
    genLblInterest: '3. Main Interest',
    genBadgeLive: '✨ Verified Itinerary',
    genStatusOsm: '📡 OpenStreetMap GPS',
    genBtnCta: 'Explore this tour in the app',

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
    footerLinkGenerator: 'AI Simulator',
    footerLinkFeatures: 'Features',
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
  updateText('#globe-drag-hint', t.globeDragHint);

  // Generator
  updateText('#gen-subtitle', t.genSubtitle);
  updateText('#gen-title', t.genTitle);
  updateText('#gen-desc', t.genDesc);
  updateText('#gen-lbl-city', t.genLblCity);
  updateText('#gen-lbl-pace', t.genLblPace);
  updateText('#gen-lbl-interest', t.genLblInterest);
  updateText('#gen-badge-live', t.genBadgeLive);
  updateText('#gen-status-osm', t.genStatusOsm);
  updateText('#gen-btn-cta', t.genBtnCta);

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
  updateText('#footer-link-faq', t.footerLinkFaq);
  updateText('#footer-col2-title', t.footerCol2Title);
  updateText('#footer-link-terms', t.footerLinkTerms);
  updateText('#footer-link-privacy', t.footerLinkPrivacy);
  updateText('#footer-link-legal', t.footerLinkLegal);
  updateText('#footer-link-register', t.footerLinkRegister);
  updateText('#footer-copy-rights', t.footerCopyRights);
  updateText('#footer-copy-design', t.footerCopyDesign);

  updateGeneratedPreview();
};

function updateText(selector, text) {
  const el = document.querySelector(selector);
  if (el && text !== undefined) el.innerText = text;
}

function updateHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el && html !== undefined) el.innerHTML = html;
}
