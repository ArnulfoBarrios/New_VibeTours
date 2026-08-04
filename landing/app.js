/* ==========================================================================
   VIBETOURS - LANDING PAGE INTERACTIVITY, APPLE STICKY SHOWCASE & I18N
   ========================================================================== */

let currentLandingLang = localStorage.getItem('vibetours_lang') || 'es';

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initScreenshotGallery();
  initUserReviews();
  initStandaloneRegisterForm();
  initScrollAnimations();
  initAppleStickyShowcase();
  initFaqAccordion();
  initLiveTourSimulator();
  setLandingLanguage(currentLandingLang);
});

/* --------------------------------------------------------------------------
   1. THEME TOGGLE (LIGHT / DARK) & PERSISTENCE
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

    // Update sticky phone image if present
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

    updateGalleryThemeImages(theme);
  }
}

/* --------------------------------------------------------------------------
   2. DYNAMIC SCROLL ANIMATIONS (INTERSECTION OBSERVER)
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   3. APPLE STICKY SHOWCASE CONTROLLER (PINNED IPHONE WITH CROSSFADE & GLOW)
   -------------------------------------------------------------------------- */
function initAppleStickyShowcase() {
  const cards = document.querySelectorAll('.showcase-card');
  const stickyPhoneImg = document.getElementById('stickyPhoneImg');
  const stickyMockupGlow = document.getElementById('stickyMockupGlow');
  const stickyIphoneFrame = document.getElementById('stickyIphoneFrame');

  if (!cards.length || !stickyPhoneImg) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -40% 0px',
    threshold: 0.35
  };

  const showcaseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach(c => c.classList.remove('active'));
        entry.target.classList.add('active');

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newSrc = currentTheme === 'dark' ? entry.target.dataset.oscuro : entry.target.dataset.claro;
        const newGlow = entry.target.dataset.glow;

        if (newSrc && stickyPhoneImg.src !== newSrc) {
          // Smooth crossfade and 3D scale pulse
          stickyPhoneImg.style.opacity = '0.3';
          stickyPhoneImg.style.transform = 'scale(0.96) rotateY(-4deg)';

          setTimeout(() => {
            stickyPhoneImg.src = newSrc;
            if (newGlow && stickyMockupGlow) {
              stickyMockupGlow.style.background = newGlow;
            }
            stickyPhoneImg.style.opacity = '1';
            stickyPhoneImg.style.transform = 'scale(1) rotateY(0deg)';
          }, 180);
        }
      }
    });
  }, observerOptions);

  cards.forEach(card => showcaseObserver.observe(card));
}

/* --------------------------------------------------------------------------
   4. DETAILED BILINGUAL I18N TRANSLATION DICTIONARY (ES / EN)
   -------------------------------------------------------------------------- */
const landingTranslations = {
  es: {
    navQueEs: '¿Qué es?',
    navComparativa: 'Comparativa',
    navFunciones: 'Funciones',
    navDestinos: 'Destinos',
    navCreadores: 'Creadores',
    navFaq: 'FAQ',
    navPlanes: 'Planes',
    navRegister: 'Registrarse',

    metric1Label: 'Tours Emblemáticos Precargados',
    metric2Label: 'Datos GPS Reales de OpenStreetMap',
    metric3Label: 'Alucinaciones o Lugares Ficticios',
    metric4Label: 'Valoración Media por Viajeros',

    compTitle: '¿Por qué elegir VibeTours?',
    compDesc: 'Descubre cómo se compara VibeTours frente a las alternativas tradicionales del mercado.',

    simTitle: 'Simulador de Live Tour',
    simDesc: 'Experimenta cómo VibeTours combina narración por voz y seguimiento GPS en tiempo real.',
    simTag: '🔊 Audioguía por Proximidad',
    simCardTitle: 'Tour Histórico: Cartagena Antigua',
    simCardDesc: 'Haz clic en reproducir para escuchar cómo la IA narra las historias fascinantes del Centro Histórico mientras te aproximas al lugar.',
    simPlayText: 'Iniciar Simulación de Audio',

    destTitle: 'Destinos Destacados',
    destDesc: 'Recorridos precargados listos para explorar en Modo Demo o con tu cuenta de viajero.',

    crTitle: '¿Eres Guía Local o Creator?',
    crDesc: 'VibeTours te ofrece herramientas avanzadas para digitalizar tus conocimientos turísticos y llegar a miles de viajeros globales.',
    cr1Title: 'Creador Manual Drag-and-Drop',
    cr1Text: 'Diseña rutas personalizadas definiendo paradas en el mapa, agregando audios explicativos y subiendo fotos directamente a la nube.',
    cr2Title: 'Publicación en la Comunidad',
    cr2Text: 'Envía tus recorridos para revisión y moderación administrativa. Una vez aprobados, estarán disponibles para toda la comunidad global.',
    cr3Title: 'Perfil Público & Reseñas',
    cr3Text: 'Construye tu reputación como experto local, recibe valoraciones de 5 estrellas y destaca entre los itinerarios más populares.',

    faqTitle: 'Preguntas Frecuentes',
    faqDesc: 'Todo lo que necesitas saber antes de iniciar tu viaje con VibeTours.',

    prTitle: 'Elige tu Experiencia',
    prDesc: 'Sin cargos ocultos ni sorpresas. Comienza gratis hoy mismo.',

    heroBadge: '✨ Experiencia Neomórfica de Lujo',
    heroTitle: 'Explora el mundo a tu propio ritmo con <span class="gradient-text">Inteligencia Artificial</span>',
    heroDesc: 'VibeTours reinventa el turismo combinando itinerarios generativos de IA anclados a coordenadas GPS reales de OpenStreetMap, narración de voz manos libres en vivo y mapas vectoriales en un diseño inolvidable.',
    heroPlayStore: 'Descargar en Google Play',
    heroCreateAccount: 'Crear Cuenta Gratis',

    subQueEs: 'Descubre VibeTours',
    titleQueEs: '¿Qué es VibeTours?',
    descQueEs: 'Es la plataforma móvil y web de turismo inteligente que elimina las visitas guiadas rígidas y costosas. VibeTours perfila tus gustos únicos para crear itinerarios a la medida, sin alucinaciones y anclados a puntos de interés reales.',
    cardAiTitle: 'IA Anclada a Puntos Reales',
    cardAiText: 'A diferencia de los chats genéricos, la IA de VibeTours ancla sus itinerarios a coordenadas verificadas de OpenStreetMap y Wikipedia, garantizando lugares y horarios de atención 100% reales.',
    cardGpsTitle: 'Navegación GPS Manos Libres',
    cardGpsText: 'La app detecta tu posición por GPS mientras caminas, guiándote paso a paso por el mapa vectorial y reproduciendo descripciones explicativas automáticamente al llegar a cada parada.',
    cardProfileTitle: 'Perfil de Viajero a la Medida',
    cardProfileText: 'Personaliza tu ritmo (Relajado, Equilibrado, Acelerado), grupo de viaje (Solo, Pareja, Familia, Amigos), presupuesto en USD e intereses como Gastronomía, Historia, Naturaleza o Arte.',

    subComoUsar: 'Pasos Sencillos',
    titleComoUsar: '¿Cómo usar VibeTours?',
    descComoUsar: 'Comenzar tu viaje personalizado es rápido e intuitivo a través de un trayecto interactivo continuo.',
    step1Title: 'Configura tu Perfil de Viaje',
    step1Text: 'Ingresa a la app (o pruébala en Modo Demo sin registro). Selecciona tu ritmo de caminata, presupuesto preferido y las categorías temáticas que deseas explorar.',
    step2Title: 'Genera o Elige tu Recorrido',
    step2Text: 'Chatea con el asistente Vibe Planner AI expresando lo que deseas en lenguaje natural, o bien explora nuestro catálogo de más de 50 tours precargados de ciudades del mundo.',
    step3Title: 'Inicia el Live Tour con Voz',
    step3Text: 'Activa el modo Live Tour en tiempo real. La app te guiará con mapas vectoriales MapLibre GL y narrará historias locales en audio automáticamente al aproximarte a cada lugar.',

    subFunciones: 'Experiencia Inmersiva',
    titleFunciones: 'Funcionalidades de VibeTours en Acción',
    descFunciones: 'Desplázate para ver cómo la Inteligencia Artificial y la geolocalización transforman cada aspecto de tu viaje en tiempo real.',

    feat1Title: 'Vibe Planner AI & Asistente Conversacional',
    feat1Desc: 'Chatea en lenguaje natural expresando tus deseos de viaje. La IA comprende tu intención, consulta puntos de interés reales en OpenStreetMap, sugiere hoteles reales como punto de encuentro y genera el itinerario de forma asíncrona.',
    feat1Item1: '✨ Creación por dictado de voz o texto libre.',
    feat1Item2: '🏨 Sugerencia interactiva de hoteles reales de partida.',
    feat1Item3: '💵 Desglose de presupuesto estimado por parada en USD.',

    feat2Title: 'Live Tour con Navegación GPS & Audioguías TTS',
    feat2Desc: 'Sigue la ruta en mapas vectoriales MapLibre GL mientras caminas. La app detecta tu posición GPS y reproduce narraciones de voz automáticas al aproximarte a cada monumento o parada.',
    feat2Item1: '🎧 Reproducción automática de audio por proximidad GPS.',
    feat2Item2: '🗺️ Mapas vectoriales MapLibre GL con modo noche/día.',
    feat2Item3: '🎙️ Interacción por voz hands-free durante la caminata.',

    feat3Title: 'Descubrimiento de Lugares Cercanos & Clima',
    feat3Desc: 'Encuentra puntos de interés no planificados a tu alrededor en un radio dinámico (Overpass API) y consulta el pronóstico del clima en tiempo real (Open-Meteo) antes de salir a explorar.',
    feat3Item1: '📍 Consulta de restaurantes, parques y museos en 4.5km a 9km.',
    feat3Item2: '☀️ Tarjeta de clima en vivo con sensación térmica y humedad.',
    feat3Item3: '🎪 Sugerencias de eventos culturales y ferias locales.',

    feat4Title: 'Creador Manual de Tours para Guías Locales',
    feat4Desc: 'Crea tu propio tour desde cero: selecciona puntos en el mapa interactivo, ordena paradas mediante drag-and-drop, sube fotografías a Supabase Storage y comparte tu ruta con la comunidad.',
    feat4Item1: '✍️ Edición intuitiva drag-and-drop de paradas del itinerario.',
    feat4Item2: '🖼️ Almacenamiento seguro de fotos en Supabase Storage.',
    feat4Item3: '📤 Envío para revisión pública o guardado privado.',

    feat5Title: 'Perfil de Viajero & Comunidad de Tours',
    feat5Desc: 'Ajusta tu experiencia según tus preferencias únicas de ritmo, presupuesto y compañía. Consulta los perfiles de otros viajeros, califica recorridos y guarda tus favoritos.',
    feat5Item1: '👤 Ritmos de caminata: Relajado, Equilibrado o Acelerado.',
    feat5Item2: '👨‍👩‍👧‍👦 Filtros para viajes Solo, Pareja, Familia o Amigos.',
    feat5Item3: '⭐ Calificación de tours y perfiles públicos de guías.',

    feat6Title: 'Panel Administrativo & Gestión PQRS',
    feat6Desc: 'Panel de control avanzado para administradores y moderadores. Aprueba solicitudes de tours creados por usuarios, gestiona eventos locales en el mapa y atiende peticiones de PQRS.',
    feat6Item1: '🛡️ Moderación y aprobación de tours públicos.',
    feat6Item2: '📋 Gestión de PQRS y atención al usuario.',
    feat6Item3: '🌐 Control de eventos y configuraciones globales.',

    subVentajas: '¿Por qué elegirnos?',
    titleVentajas: 'Ventajas de VibeTours',
    descVentajas: 'Beneficios tecnológicos clave que destacan a VibeTours frente a las guías tradicionales y los chats genéricos.',
    adv1Title: 'Sin Alucinaciones de IA',
    adv1Text: 'La IA no inventa restaurantes ni monumentos ficticios. Cada parada está validada contra coordenadas satelitales y datos abiertos de OpenStreetMap.',
    adv2Title: 'Diseño de Lujo Estilo Apple',
    adv2Text: 'Interfaz Neomórfica y Glassmorphic con desenfoque cristalino (blur), esquinas redondeadas de 24px y adaptación perfecta a Modo Claro y Modo Oscuro.',
    adv3Title: 'Resiliencia y Modo Demo',
    adv3Text: 'Prueba la aplicación inmediatamente sin necesidad de registrarte, accediendo al catálogo completo de 50 tours precargados con persistencia local.',
    adv4Title: 'Privacidad & Seguridad Supabase',
    adv4Text: 'Autenticación segura mediante Google OAuth o correo con Supabase Auth, encriptación SSL y protección estricta de tus datos de viaje.',

    subCapturas: 'Explora la Interfaz',
    titleCapturas: 'Capturas de Pantalla de VibeTours',
    descCapturas: 'Familiarízate con las 59 pantallas reales de la aplicación. Cambia el tema a Modo Oscuro en la barra superior para ver cómo se transforma la app.',
    tabAll: 'Todas',
    tabAuth: 'Onboarding',
    tabAi: 'IA Assistant',
    tabExplore: 'Exploración',
    tabTour: 'Tour Activo',
    tabCreator: 'Creador',
    tabProfile: 'Perfil',
    tabAdmin: 'Admin',

    bannerTag: 'Comunidad de Viajeros',
    bannerTitle: '¿Listo para comenzar tu aventura?',
    bannerDesc: 'Crea tu cuenta gratuita de viajero para sincronizar tus tours favoritos y solicitar itinerarios ilimitados a la Inteligencia Artificial de VibeTours.',
    bannerBtnRegister: 'Ir a la Página de Registro',
    bannerBtnPlaystore: 'Descargar en PlayStore',

    subComentarios: 'Opiniones de la Comunidad',
    titleComentarios: 'Comentarios sobre VibeTours',
    descComentarios: 'Lee las experiencias reales de usuarios o comparte tu propia opinión a continuación.',
    formReviewTitle: '¡Deja tu Comentario!',
    lblReviewName: 'Tu Nombre',
    lblReviewStars: 'Calificación (Estrellas)',
    lblReviewText: 'Tu Opinión o Reseña',
    btnSubmitReview: 'Publicar Comentario',

    footerDesc: 'La plataforma neomórfica líder en tours interactivos con Inteligencia Artificial y geolocalización.',
    footerCol1Title: 'Navegación',
    footerLinkQueEs: '¿Qué es VibeTours?',
    footerLinkComoUsar: '¿Cómo usar?',
    footerLinkFunciones: 'Funcionalidades',
    footerLinkCapturas: 'Pantallas de la App',
    footerCol2Title: 'Portal Legal',
    footerLinkTerms: 'Términos de Servicio',
    footerLinkPrivacy: 'Política de Privacidad',
    footerLinkLegal: 'Información de Seguridad',
    footerLinkRegister: 'Registro de Usuarios',
    footerCol3Title: 'Descarga Oficial',
    footerCopyRights: 'Todos los derechos reservados.',
    footerCopyDesign: 'Diseño Neomórfico & Glassmorphism estilo Apple.'
  },
  en: {
    navQueEs: 'What is it?',
    navComparativa: 'Comparison',
    navFunciones: 'Features',
    navDestinos: 'Destinations',
    navCreadores: 'Creators',
    navFaq: 'FAQ',
    navPlanes: 'Plans',
    navRegister: 'Register',

    metric1Label: 'Pre-loaded Flagship Tours',
    metric2Label: 'Real OpenStreetMap GPS Data',
    metric3Label: 'AI Hallucinations or Fake Places',
    metric4Label: 'Average Traveler Rating',

    compTitle: 'Why Choose VibeTours?',
    compDesc: 'Discover how VibeTours compares against traditional market alternatives.',

    simTitle: 'Live Tour Simulator',
    simDesc: 'Experience how VibeTours combines real-time voice narration and GPS tracking.',
    simTag: '🔊 Proximity Audio Guide',
    simCardTitle: 'Historic Tour: Old Cartagena',
    simCardDesc: 'Click play to hear how AI narrates fascinating stories of the Historic Center as you approach.',
    simPlayText: 'Start Audio Simulation',

    destTitle: 'Featured Destinations',
    destDesc: 'Pre-loaded tours ready to explore in Demo Mode or with your traveler account.',

    crTitle: 'Are You a Local Guide or Creator?',
    crDesc: 'VibeTours gives you advanced tools to digitize your travel expertise and reach thousands of global travelers.',
    cr1Title: 'Drag-and-Drop Tour Creator',
    cr1Text: 'Design custom routes by dropping map stops, attaching audio stories, and uploading photos to the cloud.',
    cr2Title: 'Community Publishing',
    cr2Text: 'Submit your tours for administrative review. Once approved, they will be available to the global community.',
    cr3Title: 'Public Profile & Reviews',
    cr3Text: 'Build your reputation as a local expert, earn 5-star ratings, and rank among top tours.',

    faqTitle: 'Frequently Asked Questions',
    faqDesc: 'Everything you need to know before embarking on your journey with VibeTours.',

    prTitle: 'Choose Your Experience',
    prDesc: 'No hidden fees or surprises. Start for free today.',

    heroBadge: '✨ Luxury Neomorphic Experience',
    heroTitle: 'Explore the world at your own pace with <span class="gradient-text">Artificial Intelligence</span>',
    heroDesc: 'VibeTours reinvents tourism by combining smart generative AI itineraries anchored to real OpenStreetMap GPS coordinates, hands-free voice narration, and vector maps in an unforgettable design.',
    heroPlayStore: 'Download on Google Play',
    heroCreateAccount: 'Create Free Account',

    subQueEs: 'Discover VibeTours',
    titleQueEs: 'What is VibeTours?',
    descQueEs: 'It is the smart mobile and web tourism platform that eliminates rigid and expensive guided tours. VibeTours profiles your unique preferences to build tailored itineraries, anchored to verified real points of interest.',
    cardAiTitle: 'AI Anchored to Real Coordinates',
    cardAiText: 'Unlike generic AI chats, VibeTours AI anchors its itineraries to verified OpenStreetMap and Wikipedia coordinates, guaranteeing 100% real locations and opening hours.',
    cardGpsTitle: 'Hands-Free GPS Navigation',
    cardGpsText: 'The app tracks your GPS position while walking, guiding you step-by-step across vector maps and playing explanatory audio guides automatically upon arriving at each stop.',
    cardProfileTitle: 'Custom Travel Profiling',
    cardProfileText: 'Customize your walking pace (Relaxed, Balanced, Fast-paced), travel group (Solo, Couple, Family, Friends), budget in USD, and interests like Food, History, Nature, or Art.',

    subComoUsar: 'Simple Steps',
    titleComoUsar: 'How to use VibeTours?',
    descComoUsar: 'Starting your custom journey is quick and intuitive through a continuous interactive workflow.',
    step1Title: 'Set Up Your Travel Profile',
    step1Text: 'Open the app (or try Demo Mode without registration). Select your walking pace, preferred budget, and thematic categories you wish to explore.',
    step2Title: 'Generate or Pick a Tour',
    step2Text: 'Chat with Vibe Planner AI expressing your wishes in natural language, or explore our pre-loaded catalog of over 50 city tours worldwide.',
    step3Title: 'Start Voice-Guided Live Tour',
    step3Text: 'Activate real-time Live Tour mode. The app will guide you with MapLibre GL vector maps and automatically narrate local stories in audio near each stop.',

    subFunciones: 'Immersive Experience',
    titleFunciones: 'VibeTours Features in Action',
    descFunciones: 'Scroll down to see how Artificial Intelligence and GPS geolocation transform every aspect of your journey in real time.',

    feat1Title: 'Vibe Planner AI & Conversational Assistant',
    feat1Desc: 'Chat fluidly in natural language expressing your travel desires. The AI understands your intent, checks real Points of Interest on OpenStreetMap, suggests real starting hotels, and generates the itinerary asynchronously.',
    feat1Item1: '✨ Creation by voice dictation or free-text.',
    feat1Item2: '🏨 Interactive suggestions of real starting hotels.',
    feat1Item3: '💵 Estimated budget breakdown per stop in USD.',

    feat2Title: 'Live Tour with GPS Navigation & TTS Audio Guides',
    feat2Desc: 'Follow the route on MapLibre GL vector maps while walking. The app detects your GPS position and automatically plays voice narration when approaching each monument.',
    feat2Item1: '🎧 Automatic audio playback by GPS proximity.',
    feat2Item2: '🗺️ MapLibre GL vector maps with night/day mode.',
    feat2Item3: '🎙️ Hands-free voice interaction while walking.',

    feat3Title: 'Nearby Places Discovery & Live Weather',
    feat3Desc: 'Find unplanned points of interest around you within a dynamic radius (Overpass API) and check real-time weather forecasts (Open-Meteo) before stepping out to explore.',
    feat3Item1: '📍 Browse restaurants, parks, and museums within 4.5km to 9km.',
    feat3Item2: '☀️ Live weather card with thermal sensation and humidity.',
    feat3Item3: '🎪 Cultural event and local fair suggestions.',

    feat4Title: 'Manual Tour Creator for Local Guides',
    feat4Desc: 'Build your own tour from scratch: select points on interactive maps, reorder stops using drag-and-drop, upload photos to Supabase Storage, and share your route with the community.',
    feat4Item1: '✍️ Intuitive drag-and-drop itinerary stop editing.',
    feat4Item2: '🖼️ Secure photo storage in Supabase Storage.',
    feat4Item3: '📤 Submit for public review or save as private.',

    feat5Title: 'Traveler Profile & Tour Community',
    feat5Desc: 'Customize your experience based on your unique pace, budget, and travel companion preferences. View other travelers\' profiles, rate tours, and save your favorites.',
    feat5Item1: '👤 Walking paces: Relaxed, Balanced, or Fast-paced.',
    feat5Item2: '👨‍👩‍👧‍👦 Filters for Solo, Couple, Family, or Friends trips.',
    feat5Item3: '⭐ Tour ratings and public guide profiles.',

    feat6Title: 'Admin Panel & PQRS Management',
    feat6Desc: 'Advanced control dashboard for administrators and moderators. Approve user-created public tour requests, manage local events on the map, and handle PQRS user tickets.',
    feat6Item1: '🛡️ Moderation and approval of public tours.',
    feat6Item2: '📋 PQRS ticket management and user support.',
    feat6Item3: '🌐 Global event control and system settings.',

    subVentajas: 'Why Choose Us?',
    titleVentajas: 'Advantages of VibeTours',
    descVentajas: 'Key technological benefits that set VibeTours apart from traditional guides and generic AI chats.',
    adv1Title: 'Zero AI Hallucinations',
    adv1Text: 'The AI does not invent fake restaurants or monuments. Every stop is validated against satellite coordinates and OpenStreetMap open data.',
    adv2Title: 'Luxury Apple-Style Design',
    adv2Text: 'Neomorphic and Glassmorphic interface with crystal blur, 24px rounded corners, and seamless adaptation to Light and Dark Mode.',
    adv3Title: 'Resilience & Demo Mode',
    adv3Text: 'Try the app immediately without registering, accessing the full catalog of 50 pre-loaded tours with local offline persistence.',
    adv4Title: 'Privacy & Supabase Security',
    adv4Text: 'Secure authentication via Google OAuth or email with Supabase Auth, SSL encryption, and strict protection of your travel data.',

    subCapturas: 'Explore the Interface',
    titleCapturas: 'VibeTours Screenshots',
    descCapturas: 'Get familiar with all 59 real app screens. Toggle to Dark Mode in the top header to see how the app transforms.',
    tabAll: 'All',
    tabAuth: 'Onboarding',
    tabAi: 'AI Assistant',
    tabExplore: 'Exploration',
    tabTour: 'Active Tour',
    tabCreator: 'Creator',
    tabProfile: 'Profile',
    tabAdmin: 'Admin',

    bannerTag: 'Traveler Community',
    bannerTitle: 'Ready to start your adventure?',
    bannerDesc: 'Create your free traveler account to sync your favorite tours and request unlimited itineraries from VibeTours AI.',
    bannerBtnRegister: 'Go to Registration Page',
    bannerBtnPlaystore: 'Download on PlayStore',

    subComentarios: 'Community Reviews',
    titleComentarios: 'VibeTours Reviews',
    descComentarios: 'Read real user experiences or share your own thoughts below.',
    formReviewTitle: 'Leave Your Review!',
    lblReviewName: 'Your Name',
    lblReviewStars: 'Rating (Stars)',
    lblReviewText: 'Your Review or Feedback',
    btnSubmitReview: 'Publish Review',

    footerDesc: 'The leading neomorphic platform for interactive tours powered by Artificial Intelligence and GPS.',
    footerCol1Title: 'Navigation',
    footerLinkQueEs: 'What is VibeTours?',
    footerLinkComoUsar: 'How to use?',
    footerLinkFunciones: 'Features',
    footerLinkCapturas: 'App Screens',
    footerCol2Title: 'Legal Portal',
    footerLinkTerms: 'Terms of Service',
    footerLinkPrivacy: 'Privacy Policy',
    footerLinkLegal: 'Security Info',
    footerLinkRegister: 'User Registration',
    footerCol3Title: 'Official Download',
    footerCopyRights: 'All rights reserved.',
    footerCopyDesign: 'Apple-style Neomorphic & Glassmorphism Design.'
  }
};

window.setLandingLanguage = function(lang) {
  currentLandingLang = lang;
  localStorage.setItem('vibetours_lang', lang);

  const btnEs = document.getElementById('landing-btn-es');
  const btnEn = document.getElementById('landing-btn-en');

  if (btnEs) btnEs.className = lang === 'es' ? 'btn btn-primary' : 'btn btn-secondary';
  if (btnEn) btnEn.className = lang === 'en' ? 'btn btn-primary' : 'btn btn-secondary';

  const t = landingTranslations[lang] || landingTranslations['es'];

  // Header & Nav Links
  updateText('.nav-menu li:nth-child(1) a', t.navQueEs);
  updateText('.nav-menu li:nth-child(2) a', t.navComparativa);
  updateText('.nav-menu li:nth-child(3) a', t.navFunciones);
  updateText('.nav-menu li:nth-child(4) a', t.navDestinos);
  updateText('.nav-menu li:nth-child(5) a', t.navCreadores);
  updateText('.nav-menu li:nth-child(6) a', t.navFaq);
  updateText('.nav-menu li:nth-child(7) a', t.navPlanes);
  updateText('#nav-btn-register', t.navRegister);

  // Metrics Bar
  updateText('#metric1-label', t.metric1Label);
  updateText('#metric2-label', t.metric2Label);
  updateText('#metric3-label', t.metric3Label);
  updateText('#metric4-label', t.metric4Label);

  // Comparison Section
  updateText('#comp-title', t.compTitle);
  updateText('#comp-desc', t.compDesc);

  // Simulator Section
  updateText('#sim-title', t.simTitle);
  updateText('#sim-desc', t.simDesc);
  updateText('#sim-tag', t.simTag);
  updateText('#sim-card-title', t.simCardTitle);
  updateText('#sim-card-desc', t.simCardDesc);
  updateText('#simPlayText', t.simPlayText);

  // Destinations
  updateText('#dest-title', t.destTitle);
  updateText('#dest-desc', t.destDesc);

  // Creators Section
  updateText('#cr-title', t.crTitle);
  updateText('#cr-desc', t.crDesc);
  updateText('#cr1-title', t.cr1Title);
  updateText('#cr1-text', t.cr1Text);
  updateText('#cr2-title', t.cr2Title);
  updateText('#cr2-text', t.cr2Text);
  updateText('#cr3-title', t.cr3Title);
  updateText('#cr3-text', t.cr3Text);

  // FAQ
  updateText('#faq-title', t.faqTitle);
  updateText('#faq-desc', t.faqDesc);

  // Pricing
  updateText('#pr-title', t.prTitle);
  updateText('#pr-desc', t.prDesc);

  // Hero Section
  updateText('.hero-badge', t.heroBadge);
  updateHTML('.hero-title', t.heroTitle);
  updateText('.hero-description', t.heroDesc);
  updateText('#hero-playstore-btn', t.heroPlayStore);
  updateText('#hero-register-btn', t.heroCreateAccount);

  // Section 2: ¿Qué es?
  updateText('#que-es .section-subtitle', t.subQueEs);
  updateText('#que-es .section-title', t.titleQueEs);
  updateText('#que-es .section-description', t.descQueEs);
  updateText('#card-ai-title', t.cardAiTitle);
  updateText('#card-ai-text', t.cardAiText);
  updateText('#card-gps-title', t.cardGpsTitle);
  updateText('#card-gps-text', t.cardGpsText);
  updateText('#card-profile-title', t.cardProfileTitle);
  updateText('#card-profile-text', t.cardProfileText);

  // Section 3: ¿Cómo usar?
  updateText('#como-usar .section-subtitle', t.subComoUsar);
  updateText('#como-usar .section-title', t.titleComoUsar);
  updateText('#como-usar .section-description', t.descComoUsar);
  updateText('#step1-title', t.step1Title);
  updateText('#step1-text', t.step1Text);
  updateText('#step2-title', t.step2Title);
  updateText('#step2-text', t.step2Text);
  updateText('#step3-title', t.step3Title);
  updateText('#step3-text', t.step3Text);

  // Section 4: Showcase Funcionalidades
  updateText('#funcionalidades .section-subtitle', t.subFunciones);
  updateText('#funcionalidades .section-title', t.titleFunciones);
  updateText('#funcionalidades .section-description', t.descFunciones);

  updateText('#feat1-title', t.feat1Title);
  updateText('#feat1-desc', t.feat1Desc);
  updateText('#feat1-item1', t.feat1Item1);
  updateText('#feat1-item2', t.feat1Item2);
  updateText('#feat1-item3', t.feat1Item3);

  updateText('#feat2-title', t.feat2Title);
  updateText('#feat2-desc', t.feat2Desc);
  updateText('#feat2-item1', t.feat2Item1);
  updateText('#feat2-item2', t.feat2Item2);
  updateText('#feat2-item3', t.feat2Item3);

  updateText('#feat3-title', t.feat3Title);
  updateText('#feat3-desc', t.feat3Desc);
  updateText('#feat3-item1', t.feat3Item1);
  updateText('#feat3-item2', t.feat3Item2);
  updateText('#feat3-item3', t.feat3Item3);

  updateText('#feat4-title', t.feat4Title);
  updateText('#feat4-desc', t.feat4Desc);
  updateText('#feat4-item1', t.feat4Item1);
  updateText('#feat4-item2', t.feat4Item2);
  updateText('#feat4-item3', t.feat4Item3);

  updateText('#feat5-title', t.feat5Title);
  updateText('#feat5-desc', t.feat5Desc);
  updateText('#feat5-item1', t.feat5Item1);
  updateText('#feat5-item2', t.feat5Item2);
  updateText('#feat5-item3', t.feat5Item3);

  updateText('#feat6-title', t.feat6Title);
  updateText('#feat6-desc', t.feat6Desc);
  updateText('#feat6-item1', t.feat6Item1);
  updateText('#feat6-item2', t.feat6Item2);
  updateText('#feat6-item3', t.feat6Item3);

  // Section 5: Ventajas
  updateText('#ventajas .section-subtitle', t.subVentajas);
  updateText('#ventajas .section-title', t.titleVentajas);
  updateText('#ventajas .section-description', t.descVentajas);
  updateText('#adv1-title', t.adv1Title);
  updateText('#adv1-text', t.adv1Text);
  updateText('#adv2-title', t.adv2Title);
  updateText('#adv2-text', t.adv2Text);
  updateText('#adv3-title', t.adv3Title);
  updateText('#adv3-text', t.adv3Text);
  updateText('#adv4-title', t.adv4Title);
  updateText('#adv4-text', t.adv4Text);

  // Section 6: Capturas
  updateText('#capturas .section-subtitle', t.subCapturas);
  updateText('#capturas .section-title', t.titleCapturas);
  updateText('#capturas .section-description', t.descCapturas);
  updateText('#tab-all', t.tabAll);
  updateText('#tab-auth', t.tabAuth);
  updateText('#tab-ai', t.tabAi);
  updateText('#tab-explore', t.tabExplore);
  updateText('#tab-tour', t.tabTour);
  updateText('#tab-creator', t.tabCreator);
  updateText('#tab-profile', t.tabProfile);
  updateText('#tab-admin', t.tabAdmin);

  // Section 7: Banner
  updateText('#banner-tag', t.bannerTag);
  updateText('#banner-title', t.bannerTitle);
  updateText('#banner-desc', t.bannerDesc);
  updateText('#banner-btn-register', t.bannerBtnRegister);
  updateText('#banner-btn-playstore', t.bannerBtnPlaystore);

  // Section 8: Comentarios
  updateText('#sub-comentarios', t.subComentarios);
  updateText('#title-comentarios', t.titleComentarios);
  updateText('#desc-comentarios', t.descComentarios);
  updateText('#form-review-title', t.formReviewTitle);
  updateText('#lbl-review-name', t.lblReviewName);
  updateText('#lbl-review-stars', t.lblReviewStars);
  updateText('#lbl-review-text', t.lblReviewText);
  updateText('#btn-submit-review', t.btnSubmitReview);

  // Footer
  updateText('#footer-desc', t.footerDesc);
  updateText('#footer-col1-title', t.footerCol1Title);
  updateText('#footer-link-quees', t.footerLinkQueEs);
  updateText('#footer-link-comousar', t.footerLinkComoUsar);
  updateText('#footer-link-funciones', t.footerLinkFunciones);
  updateText('#footer-link-capturas', t.footerLinkCapturas);

  updateText('#footer-col2-title', t.footerCol2Title);
  updateText('#footer-link-terms', t.footerLinkTerms);
  updateText('#footer-link-privacy', t.footerLinkPrivacy);
  updateText('#footer-link-legal', t.footerLinkLegal);
  updateText('#footer-link-register', t.footerLinkRegister);

  updateText('#footer-col3-title', t.footerCol3Title);
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

/* --------------------------------------------------------------------------
   5. SCREENSHOT GALLERY & EXACT DARK/LIGHT MODE FILENAME MAPPING
   -------------------------------------------------------------------------- */
const screenshotsData = [
  // Onboarding & Autenticación
  { title: "Inicio de Sesión", fileClaro: "Login.jpeg", fileOscuro: "Login.jpeg", category: "auth" },
  { title: "Registro de Usuario", fileClaro: "Registrar.jpeg", fileOscuro: "Registrar.jpeg", category: "auth" },
  { title: "Permisos de Ubicación", fileClaro: "Conceder permiso de ubicacion.jpeg", fileOscuro: "Conceder permiso de ubicacion.jpeg", category: "auth" },
  { title: "Guía de Inicio 1", fileClaro: "Guia de app 1.jpeg", fileOscuro: "Guia de app 1.jpeg", category: "auth" },
  { title: "Guía de Inicio 2", fileClaro: "Guia de app 2.jpeg", fileOscuro: "Guia de app 2.jpeg", category: "auth" },
  { title: "Cuestionario de Viaje 1", fileClaro: "Cuestionario 1 .jpeg", fileOscuro: "Cuestionario 1.jpeg", category: "auth" },
  { title: "Cuestionario de Viaje 2", fileClaro: "Cuestionario 2 .jpeg", fileOscuro: "Cuestionario 2.jpeg", category: "auth" },

  // Asistente e Inteligencia Artificial
  { title: "Chat de IA Principal", fileClaro: "Chat de IA.jpeg", fileOscuro: "Chat de IA.jpeg", category: "ai" },
  { title: "IA Recomendación de Ciudades", fileClaro: "Chat de IA recomendando ciudades.jpeg", fileOscuro: "Chad de IA recomendando ciudades.jpeg", category: "ai" },
  { title: "IA Pregunta Duración", fileClaro: "Chat de IA preguntando por la duracion del tour.jpeg", fileOscuro: "Chat de IA preguntando por la duracion del tour.jpeg", category: "ai" },
  { title: "Diseñando Tour con IA", fileClaro: "Diseñando el tour.jpeg", fileOscuro: "Diseñando tour.jpeg", category: "ai" },
  { title: "Opción de Cambiar Lugares", fileClaro: "Chat de IA preguntando si quieres cambiar lugares.jpeg", fileOscuro: "Chat dando la opcion de cambiar lugares.jpeg", category: "ai" },

  // Exploración & Mapa
  { title: "Explorar Tours 1", fileClaro: "Explorar 1.jpeg", fileOscuro: "Explorar 1.jpeg", category: "explore" },
  { title: "Explorar Tours 2", fileClaro: "Explorar 2.jpeg", fileOscuro: "Explorar 2.jpeg", category: "explore" },
  { title: "Lugares Cercanos GPS", fileClaro: "Lugar cercano.jpeg", fileOscuro: "Lugar cercano.jpeg", category: "explore" },
  { title: "Preferencias de Mapa", fileClaro: "Preferencia de mapa.jpeg", fileOscuro: "Preferencia de mapa.jpeg", category: "explore" },
  { title: "Eventos Destacados", fileClaro: "Eventos.jpeg", fileOscuro: "Eventos.jpeg", category: "explore" },

  // Experiencia de Tour & Audioguía
  { title: "Detalles del Tour 1", fileClaro: "Detalles de tour 1.jpeg", fileOscuro: "Detalles de tour 1.jpeg", category: "tour" },
  { title: "Detalles del Tour 2", fileClaro: "Detalles de tour 2.jpeg", fileOscuro: "Detalles de tour 2.jpeg", category: "tour" },
  { title: "Tour Iniciado (Navegación)", fileClaro: "Tour iniciado.jpeg", fileOscuro: "Tour iniciado.jpeg", category: "tour" },
  { title: "Añadir Paradas", fileClaro: "Añadir paradas.jpeg", fileOscuro: "Añadir paradas.jpeg", category: "tour" },
  { title: "Calificar Tour", fileClaro: "Calificar Tour.jpeg", fileOscuro: "Calificar tour.jpeg", category: "tour" },

  // Creador de Tours
  { title: "Creador Manual Paso 1", fileClaro: "Creador Manual de tours 1.jpeg", fileOscuro: "Creador Manual de tour 1.jpeg", category: "creator" },
  { title: "Creador Manual Paso 2", fileClaro: "Creador Manual de tours 2.jpeg", fileOscuro: "Creador Manual de tour 2.jpeg", category: "creator" },
  { title: "Publicar o Guardar Tour", fileClaro: "Opcion de publicar el tour o guardarlo personal.jpeg", fileOscuro: "Opcion de publicar el tour o guardarlo personal.jpeg", category: "creator" },

  // Perfil & Comunidad
  { title: "Perfil de Usuario", fileClaro: "Perfil 1.jpeg", fileOscuro: "Perfil 1.jpeg", category: "profile" },
  { title: "Perfil de Otro Viajero", fileClaro: "Perfil de viajero (Perfil de otro usuario).jpeg", fileOscuro: "Perfil de viajero (Perfil de otro usuario).jpeg", category: "profile" },
  { title: "Tours Creados por Usuario", fileClaro: "Tours creados.jpeg", fileOscuro: "Tours Creados.jpeg", category: "profile" },

  // Panel Admin & Ajustes
  { title: "Panel Administrativo", fileClaro: "Panel Admin.jpeg", fileOscuro: "Panel Admin.jpeg", category: "admin" },
  { title: "Ajustes del Sistema", fileClaro: "Mas ajustes.jpeg", fileOscuro: "Mas ajustes.jpeg", category: "admin" },
  { title: "Gestión de PQRS", fileClaro: "PQRS Admin.jpeg", fileOscuro: "PQRS Admin.jpeg", category: "admin" }
];

function initScreenshotGallery() {
  renderGallery('all');

  const toggleBtn = document.getElementById('toggleGalleryBtn');
  const collapsibleContent = document.getElementById('galleryCollapsibleContent');

  if (toggleBtn && collapsibleContent) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = collapsibleContent.style.display === 'none';
      if (isHidden) {
        collapsibleContent.style.display = 'block';
        updateToggleBtnText(true);
      } else {
        collapsibleContent.style.display = 'none';
        updateToggleBtnText(false);
      }
    });
  }

  const tabs = document.querySelectorAll('.gallery-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderGallery(tab.dataset.category);
    });
  });
}

function updateToggleBtnText(isOpen) {
  const toggleText = document.getElementById('toggleGalleryText');
  if (!toggleText) return;
  if (isOpen) {
    toggleText.textContent = currentLandingLang === 'en' ? '✕ Hide Screenshots' : '✕ Ocultar Capturas de Pantalla';
  } else {
    toggleText.textContent = currentLandingLang === 'en' ? '📱 View Screenshots (59)' : '📱 Ver Capturas de Pantalla (59)';
  }
}

function renderGallery(category) {
  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const filtered = category === 'all' 
    ? screenshotsData 
    : screenshotsData.filter(item => item.category === category);

  galleryGrid.innerHTML = filtered.map(item => {
    const fileName = currentTheme === 'dark' ? item.fileOscuro : item.fileClaro;
    const folder = currentTheme === 'dark' ? 'Modo oscuro' : 'Modo claro';
    const imagePath = `assets/screenshots/${folder}/${fileName}`;

    return `
      <div class="gallery-card" onclick="openLightbox('${imagePath}', '${item.title}')">
        <div class="iphone-frame">
          <div class="iphone-notch"></div>
          <img src="${imagePath}" alt="${item.title}" class="iphone-screen" loading="lazy">
        </div>
        <div class="gallery-card-title">${item.title}</div>
      </div>
    `;
  }).join('');
}

function updateGalleryThemeImages(theme) {
  const activeTab = document.querySelector('.gallery-tab.active');
  const currentCategory = activeTab ? activeTab.dataset.category : 'all';
  renderGallery(currentCategory);
}

// Lightbox Modal
window.openLightbox = function(imagePath, title) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  const titleEl = document.getElementById('lightboxTitle');

  if (modal && img && titleEl) {
    img.src = imagePath;
    titleEl.innerText = title;
    modal.classList.add('active');
  }
};

window.closeLightbox = function() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.remove('active');
};

/* --------------------------------------------------------------------------
   6. SECCIÓN DE COMENTARIOS DE USUARIOS
   -------------------------------------------------------------------------- */
function initUserReviews() {
  const reviewsGrid = document.getElementById('reviewsGrid');
  if (!reviewsGrid) return;

  const userReviews = JSON.parse(localStorage.getItem('vibetours_reviews')) || [];

  renderReviews(userReviews);

  const reviewForm = document.getElementById('newReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reviewNameInput').value;
      const stars = parseInt(document.getElementById('reviewStarsInput').value);
      const text = document.getElementById('reviewTextInput').value;

      const newReview = {
        name,
        stars,
        text,
        avatar: name.charAt(0).toUpperCase()
      };

      userReviews.unshift(newReview);
      localStorage.setItem('vibetours_reviews', JSON.stringify(userReviews));
      renderReviews(userReviews);
      reviewForm.reset();
      const msg = currentLandingLang === 'en' 
        ? 'Thank you for your VibeTours review! It has been published.'
        : '¡Gracias por tu reseña sobre VibeTours! Ha sido publicada.';
      alert(msg);
    });
  }
}

function renderReviews(reviews) {
  const reviewsGrid = document.getElementById('reviewsGrid');
  if (!reviewsGrid) return;

  if (reviews.length === 0) {
    const emptyTitle = currentLandingLang === 'en' ? 'No reviews published yet.' : 'Aún no hay comentarios publicados.';
    const emptySub = currentLandingLang === 'en' 
      ? 'Be the first to share your VibeTours experience using the form below!' 
      : '¡Sé el primero en compartir tu experiencia con VibeTours utilizando el formulario a continuación!';

    reviewsGrid.innerHTML = `
      <div class="glass-panel" style="grid-column: span 3; padding: 40px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${emptyTitle}</p>
        <p style="font-size: 14px;">${emptySub}</p>
      </div>
    `;
    return;
  }

  reviewsGrid.innerHTML = reviews.map(r => `
    <div class="glass-panel review-card">
      <div class="review-header">
        <div class="review-avatar">${r.avatar}</div>
        <div class="review-author-info">
          <span class="review-author-name">${r.name}</span>
          <div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
        </div>
      </div>
      <p class="review-text">"${r.text}"</p>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   7. STANDALONE REGISTER FORM HANDLER
   -------------------------------------------------------------------------- */
function initStandaloneRegisterForm() {
  const form = document.getElementById('standaloneRegisterForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regFullName').value;
      const msg = currentLandingLang === 'en'
        ? `Welcome to VibeTours, ${name}! Your account has been created. Redirecting to home.`
        : `¡Bienvenido a VibeTours, ${name}! Tu cuenta ha sido registrada con éxito. Te redirigiremos al inicio.`;
      window.location.href = 'index.html';
    });
  }
}

/* --------------------------------------------------------------------------
   8. FAQ ACCORDION HANDLER
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all other items for clean single accordion
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   9. LIVE TOUR INTERACTIVE SIMULATOR
   -------------------------------------------------------------------------- */
function initLiveTourSimulator() {
  const playBtn = document.getElementById('simPlayBtn');
  const playIcon = document.getElementById('simPlayIcon');
  const playText = document.getElementById('simPlayText');
  const waveAnim = document.getElementById('simWaveAnimation');

  if (!playBtn) return;

  let isPlaying = false;
  let synthUtterance = null;

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;

    if (isPlaying) {
      if (playIcon) playIcon.textContent = '⏸';
      if (playText) playText.textContent = currentLandingLang === 'en' ? 'Pause Simulation' : 'Pausar Simulación';
      if (waveAnim) waveAnim.style.opacity = '1';

      // Use Web Speech API if supported for real interactive audio
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = currentLandingLang === 'en'
          ? 'You are approaching Clock Tower, built in the 19th century as the main gate of the walled city of Cartagena.'
          : 'Estás llegando a la Torre del Reloj, construida en el siglo 19 como la entrada principal de la ciudad amurallada de Cartagena.';
        
        synthUtterance = new SpeechSynthesisUtterance(textToSpeak);
        synthUtterance.lang = currentLandingLang === 'en' ? 'en-US' : 'es-ES';
        synthUtterance.onend = () => {
          stopSimulator();
        };
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
    if (playText) playText.textContent = currentLandingLang === 'en' ? 'Start Audio Simulation' : 'Iniciar Simulación de Audio';
    if (waveAnim) waveAnim.style.opacity = '0.3';
  }
}

