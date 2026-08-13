/* ==========================================================================
   VIBETOURS - MODERN INTERACTIVE LOGIC & BILINGUAL ENGINE (ES / EN)
   ========================================================================== */

let currentLandingLang = localStorage.getItem('vibetours_lang') || 'es';

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initScrollAnimations();
  initTourGeneratorWidget();
  initAudioSimulator();
  initFaqAccordion();
  setLandingLanguage(currentLandingLang);
});

/* --------------------------------------------------------------------------
   1. THEME TOGGLE (LIGHT / DARK) WITH PERSISTENCE
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const heroMockupImg = document.getElementById('heroMockupImg');
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
        if (heroMockupImg) heroMockupImg.src = 'assets/screenshots/Modo oscuro/Explorar 1.jpeg';
      } else {
        themeIcon.innerHTML = `
          <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/></svg>
        `;
        if (brandLogoImg) brandLogoImg.src = 'assets/images/logo_light.png';
        if (heroMockupImg) heroMockupImg.src = 'assets/screenshots/Modo claro/Explorar 1.jpeg';
      }
    }

    // Update Bento showcase images
    const showcaseImgs = document.querySelectorAll('.showcase-img');
    showcaseImgs.forEach(img => {
      const src = theme === 'dark' ? img.dataset.oscuro : img.dataset.claro;
      if (src) img.src = src;
    });
  }
}

/* --------------------------------------------------------------------------
   2. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
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
   3. WIDGET INTERACTIVO: GENERADOR DE TOURS EN VIVO
   -------------------------------------------------------------------------- */
const tourTemplates = {
  cartagena: {
    history: {
      es: {
        title: "Cartagena Colonial: Murallas, Plazas y Leyendas",
        desc: "Recorrido histórico guiado por las fortalezas del siglo XVI, conventos coloniales y baluartes con audioguía GPS.",
        stops: [
          "Torre del Reloj & Plaza de los Coches",
          "Plaza de la Aduana & Museo de Arte Moderno",
          "Santuario San Pedro Claver",
          "Baluarte de Santo Domingo (Café del Mar)"
        ]
      },
      en: {
        title: "Colonial Cartagena: Walls, Plazas & Legends",
        desc: "Historical guided tour along 16th-century fortresses, colonial convents, and sea bastions with GPS audio.",
        stops: [
          "Clock Tower & Plaza de los Coches",
          "Plaza de la Aduana & Modern Art Museum",
          "San Pedro Claver Sanctuary",
          "Santo Domingo Bastion (Café del Mar)"
        ]
      }
    },
    food: {
      es: {
        title: "Sabores del Caribe: Getsemaní & Centro Gastronómico",
        desc: "Ruta de comida típica, arepas de huevo, dulces tradicionales en el Portal de los Dulces y cócteles de autor.",
        stops: [
          "Portal de los Dulces & Plaza de los Coches",
          "Calle de la Sierpe (Graffitis & Street Food)",
          "Plaza de la Trinidad (Comida típica de Getsemaní)",
          "Muelle de los Pegasos (Bebidas al atardecer)"
        ]
      },
      en: {
        title: "Caribbean Flavors: Getsemaní & Food Haven",
        desc: "Authentic food tour featuring egg arepas, traditional sweets at Portal de los Dulces, and signature sunset cocktails.",
        stops: [
          "Portal de los Dulces & Coaches Plaza",
          "Calle de la Sierpe (Graffiti & Street Food)",
          "Trinidad Plaza (Getsemaní Local Bites)",
          "Pegasos Pier (Sunset Drinks)"
        ]
      }
    },
    art: {
      es: {
        title: "Ruta del Arte & Color: Museos y Muralismo Urbano",
        desc: "Descubre el arte colonial en museos del Centro y la galería abierta de murales en las calles de Getsemaní.",
        stops: [
          "Museo Histórico de Cartagena (Palacio de la Inquisición)",
          "Museo Naval del Caribe",
          "Callejón Angosto (Getsemaní Art Murals)",
          "Teatro Adolfo Mejía"
        ]
      },
      en: {
        title: "Art & Color Route: Museums & Street Murals",
        desc: "Explore colonial fine arts in Historic Center museums and the vibrant open-air street murals of Getsemaní.",
        stops: [
          "Cartagena Historical Museum (Inquisition Palace)",
          "Caribbean Naval Museum",
          "Callejón Angosto (Getsemaní Art Murals)",
          "Adolfo Mejía Theater"
        ]
      }
    }
  },
  tokio: {
    history: {
      es: {
        title: "Tokio Tradicional: Santuarios y Jardines Imperiales",
        desc: "Un viaje espiritual e histórico desde los templos milenarios de Asakusa hasta los jardines del Palacio Imperial.",
        stops: [
          "Templo Senso-ji & Puerta Kaminarimon",
          "Calle Comercial Nakamise",
          "Jardines del Palacio Imperial de Tokio",
          "Santuario Meiji Jingu"
        ]
      },
      en: {
        title: "Traditional Tokyo: Shrines & Imperial Gardens",
        desc: "A spiritual and historic journey from the ancient temples of Asakusa to the serene Imperial Palace grounds.",
        stops: [
          "Senso-ji Temple & Kaminarimon Gate",
          "Nakamise Historic Shopping Street",
          "Tokyo Imperial Palace East Gardens",
          "Meiji Jingu Shrine"
        ]
      }
    },
    food: {
      es: {
        title: "Ruta Culinaria de Tokio: Ramen, Tsukiji & Izakayas",
        desc: "Experiencia gastronómica inmersiva probando sushi fresco, brochetas yakitori en Omoide Yokocho y ramen artesanal.",
        stops: [
          "Mercado Exterior de Tsukiji",
          "Callejón Omoide Yokocho (Shinjuku)",
          "Calle de Ramen en Estación de Tokio",
          "Barrio Gastronómico de Ginza"
        ]
      },
      en: {
        title: "Tokyo Culinary Odyssey: Ramen, Tsukiji & Izakayas",
        desc: "An immersive foodie adventure tasting fresh sushi, yakitori skewers in Omoide Yokocho, and artisanal ramen.",
        stops: [
          "Tsukiji Outer Seafood Market",
          "Omoide Yokocho Alley (Shinjuku)",
          "Tokyo Station Ramen Street",
          "Ginza Gourmet Food District"
        ]
      }
    },
    art: {
      es: {
        title: "Tokio Futurista & Arte Digital: Shibuya y Akihabara",
        desc: "Explora galerías interactivas, distritos tecnológicos y las vistas urbanas del cruce de Shibuya.",
        stops: [
          "Cruce de Shibuya & Mirador Shibuya Sky",
          "Distrito Tecnológico de Akihabara",
          "Mori Art Museum (Roppongi Hills)",
          "Isla Artificial de Odaiba"
        ]
      },
      en: {
        title: "Futuristic Tokyo & Digital Art: Shibuya to Akiba",
        desc: "Explore interactive digital art galleries, tech districts, and panoramic neon skyline views in Shibuya.",
        stops: [
          "Shibuya Crossing & Shibuya Sky Lookout",
          "Akihabara Tech & Anime Quarter",
          "Mori Art Museum (Roppongi Hills)",
          "Odaiba Futuristic Bay"
        ]
      }
    }
  },
  paris: {
    history: {
      es: {
        title: "París Imperial: De Notre-Dame a los Campos Elíseos",
        desc: "Recorrido histórico por la Île de la Cité, puentes del río Sena y la emblemática arquitectura neoclásica.",
        stops: [
          "Catedral de Notre-Dame & Sainte-Chapelle",
          "Puente Alejandro III sobre el Sena",
          "Museo del Louvre (Patio de la Pirámide)",
          "Arco de Triunfo & Campos Elíseos"
        ]
      },
      en: {
        title: "Imperial Paris: Notre-Dame to Champs-Élysées",
        desc: "Historic walking tour across Île de la Cité, historic Seine bridges, and monumental neoclassical landmarks.",
        stops: [
          "Notre-Dame Cathedral & Sainte-Chapelle",
          "Pont Alexandre III on the Seine",
          "Louvre Courtyard & Pyramid",
          "Arc de Triomphe & Champs-Élysées"
        ]
      }
    },
    food: {
      es: {
        title: "Bistrós & Boulangeries: El París Gourmet de Le Marais",
        desc: "Degustación de croissants artesanales, quesos franceses, crepes dulces y café en terrazas clásicas.",
        stops: [
          "Marché des Enfants Rouges",
          "Place des Vosges & Pastelería Carette",
          "Bistró Tradicional en Rue des Rosiers",
          "Café de Flore en Saint-Germain"
        ]
      },
      en: {
        title: "Bistros & Boulangeries: Gourmet Le Marais",
        desc: "Tasting tour featuring artisanal croissants, fine French cheeses, sweet crêpes, and iconic terrace cafés.",
        stops: [
          "Marché des Enfants Rouges (Oldest Market)",
          "Place des Vosges & Carette Patisserie",
          "Classic Bistro on Rue des Rosiers",
          "Café de Flore in Saint-Germain"
        ]
      }
    },
    art: {
      es: {
        title: "París Bohemio: Montmartre y la Cuna de los Pintores",
        desc: "Recorre las calles empedradas donde vivieron Picasso y Van Gogh, la Plaza del Tertre y la Basílica del Sacré-Cœur.",
        stops: [
          "Basílica del Sacré-Cœur",
          "Place du Tertre (Pintores al aire libre)",
          "Museo de Montmartre",
          "Moulin Rouge & Calle Lepic"
        ]
      },
      en: {
        title: "Bohemian Paris: Montmartre & The Painter's Haven",
        desc: "Wander cobblestone alleys where Picasso and Van Gogh painted, Place du Tertre, and Sacré-Cœur Basilica.",
        stops: [
          "Sacré-Cœur Basilica Overlook",
          "Place du Tertre (Open-air Painters)",
          "Montmartre Museum & Vineyard",
          "Moulin Rouge on Rue Lepic"
        ]
      }
    }
  },
  roma: {
    history: {
      es: {
        title: "Roma Eterna: Coliseo, Foros y el Panteón de Agripa",
        desc: "Sumérgete en dos mil años de historia imperial visitando los monumentos cumbre de la civilización romana.",
        stops: [
          "Coliseo Romano & Arco de Constantino",
          "Foro Romano & Colina Palatina",
          "Panteón de Agripa",
          "Fontana di Trevi"
        ]
      },
      en: {
        title: "Eternal Rome: Colosseum, Forum & Pantheon",
        desc: "Immerse yourself in two millennia of imperial history exploring the pinnacle of ancient Roman architecture.",
        stops: [
          "Roman Colosseum & Arch of Constantine",
          "Roman Forum & Palatine Hill",
          "Pantheon of Agrippa",
          "Trevi Fountain"
        ]
      }
    },
    food: {
      es: {
        title: "Trastevere Auténtico: Pizza al Taglio, Pasta & Gelato",
        desc: "Paseo gastronómico por callejones empedrados degustando pasta carbonara original, supplì y helados artesanales.",
        stops: [
          "Piazza Santa Maria in Trastevere",
          "Trattoria Tradicional (Pasta Cacio e Pepe)",
          "Pani e Panelle (Supplì romanos)",
          "Gelateria Histórica en Campo de' Fiori"
        ]
      },
      en: {
        title: "Authentic Trastevere: Pasta, Pizza & Gelato",
        desc: "Gourmet evening stroll through cobblestone lanes tasting authentic carbonara, supplì, and artisan gelato.",
        stops: [
          "Piazza Santa Maria in Trastevere",
          "Local Trattoria (Cacio e Pepe Pasta)",
          "Street Food Stand (Roman Supplì)",
          "Historic Gelateria at Campo de' Fiori"
        ]
      }
    },
    art: {
      es: {
        title: "El Barroco Romano: Plazas, Esculturas y Fuentes",
        desc: "Las obras maestras de Bernini y Borromini reflejadas en las fuentes monumentales y plazas renacentistas.",
        stops: [
          "Piazza Navona & Fuente de los Cuatro Ríos",
          "Iglesia de San Luis de los Franceses (Caravaggio)",
          "Piazza di Spagna & Escalinata",
          "Piazza del Popolo"
        ]
      },
      en: {
        title: "Roman Baroque: Plazas, Sculptures & Fountains",
        desc: "Masterpieces by Bernini and Borromini showcasing monumental marble fountains and renaissance piazzas.",
        stops: [
          "Piazza Navona & Four Rivers Fountain",
          "San Luigi dei Francesi (Caravaggio Altars)",
          "Piazza di España & Spanish Steps",
          "Piazza del Popolo"
        ]
      }
    }
  }
};

let currentCity = 'cartagena';
let currentPace = 'relaxed';
let currentInterest = 'history';

function initTourGeneratorWidget() {
  const cityChips = document.querySelectorAll('#cityChips .chip');
  const paceChips = document.querySelectorAll('#paceChips .chip');
  const interestChips = document.querySelectorAll('#interestChips .chip');

  cityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      cityChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCity = chip.dataset.city;
      updateGeneratedPreview();
    });
  });

  paceChips.forEach(chip => {
    chip.addEventListener('click', () => {
      paceChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentPace = chip.dataset.pace;
      updateGeneratedPreview();
    });
  });

  interestChips.forEach(chip => {
    chip.addEventListener('click', () => {
      interestChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentInterest = chip.dataset.interest;
      updateGeneratedPreview();
    });
  });

  updateGeneratedPreview();
}

function updateGeneratedPreview() {
  const cityData = tourTemplates[currentCity] || tourTemplates.cartagena;
  const template = cityData[currentInterest] || cityData.history;
  const langData = template[currentLandingLang] || template['es'];

  const titleEl = document.getElementById('tourPreviewTitle');
  const descEl = document.getElementById('tourPreviewDesc');
  const stopsEl = document.getElementById('tourPreviewStops');
  const durEl = document.getElementById('tourPreviewDuration');
  const distEl = document.getElementById('tourPreviewDistance');
  const budgEl = document.getElementById('tourPreviewBudget');

  if (titleEl) titleEl.innerText = langData.title;
  if (descEl) descEl.innerText = langData.desc;

  if (stopsEl) {
    stopsEl.innerHTML = langData.stops.map((stop, i) => `
      <div class="stop-item">
        <span class="stop-number">${i + 1}</span>
        <span class="stop-name">${stop}</span>
      </div>
    `).join('');
  }

  // Pace metrics
  let duration = currentLandingLang === 'en' ? '2 Hours' : '2 Horas';
  let distance = '2.1 km';
  let budget = '$15 - $25 USD';

  if (currentPace === 'balanced') {
    duration = currentLandingLang === 'en' ? '3.5 Hours' : '3.5 Horas';
    distance = '3.8 km';
    budget = '$25 - $40 USD';
  } else if (currentPace === 'fast') {
    duration = currentLandingLang === 'en' ? '5 Hours' : '5 Horas';
    distance = '5.4 km';
    budget = '$40 - $65 USD';
  }

  if (durEl) durEl.innerText = `${currentLandingLang === 'en' ? 'Duration' : 'Duración'}: ${duration}`;
  if (distEl) distEl.innerText = `${currentLandingLang === 'en' ? 'Distance' : 'Distancia'}: ${distance}`;
  if (budgEl) budgEl.innerText = `${currentLandingLang === 'en' ? 'Budget' : 'Presupuesto'}: ${budget}`;
}

/* --------------------------------------------------------------------------
   4. AUDIO SIMULATOR (BENTO CARD 2)
   -------------------------------------------------------------------------- */
function initAudioSimulator() {
  const playBtn = document.getElementById('simPlayBtn');
  const playIcon = document.getElementById('simPlayIcon');
  const playText = document.getElementById('simPlayText');
  const waveAnim = document.getElementById('bentoWaveAnimation');

  if (!playBtn) return;

  let isPlaying = false;
  let synthUtterance = null;

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;

    if (isPlaying) {
      if (playIcon) playIcon.textContent = '⏸';
      if (playText) playText.textContent = currentLandingLang === 'en' ? 'Pause Audio Preview' : 'Pausar Demostración';
      if (waveAnim) waveAnim.classList.add('playing');

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = currentLandingLang === 'en'
          ? 'You are approaching Clock Tower, constructed in the nineteenth century as the grand entrance to the historic walled city of Cartagena.'
          : 'Estás llegando a la Torre del Reloj, construida en el siglo 19 como la entrada principal de la ciudad amurallada de Cartagena.';
        
        synthUtterance = new SpeechSynthesisUtterance(textToSpeak);
        synthUtterance.lang = currentLandingLang === 'en' ? 'en-US' : 'es-ES';
        synthUtterance.rate = 0.95;
        synthUtterance.onend = () => stopSimulator();
        window.speechSynthesis.speak(synthUtterance);
      }
    } else {
      stopSimulator();
    }
  });

  function stopSimulator() {
    isPlaying = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (playIcon) playIcon.textContent = '▶';
    if (playText) playText.textContent = currentLandingLang === 'en' ? 'Play Voice Preview' : 'Reproducir Demostración de Voz';
    if (waveAnim) waveAnim.classList.remove('playing');
  }
}

/* --------------------------------------------------------------------------
   5. FAQ ACCORDION
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
   6. BILINGUAL TRANSLATION DICTIONARY
   -------------------------------------------------------------------------- */
const landingTranslations = {
  es: {
    navHow: '¿Cómo Funciona?',
    navGenerator: 'Probar IA',
    navFeatures: 'Funciones',
    navDestinations: 'Destinos',
    navFaq: 'FAQ',
    navRegister: 'Registrarse',

    heroBadge: 'Turismo Inteligente con IA & GPS Real',
    heroTitle: 'Explora el mundo a tu propio ritmo con <span class="gradient-text">Inteligencia Artificial</span>',
    heroDesc: 'VibeTours transforma tu viaje con itinerarios generativos adaptados a tu ritmo, anclados a coordenadas satelitales verificadas de OpenStreetMap y narraciones de voz automáticas mientras caminas.',
    heroCtaPrimary: 'Crear Cuenta Gratis',
    heroCtaSecondary: 'Probar Simulador de IA',
    trust1: 'Sin Alucinaciones (OpenStreetMap)',
    trust2: 'Audioguías GPS Manos Libres',

    floatVoiceTitle: 'Audioguía en Vivo',
    floatVoiceSub: 'Reproduciendo: Torre del Reloj',
    floatGpsTitle: 'GPS Satelital Activo',
    floatGpsSub: '6 Paradas • 2.4 km • 100% Real',

    genSubtitle: 'Prueba la Experiencia',
    genTitle: 'Experimenta la IA de VibeTours',
    genDesc: 'Selecciona tus preferencias y observa cómo nuestro motor generativo estructura un itinerario real al instante.',
    genLblCity: '1. Elige una Ciudad',
    genLblPace: '2. Ritmo de Caminata',
    genLblInterest: '3. Interés Principal',
    genBadgeLive: '✨ Itinerario Generado por IA',
    genStatusOsm: '📡 Coordenadas OpenStreetMap Verificadas',
    genBtnCta: 'Explorar este tour en la app',

    bentoSubtitle: 'Poder y Elegancia',
    bentoTitle: 'Funcionalidades de Vanguardia',
    bentoDesc: 'La combinación perfecta entre inteligencia artificial, datos satelitales abiertos y diseño visual de lujo.',

    bento1Pill: '01. IA Generativa',
    bento1Title: 'Vibe Planner AI & Asistente Conversacional',
    bento1Desc: 'Chatea en lenguaje natural para diseñar tu tour soñado. La IA comprende tus gustos, sugiere hoteles verificados de salida y estructura itinerarios optimizados por coordenadas satelitales.',
    bento1ChatUser: '"Quiero un tour de 3 horas por cafeterías y museos en París con poco presupuesto."',
    bento1ChatAi: '"¡Perfecto! Diseñando tu ruta por Montmartre y Le Marais: 5 paradas reales, $18 USD estimados y mapa listo."',

    bento2Pill: '02. Guiado Satelital',
    bento2Title: 'Live Tour & Audioguía Manos Libres',
    bento2Desc: 'Camina con mapas vectoriales MapLibre GL. Al aproximarte a cada parada, la voz narra historias y detalles en vivo.',
    bento2PlayerLabel: 'Audioguía Proximidad GPS',
    bento2Snippet: '"Estás llegando a la Torre del Reloj, construida en el siglo XIX..."',
    simPlayText: 'Reproducir Demostración de Voz',

    bento3Pill: '03. Exploración Urbana',
    bento3Title: 'Lugares Cercanos & Clima en Vivo',
    bento3Desc: 'Descubre museos, restaurantes y eventos culturales en tu radio actual y revisa la sensación térmica antes de salir.',
    bento3WeatherCity: 'Cartagena de Indias',
    bento3WeatherTag: 'Cielo Despejado',

    bento4Pill: '04. Creadores & Guías',
    bento4Title: 'Creador Manual de Tours Comunitarios',
    bento4Desc: 'Diseña tus propias rutas personalizadas: ubica puntos en el mapa interactivo, organiza paradas y compártelas con viajeros de todo el mundo.',
    bento4Item1: '✍️ Edición rápida drag-and-drop de paradas e itinerarios.',
    bento4Item2: '🖼️ Galería fotográfica en alta resolución y descripciones locales.',
    bento4Item3: '⭐ Valoraciones comunitarias y perfiles de guías de ciudad.',

    howSubtitle: 'Simple y Fluido',
    howTitle: 'Tu Viaje en Tres Pasos',
    howDesc: 'Comienza a explorar cualquier ciudad en minutos de manera autónoma.',
    step1Title: 'Configura tus Preferencias',
    step1Desc: 'Define tu ritmo de caminata (Relajado, Equilibrado o Dinámico), presupuesto e intereses específicos en segundos.',
    step2Title: 'Genera o Selecciona un Tour',
    step2Desc: 'Pídele al asistente de IA un recorrido personalizado por chat o elige entre más de 50 tours precargados del catálogo.',
    step3Title: 'Recorre con Live Tour',
    step3Desc: 'Sigue el mapa vectorial en tiempo real mientras la aplicación reproduce narraciones de voz automáticamente al llegar a cada sitio.',

    destSubtitle: 'Explora el Mundo',
    destTitle: 'Destinos Destacados',
    destDesc: 'Rutas precargadas listas para recorrer en Modo Demo o con tu cuenta.',
    city1Sub: 'Coliseo, Foro Romano & Fontana di Trevi',
    city2Sub: 'Torre Eiffel, Louvre & Barrio Latino',
    city3Sub: 'Shibuya, Senso-ji & Akihabara',
    city4Sub: 'Central Park, Times Square & Soho',

    faqSubtitle: 'Resolvemos tus dudas',
    faqTitle: 'Preguntas Frecuentes',
    faqDesc: 'Todo lo que necesitas saber antes de iniciar tu viaje con VibeTours.',
    faq1Q: '¿Cómo garantiza VibeTours que la IA no invente lugares ficticios?',
    faq1A: 'La IA de VibeTours ancla cada parada sugerida a coordenadas satelitales y datos verificados de OpenStreetMap y Wikipedia. Si una ubicación no existe en mapas reales, es descartada automáticamente del itinerario.',
    faq2Q: '¿Puedo probar la aplicación sin necesidad de crear una cuenta?',
    faq2A: '¡Sí! VibeTours cuenta con un Modo Demo que te permite explorar de inmediato el catálogo completo de más de 50 tours precargados sin necesidad de registro previo.',
    faq3Q: '¿La narración por voz funciona automáticamente al caminar?',
    faq3A: 'Correcto. Al iniciar el modo "Live Tour", la aplicación rastrea tu posición por GPS y reproduce narraciones de audio automáticamente al aproximarte a cada monumento o sitio de interés.',
    faq4Q: '¿Puedo crear y compartir mis propios recorridos?',
    faq4A: 'Sí. Con el Creador Manual de Tours puedes fijar paradas en el mapa, añadir fotografías, redactar explicaciones y publicar tu itinerario para que otros miembros de la comunidad lo disfruten.',

    bannerTag: 'Acceso Libre & Sin Costos Ocultos',
    bannerTitle: '¿Listo para comenzar tu próxima aventura?',
    bannerDesc: 'Crea tu cuenta gratuita para sincronizar tus recorridos favoritos y generar itinerarios ilimitados con Inteligencia Artificial.',
    bannerBtnRegister: 'Crear Cuenta Gratis',
    bannerBtnDemo: 'Explorar en Modo Demo',

    footerDesc: 'Tu compañero de viaje inteligente con Inteligencia Artificial, geolocalización satelital y audioguías en vivo.',
    footerCol1Title: 'Navegación',
    footerLinkHow: '¿Cómo Funciona?',
    footerLinkGenerator: 'Probar IA',
    footerLinkFeatures: 'Funciones',
    footerLinkDestinations: 'Destinos',
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
    navGenerator: 'Try AI',
    navFeatures: 'Features',
    navDestinations: 'Destinations',
    navFaq: 'FAQ',
    navRegister: 'Register',

    heroBadge: 'Smart Tourism with AI & Real GPS',
    heroTitle: 'Explore the world at your own pace with <span class="gradient-text">Artificial Intelligence</span>',
    heroDesc: 'VibeTours reinvents travel with custom itineraries tuned to your pace, anchored to verified OpenStreetMap satellite coordinates and hands-free voice audio as you walk.',
    heroCtaPrimary: 'Create Free Account',
    heroCtaSecondary: 'Try AI Simulator',
    trust1: 'Zero Hallucinations (OpenStreetMap)',
    trust2: 'Hands-Free GPS Audio Guides',

    floatVoiceTitle: 'Live Audio Guide',
    floatVoiceSub: 'Now Playing: Clock Tower',
    floatGpsTitle: 'Active GPS Sat-Lock',
    floatGpsSub: '6 Stops • 2.4 km • 100% Real',

    genSubtitle: 'Experience the Magic',
    genTitle: 'Try the VibeTours AI Engine',
    genDesc: 'Select your preferences and watch our generative AI assemble a verified real-world itinerary on the fly.',
    genLblCity: '1. Pick a City',
    genLblPace: '2. Walking Pace',
    genLblInterest: '3. Main Interest',
    genBadgeLive: '✨ AI Generated Itinerary',
    genStatusOsm: '📡 Verified OpenStreetMap Coordinates',
    genBtnCta: 'Explore this tour in app',

    bentoSubtitle: 'Power & Elegance',
    bentoTitle: 'Cutting-Edge Features',
    bentoDesc: 'The ultimate synthesis of generative AI, open geospatial data, and luxury glassmorphic design.',

    bento1Pill: '01. Generative AI',
    bento1Title: 'Vibe Planner AI & Conversational Assistant',
    bento1Desc: 'Chat fluidly in natural language to craft your dream tour. AI understands your intent, suggests verified starting hotels, and structures optimal satellite-anchored stops.',
    bento1ChatUser: '"I want a 3-hour budget tour through cafés and art museums in Paris."',
    bento1ChatAi: '"Done! Designing your route across Montmartre & Le Marais: 5 real stops, ~$18 USD estimate and ready map."',

    bento2Pill: '02. Satellite Guidance',
    bento2Title: 'Live Tour & Hands-Free Audio Guide',
    bento2Desc: 'Walk with MapLibre GL vector maps. As you approach each stop, the voice automatically narrates local stories and insights.',
    bento2PlayerLabel: 'GPS Proximity Audio Guide',
    bento2Snippet: '"You are arriving at the Clock Tower, built in the nineteenth century..."',
    simPlayText: 'Play Voice Preview',

    bento3Pill: '03. Urban Discovery',
    bento3Title: 'Nearby Places & Real-time Weather',
    bento3Desc: 'Discover museums, authentic eateries, and cultural events around your radius with real-time temperature forecasts.',
    bento3WeatherCity: 'Cartagena, Colombia',
    bento3WeatherTag: 'Clear Skies',

    bento4Pill: '04. Creators & Guides',
    bento4Title: 'Community Manual Tour Creator',
    bento4Desc: 'Design custom walking routes: drop pins on interactive maps, arrange stops, and share your expertise with global travelers.',
    bento4Item1: '✍️ Quick drag-and-drop itinerary editing.',
    bento4Item2: '🖼️ High-resolution photo galleries and local storytelling.',
    bento4Item3: '⭐ Community ratings and local guide profiles.',

    howSubtitle: 'Simple & Seamless',
    howTitle: 'Your Journey in Three Steps',
    howDesc: 'Start exploring any city in minutes with total freedom.',
    step1Title: 'Set Your Style',
    step1Desc: 'Choose your walking pace (Relaxed, Balanced, Fast), budget, and companions in seconds.',
    step2Title: 'Generate or Pick a Tour',
    step2Desc: 'Ask the AI assistant for a personalized route in chat or choose from 50+ pre-loaded catalog tours.',
    step3Title: 'Explore with Live Tour',
    step3Desc: 'Follow interactive vector maps as voice narrations trigger automatically when approaching monuments.',

    destSubtitle: 'Explore the World',
    destTitle: 'Featured Destinations',
    destDesc: 'Pre-loaded flagship tours ready to walk in Demo Mode or with your account.',
    city1Sub: 'Colosseum, Roman Forum & Trevi Fountain',
    city2Sub: 'Eiffel Tower, Louvre & Latin Quarter',
    city3Sub: 'Shibuya, Senso-ji & Akihabara',
    city4Sub: 'Central Park, Times Square & Soho',

    faqSubtitle: 'Clear Answers',
    faqTitle: 'Frequently Asked Questions',
    faqDesc: 'Everything you need to know before stepping out with VibeTours.',
    faq1Q: 'How does VibeTours ensure the AI doesn\'t make up fake places?',
    faq1A: 'VibeTours AI anchors every recommended stop against satellite coordinates and verified OpenStreetMap and Wikipedia data. Unverified places are automatically discarded.',
    faq2Q: 'Can I try the app without creating an account?',
    faq2A: 'Yes! VibeTours features a resilient Demo Mode allowing you to explore all 50+ pre-loaded city tours immediately without registration.',
    faq3Q: 'Does voice narration trigger automatically while walking?',
    faq3A: 'Yes. When starting "Live Tour" mode, the app tracks your GPS position and triggers audio stories automatically as you enter the geofenced radius.',
    faq4Q: 'Can I create and share my own tours?',
    faq4A: 'Yes. With the Manual Tour Creator you can pin stops on the map, attach photos, write narratives, and share with the global community.',

    bannerTag: 'Free Access & Zero Hidden Fees',
    bannerTitle: 'Ready to start your next adventure?',
    bannerDesc: 'Create your free account to sync favorite tours and generate unlimited smart AI itineraries.',
    bannerBtnRegister: 'Create Free Account',
    bannerBtnDemo: 'Try Demo Mode',

    footerDesc: 'Your smart travel companion powered by Artificial Intelligence, satellite geolocation, and hands-free audio guides.',
    footerCol1Title: 'Navigation',
    footerLinkHow: 'How it Works',
    footerLinkGenerator: 'Try AI',
    footerLinkFeatures: 'Features',
    footerLinkDestinations: 'Destinations',
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
  updateText('#nav-destinations', t.navDestinations);
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

  // Destinations
  updateText('#dest-subtitle', t.destSubtitle);
  updateText('#dest-title', t.destTitle);
  updateText('#dest-desc', t.destDesc);
  updateText('#city1-sub', t.city1Sub);
  updateText('#city2-sub', t.city2Sub);
  updateText('#city3-sub', t.city3Sub);
  updateText('#city4-sub', t.city4Sub);

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
  updateText('#footer-link-destinations', t.footerLinkDestinations);
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
  if (el) el.innerText = text;
}

function updateHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
}
