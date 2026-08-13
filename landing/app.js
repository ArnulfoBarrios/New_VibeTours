/* ==========================================================================
   VIBETOURS - LANDING PAGE LOGIC & BILINGUAL SUPPORT (ES / EN)
   ========================================================================== */

let currentLandingLang = localStorage.getItem('vibetours_lang') || 'es';

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initScrollAnimations();
  initStickyShowcase();
  initFaqAccordion();
  initAudioSimulator();
  setLandingLanguage(currentLandingLang);
});

/* --------------------------------------------------------------------------
   1. THEME TOGGLE (LIGHT / DARK)
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

    // Update sticky phone image
    const activeCard = document.querySelector('.showcase-card.active');
    const stickyPhoneImg = document.getElementById('stickyPhoneImg');
    if (activeCard && stickyPhoneImg) {
      const src = theme === 'dark' ? activeCard.dataset.oscuro : activeCard.dataset.claro;
      if (src) stickyPhoneImg.src = src;
    }

    // Update mobile fallback images
    const showcaseImgs = document.querySelectorAll('.showcase-img');
    showcaseImgs.forEach(img => {
      const src = theme === 'dark' ? img.dataset.oscuro : img.dataset.claro;
      if (src) img.src = src;
    });
  }
}

/* --------------------------------------------------------------------------
   2. SCROLL REVEAL ANIMATIONS
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   3. STICKY SHOWCASE CONTROLLER
   -------------------------------------------------------------------------- */
function initStickyShowcase() {
  const cards = document.querySelectorAll('.showcase-card');
  const stickyPhoneImg = document.getElementById('stickyPhoneImg');

  if (!cards.length || !stickyPhoneImg) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -40% 0px',
    threshold: 0.3
  };

  const showcaseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach(c => c.classList.remove('active'));
        entry.target.classList.add('active');

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newSrc = currentTheme === 'dark' ? entry.target.dataset.oscuro : entry.target.dataset.claro;

        if (newSrc && stickyPhoneImg.src !== newSrc) {
          stickyPhoneImg.style.opacity = '0.3';
          stickyPhoneImg.style.transform = 'scale(0.97)';

          setTimeout(() => {
            stickyPhoneImg.src = newSrc;
            stickyPhoneImg.style.opacity = '1';
            stickyPhoneImg.style.transform = 'scale(1)';
          }, 150);
        }
      }
    });
  }, observerOptions);

  cards.forEach(card => {
    showcaseObserver.observe(card);
    
    // Also allow clicking cards directly
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newSrc = currentTheme === 'dark' ? card.dataset.oscuro : card.dataset.claro;
      if (newSrc && stickyPhoneImg) {
        stickyPhoneImg.src = newSrc;
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. FAQ ACCORDION
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isActive = item.classList.contains('active');
      
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   5. LIVE AUDIO SIMULATOR
   -------------------------------------------------------------------------- */
function initAudioSimulator() {
  const playBtn = document.getElementById('simPlayBtn');
  const playIcon = document.getElementById('simPlayIcon');
  const playText = document.getElementById('simPlayText');

  if (!playBtn) return;

  let isPlaying = false;
  let synthUtterance = null;

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isPlaying = !isPlaying;

    if (isPlaying) {
      if (playIcon) playIcon.textContent = '⏸';
      if (playText) playText.textContent = currentLandingLang === 'en' ? 'Pausar Audioguía' : 'Pausar Audioguía';

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = currentLandingLang === 'en'
          ? 'You are arriving at the Clock Tower, built in the 19th century as the main entrance to the walled historic city of Cartagena.'
          : 'Estás llegando a la Torre del Reloj, construida en el siglo 19 como la entrada principal de la ciudad amurallada de Cartagena.';
        
        synthUtterance = new SpeechSynthesisUtterance(textToSpeak);
        synthUtterance.lang = currentLandingLang === 'en' ? 'en-US' : 'es-ES';
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
    if (playText) playText.textContent = currentLandingLang === 'en' ? 'Play Audio Guide' : 'Reproducir Audioguía';
  }
}

/* --------------------------------------------------------------------------
   6. BILINGUAL TRANSLATIONS (ES / EN)
   -------------------------------------------------------------------------- */
const landingTranslations = {
  es: {
    navHow: '¿Cómo Funciona?',
    navFeatures: 'Funciones',
    navDestinations: 'Destinos',
    navFaq: 'Preguntas Frecuentes',
    navRegister: 'Registrarse',

    heroBadge: '✨ Turismo Inteligente con IA & GPS',
    heroTitle: 'Explora el mundo a tu propio ritmo con <span class="gradient-text">Inteligencia Artificial</span>',
    heroDesc: 'VibeTours crea itinerarios a tu medida basados en datos satelitales reales de OpenStreetMap, acompañándote con narraciones de voz automáticas y mapas vectoriales mientras caminas.',
    heroCtaPrimary: 'Crear Cuenta Gratis',
    heroCtaSecondary: 'Ver Cómo Funciona',

    pillar1Title: 'Rutas Reales Sin Alucinaciones',
    pillar1Desc: 'Cada punto sugerido por la IA está verificado con coordenadas satelitales de OpenStreetMap y Wikipedia.',
    pillar2Title: 'Audioguía Manos Libres GPS',
    pillar2Desc: 'La voz inteligente narra historias y detalles fascinantes de forma automática al aproximarte a cada lugar.',
    pillar3Title: 'Modo Demo sin Registro',
    pillar3Desc: 'Explora el catálogo de más de 50 tours precargados inmediatamente sin necesidad de registrarte.',

    howSubtitle: 'Experiencia Fluida',
    howTitle: '¿Cómo funciona VibeTours?',
    howDesc: 'Empieza tu recorrido en tres simples pasos desde cualquier lugar del mundo.',
    step1Title: 'Define tu Estilo de Viaje',
    step1Desc: 'Elige tu ritmo de caminata (Relajado, Equilibrado o Dinámico), tu compañía (Solo, Pareja, Familia, Amigos) y tus gustos principales.',
    step2Title: 'Genera o Elige tu Recorrido',
    step2Desc: 'Pídele a Vibe Planner AI un itinerario personalizado en lenguaje natural o explora tours creados por la comunidad.',
    step3Title: 'Inicia el Live Tour con Voz',
    step3Desc: 'Camina con el mapa vectorial. La aplicación detecta tu proximidad por GPS y reproduce narraciones de audio automáticamente.',

    featSubtitle: 'Tecnología en Acción',
    featTitle: 'Funcionalidades Principales',
    featDesc: 'Descubre cómo la IA y la geolocalización transforman cada minuto de tu experiencia de viaje.',

    feat1Title: 'Vibe Planner AI & Asistente Conversacional',
    feat1Desc: 'Chatea en lenguaje natural para diseñar tu tour ideal. La IA analiza tu intención, consulta puntos de interés reales y sugiere hoteles de partida y presupuestos estimados.',
    feat1Bullet1: '✨ Creación mediante texto libre o dictado por voz.',
    feat1Bullet2: '🏨 Sugerencia de hoteles y puntos de encuentro verificados.',
    feat1Bullet3: '💵 Estimación de presupuesto por parada.',

    feat2Title: 'Live Tour con Navegación GPS & Audioguías',
    feat2Desc: 'Navega con mapas vectoriales MapLibre GL mientras caminas. La app detecta tu posición satelital y reproduce narraciones de voz automáticas al aproximarte a cada lugar.',
    audioDemoLabel: '🔊 Probar Simulación de Voz:',
    audioDemoSnippet: '"Estás llegando a la Torre del Reloj, construida en el siglo XIX como la entrada principal de la ciudad amurallada..."',
    simPlayText: 'Reproducir Audioguía',

    feat3Title: 'Descubrimiento de Lugares Cercanos & Clima',
    feat3Desc: 'Encuentra monumentos, museos y gastronomía en tu radio actual y consulta el pronóstico del clima en tiempo real antes de salir a recorrer.',
    feat3Bullet1: '📍 Puntos de interés cercanos con cálculo de distancias.',
    feat3Bullet2: '☀️ Clima en vivo, sensación térmica y alertas de lluvia.',
    feat3Bullet3: '🎪 Sugerencias de eventos culturales locales.',

    feat4Title: 'Creador de Tours para Guías & Locales',
    feat4Desc: 'Diseña tus propias rutas personalizadas: añade paradas en el mapa interactivo, organiza el orden de visita y compártelas con otros viajeros.',
    feat4Bullet1: '✍️ Edición rápida e intuitiva de paradas e itinerarios.',
    feat4Bullet2: '🖼️ Galería fotográfica y descripciones personalizadas.',
    feat4Bullet3: '⭐ Calificación comunitaria y perfiles de guías locales.',

    destSubtitle: 'Inspiración de Viaje',
    destTitle: 'Destinos Populares',
    destDesc: 'Recorridos precargados listos para explorar en Modo Demo o con tu cuenta.',

    faqSubtitle: 'Resolvemos tus dudas',
    faqTitle: 'Preguntas Frecuentes',
    faqDesc: 'Todo lo que necesitas saber antes de iniciar tu viaje con VibeTours.',
    faq1Q: '¿Cómo garantiza VibeTours que la IA no invente lugares ficticios?',
    faq1A: 'La IA de VibeTours ancla cada punto sugerido a coordenadas satelitales y datos verificados de OpenStreetMap y Wikipedia. Si un sitio no cuenta con ubicación geográfica real, es descartado del itinerario.',
    faq2Q: '¿Puedo usar la aplicación sin crear una cuenta?',
    faq2A: '¡Sí! VibeTours incluye un Modo Demo que te permite explorar de inmediato el catálogo de tours precargados sin necesidad de registro previo.',
    faq3Q: '¿La audioguía funciona de forma automática al caminar?',
    faq3A: 'Correcto. Al iniciar el modo "Live Tour", la aplicación monitorea tu posición GPS y reproduce automáticamente la narración de audio al aproximarte a cada punto de interés.',
    faq4Q: '¿Puedo personalizar el ritmo y presupuesto de mis tours?',
    faq4A: 'Sí. Puedes definir tu ritmo de caminata (Relajado, Equilibrado o Dinámico), tu rango de presupuesto y si viajas en familia o con amigos para adaptar todas las recomendaciones.',

    bannerTag: 'Acceso Libre',
    bannerTitle: '¿Listo para comenzar tu aventura?',
    bannerDesc: 'Crea tu cuenta gratuita para sincronizar tus recorridos favoritos y generar itinerarios inteligentes con VibeTours.',
    bannerBtnRegister: 'Crear Cuenta Gratis',
    bannerBtnDemo: 'Probar en Modo Demo',

    footerDesc: 'Tu compañero de viaje inteligente con Inteligencia Artificial, geolocalización y audioguías automáticas.',
    footerCol1Title: 'Navegación',
    footerLinkHow: '¿Cómo Funciona?',
    footerLinkFeatures: 'Funciones',
    footerLinkDestinations: 'Destinos',
    footerLinkFaq: 'Preguntas Frecuentes',
    footerCol2Title: 'Portal Legal',
    footerLinkTerms: 'Términos de Servicio',
    footerLinkPrivacy: 'Política de Privacidad',
    footerLinkLegal: 'Información de Seguridad',
    footerLinkRegister: 'Registro de Usuario',
    footerCopyRights: 'Todos los derechos reservados.',
    footerCopyDesign: 'Diseño limpio y optimizado para exploradores modernos.'
  },
  en: {
    navHow: 'How it Works',
    navFeatures: 'Features',
    navDestinations: 'Destinations',
    navFaq: 'FAQ',
    navRegister: 'Register',

    heroBadge: '✨ Smart Tourism with AI & GPS',
    heroTitle: 'Explore the world at your own pace with <span class="gradient-text">Artificial Intelligence</span>',
    heroDesc: 'VibeTours creates custom itineraries based on verified OpenStreetMap satellite coordinates, guiding you with hands-free voice audio and vector maps as you walk.',
    heroCtaPrimary: 'Create Free Account',
    heroCtaSecondary: 'See How it Works',

    pillar1Title: 'Real Routes Without Hallucinations',
    pillar1Desc: 'Every point suggested by AI is verified against OpenStreetMap satellite coordinates and Wikipedia.',
    pillar2Title: 'Hands-Free GPS Audio Guide',
    pillar2Desc: 'Smart voice narrations trigger automatically as you approach monuments and landmarks.',
    pillar3Title: 'Demo Mode Without Registration',
    pillar3Desc: 'Instantly explore our catalog of 50+ pre-loaded city tours without signing up.',

    howSubtitle: 'Seamless Experience',
    howTitle: 'How does VibeTours work?',
    howDesc: 'Start your custom journey in three simple steps anywhere in the world.',
    step1Title: 'Set Your Travel Style',
    step1Desc: 'Choose your walking pace (Relaxed, Balanced, Fast), companions (Solo, Couple, Family, Friends) and top interests.',
    step2Title: 'Generate or Choose a Tour',
    step2Desc: 'Ask Vibe Planner AI for a custom itinerary in natural language or browse community-curated routes.',
    step3Title: 'Start Voice-Guided Live Tour',
    step3Desc: 'Walk with interactive vector maps. The app tracks your GPS proximity and narrates stories hands-free.',

    featSubtitle: 'Technology in Action',
    featTitle: 'Core Features',
    featDesc: 'Discover how AI and real-time geolocation transform every minute of your travel journey.',

    feat1Title: 'Vibe Planner AI & Conversational Assistant',
    feat1Desc: 'Chat fluidly in natural language to craft your dream tour. AI analyzes your intent, consults real landmarks, and estimates budget.',
    feat1Bullet1: '✨ Create via free-text prompt or voice dictation.',
    feat1Bullet2: '🏨 Verified hotel suggestions and departure points.',
    feat1Bullet3: '💵 Budget estimate per tour stop.',

    feat2Title: 'Live Tour with GPS Navigation & Audio Guides',
    feat2Desc: 'Navigate MapLibre GL vector maps while walking. The app detects your GPS coordinates and triggers audio automatically near each landmark.',
    audioDemoLabel: '🔊 Test Voice Simulation:',
    audioDemoSnippet: '"You are arriving at the Clock Tower, built in the 19th century as the main entrance to the walled city..."',
    simPlayText: 'Play Audio Guide',

    feat3Title: 'Nearby Places Discovery & Live Weather',
    feat3Desc: 'Find landmarks, museums, and food spots around your current radius with live weather forecasts before heading out.',
    feat3Bullet1: '📍 Nearby points of interest with real-time distance.',
    feat3Bullet2: '☀️ Live weather, thermal sensation and rain alerts.',
    feat3Bullet3: '🎪 Local cultural event suggestions.',

    feat4Title: 'Tour Creator for Guides & Locals',
    feat4Desc: 'Design your own custom routes: pin stops on the map, arrange itinerary order, and share with travelers worldwide.',
    feat4Bullet1: '✍️ Quick, intuitive stop and itinerary editing.',
    feat4Bullet2: '🖼️ Custom photo gallery and descriptions.',
    feat4Bullet3: '⭐ Community ratings and local guide profiles.',

    destSubtitle: 'Travel Inspiration',
    destTitle: 'Popular Destinations',
    destDesc: 'Pre-loaded tours ready to explore in Demo Mode or with your account.',

    faqSubtitle: 'Clear Answers',
    faqTitle: 'Frequently Asked Questions',
    faqDesc: 'Everything you need to know before stepping out with VibeTours.',
    faq1Q: 'How does VibeTours guarantee AI doesn\'t make up fake places?',
    faq1A: 'VibeTours AI anchors every recommended point to satellite coordinates and verified OpenStreetMap and Wikipedia data. Unverified places are excluded from itineraries.',
    faq2Q: 'Can I use the app without creating an account?',
    faq2A: 'Yes! VibeTours includes a resilient Demo Mode allowing you to explore the catalog of pre-loaded tours immediately without registration.',
    faq3Q: 'Does the audio narration play automatically while walking?',
    faq3A: 'Yes. When starting "Live Tour" mode, the app tracks your GPS position and automatically plays audio stories upon approaching each stop.',
    faq4Q: 'Can I customize my pace and budget?',
    faq4A: 'Yes. You can define your walking pace (Relaxed, Balanced, Fast), budget preferences, and companion filters to customize all recommendations.',

    bannerTag: 'Free Access',
    bannerTitle: 'Ready to start your adventure?',
    bannerDesc: 'Create your free account to sync favorite tours and generate smart AI itineraries with VibeTours.',
    bannerBtnRegister: 'Create Free Account',
    bannerBtnDemo: 'Try Demo Mode',

    footerDesc: 'Your smart travel companion powered by Artificial Intelligence, GPS geolocation, and hands-free audio guides.',
    footerCol1Title: 'Navigation',
    footerLinkHow: 'How it Works',
    footerLinkFeatures: 'Features',
    footerLinkDestinations: 'Destinations',
    footerLinkFaq: 'FAQ',
    footerCol2Title: 'Legal Portal',
    footerLinkTerms: 'Terms of Service',
    footerLinkPrivacy: 'Privacy Policy',
    footerLinkLegal: 'Security Info',
    footerLinkRegister: 'User Registration',
    footerCopyRights: 'All rights reserved.',
    footerCopyDesign: 'Clean and optimized design for modern travelers.'
  }
};

window.setLandingLanguage = function(lang) {
  currentLandingLang = lang;
  localStorage.setItem('vibetours_lang', lang);

  const btnEs = document.getElementById('landing-btn-es');
  const btnEn = document.getElementById('landing-btn-en');

  if (btnEs) btnEs.className = lang === 'es' ? 'btn btn-lang active' : 'btn btn-lang';
  if (btnEn) btnEn.className = lang === 'en' ? 'btn btn-lang active' : 'btn btn-lang';

  const t = landingTranslations[lang] || landingTranslations['es'];

  // Navigation
  updateText('#nav-how', t.navHow);
  updateText('#nav-features', t.navFeatures);
  updateText('#nav-destinations', t.navDestinations);
  updateText('#nav-faq', t.navFaq);
  updateText('#nav-btn-register', t.navRegister);

  // Hero
  updateText('#hero-badge', t.heroBadge);
  updateHTML('#hero-title', t.heroTitle);
  updateText('#hero-desc', t.heroDesc);
  updateText('#hero-cta-primary', t.heroCtaPrimary);
  updateText('#hero-cta-secondary', t.heroCtaSecondary);

  // Pillars
  updateText('#pillar1-title', t.pillar1Title);
  updateText('#pillar1-desc', t.pillar1Desc);
  updateText('#pillar2-title', t.pillar2Title);
  updateText('#pillar2-desc', t.pillar2Desc);
  updateText('#pillar3-title', t.pillar3Title);
  updateText('#pillar3-desc', t.pillar3Desc);

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

  // Features Showcase
  updateText('#feat-subtitle', t.featSubtitle);
  updateText('#feat-title', t.featTitle);
  updateText('#feat-desc', t.featDesc);

  updateText('#feat1-title', t.feat1Title);
  updateText('#feat1-desc', t.feat1Desc);
  updateText('#feat1-bullet1', t.feat1Bullet1);
  updateText('#feat1-bullet2', t.feat1Bullet2);
  updateText('#feat1-bullet3', t.feat1Bullet3);

  updateText('#feat2-title', t.feat2Title);
  updateText('#feat2-desc', t.feat2Desc);
  updateText('#audio-demo-label', t.audioDemoLabel);
  updateText('#audio-demo-snippet', t.audioDemoSnippet);
  updateText('#simPlayText', t.simPlayText);

  updateText('#feat3-title', t.feat3Title);
  updateText('#feat3-desc', t.feat3Desc);
  updateText('#feat3-bullet1', t.feat3Bullet1);
  updateText('#feat3-bullet2', t.feat3Bullet2);
  updateText('#feat3-bullet3', t.feat3Bullet3);

  updateText('#feat4-title', t.feat4Title);
  updateText('#feat4-desc', t.feat4Desc);
  updateText('#feat4-bullet1', t.feat4Bullet1);
  updateText('#feat4-bullet2', t.feat4Bullet2);
  updateText('#feat4-bullet3', t.feat4Bullet3);

  // Destinations
  updateText('#dest-subtitle', t.destSubtitle);
  updateText('#dest-title', t.destTitle);
  updateText('#dest-desc', t.destDesc);

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

  // Banner CTA
  updateText('#banner-tag', t.bannerTag);
  updateText('#banner-title', t.bannerTitle);
  updateText('#banner-desc', t.bannerDesc);
  updateText('#banner-btn-register', t.bannerBtnRegister);
  updateText('#banner-btn-demo', t.bannerBtnDemo);

  // Footer
  updateText('#footer-desc', t.footerDesc);
  updateText('#footer-col1-title', t.footerCol1Title);
  updateText('#footer-link-how', t.footerLinkHow);
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
};

function updateText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.innerText = text;
}

function updateHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
}
