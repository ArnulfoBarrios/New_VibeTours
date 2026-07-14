# VibeTours - Estructura de la Presentación (Dos Diapositivas de Alta Densidad)

Este documento define la estructura y contenido para una presentación compacta de **únicamente dos diapositivas**, organizadas visualmente como una infografía con una ruta continua (línea de viaje) que conecta diferentes tarjetas, emulando el flujo de navegación de la aplicación VibeTours.

---

## 🎨 Sistema de Diseño Visual Propuesto (Estilo VibeTours)
*   **Fondo de las Diapositivas**: Degradado premium de azul cobalto profundo (`#0d1117`) a violeta oscuro (`#1a0f2e`), simulando un mapa nocturno de viaje.
*   **La Línea del Camino (Ruta)**: Una línea brillante de color cian/azul neón con un trazo curvo continuo que recorre la diapositiva de izquierda a derecha (en zigzag), uniendo cada una de las tarjetas de información.
*   **Tarjetas de Información (Cards)**: Estilo *glassmorphism* (fondos blancos translúcidos con 15% de opacidad, desenfoque de fondo -backdrop blur-, bordes delgados semitransparentes y sombras suaves).
*   **Acentos e Iconos**: Íconos minimalistas con degradado de cian a violeta neón para categorizar los datos rápidamente.
*   **Tipografía**: Sans-serif moderna (Inter u Outfit), con títulos en negrita de alto contraste y textos compactos en listas con viñetas.

---

## 📊 DIAPOSITIVA 1: La Ruta del Producto (Propuesta de Valor y Experiencia de Usuario)

Esta diapositiva muestra el flujo del usuario y cómo VibeTours resuelve los problemas del turismo tradicional a través de un recorrido infográfico de 5 tarjetas conectadas por la ruta de viaje.

```
[Inicio de Ruta: El Problema] ➔ [La Solución IA] ➔ [Personalización] ➔ [Búsqueda Real] ➔ [Navegación Activa]
```

### Tarjeta 1: La Brecha del Viajero (El Problema)
*   **Icono**: 🗺️ (Mapa con signo de interrogación)
*   **Título**: El Caos de la Planificación
*   **Viñetas**:
    *   **Pérdida de Tiempo**: Horas buscando atracciones e itinerarios en múltiples webs.
    *   **Alucinaciones de IA**: Chats genéricos recomiendan sitios inexistentes o cerrados.
    *   **Rutas Incoherentes**: Pérdida de tiempo por traslados físicamente imposibles.
    *   **Desconexión**: Saltos constantes de la guía escrita a la app de mapas.

### Tarjeta 2: VibeTours al Rescate (La Solución)
*   **Icono**: 🤖 (Asistente inteligente con destellos)
*   **Título**: El Guía de Bolsillo Inteligente
*   **Viñetas**:
    *   **Planificación en Segundos**: Generación dinámica basada en IA.
    *   **Datos Geoespaciales Reales**: Cero inventos; anclado en datos de OpenStreetMap.
    *   **Navegación Activa**: Ruta interactiva guiada por GPS con recálculo automático.
    *   **Guía de Voz Nativa**: La app narra la historia en cada parada (TTS).

### Tarjeta 3: Tu Perfil, Tu Viaje (Personalización)
*   **Icono**: 👤 (Silueta de usuario con engranaje)
*   **Título**: Perfil del Viajero Adaptable
*   **Viñetas**:
    *   **Tipo de Acompañamiento**: Solo, pareja, amigos o familia (con control de menores).
    *   **Ritmo del Tour**: Relajado, equilibrado o intenso (calcula tiempos de descanso).
    *   **Presupuesto Real**: Filtros según nivel de gasto (bajo, medio, alto) estimado en USD.
    *   **Intereses Dinámicos**: Prioriza historia, museos, gastronomía, naturaleza o compras.

### Tarjeta 4: El Motor de Datos (Búsqueda Geo Real)
*   **Icono**: ⚙️ (Engranajes sobre mapa)
*   **Título**: Curación Geoespacial y Cultural
*   **Viñetas**:
    *   **Geocodificación Precisa**: Evita homónimos (asume la ciudad más cercana a las coordenadas).
    *   **Overpass API**: Consulta y filtra POIs y hoteles en tiempo real (radio de 10km).
    *   **Wikipedia API**: Inyecta resúmenes históricos reales dentro de la narrativa del tour.
    *   **TomTom Routing**: Optimización matemática del orden de paradas (TSP).

### Tarjeta 5: Recorriendo en Vivo (La Experiencia)
*   **Icono**: 🎙️ (Micrófono con ondas de audio)
*   **Título**: Tour Live & Audio Guía
*   **Viñetas**:
    *   **Voz a Texto (STT)**: Dictado de prompts y búsquedas manos libres.
    *   **Texto a Voz (TTS)**: Narración inmersiva en la parada sin leer pantallas.
    *   **Storytelling Dinámico**: Evita frases repetitivas; narración fluida y local.
    *   **Recomendaciones**: Listas de *"Qué hacer aquí"* y *"Dónde comer cerca"*.

---

## 🛠️ DIAPOSITIVA 2: Detrás del Mapa (Arquitectura, Datos y Negocio)

Esta diapositiva muestra la infraestructura del sistema, la base de datos segura y la viabilidad del modelo de negocio, conectados por el tramo final de la ruta infográfica.

```
[Tecnología Core] ➔ [Esquema Supabase] ➔ [Seguridad RLS] ➔ [Soporte & Control] ➔ [Métricas & Negocio]
```

### Tarjeta 1: La Ingeniería (Stack Tecnológico)
*   **Icono**: 💻 (Laptop con código)
*   **Título**: Frontend Premium & Backend Ágil
*   **Viñetas**:
    *   **Flutter**: UI fluida (120Hz) y MapLibre GL para mapas vectoriales ligeros.
    *   **Riverpod & GoRouter**: Gestión de estado reactivo y enrutamiento con guardias de seguridad.
    *   **Node.js / Express**: API de orquestación de IA y geolocalización.
    *   **Modo Demo**: Resiliencia offline; carga tours locales si cae la red.

### Tarjeta 2: La Base del Negocio (Supabase DB)
*   **Icono**: 🗄️ (Base de datos relacional)
*   **Título**: Persistencia y Estructura Relacional
*   **Viñetas**:
    *   **Tours & Stops**: Tabla relacional multi-día para itinerarios extensos.
    *   **Likes & Favorites**: Registro de interacciones sociales y marcadores rápidos.
    *   **Tourist Profiles**: Almacén del perfil personal con resúmenes compilados.
    *   **Storage Buckets**: Repositorios para cubiertas de tours, galerías y avatares (límite 10MB).

### Tarjeta 3: Blindaje de Datos (RLS & Cloud Services)
*   **Icono**: 🔒 (Candado con llave neón)
*   **Título**: Seguridad a Nivel de Fila (RLS)
*   **Viñetas**:
    *   **Políticas de Lectura**: Tours y comentarios públicos visibles para todos (anon/auth).
    *   **Políticas de Escritura**: Solo el propietario (`auth.uid()`) edita o borra sus tours.
    *   **Ajustes Privados**: Configuraciones e historial PQRS cifrados por usuario.
    *   **Firebase Integration**: Firebase Crashlytics para fallos y Google Sign-in integrado.

### Tarjeta 4: Control de Calidad (Admin & Soporte)
*   **Icono**: 🛡️ (Escudo con check)
*   **Título**: Moderación y Soporte de Usuarios
*   **Viñetas**:
    *   **PQRS Hub**: Envío y seguimiento de peticiones, quejas, reclamos y sugerencias.
    *   **UGC Moderation**: Panel administrativo para validar tours creados por usuarios.
    *   **Sistema de Reportes**: Alertas de contenido inapropiado o problemático.
    *   **Singleton de Administración**: Cuenta única administradora validada en base de datos.

### Tarjeta 5: VibeTours en Números (Viabilidad)
*   **Icono**: 📊 (Gráfico de barras ascendente)
*   **Título**: Métricas y Potencial de Crecimiento
*   **Viñetas**:
    *   **Control de API**: Límite de 2 generaciones IA en modo invitado (demo limit).
    *   **Suscripciones**: Generaciones ilimitadas e itinerarios de larga distancia.
    *   **Marketplace UGC**: Reparto de ingresos con guías locales que vendan sus tours.
    *   **Multilenguaje**: Adaptación dinámica nativa a Inglés (EN) y Español (ES).

---

## 🎙️ Guion del Pitch para las Dos Diapositivas (3 Minutos)

### Exposición de la Diapositiva 1 (1.5 minutos):
"Buenas tardes. Cuando viajamos a una nueva ciudad, queremos explorarla de verdad, no pasar horas planificando rutas imposibles o leyendo guías estáticas. Tampoco queremos que la Inteligencia Artificial nos invente monumentos cerrados, obligándonos a saltar de app en app. 

Por eso creamos **VibeTours**, el guía inteligente en tu bolsillo. En nuestra primera diapositiva vemos **La Ruta del Producto**. VibeTours transforma la planificación de viajes en un proceso de segundos. A través de un formulario dinámico o dictado por voz, nuestro motor de IA extrae el perfil del viajero: su ritmo, sus intereses, su presupuesto y acompañantes. 

Pero aquí está la magia: para evitar las alucinaciones de la IA, el backend busca lugares físicos reales a través de OpenStreetMap y Overpass en un radio de 10km, los enriquece con historia real de Wikipedia y calcula la ruta más corta y lógica usando TomTom. Al iniciar, el usuario sigue el mapa con GPS en tiempo real mientras la aplicación le narra la historia de cada parada con voz nativa en su idioma, ofreciéndole además recomendaciones prácticas como dónde comer cerca."

### Exposición de la Diapositiva 2 (1.5 minutos):
"Detrás de esta gran experiencia de usuario, hay una arquitectura robusta y escalable que vemos en nuestra segunda diapositiva: **Detrás del Mapa**. 

El frontend está desarrollado en Flutter a 120Hz para ofrecer una visualización fluida de mapas vectoriales interactivos, gestionado por Riverpod. El backend utiliza Node.js y Express para orquestar la geolocalización y los LLMs. La seguridad de los datos de nuestros usuarios está blindada gracias a Supabase, aplicando políticas de Seguridad a Nivel de Fila o RLS, garantizando que solo los dueños puedan modificar sus tours o perfiles.

Además, VibeTours es resiliente: si el servidor falla, el Modo Demo offline asegura que la app siga funcionando con tours locales pre-cargados. También integramos un canal de moderación y PQRS para mantener la calidad de los tours generados por usuarios. 

VibeTours no es solo una app de IA bonita; es un negocio escalable con límites de generación gratuita para invitados, un modelo de suscripción premium, y un marketplace de tours compartidos para guías locales. Los invito a unirse a la era del turismo inteligente. Muchas gracias."
