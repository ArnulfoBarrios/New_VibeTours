# VibeTours - Panorama General y Arquitectura del Proyecto

## 1. Visión General del Proyecto
**VibeTours** es una solución tecnológica de turismo inteligente integrada por una aplicación móvil multiplataforma (iOS y Android) desarrollada en **Flutter** y un backend robusto basado en **Node.js/Express** con persistencia, autenticación y seguridad gestionadas a través de **Supabase** y **Firebase**. 

El propósito principal de la aplicación es reinventar la forma en que los viajeros exploran destinos, permitiéndoles descubrir tours locales existentes, crear recorridos de manera manual, u obtener itinerarios personalizados e inmersivos generados mediante Inteligencia Artificial (IA) local o en la nube. Durante el recorrido de un tour, la app asiste al usuario en tiempo real mediante mapas interactivos, geolocalización activa y narraciones de audio automáticas (guía de voz) en cada parada.

---

## 2. Stack Tecnológico Principal

### Frontend (Móvil)
*   **Flutter & Dart**: Framework principal para el desarrollo multiplataforma con alto rendimiento visual (120Hz).
*   **Riverpod**: Gestor de estado reactivo y modular de la aplicación.
*   **GoRouter**: Enrutador declarativo para la navegación fluida, guardias de autenticación y transiciones.
*   **MapLibre GL**: Motor de renderizado de mapas interactivos vectoriales offline/online.
*   **Geolocator**: Captura y monitoreo de la posición GPS del dispositivo móvil en tiempo real.
*   **Flutter TTS (Text-to-Speech) & Speech-to-Text**: Servicios nativos para la narración por voz de las paradas turísticas y el dictado de prompts de viaje.

### Backend (API)
*   **Node.js & Express**: Servidor web y API REST encargado del procesamiento lógico pesado, las integraciones con servicios geográficos y la orquestación de la IA.
*   **OpenStreetMap (OSM) Services**:
    *   **Nominatim**: Para geocodificación normal y reversa (convertir texto a coordenadas y viceversa).
    *   **Photon**: Motor de búsqueda de lugares y autocompletado como respaldo.
    *   **Overpass API**: Consulta geoespacial avanzada de puntos de interés (POIs) reales y hoteles en un radio específico.
*   **Wikipedia API**: Para enriquecer los puntos de interés con contexto histórico y cultural real.
*   **TomTom Routing API**: Optimización geográfica de rutas itinerantes.
*   **Ollama**: Integración de modelos LLM locales (como Mistral, Llama) para la generación determinista offline de itinerarios.
*   **OpenAI API (GPT-4o-mini)**: Modelo en la nube para el chatbot de planificación interactiva y extracción semántica de datos de viaje.

### Backend as a Service (BaaS)
*   **Supabase (PostgreSQL)**:
    *   **Supabase Auth**: Autenticación segura de usuarios (correo/contraseña y Google Sign-in).
    *   **Database**: Persistencia de datos mediante tablas relacionales con soporte geográfico.
    *   **Row Level Security (RLS)**: Reglas de acceso estrictas a nivel de base de datos para proteger la información privada.
    *   **Storage**: Almacenamiento público para imágenes de portada de tours, galerías y avatares de usuario.
*   **Firebase**:
    *   **Firebase Crashlytics**: Monitoreo y reporte de fallos en producción.
    *   **Google Sign-In**: Autenticación federada integrada con Firebase y Supabase.

---

## 3. Estructura y Modularidad del Frontend (Flutter)
El código en `lib/src` sigue una arquitectura basada en características (**feature-based**), organizando las responsabilidades por módulos funcionales en lugar de capas de componentes genéricas.

### Estructura de Carpetas en `lib/src`
*   `core/`: Configuraciones globales, utilidades, temas (claro/oscuro) y constantes globales del sistema.
*   `domain/`: Definición de los modelos de datos compartidos (`models.dart`) y lógica de negocio pura.
*   `data/`: Repositorios y proveedores de datos encargados de comunicarse con Supabase y el backend local.
*   `state/`: Gestión del estado global y reactivo de la aplicación (`app_state.dart`).
*   `features/`: Implementación de los distintos flujos y pantallas de la interfaz de usuario:
    *   `auth/`: Inicio de sesión, registro y flujo de recuperación de contraseña.
    *   `home/`: Pantalla de bienvenida, descubrimiento de destinos y recomendaciones rápidas.
    *   `tours/`: Lista de tours disponibles, filtros y vista de detalles del tour.
    *   `tour_live/`: Interfaz de navegación interactiva en mapa, seguimiento por GPS, cálculo de desvíos y guía de voz TTS paso a paso.
    *   `creator/`: Herramienta para la creación manual de tours (añadir paradas en el mapa, descripciones, orden).
    *   `ai/`: Planificador de tours con IA, entrada de datos, transcripción por voz de prompts y previsualización del JSON del tour.
    *   `profile/`: Visualización del perfil del usuario, estadísticas de viajes, medallas y sus tours guardados.
    *   `settings/`: Ajustes de configuración (idioma ES/EN, modo de mapa, límite de tasa de refresco, modo oscuro/claro).
    *   `support/`: Centro de PQRS (Peticiones, Quejas, Reclamos y Sugerencias) para comunicación directa con el equipo técnico.
    *   `admin/`: Panel exclusivo para la moderación de contenido generado por usuarios (UGC) e inspección de reportes.

---

## 4. Estado Global de la Aplicación (`app_state.dart`)
La reactividad de la aplicación móvil se centraliza mediante Riverpod a través del proveedor `appStateProvider` que expone un `AppStateNotifier`. Este estado unificado gestiona:
*   El usuario autenticado actualmente en Supabase.
*   El estado administrativo del usuario (`isAdmin`).
*   La lista de tours públicos cargados en memoria.
*   El tour seleccionado para visualizar o recorrer en vivo (`selectedTour`).
*   Los tours privados creados por el propio usuario.
*   Preferencias del sistema: idioma actual (Español/Inglés) y tema (Claro/Oscuro/Sistema).
*   El perfil de viajero (`TouristProfileV2`) con sus intereses específicos, ritmo de viaje y presupuesto preferido.
*   Límites de la cuenta (por ejemplo, el límite de dos generaciones de tours de prueba en el modo de invitado/demo).

---

## 5. Arquitectura del Servidor Backend (Node.js/Express)
El backend procesa las solicitudes pesadas de geocodificación, enriquecimiento de datos y llamadas a IA. Está estructurado en `backend/src/` bajo los siguientes directorios:
*   `server.js`: Punto de entrada del servidor Express. Configura middlewares de seguridad, compresión y parseo de JSON.
*   `routes/`: Define las rutas expuestas por la API REST:
    *   `ai.js`: Orquestación del motor de generación de tours con IA, validaciones Zod y generación con Ollama.
    *   `chat.js`: Control del flujo conversacional interactivo (máquina de estados del asistente de viajes).
    *   `discovery.js`: Búsqueda geográfica de puntos de interés locales y eventos en tiempo real en los alrededores del usuario.
    *   `tours.js`: Rutas complementarias para la manipulación y sincronización de tours.
*   `services/`: Centraliza las integraciones externas:
    *   `openai.js`: Clientes de llamadas a OpenAI (GPT-4o-mini) para la extracción de información del chat y fallback de atracciones.
    *   `osm.js`: Clientes para realizar búsquedas geográficas y parsear datos de OpenStreetMap (Nominatim, Photon, Overpass).
    *   `wikipedia.js`: Recuperación de resúmenes de texto históricos basados en los nombres de las locaciones.
    *   `tomtom.js`: Cálculo de rutas óptimas e itinerarios optimizados por distancia o tiempo de tráfico.
    *   `chatSession.js`: Gestión del estado persistente en memoria para las conversaciones de los usuarios con el planificador de IA.

---

## 6. Modo Demo e Independencia de Conectividad
VibeTours cuenta con una funcionalidad de resiliencia llamada **Modo Demo**. Si los servicios en la nube de Supabase o el backend Node.js no están disponibles (ejemplo: falta de internet o configuración local incompleta):
1.  La aplicación detecta el error de conexión.
2.  Arranca automáticamente en modo offline/invitado.
3.  Carga un catálogo interno de tours locales almacenados en los assets del dispositivo.
4.  Permite realizar la navegación de tours simulada por coordenadas preestablecidas.
5.  Deshabilita los accesos de escritura a base de datos (como guardar favoritos, redactar comentarios o crear PQRS) de forma segura para no corromper la interfaz, manteniendo una experiencia fluida al 100% para pruebas rápidas.
